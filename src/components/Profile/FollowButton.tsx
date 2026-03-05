import React, { useEffect, useState } from "react";
import { DeviceEventEmitter, Text, TouchableOpacity } from "react-native";
import { supabase } from "../../../lib/supabase";
type Props = {
    targetUserId: string;
};
const FollowButton = ({ targetUserId }: Props) => {
    const [following, setFollowing] = useState(false);
    const [loading, setLoading] = useState(true);
    const checkFollowStatus = async () => {
        const { data: { user }, } = await supabase.auth.getUser();
        if (!user)
            return;
        const { data } = await supabase
            .from("followers")
            .select("id")
            .eq("follower_id", user.id)
            .eq("following_id", targetUserId)
            .maybeSingle();
        setFollowing(!!data);
        setLoading(false);
    };
    useEffect(() => {
        checkFollowStatus();
        const sub = DeviceEventEmitter.addListener("followChanged", () => {
            checkFollowStatus();
        });
        return () => sub.remove();
    }, [targetUserId]);
    const toggleFollow = async () => {
        const { data: { user }, } = await supabase.auth.getUser();
        if (!user)
            return;
        if (following) {
            await supabase
                .from("followers")
                .delete()
                .eq("follower_id", user.id)
                .eq("following_id", targetUserId);
            setFollowing(false);
        }
        else {
            await supabase.from("followers").insert({
                follower_id: user.id,
                following_id: targetUserId,
            });
            await supabase.from("notifications").insert({
                sender_id: user.id,
                receiver_id: targetUserId,
                type: "follow",
            });
            setFollowing(true);
        }
        DeviceEventEmitter.emit("followChanged");
    };
    if (loading)
        return null;
    return (<TouchableOpacity onPress={toggleFollow}>
      <Text style={{
            color: following ? "#aaa" : "#0095f6",
            fontWeight: "600",
        }}>
        {following ? "Following" : "Follow"}
      </Text>
    </TouchableOpacity>);
};
export default FollowButton;
