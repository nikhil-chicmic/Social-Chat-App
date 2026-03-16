import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../../lib/supabase";
import ChatItem from "../../components/ChatItem";
import AuthContext from "../../navigation/AuthContext";
import { DarkTheme } from "../../theme/DarkTheme";

const CONV_CACHE_KEY = "chat_conversation_cache";

const MessageScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useContext(AuthContext);

  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const conversationsRef = useRef<any[]>([]);
  const realtimeChannelRef = useRef<any>(null);
  const pollIntervalRef = useRef<any>(null);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  const loadConvCache = async (): Promise<Record<string, string>> => {
    try {
      const raw = await AsyncStorage.getItem(CONV_CACHE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  };

  const formatTimestamp = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);

    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;

    return date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
    });
  };

  const doFetch = async (showLoader = true) => {
    if (!user?.id) return;

    if (showLoader) setLoading(true);

    try {
      const { data: myParticipations } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id);

      if (!myParticipations || myParticipations.length === 0) {
        setConversations([]);
        if (showLoader) setLoading(false);
        return;
      }

      const conversationIds = myParticipations.map((p) => p.conversation_id);

      const { data: otherParticipants } = await supabase
        .from("conversation_participants")
        .select("conversation_id,user_id")
        .in("conversation_id", conversationIds)
        .neq("user_id", user.id);

      const convToOtherUserId = new Map<string, string>();

      otherParticipants?.forEach((p) => {
        convToOtherUserId.set(p.conversation_id, p.user_id);
      });

      const { data: allMessages } = await supabase
        .from("messages")
        .select("conversation_id,content,created_at,sender_id")
        .in("conversation_id", conversationIds)
        .order("created_at", { ascending: false });

      allMessages?.forEach((msg) => {
        if (
          msg.sender_id !== user.id &&
          !convToOtherUserId.has(msg.conversation_id)
        ) {
          convToOtherUserId.set(msg.conversation_id, msg.sender_id);
        }
      });

      const convCache = await loadConvCache();

      conversationIds.forEach((convId) => {
        if (!convToOtherUserId.has(convId) && convCache[convId]) {
          convToOtherUserId.set(convId, convCache[convId]);
        }
      });

      const latestMsgMap = new Map<string, any>();

      allMessages?.forEach((msg) => {
        if (!latestMsgMap.has(msg.conversation_id)) {
          latestMsgMap.set(msg.conversation_id, msg);
        }
      });

      const otherUserIds = [...new Set(convToOtherUserId.values())];

      const { data: users } = await supabase
        .from("users")
        .select("*")
        .in("id", otherUserIds);

      const usersMap = new Map<string, any>();
      users?.forEach((u) => usersMap.set(u.id, u));

      const readReceiptsRaw = await AsyncStorage.getItem("READ_RECEIPTS_CACHE");
      const readReceipts = readReceiptsRaw ? JSON.parse(readReceiptsRaw) : {};

      const chats: any[] = [];

      conversationIds.forEach((convId) => {
        const otherUserId = convToOtherUserId.get(convId);
        const otherUser = otherUserId ? usersMap.get(otherUserId) : null;
        const latestMsg = latestMsgMap.get(convId);

        if (!otherUser || !latestMsg) return;

        const isMyMessage = latestMsg.sender_id === user.id;
        const msgTime = new Date(latestMsg.created_at).getTime();
        const lastRead = readReceipts[convId] || 0;

        chats.push({
          id: convId,
          otherUser,
          lastMessage: `${isMyMessage ? "You: " : ""}${latestMsg.content}`,
          time: formatTimestamp(latestMsg.created_at),
          latestTimestamp: msgTime,
          isUnread: !isMyMessage && msgTime > lastRead,
        });
      });

      chats.sort((a, b) => b.latestTimestamp - a.latestTimestamp);

      setConversations(chats);
    } catch (err) {
      console.error("fetchConversations error:", err);
    }

    if (showLoader) setLoading(false);
  };

  const fetchConversations = () => doFetch(true);

  const confirmDeleteChat = (conversationId: string) => {
    Alert.alert("Delete Chat", "Are you sure you want to delete?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => handleDeleteChat(conversationId),
      },
    ]);
  };

  const handleDeleteChat = async (conversationId: string) => {
    if (!user?.id) return;

    setConversations((prev) => prev.filter((c) => c.id !== conversationId));

    await supabase.from("conversations").delete().eq("id", conversationId);

    const raw = await AsyncStorage.getItem(CONV_CACHE_KEY);
    if (!raw) return;

    const cache = JSON.parse(raw);
    delete cache[conversationId];

    await AsyncStorage.setItem(CONV_CACHE_KEY, JSON.stringify(cache));
  };

  const subscribeRealtime = () => {
    if (!user?.id) return;

    realtimeChannelRef.current = supabase
      .channel("messages-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const newMsg = payload.new;

          setConversations((prev) => {
            const index = prev.findIndex(
              (c) => c.id === newMsg.conversation_id,
            );

            if (index === -1) {
              doFetch(false);
              return prev;
            }

            const isMyMessage = newMsg.sender_id === user.id;
            const msgTime = new Date(newMsg.created_at).getTime();

            const updated = [...prev];

            updated[index] = {
              ...updated[index],
              lastMessage: `${isMyMessage ? "You: " : ""}${newMsg.content}`,
              time: formatTimestamp(newMsg.created_at),
              latestTimestamp: msgTime,
              isUnread: !isMyMessage,
            };

            updated.sort((a, b) => b.latestTimestamp - a.latestTimestamp);

            return updated;
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "conversation_participants",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          doFetch(false);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "conversations",
        },
        (payload) => {
          const deletedId: any = payload.old.id;
          setConversations((prev) => prev.filter((c) => c.id !== deletedId));
        },
      )
      .subscribe();
  };

  const unsubscribeRealtime = () => {
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
      realtimeChannelRef.current = null;
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchConversations();
      subscribeRealtime();

      if (!pollIntervalRef.current) {
        pollIntervalRef.current = setInterval(() => {
          doFetch(false);
        }, 4000);
      }

      return () => {
        unsubscribeRealtime();
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      };
    }, [user?.id]),
  );

  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      style={{ flex: 1, backgroundColor: DarkTheme.PRIMARY_BACKGROUND }}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backIcon}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerText}>Messages</Text>

        <TouchableOpacity
          style={styles.newChatIcon}
          onPress={() =>
            navigation.navigate("Main", {
              screen: "Search",
            })
          }
        >
          <Ionicons name="create-outline" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.chatContainer}>
        {loading ? (
          <ActivityIndicator
            size="large"
            color={DarkTheme.PRIMARY_BUTTON}
            style={{ marginTop: 50 }}
          />
        ) : conversations.length === 0 ? (
          <View style={styles.emptyBox}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="chatbubbles-outline" size={48} color="#555" />
            </View>

            <Text style={styles.emptyTitle}>Your Messages</Text>

            <Text style={styles.emptyText}>
              Connect with friends and start a conversation.
            </Text>

            <TouchableOpacity
              style={styles.findFriendsButton}
              onPress={() =>
                navigation.navigate("Main", {
                  screen: "Search",
                })
              }
            >
              <Text style={styles.findFriendsText}>Find Friends</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            bounces={false}
            data={conversations}
            keyExtractor={(item, index) => item.id + index}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <ChatItem
                username={item.otherUser.username}
                avatar={item.otherUser.photo_url || "https://i.pravatar.cc/140"}
                message={item.lastMessage}
                time={item.time}
                isUnread={item.isUnread}
                onDelete={() => confirmDeleteChat(item.id)}
                onPress={() =>
                  navigation.navigate("ChatRoom", {
                    conversationId: item.id,
                    otherUser: item.otherUser,
                  })
                }
              />
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

export default MessageScreen;

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  headerText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  backIcon: {
    position: "absolute",
    left: 20,
    padding: 4,
  },
  newChatIcon: {
    position: "absolute",
    right: 20,
    padding: 4,
  },
  chatContainer: {
    flex: 1,
  },
  emptyBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    marginTop: -80,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#161618",
    borderWidth: 1,
    borderColor: "#2A2A2C",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  emptyText: {
    color: "#8E8E93",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  findFriendsButton: {
    backgroundColor: DarkTheme.PRIMARY_BUTTON,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
    shadowColor: DarkTheme.PRIMARY_BUTTON,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  findFriendsText: {
    fontWeight: "700",
    fontSize: 16,
    color: "#000",
  },
});
