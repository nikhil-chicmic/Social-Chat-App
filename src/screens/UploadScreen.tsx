import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  DeviceEventEmitter,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { supabase } from "../../lib/supabase";
import { DarkTheme } from "../theme/DarkTheme";

const UploadScreen = () => {
  const [image, setImage] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);

  const requestPermission = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission required",
        "We need access to your gallery to upload photos.",
      );
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const allowed = await requestPermission();
    if (!allowed) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string, userId: string) => {
    const ext = uri.split(".").pop();
    const fileName = `${userId}/${Date.now()}.${ext}`;

    const response = await fetch(uri);
    const buffer = await response.arrayBuffer();

    const { error } = await supabase.storage
      .from("Posts")
      .upload(fileName, buffer, { contentType: "image/jpeg" });

    if (error) throw error;

    const { data } = supabase.storage.from("Posts").getPublicUrl(fileName);
    return data.publicUrl;
  };

  const createPost = async (userId: string, imageUrl: string) => {
    const { error } = await supabase.from("posts").insert([
      {
        user_id: userId,
        image_url: imageUrl,
        caption: caption.trim(),
      },
    ]);

    if (error) throw error;
  };

  const handleUpload = async () => {
    if (!image) {
      Alert.alert("Image missing", "Please select an image to share.");
      return;
    }

    try {
      setUploading(true);

      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (!user) throw new Error("User not authenticated");

      const imageUrl = await uploadImage(image, user.id);
      await createPost(user.id, imageUrl);

      setImage(null);
      setCaption("");

      DeviceEventEmitter.emit("post_uploaded");

      Alert.alert("Success", "Post uploaded successfully");
    } catch (err: any) {
      Alert.alert("Upload failed", err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: DarkTheme.PRIMARY_BACKGROUND }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.title}>New Post</Text>
        </View>

        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={[styles.imageBox, image && styles.imageBoxSelected]}
            onPress={pickImage}
            activeOpacity={0.8}
          >
            {image ? (
              <Image source={{ uri: image }} style={styles.preview} />
            ) : (
              <View style={styles.placeholder}>
                <View style={styles.iconCircle}>
                  <Ionicons
                    name="camera-outline"
                    size={36}
                    color={DarkTheme.PRIMARY_BUTTON}
                  />
                </View>

                <Text style={styles.placeholderTitle}>Add Photo</Text>

                <Text style={styles.placeholderText}>
                  Choose an image from your gallery
                </Text>
              </View>
            )}

            {image && (
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setImage(null)}
              >
                <Ionicons
                  name="close-circle"
                  size={28}
                  color="rgba(255,255,255,0.8)"
                />
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          <Text style={styles.label}>Caption</Text>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ flex: 1 }}
          >
            <TextInput
              style={styles.input}
              placeholder="Write something beautiful..."
              placeholderTextColor="#666"
              multiline
              numberOfLines={4}
              maxLength={800}
              value={caption}
              onChangeText={setCaption}
            />
          </KeyboardAvoidingView>

          <TouchableOpacity
            style={[
              styles.uploadButton,
              (!image || uploading) && { opacity: 0.5 },
            ]}
            disabled={!image || uploading}
            onPress={handleUpload}
          >
            {uploading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.uploadText}>Share Post</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default UploadScreen;

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingBottom: 100 },

  header: { marginTop: 10, marginBottom: 24 },

  title: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.5,
    paddingHorizontal: 20,
  },

  imageBox: {
    width: "100%",
    height: 380,
    backgroundColor: "#161618",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#ddd",
    borderStyle: "dashed",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },

  imageBoxSelected: {
    borderStyle: "solid",
    borderColor: "#000",
  },

  preview: {
    width: "100%",
    height: "100%",
  },

  placeholder: {
    alignItems: "center",
    justifyContent: "center",
  },

  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(198,255,0,0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },

  placeholderTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },

  placeholderText: {
    color: "#8E8E93",
    fontSize: 14,
  },

  closeButton: {
    position: "absolute",
    top: 14,
    right: 14,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 15,
  },

  label: {
    color: "#EBEBF5",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 10,
    marginLeft: 4,
  },

  input: {
    backgroundColor: "#1A1A1C",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 16,
    padding: 16,
    color: "#fff",
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
  },

  uploadButton: {
    marginTop: 32,
    backgroundColor: DarkTheme.PRIMARY_BUTTON,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },

  uploadText: {
    fontWeight: "700",
    fontSize: 17,
    color: "#000",
    letterSpacing: 0.3,
  },
});
