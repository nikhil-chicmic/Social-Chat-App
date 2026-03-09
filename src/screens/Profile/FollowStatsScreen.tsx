import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../../lib/supabase";
import { DarkTheme } from "../../theme/DarkTheme";
import FollowersListItem from "../../components/Profile/FollowersListItem";
import FollowingListItem from "../../components/Profile/FollowingListItem";

export default function FollowStatsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { userId, initialTab = "followers" } = route.params as {
    userId: string;
    initialTab?: "followers" | "following";
  };

  const [activeTab, setActiveTab] = useState<"followers" | "following">(initialTab);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);

    try {
      if (activeTab === "followers") {
        const { data, error } = await supabase
          .from("followers")
          .select("follower_id")
          .eq("following_id", userId);

        if (!error && data && data.length > 0) {
          const ids = data.map((item: any) => item.follower_id);
          const { data: userData } = await supabase
            .from("users")
            .select("id, username, photo_url")
            .in("id", ids);
          
          setUsers(userData || []);
        } else {
          setUsers([]);
        }
      } else {
        const { data, error } = await supabase
          .from("followers")
          .select("following_id")
          .eq("follower_id", userId);

        if (!error && data && data.length > 0) {
          const ids = data.map((item: any) => item.following_id);
          const { data: userData } = await supabase
            .from("users")
            .select("id, username, photo_url")
            .in("id", ids);
          
          setUsers(userData || []);
        } else {
          setUsers([]);
        }
      }
    } catch (err) {
      console.error("Error fetching follow stats", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [activeTab, userId]);


  const renderItem = ({ item }: { item: any }) => {
    if (!item) return null;
    return activeTab === "followers" ? (
      <FollowersListItem user={item} />
    ) : (
      <FollowingListItem user={item} />
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: DarkTheme.PRIMARY_BACKGROUND }} edges={["top"]}>
      <View style={{ flexDirection: "row", alignItems: "center", padding: 16 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4, marginRight: 16 }}>
          <Ionicons name="arrow-back" size={26} color="#EBEBF5" />
        </TouchableOpacity>
        <Text style={{ color: "#fff", fontSize: 20, fontWeight: "700" }}>
          {activeTab === "followers" ? "Followers" : "Following"}
        </Text>
      </View>

      <View style={{ flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#2A2A2C" }}>
        <TouchableOpacity
          style={{ flex: 1, paddingVertical: 14, alignItems: "center", borderBottomWidth: activeTab === "followers" ? 2 : 0, borderBottomColor: "#EBEBF5" }}
          onPress={() => setActiveTab("followers")}
        >
          <Text style={{ color: activeTab === "followers" ? "#fff" : "#8E8E93", fontWeight: "600", fontSize: 15 }}>
            Followers
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={{ flex: 1, paddingVertical: 14, alignItems: "center", borderBottomWidth: activeTab === "following" ? 2 : 0, borderBottomColor: "#EBEBF5" }}
          onPress={() => setActiveTab("following")}
        >
          <Text style={{ color: activeTab === "following" ? "#fff" : "#8E8E93", fontWeight: "600", fontSize: 15 }}>
            Following
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={DarkTheme.PRIMARY_BUTTON} />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item, index) => item?.id || index.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingVertical: 8 }}
          ListEmptyComponent={
            <View style={{ alignItems: "center", marginTop: 40 }}>
              <Text style={{ color: "#8E8E93", fontSize: 16 }}>
                No {activeTab} yet.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
