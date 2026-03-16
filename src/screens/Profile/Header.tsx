import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  DeviceEventEmitter,
  Image,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { supabase } from "../../../lib/supabase";
import { DarkTheme } from "../../theme/DarkTheme";
import { styles } from "./styles";

const blankProfile = require("../../../assets/BlankProfile.png");

const Header = () => {
  const navigation = useNavigation<any>();

  const [profile, setProfile] = useState<any>(null);
  const [postCount, setPostCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [editingProfile, setEditingProfile] = useState(false);
  const [usernameDraft, setUsernameDraft] = useState("");
  const [bioDraft, setBioDraft] = useState("");

  const getUser = async () => {
    const { data } = await supabase.auth.getUser();
    return data.user;
  };

  const loadProfile = async () => {
    const user = await getUser();
    if (!user) return setLoading(false);

    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    const { count: posts } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    const { count: followers } = await supabase
      .from("followers")
      .select("*", { count: "exact", head: true })
      .eq("following_id", user.id);

    const { count: following } = await supabase
      .from("followers")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", user.id);

    setPostCount(posts ?? 0);

    if (data) {
      setProfile({
        ...data,
        followers_count: followers ?? 0,
        following_count: following ?? 0,
      });

      setUsernameDraft(data.username ?? "");
      setBioDraft(data.bio ?? "");
    }

    setLoading(false);
  };

  useEffect(() => {
    loadProfile();

    const sub = DeviceEventEmitter.addListener("followChanged", loadProfile);
    return () => sub.remove();
  }, []);

  const pickImage = async () => {
    const user = await getUser();
    if (!user) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return Alert.alert("Permission required");

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (result.canceled) return;

    try {
      setUploading(true);

      const uri = result.assets[0].uri;
      const fileName = `${user.id}/avatar.jpg`;

      const response = await fetch(uri);
      const buffer = await response.arrayBuffer();

      await supabase.storage.from("avatars").remove([fileName]);

      await supabase.storage
        .from("avatars")
        .upload(fileName, buffer, { contentType: "image/jpeg" });

      const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);

      const photoUrl = `${data.publicUrl}?t=${Date.now()}`;

      await supabase
        .from("users")
        .update({ photo_url: photoUrl })
        .eq("id", user.id);

      setProfile((p: any) => ({ ...p, photo_url: photoUrl }));
    } catch (err: any) {
      Alert.alert("Upload failed", err.message);
    }

    setUploading(false);
  };

  const handleProfileSave = async () => {
    if (!profile) return;

    const username = usernameDraft.trim().toLowerCase();

    if (username.includes(" "))
      return Alert.alert("Username cannot contain spaces");

    if (username.length < 4)
      return Alert.alert("Username: Minimum 4 characters required");

    if (bioDraft.split("\n").length > 4)
      return Alert.alert("Bio: Max 4 lines allowed");

    if (username !== profile.username) {
      const { data } = await supabase
        .from("users")
        .select("username")
        .eq("username", username)
        .single();

      if (data) return Alert.alert("Username already taken");
    }

    const user = await getUser();
    if (!user) return;

    await supabase
      .from("users")
      .update({ username, bio: bioDraft })
      .eq("id", user.id);

    setProfile((p: any) => ({ ...p, username, bio: bioDraft }));
    setEditingProfile(false);
  };

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: () => supabase.auth.signOut(),
      },
    ]);
  };

  const saveDisabled =
    usernameDraft === profile?.username && bioDraft === profile?.bio;

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={DarkTheme.PRIMARY_BUTTON} />
      </View>
    );

  if (!profile) return null;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>
          Social<Text style={{ color: "#fff" }}>Hub</Text>
        </Text>

        <TouchableOpacity onPress={handleLogout} style={styles.iconButton}>
          <Ionicons name="log-out-outline" size={22} color="#EBEBF5" />
        </TouchableOpacity>
      </View>

      <View style={styles.header}>
        <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
          <Image
            source={
              profile.photo_url ? { uri: profile.photo_url } : blankProfile
            }
            style={styles.avatar}
          />

          {uploading && (
            <ActivityIndicator
              style={styles.uploadingIndicator}
              color={DarkTheme.PRIMARY_BUTTON}
            />
          )}
        </TouchableOpacity>

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
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setEditingProfile(true)}
        >
          <Text style={styles.editText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={editingProfile} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Edit Profile</Text>

            <Text style={styles.inputLabel}>Username</Text>
            <TextInput
              style={styles.inputUsername}
              autoCapitalize="none"
              value={usernameDraft}
              onChangeText={setUsernameDraft}
            />

            <Text style={styles.inputLabel}>Bio</Text>
            <TextInput
              style={styles.input}
              multiline
              maxLength={90}
              value={bioDraft}
              onChangeText={setBioDraft}
            />

            <TouchableOpacity
              style={[styles.saveButton, saveDisabled && { opacity: 0.5 }]}
              onPress={handleProfileSave}
              disabled={saveDisabled}
            >
              <Text style={styles.saveText}>Save Changes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setEditingProfile(false)}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const Stat = ({ label, value }: any) => (
  <View style={styles.statBox}>
    <Text style={styles.statNumber}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

export default Header;
