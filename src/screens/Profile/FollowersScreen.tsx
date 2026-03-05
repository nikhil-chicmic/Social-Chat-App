import React, { useEffect, useState } from "react";
import { FlatList, View } from "react-native";
import { supabase } from "../../../lib/supabase";
import FollowersListItem from "../../components/Profile/FollowersListItem";
const FollowersScreen = ({ route }: any) => {
    const { userId } = route.params;
    const [followers, setFollowers] = useState<any[]>([]);
    const loadFollowers = async () => {
        const { data } = await supabase
            .from("followers")
            .select("follower_id, users(*)")
            .eq("following_id", userId);
        if (data) {
            const users = data.map((item: any) => item.users);
            setFollowers(users);
        }
    };
    useEffect(() => {
        loadFollowers();
    }, []);
    return (<View style={{ flex: 1, backgroundColor: "#000" }}>
      <FlatList data={followers} keyExtractor={(item) => item.id} renderItem={({ item }) => <FollowersListItem user={item}/>}/>
    </View>);
};
export default FollowersScreen;
