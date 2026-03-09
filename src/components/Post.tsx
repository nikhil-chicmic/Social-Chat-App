import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { supabase } from "../../lib/supabase";

const blankProfile = require("../../assets/BlankProfile.png");

import { useIsFocused, useNavigation } from "@react-navigation/native";

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
  const [saved, setSaved] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [expanded, setExpanded] = useState(false);

  const isFocused = useIsFocused();
  const navigation = useNavigation<any>();

  const username = post?.users?.username ?? "user";
  const avatar = post?.users?.photo_url
    ? { uri: post.users.photo_url }
    : blankProfile;

  const timeText = useMemo(() => timeAgo(post.created_at), [post.created_at]);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (isFocused) {
      checkLikeStatus();
      checkSaveStatus();
      loadLikesCount();
    }
  }, [isFocused, post.id]);

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

  return (
    <View style={styles.postContainer}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.userInfo}
          onPress={() => {
            if (post.user_id === user?.id) {
              navigation.navigate("Profile");
            } else {
              navigation.push("OtherProfile", { userId: post.user_id });
            }
          }}
        >
          <Image source={avatar} style={styles.profileImg} />
          <Text style={styles.username}>{username}</Text>
        </TouchableOpacity>

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
            color={saved ? "#fff" : "#fff"}
          />
        </TouchableOpacity>
      </View>

      <Text style={styles.likesText}>
        {likesCount.toLocaleString()} {likesCount <= 1 ? "like" : "likes"}
      </Text>

      {post.caption ? (
        <Text style={styles.caption}>
          <Text style={styles.username}>{username} </Text>

          {expanded || post.caption.length <= 100 ? (
            post.caption
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
    </View>
  );
};

export default Post;

const styles = StyleSheet.create({
  postContainer: {
    marginBottom: 24,
    backgroundColor: "#161618",
    borderRadius: 24,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: "#2A2A2C",
    overflow: "hidden",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
  },

  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },

  profileImg: {
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

  postImage: {
    width: "100%",
    height: 400,
  },

  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },

  leftActions: {
    flexDirection: "row",
    gap: 20,
    alignItems: "center",
  },

  likesText: {
    color: "#fff",
    fontWeight: "700",
    paddingHorizontal: 16,
    marginBottom: 6,
    fontSize: 14,
  },

  caption: {
    color: "#EBEBF5",
    paddingHorizontal: 16,
    lineHeight: 20,
    fontSize: 14,
  },

  timeText: {
    color: "#8E8E93",
    fontSize: 12,
    fontWeight: "500",
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    textTransform: "uppercase",
  },
});
