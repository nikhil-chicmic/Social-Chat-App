import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useContext, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../../lib/supabase";
import AuthContext from "../../navigation/AuthContext";
import { DarkTheme } from "../../theme/DarkTheme";
import { setChatScreenActive } from "../../utils/chatState";
import { styles } from "./styles";

export default function ChatRoomScreen() {
  const { params }: any = useRoute();
  const navigation = useNavigation<any>();
  const { user } = useContext(AuthContext);

  const { conversationId, otherUser } = params;

  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    setChatScreenActive(true);
    return () => {
      setChatScreenActive(false);
    };
  });

  async function updateReadReceipt(timestamp?: number) {
    const raw = await AsyncStorage.getItem("READ_RECEIPTS_CACHE");
    const cache = raw ? JSON.parse(raw) : {};

    cache[conversationId] = timestamp || Date.now();

    await AsyncStorage.setItem("READ_RECEIPTS_CACHE", JSON.stringify(cache));
  }

  async function loadMessages() {
    setLoading(true);

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setMessages(data || []);

    if (data?.length) {
      const last = data[data.length - 1];
      updateReadReceipt(new Date(last.created_at).getTime());
    } else {
      updateReadReceipt();
    }

    setLoading(false);
  }

  function subscribeRealtime() {
    return supabase
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
          updateReadReceipt(new Date(payload.new.created_at).getTime());
        },
      )
      .subscribe();
  }

  useEffect(() => {
    if (!conversationId) return;

    loadMessages();
    const channel = subscribeRealtime();

    return () => {
      channel.unsubscribe();
    };
  }, [conversationId]);

  async function sendMessage() {
    if (!inputText.trim()) return;

    const text = inputText.trim();
    setInputText("");

    const senderName =
      (user?.user_metadata as any)?.username ||
      user?.email?.split("@")[0] ||
      "Someone";

    const preview = text.length > 80 ? text.slice(0, 77) + "..." : text;

    const { error } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: user?.id,
      content: text,
    });

    if (error) {
      console.error(error);
      return;
    }

    if (otherUser?.id) {
      await supabase.functions.invoke("send-push", {
        body: {
          recipientId: otherUser.id,
          title: `New message from ${senderName}`,
          body: preview,
          data: {
            type: "message",
            conversationId,
            fromUserId: user?.id,
            senderName,
          },
        },
      });
    }

    await supabase
      .from("conversations")
      .update({
        updated_at: new Date().toISOString(),
        last_message: text,
      })
      .eq("id", conversationId);
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
      >
        <TouchableOpacity
          style={styles.header}
          onPress={() =>
            navigation.push("OtherProfile", { userId: otherUser?.id })
          }
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

        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={DarkTheme.PRIMARY_BUTTON} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={[...messages].reverse()}
            inverted
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderMessage}
            contentContainerStyle={{ padding: 16 }}
            showsVerticalScrollIndicator={false}
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
