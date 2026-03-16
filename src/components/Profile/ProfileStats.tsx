import React, { useEffect, useState } from "react";
import { DeviceEventEmitter, Text, TouchableOpacity, View } from "react-native";
import { supabase } from "../../../lib/supabase";

type Props = {
  userId: string;
  navigation: any;
};

const ProfileStats = ({ userId, navigation }: Props) => {
  const [stats, setStats] = useState({ followers: 0, following: 0 });

  const loadStats = async () => {
    const { count: followers } = await supabase
      .from("followers")
      .select("*", { count: "exact", head: true })
      .eq("following_id", userId);

    const { count: following } = await supabase
      .from("followers")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", userId);

    setStats({
      followers: followers ?? 0,
      following: following ?? 0,
    });
  };

  useEffect(() => {
    loadStats();

    const sub = DeviceEventEmitter.addListener("followChanged", loadStats);

    return () => sub.remove();
  }, [userId]);

  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-around",
        marginTop: 10,
      }}
    >
      <Stat
        label="Followers"
        value={stats.followers}
        onPress={() => navigation.navigate("FollowersScreen", { userId })}
      />

      <Stat
        label="Following"
        value={stats.following}
        onPress={() => navigation.navigate("FollowingScreen", { userId })}
      />
    </View>
  );
};

const Stat = ({
  label,
  value,
  onPress,
}: {
  label: string;
  value: number;
  onPress: () => void;
}) => (
  <TouchableOpacity onPress={onPress} style={{ alignItems: "center" }}>
    <Text style={{ color: "#fff", fontSize: 18, fontWeight: "600" }}>
      {value}
    </Text>
    <Text style={{ color: "#aaa", fontSize: 12 }}>{label}</Text>
  </TouchableOpacity>
);

export default ProfileStats;
