import { Ionicons } from "@expo/vector-icons";
import React, { useContext, useEffect, useState } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";
import { supabase } from "../../lib/supabase";
import AuthContext from "../navigation/AuthContext";
const YourStory = () => {
    const { user } = useContext(AuthContext);
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }
        const fetchProfile = async () => {
            const { data, error } = await supabase
                .from("users")
                .select("photo_url")
                .eq("id", user.id)
                .single();
            if (!error && data) {
                setProfileImage(data.photo_url || null);
            }
            setLoading(false);
        };
        fetchProfile();
        const channel = supabase
            .channel("our-story-profile")
            .on("postgres_changes", {
            event: "UPDATE",
            schema: "public",
            table: "users",
            filter: `id=eq.${user.id}`,
        }, (payload) => {
            setProfileImage(payload.new.photo_url || null);
        })
            .subscribe();
        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);
    return (<View style={styles.container}>
      <View style={styles.imageWrapper}>
        {loading ? (<ActivityIndicator size="small" color="#999"/>) : (<Image source={profileImage
                ? { uri: profileImage }
                : require("../../assets/BlankProfile.png")} style={styles.profileImg}/>)}

        <View style={styles.plusContainer}>
          <Ionicons name="add" size={14} color="#fff"/>
        </View>
      </View>

      <Text style={styles.label}>Your Story</Text>
    </View>);
};
export default YourStory;
const styles = StyleSheet.create({
    container: {
        alignItems: "center",
        marginRight: 15,
    },
    imageWrapper: {
        position: "relative",
    },
    profileImg: {
        width: 70,
        height: 70,
        borderRadius: 50,
    },
    plusContainer: {
        position: "absolute",
        bottom: 0,
        right: 0,
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: "#0095F6",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#000",
    },
    label: {
        marginTop: 6,
        fontSize: 12,
        color: "#fff",
    },
});
