import React, { useEffect, useState } from "react";
import { FlatList, View } from "react-native";
import { supabase } from "../../../lib/supabase";
import FollowingListItem from "../../components/Profile/FollowingListItem";
const FollowingScreen = ({ route }: any) => {
    const { userId } = route.params;
    const [following, setFollowing] = useState<any[]>([]);
    const loadFollowing = async () => {
        const { data } = await supabase
            .from("followers")
            .select("following_id, users(*)")
            .eq("follower_id", userId);
        if (data) {
            const users = data.map((item: any) => item.users);
            setFollowing(users);
        }
    };
    useEffect(() => {
        loadFollowing();
    }, []);
    return (<View style={{ flex: 1, backgroundColor: "#000" }}>
      <FlatList data={following} keyExtractor={(item) => item.id} renderItem={({ item }) => <FollowingListItem user={item}/>}/>
    </View>);
};
export default FollowingScreen;
