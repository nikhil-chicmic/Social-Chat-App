import React from "react";
import { Image, Text, View } from "react-native";
import FollowButton from "./FollowButton";
const FollowersListItem = ({ user }: any) => {
    return (<View style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            padding: 12,
        }}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Image source={{ uri: user.photo_url }} style={{ width: 40, height: 40, borderRadius: 20, marginRight: 10 }}/>
        <Text style={{ color: "#fff" }}>{user.username}</Text>
      </View>

      <FollowButton targetUserId={user.id}/>
    </View>);
};
export default FollowersListItem;
