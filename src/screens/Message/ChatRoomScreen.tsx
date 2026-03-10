import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../../lib/supabase";
import AuthContext from "../../navigation/AuthContext";
import { DarkTheme } from "../../theme/DarkTheme";

export default function ChatRoomScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { user } = useContext(AuthContext);

  const { conversationId, otherUser } = route.params;

  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(true);

  const flatListRef = useRef<FlatList>(null);
  // Track whether the list has done its initial scroll so we only
  // auto-scroll on new messages, not on every content resize.
  const initialScrollDone = useRef(false);

  const updateReadReceipt = useCallback(
    async (timestamp?: number) => {
      try {
        const raw = await AsyncStorage.getItem("READ_RECEIPTS_CACHE");
        const cache = raw ? JSON.parse(raw) : {};
        cache[conversationId] = timestamp || Date.now();
        await AsyncStorage.setItem("READ_RECEIPTS_CACHE", JSON.stringify(cache));
      } catch (err) {
        console.error("Failed to update read receipt:", err);
      }
    },
    [conversationId],
  );

  const scrollToBottom = useCallback((animated = true) => {
    flatListRef.current?.scrollToEnd({ animated });
  }, []);

  useEffect(() => {
    if (!conversationId) return;

    loadMessages();
    const channel = subscribeRealtime();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  async function loadMessages() {
    setLoadingMessages(true);
    initialScrollDone.current = false;

    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Load messages error:", error);
        setLoadingMessages(false);
        return;
      }

      setMessages(data || []);

      if (data && data.length > 0) {
        const latestMsg = data[data.length - 1];
        updateReadReceipt(new Date(latestMsg.created_at).getTime());
      } else {
        updateReadReceipt(Date.now());
      }

      // Scroll after data is set
      setTimeout(() => {
        scrollToBottom(false);
        initialScrollDone.current = true;
      }, 150);
    } catch (err) {
      console.error("loadMessages exception:", err);
    }

    setLoadingMessages(false);
  }

  function subscribeRealtime() {
    return supabase
      .channel(`chat-room-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          // Server-side filter: only receive events for THIS conversation.
          // This is the key fix ensuring the receiver gets messages instantly.
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => {
            // Deduplicate: sender already appended optimistically via sendMessage
            if (prev.some((m) => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });

          updateReadReceipt(new Date(payload.new.created_at).getTime());

          setTimeout(() => scrollToBottom(true), 80);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "conversations",
          filter: `id=eq.${conversationId}`,
        },
        () => {
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            navigation.navigate("Message");
          }
        },
      )
      .subscribe();
  }

  async function sendMessage() {
    if (!inputText.trim()) return;

    const messageText = inputText.trim();
    setInputText("");

    try {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_id: user?.id,
          content: messageText,
        })
        .select()
        .single();

      if (error) {
        console.error("Send message error:", error);
        return;
      }

      // Optimistically add to local state (realtime will deduplicate)
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.id)) return prev;
        return [...prev, data];
      });

      updateReadReceipt(new Date(data.created_at).getTime());

      setTimeout(() => scrollToBottom(true), 80);

      await supabase
        .from("conversations")
        .update({
          updated_at: new Date().toISOString(),
          last_message: messageText,
        })
        .eq("id", conversationId);
    } catch (err) {
      console.error("sendMessage exception:", err);
    }
  }

  function renderMessage({ item }: any) {
    const isMe = item.sender_id === user?.id;

    return (
      <View
        style={[styles.messageRow, isMe ? styles.rowRight : styles.rowLeft]}
      >
        {!isMe && (
          <Image
            source={{
              uri: otherUser?.photo_url || "https://i.pravatar.cc/150",
            }}
            style={styles.avatar}
          />
        )}

        <View
          style={[styles.bubble, isMe ? styles.myBubble : styles.otherBubble]}
        >
          <Text style={[styles.messageText, { color: isMe ? "#000" : "#fff" }]}>
            {item.content}
          </Text>
          <Text
            style={[
              styles.timeText,
              { color: isMe ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.4)" },
            ]}
          >
            {item.created_at
              ? new Date(item.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : ""}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "android" ? 0 : 0}
      >
        <TouchableOpacity
          style={styles.header}
          onPress={() => {
            navigation.push("OtherProfile", { userId: otherUser?.id });
          }}
        >
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          <Image
            source={{
              uri: otherUser?.photo_url || "https://i.pravatar.cc/150",
            }}
            style={styles.headerAvatar}
          />

          <Text style={styles.headerName}>{otherUser?.username || "User"}</Text>
        </TouchableOpacity>

        {loadingMessages ? (
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <ActivityIndicator size="large" color={DarkTheme.PRIMARY_BUTTON} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderMessage}
            contentContainerStyle={
              messages.length === 0
                ? { flex: 1, justifyContent: "center", alignItems: "center" }
                : { padding: 16, paddingBottom: 8 }
            }
            showsVerticalScrollIndicator={false}
            // Auto-scroll as content grows (covers both new messages and
            // initial load without relying solely on setTimeout).
            onContentSizeChange={() => {
              if (initialScrollDone.current) {
                scrollToBottom(true);
              }
            }}
            ListEmptyComponent={
              <View style={{ alignItems: "center", padding: 40 }}>
                <Ionicons name="chatbubble-outline" size={48} color="#444" />
                <Text
                  style={{
                    color: "#666",
                    marginTop: 16,
                    fontSize: 16,
                    textAlign: "center",
                  }}
                >
                  No messages yet.{"\n"}Say hello! 👋
                </Text>
              </View>
            }
          />
        )}

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={inputText}
            placeholder="Message..."
            placeholderTextColor="#888"
            onChangeText={setInputText}
            onSubmitEditing={sendMessage}
            blurOnSubmit={false}
            multiline
          />

          <TouchableOpacity
            onPress={sendMessage}
            disabled={!inputText.trim()}
            style={[styles.sendButton, { opacity: inputText.trim() ? 1 : 0.4 }]}
          >
            <Ionicons name="send" size={18} color="#000" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DarkTheme.PRIMARY_BACKGROUND,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginLeft: 12,
    marginRight: 10,
  },
  headerName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 10,
  },
  rowRight: {
    justifyContent: "flex-end",
  },
  rowLeft: {
    justifyContent: "flex-start",
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    marginRight: 8,
  },
  bubble: {
    maxWidth: "75%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  myBubble: {
    backgroundColor: DarkTheme.PRIMARY_BUTTON,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: "#2A2A2A",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  timeText: {
    fontSize: 11,
    marginTop: 4,
    textAlign: "right",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#222",
  },
  input: {
    flex: 1,
    backgroundColor: "#1A1A1A",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: "#fff",
    fontSize: 16,
    maxHeight: 120,
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: DarkTheme.PRIMARY_BUTTON,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
});
