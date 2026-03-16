import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  DeviceEventEmitter,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";

const blankProfile = require("../../assets/BlankProfile.png");

const timeAgo = (date: string) => {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

const PostScreen = ({ route, navigation }: any) => {
  const { post } = route.params;

  const [profile, setProfile] = useState(post?.users ?? null);
  const [loading, setLoading] = useState(!post?.users);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [expanded, setExpanded] = useState(false);

  const username = profile?.username ?? "user";
  const avatar = profile?.photo_url ? { uri: profile.photo_url } : blankProfile;

  const timeText = useMemo(() => timeAgo(post.created_at), [post.created_at]);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    setCurrentUser(user);

    if (!post?.users) {
      const { data: u } = await supabase
        .from("users")
        .select("id,username,photo_url")
        .eq("id", post.user_id)
        .single();
      setProfile(u);
    }

    await loadLikes();
    await loadLikeStatus(user?.id);
    await loadSaveStatus(user?.id);

    setLoading(false);
  };

  const loadLikes = async () => {
    const { count } = await supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .eq("post_id", post.id);

    setLikesCount(count ?? 0);
  };

  const loadLikeStatus = async (userId: string | undefined) => {
    if (!userId) return;

    const { data } = await supabase
      .from("likes")
      .select("id")
      .eq("post_id", post.id)
      .eq("user_id", userId)
      .maybeSingle();

    setLiked(!!data);
  };

  const loadSaveStatus = async (userId: string | undefined) => {
    if (!userId) return;

    const { data } = await supabase
      .from("saved_posts")
      .select("id")
      .eq("post_id", post.id)
      .eq("user_id", userId)
      .maybeSingle();

    setSaved(!!data);
  };

  const toggleLike = async () => {
    if (!currentUser) return;

    if (liked) {
      await supabase
        .from("likes")
        .delete()
        .eq("post_id", post.id)
        .eq("user_id", currentUser.id);

      setLiked(false);
      setLikesCount((v) => Math.max(v - 1, 0));
      DeviceEventEmitter.emit("post_unliked", post.id);
    } else {
      await supabase.from("likes").insert({
        user_id: currentUser.id,
        post_id: post.id,
      });

      setLiked(true);
      setLikesCount((v) => v + 1);

      if (post.user_id !== currentUser.id) {
        await supabase.from("notifications").insert({
          sender_id: currentUser.id,
          receiver_id: post.user_id,
          post_id: post.id,
          type: "like",
        });
      }
    }
  };

  const toggleSave = async () => {
    if (!currentUser) return;

    if (saved) {
      await supabase
        .from("saved_posts")
        .delete()
        .eq("post_id", post.id)
        .eq("user_id", currentUser.id);

      setSaved(false);
      DeviceEventEmitter.emit("post_unsaved", post.id);
    } else {
      await supabase.from("saved_posts").insert({
        user_id: currentUser.id,
        post_id: post.id,
      });
      setSaved(true);
    }
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
      {/* TOP BAR */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Post</Text>
        <View style={{ width: 26 }} />
      </View>

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Image source={avatar} style={styles.profileImg} />
          <Text style={styles.username}>{username}</Text>
        </View>
        <Ionicons name="ellipsis-horizontal" size={20} color="#fff" />
      </View>

      {/* IMAGE */}
      <Image source={{ uri: post.image_url }} style={styles.image} />

      {/* ACTIONS */}
      <View style={styles.actions}>
        <View style={styles.leftActions}>
          <TouchableOpacity onPress={toggleLike}>
            <Ionicons
              name={liked ? "heart" : "heart-outline"}
              size={26}
              color={liked ? "red" : "#fff"}
            />
          </TouchableOpacity>

          <Ionicons name="chatbubble-outline" size={24} color="#fff" />
          <Ionicons name="paper-plane-outline" size={24} color="#fff" />
        </View>

        <TouchableOpacity onPress={toggleSave}>
          <Ionicons
            name={saved ? "bookmark" : "bookmark-outline"}
            size={24}
            color="#fff"
          />
        </TouchableOpacity>
      </View>

      {/* LIKES */}
      <Text style={styles.likes}>
        {likesCount.toLocaleString()} {likesCount <= 1 ? "like" : "likes"}
      </Text>

      {/* CAPTION */}
      {post.caption && (
        <Text style={styles.caption}>
          <Text style={styles.username}>{username} </Text>
          {expanded || post.caption.length <= 100
            ? post.caption
            : post.caption.slice(0, 100)}

          {post.caption.length > 100 && (
            <TouchableOpacity onPress={() => setExpanded(!expanded)}>
              <Text style={styles.more}>{expanded ? " less" : "...more"}</Text>
            </TouchableOpacity>
          )}
        </Text>
      )}

      <Text style={styles.time}>{timeText}</Text>
    </SafeAreaView>
  );
};

export default PostScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },

  center: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
  },

  title: { color: "#fff", fontSize: 18, fontWeight: "600" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingBottom: 8,
  },

  userInfo: { flexDirection: "row", alignItems: "center" },

  profileImg: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },

  username: { color: "#fff", fontWeight: "700" },

  image: {
    width: "100%",
    height: 420,
    backgroundColor: "#111",
  },

  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 14,
  },

  leftActions: { flexDirection: "row", gap: 16 },

  likes: { color: "#fff", fontWeight: "600", paddingHorizontal: 14 },

  caption: { color: "#fff", paddingHorizontal: 14, marginTop: 6 },

  more: { color: "#999" },

  time: { color: "gray", fontSize: 12, paddingHorizontal: 14, marginTop: 6 },
});
