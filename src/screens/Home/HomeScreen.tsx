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
        .range(from, to);

      if (data) {
        if (reset) {
          setPosts(data);
          setPage(1);
        } else {
          setPosts((prev) => {
            const newPosts = data.filter(
              (d) => !prev.some((p) => p.id === d.id),
            );
            return [...prev, ...newPosts];
          });
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
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.appText}>
            Social<Text style={{ color: "#fff" }}>Hub</Text>
          </Text>

          <TouchableOpacity
            style={styles.chatIcon}
            onPress={() => navigation.navigate("Message")}
          >
            <View style={styles.chatIconCircle}>
              <Ionicons
                name="chatbubble-ellipses"
                size={22}
                color={DarkTheme.PRIMARY_BUTTON}
              />
            </View>
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
          contentContainerStyle={{ paddingBottom: 20 }}
          ListFooterComponent={
            loading ? (
              <ActivityIndicator
                size="large"
                color={DarkTheme.PRIMARY_BUTTON}
                style={{ marginVertical: 30 }}
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
  container: {
    flex: 1,
    backgroundColor: DarkTheme.PRIMARY_BACKGROUND,
  },
  screen: {
    flex: 1,
    width: "100%",
  },

  header: {
    marginTop: 10,
    marginBottom: 5,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  appText: {
    color: DarkTheme.PRIMARY_BUTTON,
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -1,
  },

  chatIcon: {
    // position: "absolute",
    // right: 20,
  },

  chatIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(198, 255, 0, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },

  storySection: {
    paddingLeft: 20,
    marginTop: 10,
    marginBottom: 16,
  },
});
