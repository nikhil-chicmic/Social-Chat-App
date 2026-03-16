import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { supabase } from "../../../lib/supabase";
import FollowButton from "../../components/Profile/FollowButton";
import { DarkTheme } from "../../theme/DarkTheme";
import PostsGrid from "./PostsGrid";
import { styles } from "./styles";

const blankProfile = require("../../../assets/BlankProfile.png");
const CONV_CACHE_KEY = "chat_conversation_cache";

const OtherProfileScreen = () => {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { userId } = route.params as { userId: string };

  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [postCount, setPostCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const getCurrentUser = async () => {
    const { data } = await supabase.auth.getUser();
    return data.user;
  };

  const findExistingConversation = async (myId: string, targetId: string) => {
    const { data: myConvs } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", myId);

    if (!myConvs?.length) return null;

    const convIds = myConvs.map((c) => c.conversation_id);

    const { data } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", targetId)
      .in("conversation_id", convIds);

    return data?.[0]?.conversation_id ?? null;
  };

  const createConversation = async (myId: string, targetId: string) => {
    const { data } = await supabase
      .from("conversations")
      .insert({})
      .select()
      .single();

    if (!data) return null;

    await supabase.from("conversation_participants").insert([
      { conversation_id: data.id, user_id: myId },
      { conversation_id: data.id, user_id: targetId },
    ]);

    return data.id;
  };

  const handleMessageUser = async (targetUser: any) => {
    const user = await getCurrentUser();
    if (!user?.id) return;

    let conversationId =
      (await findExistingConversation(user.id, targetUser.id)) || null;

    if (!conversationId) {
      conversationId = await createConversation(user.id, targetUser.id);
    }

    if (!conversationId) return;

    try {
      const raw = await AsyncStorage.getItem(CONV_CACHE_KEY);
      const cache = raw ? JSON.parse(raw) : {};

      cache[conversationId] = targetUser.id;

      await AsyncStorage.setItem(CONV_CACHE_KEY, JSON.stringify(cache));
    } catch {}

    navigation.navigate("ChatRoom", {
      conversationId,
      otherUser: targetUser,
    });
  };

  const loadProfile = async () => {
    try {
      setLoading(true);

      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      const { count: posts } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      const { count: followers } = await supabase
        .from("followers")
        .select("*", { count: "exact", head: true })
        .eq("following_id", userId);

      const { count: following } = await supabase
        .from("followers")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", userId);

      setPostCount(posts ?? 0);

      if (data) {
        setProfile({
          ...data,
          followers_count: followers ?? 0,
          following_count: following ?? 0,
        });
      }
    } catch (err) {
      console.error("Profile load error:", err);
    }

    setLoading(false);
  };

  const fetchPosts = async () => {
    const { data } = await supabase
      .from("posts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    setPosts(data || []);
  };

  useFocusEffect(
    useCallback(() => {
      loadProfile();
      fetchPosts();
    }, [userId]),
  );

  if (loading || !profile) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={DarkTheme.PRIMARY_BUTTON} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View
            style={[
              styles.topBar,
              { justifyContent: "flex-start", paddingBottom: 8 },
            ]}
          >
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ padding: 4, marginRight: 12 }}
            >
              <Ionicons name="arrow-back" size={26} color="#EBEBF5" />
            </TouchableOpacity>

            <Text style={[styles.topBarTitle, { color: "#fff", fontSize: 20 }]}>
              {profile.username}
            </Text>
          </View>

          <View style={styles.header}>
            <Image
              source={
                profile.photo_url ? { uri: profile.photo_url } : blankProfile
              }
              style={styles.avatar}
            />

            <View style={styles.statsContainer}>
              <Stat label="Posts" value={postCount} />

              <TouchableOpacity
                onPress={() =>
                  navigation.push("FollowStats", {
                    userId: profile.id,
                    initialTab: "followers",
                  })
                }
              >
                <Stat label="Followers" value={profile.followers_count} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  navigation.push("FollowStats", {
                    userId: profile.id,
                    initialTab: "following",
                  })
                }
              >
                <Stat label="Following" value={profile.following_count} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.userInfoSection}>
            <Text style={styles.username}>@{profile.username}</Text>
            <Text style={styles.bio}>{profile.bio || "No bio yet."}</Text>
          </View>

          <View style={styles.buttonRow}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <FollowButton targetUserId={userId} fullWidth />
            </View>

            <TouchableOpacity
              style={styles.editButton}
              onPress={() => handleMessageUser(profile)}
            >
              <Text style={styles.editText}>Message</Text>
            </TouchableOpacity>
          </View>

          <View
            style={{
              height: 1,
              backgroundColor: "#2A2A2C",
              marginVertical: 10,
            }}
          />

          <PostsGrid posts={posts} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const Stat = ({ label, value }: any) => (
  <View style={styles.statBox}>
    <Text style={styles.statNumber}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

export default OtherProfileScreen;
