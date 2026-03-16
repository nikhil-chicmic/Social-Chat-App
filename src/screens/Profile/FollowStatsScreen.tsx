import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { supabase } from "../../../lib/supabase";
import FollowersListItem from "../../components/Profile/FollowersListItem";
import FollowingListItem from "../../components/Profile/FollowingListItem";
import { DarkTheme } from "../../theme/DarkTheme";

export default function FollowStatsScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  const { userId, initialTab = "followers" } = route.params as {
    userId: string;
    initialTab?: "followers" | "following";
  };

  const [activeTab, setActiveTab] = useState<"followers" | "following">(
    initialTab,
  );
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);

    try {
      const column = activeTab === "followers" ? "follower_id" : "following_id";
      const filterColumn =
        activeTab === "followers" ? "following_id" : "follower_id";

      const { data } = await supabase
        .from("followers")
        .select(column)
        .eq(filterColumn, userId);

      if (!data?.length) {
        setUsers([]);
        setLoading(false);
        return;
      }

      const ids = data.map((item: any) => item[column]);

      const { data: userData } = await supabase
        .from("users")
        .select("id, username, photo_url")
        .in("id", ids);

      setUsers(userData || []);
    } catch (err) {
      console.error("Follow stats fetch error:", err);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, [activeTab, userId]);

  const renderItem = ({ item }: any) =>
    activeTab === "followers" ? (
      <FollowersListItem user={item} />
    ) : (
      <FollowingListItem user={item} />
    );

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: DarkTheme.PRIMARY_BACKGROUND }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", padding: 16 }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ padding: 4, marginRight: 16 }}
        >
          <Ionicons name="arrow-back" size={26} color="#EBEBF5" />
        </TouchableOpacity>

        <Text style={{ color: "#fff", fontSize: 20, fontWeight: "700" }}>
          {activeTab === "followers" ? "Followers" : "Following"}
        </Text>
      </View>

      <View
        style={{
          flexDirection: "row",
          borderBottomWidth: 1,
          borderBottomColor: "#2A2A2C",
        }}
      >
        {["followers", "following"].map((tab) => {
          const active = activeTab === tab;

          return (
            <TouchableOpacity
              key={tab}
              style={{
                flex: 1,
                paddingVertical: 14,
                alignItems: "center",
                borderBottomWidth: active ? 2 : 0,
                borderBottomColor: "#EBEBF5",
              }}
              onPress={() => setActiveTab(tab as any)}
            >
              <Text
                style={{
                  color: active ? "#fff" : "#8E8E93",
                  fontWeight: "600",
                  fontSize: 15,
                }}
              >
                {tab === "followers" ? "Followers" : "Following"}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color={DarkTheme.PRIMARY_BUTTON} />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
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
