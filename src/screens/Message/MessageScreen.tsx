import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import React, { useContext, useState, useCallback } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ChatItem from "../../components/ChatItem";
import { DarkTheme } from "../../theme/DarkTheme";
import AuthContext from "../../navigation/AuthContext";
import { supabase } from "../../../lib/supabase";

const MessageScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useContext(AuthContext);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    
    try {
      // 1. Fetch conversation IDs where current user is a participant
      const { data: myParticipants, error: myPartErr } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id);

      if (myPartErr) throw myPartErr;
      
      if (!myParticipants || myParticipants.length === 0) {
        setConversations([]);
        return;
      }

      const conversationIds = myParticipants.map(p => p.conversation_id);

      // 2. Fetch the OTHER participants in those conversations
      const { data: otherParticipants, error: otherPartErr } = await supabase
        .from("conversation_participants")
        .select("conversation_id, user_id")
        .in("conversation_id", conversationIds)
        .neq("user_id", user.id);

      if (otherPartErr) throw otherPartErr;

      const otherUserIds = otherParticipants ? otherParticipants.map(p => p.user_id) : [];

      // 3. Fetch the profiles for these other users
      let usersMap = new Map();
      if (otherUserIds.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from("users")
          .select("*")
          .in("id", otherUserIds);

        if (usersError) throw usersError;
        if (usersData) {
          usersData.forEach(u => usersMap.set(u.id, u));
        }
      }

      // 4. Assemble final structured data
      const enrichedConversations = await Promise.all(
        conversationIds.map(async (convId) => {
          // Find the other participant for this conversation
          const participantRecord = otherParticipants?.find(p => p.conversation_id === convId);
          const otherUserId = participantRecord?.user_id;
          const otherUser = otherUserId ? usersMap.get(otherUserId) : null;
          
          // Attempt to get the latest message
          const { data: latestMsg } = await supabase
            .from("messages")
            .select("content, created_at")
            .eq("conversation_id", convId)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();
            
          return {
            id: convId,
            otherUser: otherUser || { id: otherUserId || "unknown", username: "Unknown User", photo_url: "https://i.pravatar.cc/150" },
            lastMessage: latestMsg?.content || "No messages yet",
            time: latestMsg?.created_at ? new Date(latestMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "",
          };
        })
      );

      setConversations(enrichedConversations);
    } catch (err) {
      console.error("Error fetching conversations:", err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchConversations();
    }, [user?.id])
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
          onPress={() => navigation.navigate("Search")}
        >
          <Ionicons name="create-outline" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.chatContainer}>
        {loading ? (
          <ActivityIndicator size="large" color={DarkTheme.PRIMARY_BUTTON} style={{ marginTop: 50 }} />
        ) : conversations.length === 0 ? (
          <View style={styles.emptyBox}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="chatbubbles-outline" size={48} color="#555" />
            </View>
            <Text style={styles.emptyTitle}>Your Messages</Text>
            <Text style={styles.emptyText}>Connect with friends and share moments. Start a conversation today.</Text>
            <TouchableOpacity 
              style={styles.findFriendsButton}
              onPress={() => navigation.navigate("Search")}
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
                avatar={item.otherUser.photo_url || "https://i.pravatar.cc/150"}
                message={item.lastMessage}
                time={item.time}
                onPress={() => navigation.navigate("ChatRoom", {
                  conversationId: item.id,
                  otherUser: item.otherUser
                })}
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
