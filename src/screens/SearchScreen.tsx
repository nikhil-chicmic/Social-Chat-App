import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, DeviceEventEmitter, FlatList, Image, StyleSheet, Text, TextInput, View, } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";
import FollowButton from "../components/Profile/FollowButton";
import { DarkTheme } from "../theme/DarkTheme";
const blankProfile = require("../../assets/BlankProfile.png");
const SearchScreen = () => {
    const [query, setQuery] = useState("");
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const loadRecommendedUsers = async () => {
        setLoading(true);
        const { data: { user }, } = await supabase.auth.getUser();
        const { data } = await supabase
            .from("users")
            .select("*")
            .neq("id", user?.id)
            .limit(20);
        if (data)
            setUsers(data);
        setLoading(false);
    };
    const searchUsers = async (text: string) => {
        if (text.trim() === "") {
            loadRecommendedUsers();
            return;
        }
        setLoading(true);
        const { data: { user }, } = await supabase.auth.getUser();
        const { data } = await supabase
            .from("users")
            .select("*")
            .ilike("username", `%${text}%`)
            .neq("id", user?.id)
            .limit(20);
        if (data)
            setUsers(data);
        setLoading(false);
    };
    useEffect(() => {
        loadRecommendedUsers();
        const sub = DeviceEventEmitter.addListener("followChanged", () => {
            if (query.trim() === "")
                loadRecommendedUsers();
            else
                searchUsers(query);
        });
        return () => sub.remove();
    }, [query]);
    const handleSearch = (text: string) => {
        setQuery(text);
        clearTimeout((global as any).searchTimeout);
        (global as any).searchTimeout = setTimeout(() => {
            searchUsers(text);
        }, 300);
    };
    const renderUser = useCallback(({ item }: any) => {
        return (<View style={styles.userRow}>
        <View style={styles.userInfo}>
          <Image source={item.photo_url ? { uri: item.photo_url } : blankProfile} style={styles.avatar}/>
          <Text style={styles.username}>{item.username}</Text>
        </View>

        <FollowButton targetUserId={item.id}/>
      </View>);
    }, []);
    return (<SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: DarkTheme.PRIMARY_BACKGROUND }}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TextInput placeholder="Search for users" placeholderTextColor="#aaa" style={styles.input} value={query} autoCapitalize="none" autoCorrect={false} clearButtonMode="while-editing" returnKeyType="search" onChangeText={handleSearch}/>
        </View>

        {loading ? (<ActivityIndicator size="large" color="#fff" style={{ marginTop: 30 }}/>) : (<>
            <Text style={styles.title}>RECOMMENDED</Text>

            <FlatList data={users} keyExtractor={(item) => item.id} renderItem={renderUser} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}/>
          </>)}
      </View>
    </SafeAreaView>);
};
export default SearchScreen;
const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 16,
    },
    header: {
        marginTop: 16,
        marginBottom: 20,
    },
    input: {
        height: 42,
        backgroundColor: "#1c1c1c",
        borderRadius: 10,
        paddingHorizontal: 14,
        color: "#fff",
        borderColor: "#777",
        borderWidth: 1,
    },
    title: {
        color: "#fff",
        fontSize: 18,
        textAlign: "center",
        marginBottom: 10,
    },
    userRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 12,
    },
    userInfo: {
        flexDirection: "row",
        alignItems: "center",
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    username: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "500",
    },
});
