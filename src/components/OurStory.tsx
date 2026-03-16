import { Ionicons } from "@expo/vector-icons";
import React, { useContext, useEffect, useState } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";
import { supabase } from "../../lib/supabase";
import AuthContext from "../navigation/AuthContext";

const blankProfile = require("../../assets/BlankProfile.png");

const YourStory = () => {
  const { user } = useContext(AuthContext);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("users")
      .select("photo_url")
      .eq("id", user.id)
      .single();

    setProfileImage(data?.photo_url ?? null);
    setLoading(false);
  };

  useEffect(() => {
    loadProfile();

    if (!user?.id) return;

    const channel = supabase
      .channel("profile-update")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "users",
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          setProfileImage(payload.new.photo_url ?? null);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return (
    <View style={styles.container}>
      <View style={styles.imageWrapper}>
        {loading ? (
          <ActivityIndicator size="small" color="#999" />
        ) : (
          <Image
            source={profileImage ? { uri: profileImage } : blankProfile}
            style={styles.profileImg}
          />
        )}

        <View style={styles.plusContainer}>
          <Ionicons name="add" size={14} color="#fff" />
        </View>
      </View>

      <Text style={styles.label}>Your Story</Text>
    </View>
  );
};

export default YourStory;

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginRight: 16,
  },

  imageWrapper: {
    position: "relative",
    padding: 4,
  },

  profileImg: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#2A2A2C",
  },

  plusContainer: {
    position: "absolute",
    bottom: 4,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#C6FF00",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#000",
  },

  label: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
  },
});
