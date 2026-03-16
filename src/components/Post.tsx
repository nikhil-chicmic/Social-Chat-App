import { Ionicons } from "@expo/vector-icons";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import React, { useEffect, useMemo, useState } from "react";
import {
  DeviceEventEmitter,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";

const blankProfile = require("../../assets/BlankProfile.png");

const timeAgo = (date: string) => {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  const m = 60,
    h = 3600,
    d = 86400;

  if (diff < m) return `${diff}s ago`;
  if (diff < h) return `${Math.floor(diff / m)}m ago`;
  if (diff < d) return `${Math.floor(diff / h)}h ago`;
  return `${Math.floor(diff / d)}d ago`;
};

type Props = {
  post: any;
  refreshPosts?: () => Promise<void> | void;
};

const Post = ({ post, refreshPosts }: Props) => {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [expanded, setExpanded] = useState(false);

  const username = post?.users?.username ?? "user";
  const avatar = post?.users?.photo_url
    ? { uri: post.users.photo_url }
    : blankProfile;

  const timeText = useMemo(() => timeAgo(post.created_at), [post.created_at]);

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      setCurrentUser(data.user);
    };
    loadUser();
  }, []);

  useEffect(() => {
    if (!isFocused || !post?.id) return;
    loadLikeStatus();
    loadSaveStatus();
    loadLikesCount();
  }, [isFocused, post.id]);

  const loadLikesCount = async () => {
    const { count } = await supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .eq("post_id", post.id);

    setLikesCount(count ?? 0);
  };

  const loadLikeStatus = async () => {
    if (!currentUser) return;

    const { data } = await supabase
      .from("likes")
      .select("id")
      .eq("post_id", post.id)
      .eq("user_id", currentUser.id)
      .maybeSingle();

    setLiked(!!data);
  };

  const loadSaveStatus = async () => {
    if (!currentUser) return;

    const { data } = await supabase
      .from("saved_posts")
      .select("id")
      .eq("post_id", post.id)
      .eq("user_id", currentUser.id)
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

    refreshPosts?.();
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

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.userRow}
          onPress={() =>
            post.user_id === currentUser?.id
              ? navigation.navigate("Profile")
              : navigation.push("OtherProfile", { userId: post.user_id })
          }
        >
          <Image source={avatar} style={styles.avatar} />
          <Text style={styles.username}>{username}</Text>
        </TouchableOpacity>

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
    </View>
  );
};

export default Post;

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#161618",
    borderWidth: 1,
    borderColor: "#2A2A2C",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
  },

  userRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: "#2A2A2C",
  },

  username: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },

  image: {
    width: "100%",
    height: 400,
  },

  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },

  leftActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },

  likes: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
    paddingHorizontal: 16,
    marginBottom: 6,
  },

  caption: {
    color: "#EBEBF5",
    paddingHorizontal: 16,
    lineHeight: 20,
    fontSize: 14,
  },

  more: {
    color: "#999",
  },

  time: {
    color: "#8E8E93",
    fontSize: 12,
    fontWeight: "500",
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    textTransform: "uppercase",
  },
});
