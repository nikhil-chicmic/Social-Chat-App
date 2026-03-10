import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import React, { useCallback, useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../../lib/supabase";
import ChatItem from "../../components/ChatItem";
import AuthContext from "../../navigation/AuthContext";
import { DarkTheme } from "../../theme/DarkTheme";
import { styles } from "./styles";

const CONV_CACHE_KEY = "chat_conversation_cache";

const MessageScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useContext(AuthContext);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadConvCache = async (): Promise<Record<string, string>> => {
    try {
      const raw = await AsyncStorage.getItem(CONV_CACHE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  };

  const fetchConversations = async (showLoading = true) => {
    if (!user?.id) return;

    if (showLoading) setLoading(true);

    try {
      const { data: myParticipations, error: partError } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id);

      if (partError) {
        console.error("Error fetching participations:", partError);
      }

      if (!myParticipations || myParticipations.length === 0) {
        setConversations([]);
        if (showLoading) setLoading(false);
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

      if (otherUserIds.length === 0) {
        setConversations([]);
        if (showLoading) setLoading(false);
        return;
      }

      const { data: users } = await supabase
        .from("users")
        .select("*")
        .in("id", otherUserIds);

      const usersMap = new Map<string, any>();
      users?.forEach((u) => usersMap.set(u.id, u));

      const chats: any[] = [];

      const readReceiptsRaw = await AsyncStorage.getItem("READ_RECEIPTS_CACHE");
      const readReceipts = readReceiptsRaw ? JSON.parse(readReceiptsRaw) : {};

      conversationIds.forEach((convId) => {
        const otherUserId = convToOtherUserId.get(convId);
        const otherUser = otherUserId ? usersMap.get(otherUserId) : null;
        const latestMsg = latestMsgMap.get(convId);

        if (!otherUser || !latestMsg) return;

        const isMyMessage = latestMsg.sender_id === user.id;
        const msgTime = new Date(latestMsg.created_at).getTime();
        const lastRead = readReceipts[convId] || 0;
        const isUnread = !isMyMessage && msgTime > lastRead;

        chats.push({
          id: convId,
          otherUser,
          lastMessage: `${isMyMessage ? "You: " : ""}${latestMsg.content}`,
          time: formatTimestamp(latestMsg.created_at),
          latestTimestamp: msgTime,
          isUnread,
        });
      });

      chats.sort((a, b) => b.latestTimestamp - a.latestTimestamp);

      setConversations(chats);
    } catch (err) {
      console.error("fetchConversations error:", err);
    }

    if (showLoading) setLoading(false);
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

  const confirmDeleteChat = (conversationId: string) => {
    Alert.alert(
      "Delete Chat",
      "Are you sure you want to delete?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => handleDeleteChat(conversationId),
        },
      ],
      { cancelable: true },
    );
  };

  const handleDeleteChat = async (conversationId: string) => {
    if (!user?.id) return;

    setConversations((prev) => prev.filter((c) => c.id !== conversationId));

    const { error } = await supabase
      .from("conversations")
      .delete()
      .eq("id", conversationId);

    if (error) {
      console.error("Delete chat error:", error);
      return;
    }

    const raw = await AsyncStorage.getItem(CONV_CACHE_KEY);
    if (!raw) return;

    const cache = JSON.parse(raw);
    delete cache[conversationId];

    await AsyncStorage.setItem(CONV_CACHE_KEY, JSON.stringify(cache));
  };

  useFocusEffect(
    useCallback(() => {
      fetchConversations(true);
    }, [user?.id]),
  );

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel("message-list-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => fetchConversations(false),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        () => fetchConversations(false),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversation_participants" },
        () => fetchConversations(false),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

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
              Connect with friends and share moments. Start a conversation
              today.
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
            keyExtractor={(item) => item.id}
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
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

export default MessageScreen;
