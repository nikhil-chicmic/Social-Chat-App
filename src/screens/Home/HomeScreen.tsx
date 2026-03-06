import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../../lib/supabase";
import OurStory from "../../components/OurStory";
import Post from "../../components/Post";
import StoryCircle from "../../components/StoryCircle";
import { DarkTheme } from "../../theme/DarkTheme";

const PAGE_SIZE = 15;

const HomeScreen = () => {
  const navigation = useNavigation<any>();

  const [posts, setPosts] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchPosts = useCallback(
    async (reset = false) => {
      if (loading) return;

      setLoading(true);

      const from = reset ? 0 : page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data } = await supabase
        .from("posts")
        .select(
          `
          *,
          users (
            id,
            username,
            photo_url
          )
        `,
        )
        .order("created_at", { ascending: false })
        .limit(100);

      if (data) {
        const shuffled = [...data].sort(() => Math.random() - 0.5);
        const paginated = shuffled.slice(from, to + 1);

        if (reset) {
          setPosts(paginated);
          setPage(1);
        } else {
          setPosts((prev) => [...prev, ...paginated]);
          setPage((prev) => prev + 1);
        }
      }

      setLoading(false);
    },
    [page, loading],
  );

  useEffect(() => {
    fetchPosts(true);
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("likes-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "likes" },
        async (payload) => {
          const postId =
            (payload.new as any)?.post_id || (payload.old as any)?.post_id;

          if (!postId) return;

          const { count } = await supabase
            .from("likes")
            .select("*", { count: "exact", head: true })
            .eq("post_id", postId);

          setPosts((prev) =>
            prev.map((p) =>
              p.id === postId ? { ...p, likes_count: count ?? 0 } : p,
            ),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const renderPost = ({ item }: any) => {
    return <Post post={item} />;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }} edges={["top"]}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.appText}>
            Social<Text style={{ color: "#fff" }}>Hub</Text>
          </Text>

          <TouchableOpacity
            style={styles.chatIcon}
            onPress={() => navigation.navigate("Message")}
          >
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={30}
              color="white"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.storySection}>
          <ScrollView
            horizontal
            bounces={false}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 20 }}
          >
            <OurStory />
            <StoryCircle />
          </ScrollView>
        </View>

        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={renderPost}
          showsVerticalScrollIndicator={false}
          onEndReached={() => fetchPosts()}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loading ? (
              <ActivityIndicator
                size="large"
                color="#fff"
                style={{ marginVertical: 20 }}
              />
            ) : null
          }
        />
      </View>
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    width: "100%",
  },

  header: {
    marginTop: 5,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  appText: {
    color: DarkTheme.PRIMARY_BUTTON,
    fontSize: 30,
    fontWeight: "900",
  },

  chatIcon: {
    position: "absolute",
    right: 20,
  },

  storySection: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 10,
  },
});
