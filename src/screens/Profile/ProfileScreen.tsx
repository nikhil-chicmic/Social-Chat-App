import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useEffect, useState } from "react";
import { DeviceEventEmitter, ScrollView, StyleSheet, View } from "react-native";
import { supabase } from "../../../lib/supabase";

import Header from "./Header";
import PostsGrid from "./PostsGrid";
import ProfileTabs from "./ProfileTabs";

const ProfileScreen = () => {
  const [activeTab, setActiveTab] = useState<"posts" | "likes" | "save">(
    "posts",
  );

  const [posts, setPosts] = useState<any[]>([]);
  const [likedPosts, setLikedPosts] = useState<any[]>([]);
  const [savedPosts, setSavedPosts] = useState<any[]>([]);

  const getCurrentUser = async () => {
    const { data } = await supabase.auth.getUser();
    return data.user;
  };

  const fetchPosts = async () => {
    const user = await getCurrentUser();
    if (!user) return;

    const { data } = await supabase
      .from("posts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setPosts(data || []);
  };

  const fetchLikedPosts = async () => {
    const user = await getCurrentUser();
    if (!user) return;

    const { data } = await supabase
      .from("likes")
      .select("posts(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setLikedPosts(data?.map((i: any) => i.posts) || []);
  };

  const fetchSavedPosts = async () => {
    const user = await getCurrentUser();
    if (!user) return;

    const { data } = await supabase
      .from("saved_posts")
      .select("posts(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setSavedPosts(data?.map((i: any) => i.posts) || []);
  };

  useFocusEffect(
    useCallback(() => {
      fetchPosts();
      fetchLikedPosts();
      fetchSavedPosts();
    }, []),
  );

  useEffect(() => {
    const unlikeListener = DeviceEventEmitter.addListener(
      "post_unliked",
      (postId: string) => {
        setLikedPosts((p) => p.filter((post) => post.id !== postId));
      },
    );

    const unsaveListener = DeviceEventEmitter.addListener(
      "post_unsaved",
      (postId: string) => {
        setSavedPosts((p) => p.filter((post) => post.id !== postId));
      },
    );

    return () => {
      unlikeListener.remove();
      unsaveListener.remove();
    };
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Header />

        <ProfileTabs activeTab={activeTab} setActiveTab={setActiveTab} />

        <View style={{ flex: 1 }}>
          <View style={{ display: activeTab === "posts" ? "flex" : "none" }}>
            <PostsGrid posts={posts} />
          </View>

          <View style={{ display: activeTab === "likes" ? "flex" : "none" }}>
            <PostsGrid posts={likedPosts} />
          </View>

          <View style={{ display: activeTab === "save" ? "flex" : "none" }}>
            <PostsGrid posts={savedPosts} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
});
