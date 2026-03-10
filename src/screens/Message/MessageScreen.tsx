import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useCallback, useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
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

const MessageScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useContext(AuthContext);

  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data: participations } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id);

      if (!participations || participations.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      const conversationIds = participations.map((p) => p.conversation_id);

      const { data: messages } = await supabase
        .from("messages")
        .select("*")
        .in("conversation_id", conversationIds)
        .order("created_at", { ascending: false });

      const latestMap = new Map();

      messages?.forEach((msg) => {
        if (!latestMap.has(msg.conversation_id)) {
          latestMap.set(msg.conversation_id, msg);
        }
      });

      const { data: participants } = await supabase
        .from("conversation_participants")
        .select("conversation_id,user_id")
        .in("conversation_id", conversationIds)
        .neq("user_id", user.id);

      const userIds = participants?.map((p) => p.user_id) || [];

      const { data: users } = await supabase
        .from("users")
        .select("*")
        .in("id", userIds);

      const userMap = new Map();
      users?.forEach((u) => userMap.set(u.id, u));

      const chats: any[] = [];

      conversationIds.forEach((id) => {
        const msg = latestMap.get(id);
        const participant = participants?.find((p) => p.conversation_id === id);

        if (!msg || !participant) return;

        const otherUser = userMap.get(participant.user_id);

        chats.push({
          id,
          otherUser,
          lastMessage: msg.content,
          time: new Date(msg.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          latestTimestamp: new Date(msg.created_at).getTime(),
        });
      });

      chats.sort((a, b) => b.latestTimestamp - a.latestTimestamp);

      setConversations(chats);
      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`messages-list-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        () => {
          fetchConversations();
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
          fetchConversations();
        },
      )
      .subscribe((status) => {
        console.log("Messages realtime:", status);
      });

    return () => {
      channel.unsubscribe();
    };
  }, [user?.id, fetchConversations]);

  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      style={{ flex: 1, backgroundColor: DarkTheme.PRIMARY_BACKGROUND }}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerText}>Messages</Text>

        <TouchableOpacity
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
            <Text style={styles.emptyTitle}>Your Messages</Text>
            <Text style={styles.emptyText}>
              Connect with friends and start chatting.
            </Text>
          </View>
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ChatItem
                username={item.otherUser.username}
                avatar={item.otherUser.photo_url}
                message={item.lastMessage}
                time={item.time}
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
