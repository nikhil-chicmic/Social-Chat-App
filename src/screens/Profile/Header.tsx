import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import React, { useCallback, useEffect, useState } from "react";
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
  const [profile, setProfile] = useState<any>(null);
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [bioDraft, setBioDraft] = useState("");
  const [usernameDraft, setUsernameDraft] = useState("");
  const [uploading, setUploading] = useState(false);
  const [postCount, setPostCount] = useState(0);
  const [disabled, setDisabled] = useState(false);

  const loadProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();
    const { count: postsCount } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);
    const { count: followersCount } = await supabase
      .from("followers")
      .select("*", { count: "exact", head: true })
      .eq("following_id", user.id);
    const { count: followingCount } = await supabase
      .from("followers")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", user.id);
    setPostCount(postsCount ?? 0);
    if (data) {
      setProfile({
        ...data,
        followers_count: followersCount ?? 0,
        following_count: followingCount ?? 0,
      });
      setBioDraft(data.bio ?? "");
      setUsernameDraft(data.username ?? "");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadProfile();
    const sub = DeviceEventEmitter.addListener("followChanged", () => {
      loadProfile();
    });
    return () => sub.remove();
  }, []);

  const openEditModal = () => {
    setBioDraft(profile?.bio ?? "");
    setUsernameDraft(profile?.username ?? "");
    setEditingProfile(true);
  };

  const pickImage = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required");
      return;
    }
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
      const fileExt = uri.split(".").pop();
      const fileName = `${user.id}/avatar.${fileExt}`;
      await supabase.storage.from("avatars").remove([fileName]);
      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, arrayBuffer, {
          contentType: "image/jpeg",
        });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);
      const photoUrl = `${data.publicUrl}?t=${Date.now()}`;
      await supabase
        .from("users")
        .update({ photo_url: photoUrl })
        .eq("id", user.id);
      setProfile((prev: any) => ({
        ...prev,
        photo_url: photoUrl,
      }));
    } catch (err: any) {
      Alert.alert("Upload failed", err.message);
    } finally {
      setUploading(false);
    }
  }, []);

  const handleProfileSave = async () => {
    if (!profile) return;

    if (usernameDraft.includes(" ")) {
      Alert.alert("Username cannot contain spaces");
      return;
    }
    const newUsername = usernameDraft.trim().toLowerCase();
    if (newUsername.length < 4) {
      Alert.alert("Username: Minimum 4 characters required");
      return;
    }

    if (bioDraft.split("\n").length > 4) {
      Alert.alert("Bio: Max 4 lines allowed");
      return;
    }

    if (newUsername !== profile.username) {
      const { data: existing } = await supabase
        .from("users")
        .select("username")
        .eq("username", newUsername)
        .single();
      if (existing) {
        Alert.alert("Username already taken");
        return;
      }
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    await supabase
      .from("users")
      .update({ username: newUsername, bio: bioDraft })
      .eq("id", user.id);

    setProfile((prev: any) => ({
      ...prev,
      username: newUsername,
      bio: bioDraft,
    }));

    setEditingProfile(false);
  };

  const handleLogout = async () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => await supabase.auth.signOut(),
      },
    ]);
  };

  const handleDisabled = () => {
    const isDisabled =
      usernameDraft === profile.username && bioDraft === profile.bio;
    if (isDisabled) return true;
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={DarkTheme.PRIMARY_BUTTON} />
      </View>
    );
  }

  if (!profile) return null;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Top action row */}
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
        <TouchableOpacity style={styles.editButton} onPress={openEditModal}>
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
              style={
                handleDisabled()
                  ? { ...styles.saveButton, opacity: 0.5 }
                  : styles.saveButton
              }
              onPress={handleProfileSave}
              disabled={handleDisabled()}
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
