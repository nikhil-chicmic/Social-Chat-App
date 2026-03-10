import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute } from "@react-navigation/native";
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
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
  const isInitialLoad = useRef(true);

  const updateReadReceipt = useCallback(
    async (timestamp?: number) => {
      try {
        const raw = await AsyncStorage.getItem("READ_RECEIPTS_CACHE");
        const cache = raw ? JSON.parse(raw) : {};
        cache[conversationId] = timestamp || Date.now();
        await AsyncStorage.setItem(
          "READ_RECEIPTS_CACHE",
          JSON.stringify(cache),
        );
      } catch (err) {
        console.error("Read receipt error:", err);
      }
    },
    [conversationId],
  );

  const scrollToBottom = useCallback((animated = true) => {
    flatListRef.current?.scrollToEnd({ animated });
  }, []);

  const handleContentSizeChange = useCallback(() => {
    if (isInitialLoad.current) {
      scrollToBottom(false);
      isInitialLoad.current = false;
    } else {
      scrollToBottom(true);
    }
  }, [scrollToBottom]);

  useEffect(() => {
    if (!conversationId) return;

    isInitialLoad.current = true;

    loadMessages();
    const channel = subscribeRealtime();

    return () => {
      channel.unsubscribe();
    };
  }, [conversationId]);

  async function loadMessages() {
    setLoadingMessages(true);

    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error(error);
        return;
      }

      setMessages(data || []);

      if (data && data.length > 0) {
        const last = data[data.length - 1];
        updateReadReceipt(new Date(last.created_at).getTime());
      } else {
        updateReadReceipt(Date.now());
      }
    } catch (err) {
      console.error(err);
    }

    setLoadingMessages(false);
  }

  function subscribeRealtime() {
    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
          // Keep the read receipt up-to-date so the unread badge
          // doesn't reappear when navigating back to MessageScreen
          updateReadReceipt(new Date(payload.new.created_at).getTime());
        },
      )
      .subscribe((status) => {
        console.log("Realtime status:", status);
      });

    return channel;
  }

  async function sendMessage() {
    if (!inputText.trim()) return;

    const messageText = inputText.trim();
    setInputText("");

    try {
      const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: user?.id,
        content: messageText,
      });

      if (error) {
        console.error(error);
        return;
      }

      await supabase
        .from("conversations")
        .update({
          updated_at: new Date().toISOString(),
          last_message: messageText,
        })
        .eq("id", conversationId);

      // Fire backend push notification via Supabase Edge Function
      const recipientId = otherUser?.id;
      if (recipientId) {
        try {
          const { data: fnData, error: fnError } =
            await supabase.functions.invoke("send-push", {
              body: {
                recipientId,
                title: `New message from ${
                  user?.user_metadata?.username || "Someone"
                }`,
                body: messageText,
                data: {
                  type: "message",
                  conversationId,
                  fromUserId: user?.id,
                },
              },
            });

          if (fnError) {
            console.error("send-push function error:", fnError);
          } else {
            console.log("send-push function response:", fnData);
          }
        } catch (err) {
          console.error("send-push function network error:", err);
        }
      }
    } catch (err) {
      console.error(err);
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
            {new Date(item.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
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
        // Tweak offset so the header + input stay visible when keyboard is open
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 90}
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
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={DarkTheme.PRIMARY_BUTTON} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderMessage}
            contentContainerStyle={{ padding: 16 }}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={handleContentSizeChange}
            onLayout={handleContentSizeChange}
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
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
