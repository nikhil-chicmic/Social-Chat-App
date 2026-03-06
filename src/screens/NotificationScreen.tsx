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
              {item.sender?.username ?? "user"}
            </Text>{" "}
            {item.type === "follow"
              ? "started following you"
              : "liked your post"}
          </Text>
        </View>

        {item.type === "like" && item.post?.image_url ? (
          <Image
            source={{ uri: item.post.image_url }}
            style={styles.postPreview}
          />
        ) : null}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#fff" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>Notifications</Text>

      {notifications.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>No notifications yet</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
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
    fontSize: 22,
    fontWeight: "800",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  username: {
    color: "#fff",
    fontWeight: "700",
  },
  text: {
    color: "#ddd",
  },
  postPreview: {
    width: 44,
    height: 44,
    borderRadius: 6,
  },
  emptyBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: "#777",
    fontSize: 16,
  },
  center: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
});
