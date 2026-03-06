import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { supabase } from "../../../lib/supabase";
import Header from "./Header";
import PostsGrid from "./PostsGrid";
import ProfileTabs from "./ProfileTabs";

const ProfileScreen = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"posts" | "likes" | "save">(
    "posts",
  );

  const fetchPosts = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    let query;

    if (activeTab === "posts") {
      query = supabase.from("posts").select("*").eq("user_id", user.id);
    } else if (activeTab === "likes") {
      query = supabase.from("likes").select("posts(*)").eq("user_id", user.id);
    } else {
      query = supabase
        .from("saved_posts")
        .select("posts(*)")
        .eq("user_id", user.id);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (!error && data) {
      if (activeTab === "posts") {
        setPosts(data);
      } else {
        const extractedPosts = data.map((item: any) => item.posts);
        setPosts(extractedPosts);
      }
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPosts();
    }, [activeTab]),
  );

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Header />

        <ProfileTabs activeTab={activeTab} setActiveTab={setActiveTab} />

        <PostsGrid posts={posts} refreshPosts={fetchPosts} />
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
