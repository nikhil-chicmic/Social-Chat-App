import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

import { supabase } from "../../lib/supabase";
import { DarkTheme } from "../theme/DarkTheme";

const blankProfile = require("../../assets/BlankProfile.png");

const timeAgo = (date: string) => {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;

  return `${Math.floor(seconds / 86400)}d ago`;
};

const NotificationScreen = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<NavigationProp>();

  const getCurrentUser = async () => {
    const { data } = await supabase.auth.getUser();
    return data.user;
  };

  const fetchNotifications = async () => {
    const user = await getCurrentUser();
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

    setNotifications(data || []);
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

  const getAvatar = (item: any) =>
    item.sender?.photo_url ? { uri: item.sender.photo_url } : blankProfile;

  const renderNotificationText = (item: any) => {
    const username = item.sender?.username ?? "someone";

    if (item.type === "follow") {
      return (
        <>
          <Text style={styles.username}>{username}</Text> started following you.
        </>
      );
    }

    return (
      <>
        <Text style={styles.username}>{username}</Text> liked your post.
      </>
    );
  };

  const renderRightContent = (item: any) => {
    if (item.type === "like" && item.post?.image_url) {
      return (
        <Image
          source={{ uri: item.post.image_url }}
          style={styles.postPreview}
        />
      );
    }

    if (item.type === "follow") {
      return (
        <View style={styles.iconIndicator}>
          <Ionicons name="person-add" size={16} color="#8E8E93" />
        </View>
      );
    }

    return null;
  };

  const renderItem = ({ item }: any) => {
    const senderId = item.sender?.id;
    const post = item.post;

    return (
      <View style={styles.row}>
        {/* Avatar + Username → Profile */}
        <TouchableOpacity
          style={{ flexDirection: "row", flex: 1, alignItems: "center" }}
          onPress={() =>
            senderId &&
            navigation.navigate("OtherProfile", { userId: senderId })
          }
        >
          <Image source={getAvatar(item)} style={styles.avatar} />

          <View style={styles.textContainer}>
            <Text style={styles.text}>
              {renderNotificationText(item)}{" "}
              <Text style={styles.timeText}>{timeAgo(item.created_at)}</Text>
            </Text>
          </View>
        </TouchableOpacity>

        {/* Right side content */}
        {item.type === "like" && post?.image_url ? (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("Post", {
                post,
              })
            }
          >
            <Image
              source={{ uri: post.image_url }}
              style={styles.postPreview}
            />
          </TouchableOpacity>
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

          <Text style={styles.emptyTitle}>No notifications yet</Text>

          <Text style={styles.emptyText}>
            When someone likes your posts or follows you, you'll see it here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={DarkTheme.PRIMARY_BUTTON}
            />
          }
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
    marginTop: -50,
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
