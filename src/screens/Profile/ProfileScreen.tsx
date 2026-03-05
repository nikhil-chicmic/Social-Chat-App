import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { supabase } from "../../../lib/supabase";
import Header from "./Header";
import PostsGrid from "./PostsGrid";
const ProfileScreen = () => {
    const [posts, setPosts] = useState<any[]>([]);
    const fetchPosts = async () => {
        const { data: { user }, } = await supabase.auth.getUser();
        if (!user)
            return;
        const { data, error } = await supabase
            .from("posts")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });
        if (!error && data) {
            setPosts(data);
        }
    };
    useFocusEffect(useCallback(() => {
        fetchPosts();
    }, []));
    return (<View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        <Header />
        <View style={{
            paddingBottom: 7,
        }}>
          <Text style={{
            color: "#fff",
            fontSize: 22,
            fontWeight: "600",
            textAlign: "center",
        }}>
            Posts
          </Text>
        </View>
        <PostsGrid posts={posts}/>
      </ScrollView>
    </View>);
};
export default ProfileScreen;
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
    },
});
