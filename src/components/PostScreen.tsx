import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  DeviceEventEmitter,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";

const blankProfile = require("../../assets/BlankProfile.png");

const timeAgo = (date: string) => {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  const m = 60;
  const h = 3600;
  const d = 86400;

  if (seconds < m) return `${seconds}s ago`;
  if (seconds < h) return `${Math.floor(seconds / m)}m ago`;
  if (seconds < d) return `${Math.floor(seconds / h)}h ago`;
  return `${Math.floor(seconds / d)}d ago`;
};

const PostScreen = ({ route, navigation }: any) => {
  const { post } = route.params;

  const [profile, setProfile] = useState<any>(post?.users ?? null);
  const [loading, setLoading] = useState(!post?.users);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    checkLikeStatus();
    checkSaveStatus();
    loadLikesCount();
  }, []);

  const checkLikeStatus = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await supabase
      .from("likes")
      .select("id")
      .eq("post_id", post.id)
      .eq("user_id", user.id)
      .maybeSingle();

    setLiked(!!data);
  };

  const checkSaveStatus = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await supabase
      .from("saved_posts")
      .select("id")
      .eq("post_id", post.id)
      .eq("user_id", user.id)
      .maybeSingle();

    setSaved(!!data);
  };

  const loadLikesCount = async () => {
    const { count } = await supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .eq("post_id", post.id);

    setLikesCount(count ?? 0);
  };

  const toggleLike = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    if (liked) {
      const { error } = await supabase
        .from("likes")
        .delete()
        .eq("post_id", post.id)
        .eq("user_id", user.id);

      if (!error) {
        setLiked(false);
        setLikesCount((prev: number) => Math.max(prev - 1, 0));
        DeviceEventEmitter.emit("post_unliked", post.id);
      }
    } else {
      const { error } = await supabase.from("likes").insert({
        user_id: user.id,
        post_id: post.id,
      });

      if (!error) {
        setLiked(true);
        setLikesCount((prev: number) => prev + 1);

        if (post.user_id !== user.id) {
          await supabase.from("notifications").insert({
            sender_id: user.id,
            receiver_id: post.user_id,
            post_id: post.id,
            type: "like",
          });
        }
      }
    }
  };

  const toggleSave = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    if (saved) {
      const { error } = await supabase
        .from("saved_posts")
        .delete()
        .eq("post_id", post.id)
        .eq("user_id", user.id);

      if (!error) {
        setSaved(false);
        DeviceEventEmitter.emit("post_unsaved", post.id);
      }
    } else {
      const { error } = await supabase.from("saved_posts").insert({
        user_id: user.id,
        post_id: post.id,
      });

      if (!error) {
        setSaved(true);
      }
    }
  };

  useEffect(() => {
    if (post?.users) {
      setLoading(false);
      return;
    }

    const fetchUser = async () => {
      const { data } = await supabase
        .from("users")
        .select("id,username,photo_url")
        .eq("id", post.user_id)
        .single();

      if (data) setProfile(data);
      setLoading(false);
    };

    fetchUser();
  }, []);

  const timeText = useMemo(() => {
    if (!post?.created_at) return "";
    return timeAgo(post.created_at);
  }, [post]);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#fff" />
      </SafeAreaView>
    );
  }

  const avatar = profile?.photo_url ? { uri: profile.photo_url } : blankProfile;

  const username = profile?.username ?? "user";

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.title}>Post</Text>

        <View style={{ width: 26 }} />
      </View>

      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Image source={avatar} style={styles.profileImg} />
          <Text style={styles.username}>{username}</Text>
        </View>

        <Ionicons name="ellipsis-horizontal" size={20} color="#fff" />
      </View>

      <Image
        source={{ uri: post.image_url }}
        style={styles.postImage}
        resizeMode="cover"
      />

      <View style={styles.actionsRow}>
        <View style={styles.leftActions}>
          <TouchableOpacity onPress={toggleLike}>
            <Ionicons
              name={liked ? "heart" : "heart-outline"}
              size={26}
              color={liked ? "red" : "#fff"}
            />
          </TouchableOpacity>

          <TouchableOpacity>
            <Ionicons name="chatbubble-outline" size={24} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity>
            <Ionicons name="paper-plane-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={toggleSave}>
          <Ionicons
            name={saved ? "bookmark" : "bookmark-outline"}
            size={24}
            color="#fff"
          />
        </TouchableOpacity>
      </View>

      <Text style={styles.likesText}>{likesCount.toLocaleString()} likes</Text>

      {post.caption ? (
        <Text style={styles.caption}>
          <Text style={styles.username}>{username} </Text>

          {expanded || post.caption.length <= 100 ? (
            <>
              {post.caption}
              {post.caption.length > 100 && (
                <TouchableOpacity onPress={() => setExpanded(false)}>
                  <Text style={{ color: "#999" }}> less</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <>
              {post.caption.slice(0, 100)}
              <TouchableOpacity onPress={() => setExpanded(true)}>
                <Text style={{ color: "#999" }}>...more</Text>
              </TouchableOpacity>
            </>
          )}
        </Text>
      ) : null}

      <Text style={styles.timeText}>{timeText}</Text>
    </SafeAreaView>
  );
};

export default PostScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

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
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },

  profileImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },

  username: {
    color: "#fff",
    fontWeight: "700",
  },

  postImage: {
    width: "100%",
    height: 420,
    backgroundColor: "#111",
  },

  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },

  leftActions: {
    flexDirection: "row",
    gap: 16,
  },

  likesText: {
    color: "#fff",
    fontWeight: "600",
    paddingHorizontal: 12,
  },

  caption: {
    color: "#fff",
    paddingHorizontal: 12,
    marginTop: 4,
  },

  timeText: {
    color: "gray",
    fontSize: 12,
    paddingHorizontal: 12,
    marginTop: 6,
  },
});
