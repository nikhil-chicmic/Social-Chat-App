import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../../lib/supabase";
import { styles } from "./styles";
import PostsGrid from "./PostsGrid";
import { DarkTheme } from "../../theme/DarkTheme";
import FollowButton from "../../components/Profile/FollowButton";
import { useChatNavigation } from "../../hooks/useChatNavigation";

const blankProfile = require("../../../assets/BlankProfile.png");

const OtherProfileScreen = () => {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { userId } = route.params as { userId: string };
  const { handleMessageUser } = useChatNavigation();
  
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<any[]>([]);
  const [postCount, setPostCount] = useState(0);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();
        
      if (error) throw error;
      
      const { count: postsCount } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);
        
      const { count: followersCount } = await supabase
        .from("followers")
        .select("*", { count: "exact", head: true })
        .eq("following_id", userId);
        
      const { count: followingCount } = await supabase
        .from("followers")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", userId);
        
      setPostCount(postsCount ?? 0);
      
      if (data) {
        setProfile({
          ...data,
          followers_count: followersCount ?? 0,
          following_count: followingCount ?? 0,
        });
      }
    } catch (err) {
      console.error("Error loading user profile", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setPosts(data);
    }
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
          {/* Header Row */}
          <View style={[styles.topBar, { justifyContent: "flex-start", paddingBottom: 8 }]}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4, marginRight: 12 }}>
              <Ionicons name="arrow-back" size={26} color="#EBEBF5" />
            </TouchableOpacity>
            <Text style={[styles.topBarTitle, { color: "#fff", fontSize: 20 }]}>
              {profile.username}
            </Text>
          </View>

          {/* Profile Details */}
          <View style={styles.header}>
            <View style={styles.avatarContainer}>
              <Image
                source={profile.photo_url ? { uri: profile.photo_url } : blankProfile}
                style={styles.avatar}
              />
            </View>

          <View style={styles.statsContainer}>
              <Stat label="Posts" value={postCount} />

              <TouchableOpacity onPress={() => navigation.push("FollowStats", { userId: profile.id, initialTab: "followers" })}>
                <Stat label="Followers" value={profile.followers_count} />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigation.push("FollowStats", { userId: profile.id, initialTab: "following" })}>
                <Stat label="Following" value={profile.following_count} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.userInfoSection}>
            <Text style={styles.username}>@{profile.username}</Text>
            <Text style={styles.bio}>{profile.bio || "No bio yet."}</Text>
          </View>

          {/* Actions */}
          <View style={styles.buttonRow}>
            <View style={{ flex: 1, marginRight: 10 }}>
                <FollowButton targetUserId={userId} fullWidth={true} />
            </View>
            <TouchableOpacity 
                style={styles.editButton} 
                onPress={() => handleMessageUser(profile)}
            >
              <Text style={styles.editText}>Message</Text>
            </TouchableOpacity>
          </View>

          {/* Feed Divider */}
          <View style={{ height: 1, backgroundColor: "#2A2A2C", marginVertical: 10 }} />
          
          <PostsGrid posts={posts} refreshPosts={fetchPosts} />
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
