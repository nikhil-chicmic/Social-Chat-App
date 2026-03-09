import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";
import { DarkTheme } from "../theme/DarkTheme";
const blankProfile = require("../../assets/BlankProfile.png");

const NotificationScreen = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select(
        `
        id,
        type,
        created_at,
        sender:users!sender_id (
          id,
          username,
          photo_url
        ),
        post:posts (
          id,
          image_url
        )
      `,
      )
      .eq("receiver_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setNotifications(data);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const renderItem = ({ item }: any) => {
    const avatar = item.sender?.photo_url
      ? { uri: item.sender.photo_url }
      : blankProfile;

    return (
      <View style={styles.row}>
        <Image source={avatar} style={styles.avatar} />

        <View style={styles.textContainer}>
          <Text style={styles.text}>
            <Text style={styles.username}>
              {item.sender?.username ?? "someone"}
            </Text>{" "}
            {item.type === "follow"
              ? "started following you. "
              : "liked your post. "}
            <Text style={styles.timeText}>Just now</Text>
          </Text>
        </View>

        {item.type === "like" && item.post?.image_url ? (
          <Image
            source={{ uri: item.post.image_url }}
            style={styles.postPreview}
          />
        ) : item.type === "follow" ? (
          <View style={styles.iconIndicator}>
            <Ionicons name="person-add" size={16} color="#8E8E93" />
          </View>
        ) : null}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={DarkTheme.PRIMARY_BUTTON} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Text style={styles.heading}>Activity</Text>

      {notifications.length === 0 ? (
        <View style={styles.emptyBox}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="notifications-off-outline" size={48} color="#555" />
          </View>
          <Text style={styles.emptyTitle}>Nothing here yet</Text>
          <Text style={styles.emptyText}>
            When someone likes your posts or follows you, you'll see it here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={DarkTheme.PRIMARY_BUTTON}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

export default NotificationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DarkTheme.PRIMARY_BACKGROUND,
  },
  heading: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "800",
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1A1A1C",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 14,
    borderWidth: 1,
    borderColor: "#2A2A2C",
    backgroundColor: "#161618",
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
    paddingRight: 10,
  },
  username: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  text: {
    color: "#EBEBF5",
    fontSize: 15,
    lineHeight: 22,
  },
  timeText: {
    color: "#8E8E93",
    fontSize: 13,
  },
  postPreview: {
    width: 50,
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2A2A2C",
  },
  iconIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#161618",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2A2C",
  },
  emptyBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    marginTop: -50, // Slight upward adjustment for visual center
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
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
  },
  emptyText: {
    color: "#8E8E93",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  center: {
    flex: 1,
    backgroundColor: DarkTheme.PRIMARY_BACKGROUND,
    justifyContent: "center",
    alignItems: "center",
  },
});
