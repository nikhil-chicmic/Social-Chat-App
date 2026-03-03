import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../../lib/supabase";
import { styles } from "./styles";

const blankProfile = require("../../../assets/BlankProfile.png");

const Header = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editingBio, setEditingBio] = useState(false);
  const [bioDraft, setBioDraft] = useState("");
  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameDraft, setUsernameDraft] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!error && data) {
        setProfile(data);
        setBioDraft(data.bio ?? "");
      }

      setLoading(false);
    };

    loadProfile();
  }, []);

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
    });

    if (result.canceled) return;

    try {
      setUploading(true);

      const uri = result.assets[0].uri;
      const fileExt = uri.split(".").pop();
      const fileName = `${user.id}.${fileExt}`;

      const response = await fetch(uri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, blob, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      const photoUrl = publicUrlData.publicUrl;

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

  const handleBioSave = async () => {
    if (bioDraft.split("\n").length > 4) {
      Alert.alert("Max 4 lines allowed");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    await supabase.from("users").update({ bio: bioDraft }).eq("id", user.id);

    setProfile((prev: any) => ({
      ...prev,
      bio: bioDraft,
    }));

    setEditingBio(false);
  };

  const handleUsernameSave = async () => {
    if (!profile) return;

    if (usernameDraft.includes(" ")) {
      Alert.alert("Username cannot contain spaces");
      return;
    }

    const newUsername = usernameDraft.trim().toLowerCase();

    if (newUsername.length < 4) {
      Alert.alert("Minimum 4 characters required");
      return;
    }

    if (newUsername === profile.username) {
      Alert.alert("Username cannot be same");
      return;
    }

    const { data: existing } = await supabase
      .from("users")
      .select("username")
      .eq("username", newUsername)
      .single();

    if (existing) {
      Alert.alert("Username already taken");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase
      .from("users")
      .update({ username: newUsername })
      .eq("id", user.id);

    if (error) {
      Alert.alert("Update failed", error.message);
      return;
    }

    setProfile((prev: any) => ({
      ...prev,
      username: newUsername,
    }));

    setEditingUsername(false);
    setUsernameDraft("");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (!profile) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={pickImage}>
          <Image
            source={
              profile.photo_url ? { uri: profile.photo_url } : blankProfile
            }
            style={styles.avatar}
          />
        </TouchableOpacity>

        {uploading && (
          <ActivityIndicator
            style={{ position: "absolute", top: 45, left: 45 }}
            color="#fff"
          />
        )}

        <View style={styles.statsContainer}>
          <Stat label="Posts" value={0} />
          <Stat label="Followers" value={profile.followers_count ?? 0} />
          <Stat label="Following" value={profile.following_count ?? 0} />
        </View>
      </View>

      <View style={styles.usernameRow}>
        <Text style={styles.username}>@{profile.username}</Text>
        <TouchableOpacity
          style={styles.editIcon}
          onPress={() => setEditingUsername(true)}
        >
          <Ionicons name="pencil-outline" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <Text style={styles.bio}>{profile.bio || "No bio yet."}</Text>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setEditingBio(true)}
        >
          <Text style={styles.editText}>Edit Bio</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={editingBio} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Edit Bio</Text>

            <TextInput
              style={styles.input}
              multiline
              maxLength={90}
              value={bioDraft}
              onChangeText={setBioDraft}
            />

            <TouchableOpacity style={styles.saveButton} onPress={handleBioSave}>
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setEditingBio(false)}>
              <Text style={{ color: "#aaa", marginTop: 15 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={editingUsername} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Change Username</Text>

            <TextInput
              style={styles.input}
              autoCapitalize="none"
              value={usernameDraft}
              onChangeText={setUsernameDraft}
            />

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleUsernameSave}
            >
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setEditingUsername(false)}>
              <Text style={{ color: "#aaa", marginTop: 15 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const Stat = ({ label, value }: any) => (
  <View style={{ alignItems: "center" }}>
    <Text
      style={{
        color: "#fff",
        fontSize: 18,
        fontWeight: "600",
      }}
    >
      {value}
    </Text>
    <Text style={{ color: "#aaa", fontSize: 12 }}>{label}</Text>
  </View>
);

export default Header;
