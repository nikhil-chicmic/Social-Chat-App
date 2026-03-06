import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { supabase } from "../../lib/supabase";

const blankProfile = require("../../assets/BlankProfile.png");

const timeAgo = (dateString: string) => {
  const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
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
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  const username = post?.users?.username ?? "user";
  const avatar = post?.users?.photo_url
    ? { uri: post.users.photo_url }
    : blankProfile;

  const timeText = useMemo(() => timeAgo(post.created_at), [post.created_at]);

  useEffect(() => {
    checkLikeStatus();
    loadLikesCount();
  }, []);

  const loadLikesCount = async () => {
    const { count } = await supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .eq("post_id", post.id);

    setLikesCount(count ?? 0);
  };

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
        setLikesCount((prev) => Math.max(prev - 1, 0));
        if (refreshPosts) refreshPosts();
      }
    } else {
      const { error } = await supabase.from("likes").insert({
        user_id: user.id,
        post_id: post.id,
      });

      if (!error) {
        setLiked(true);
        setLikesCount((prev) => prev + 1);

        if (post.user_id !== user.id) {
          await supabase.from("notifications").insert({
            sender_id: user.id,
            receiver_id: post.user_id,
            post_id: post.id,
            type: "like",
          });
        }

        if (refreshPosts) refreshPosts();
      }
    }
  };

  return (
    <View style={styles.postContainer}>
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

        <TouchableOpacity>
          <Ionicons name="bookmark-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <Text style={styles.likesText}>{likesCount.toLocaleString()} likes</Text>

      {post.caption ? (
        <Text style={styles.caption}>
          <Text style={styles.username}>{username} </Text>
          {post.caption}
        </Text>
      ) : null}

      <Text style={styles.timeText}>{timeText}</Text>
    </View>
  );
};

export default Post;

const styles = StyleSheet.create({
  postContainer: {
    marginBottom: 20,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
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
    fontWeight: "600",
  },

  postImage: {
    width: "100%",
    height: 400,
  },

  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
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
    marginTop: 4,
  },
});
