import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  DeviceEventEmitter,
  FlatList,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../../lib/supabase";
import OurStory from "../../components/OurStory";
import Post from "../../components/Post";
import { DarkTheme } from "../../theme/DarkTheme";
import { styles } from "./styles";

const PAGE_SIZE = 15;

const HomeScreen = () => {
  const navigation = useNavigation<any>();

  const [posts, setPosts] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  const fetchPosts = async (reset = false) => {
    if (loading) return;

    setLoading(true);

    const currentPage = reset ? 0 : page;
    const from = currentPage * PAGE_SIZE;
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
        setPosts((prev) => [...prev, ...data]);
        setPage((prev) => prev + 1);
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchPosts(true);
    const listener = DeviceEventEmitter.addListener("post_uploaded", () => {
      fetchPosts(true);
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    });
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
            prev.map((post) =>
              post.id === postId ? { ...post, likes_count: count ?? 0 } : post,
            ),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      listener.remove();
    };
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={styles.appText}>Social</Text>
            <Text style={{ ...styles.appText, color: "#fff" }}>Hub</Text>
          </View>

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

        <FlatList
          ref={flatListRef}
          data={posts}
          keyExtractor={(item, index) => item.id + index}
          renderItem={({ item }) => <Post post={item} />}
          showsVerticalScrollIndicator={false}
          onEndReached={() => fetchPosts()}
          onEndReachedThreshold={0.5}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListHeaderComponent={
            <View style={styles.storySection}>
              <ScrollView
                horizontal
                bounces={false}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 20 }}
              >
                <OurStory />
              </ScrollView>
            </View>
          }
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
