import React, { useEffect, useState } from "react";
import { DeviceEventEmitter, Text, TouchableOpacity, View } from "react-native";
import { supabase } from "../../../lib/supabase";
type Props = {
    userId: string;
    navigation: any;
};
const ProfileStats = ({ userId, navigation }: Props) => {
    const [followers, setFollowers] = useState(0);
    const [following, setFollowing] = useState(0);
    const loadStats = async () => {
        const { count: followersCount } = await supabase
            .from("followers")
            .select("*", { count: "exact", head: true })
            .eq("following_id", userId);
        const { count: followingCount } = await supabase
            .from("followers")
            .select("*", { count: "exact", head: true })
            .eq("follower_id", userId);
        setFollowers(followersCount ?? 0);
        setFollowing(followingCount ?? 0);
    };
    useEffect(() => {
        loadStats();
        const sub = DeviceEventEmitter.addListener("followChanged", () => {
            loadStats();
        });
        return () => sub.remove();
    }, [userId]);
    return (<View style={{
            flexDirection: "row",
            justifyContent: "space-around",
            marginTop: 10,
        }}>
      <Stat label="Followers" value={followers} onPress={() => navigation.navigate("FollowersScreen", { userId })}/>

      <Stat label="Following" value={following} onPress={() => navigation.navigate("FollowingScreen", { userId })}/>
    </View>);
};
const Stat = ({ label, value, onPress }: any) => (<TouchableOpacity onPress={onPress} style={{ alignItems: "center" }}>
    <Text style={{ color: "#fff", fontSize: 18, fontWeight: "600" }}>
      {value}
    </Text>
    <Text style={{ color: "#aaa", fontSize: 12 }}>{label}</Text>
  </TouchableOpacity>);
export default ProfileStats;
