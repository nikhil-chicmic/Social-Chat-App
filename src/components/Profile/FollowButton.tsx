import React, { useEffect, useState } from "react";
import { DeviceEventEmitter, Text, TouchableOpacity } from "react-native";
import { supabase } from "../../../lib/supabase";
import { DarkTheme } from "../../theme/DarkTheme";
type Props = {
  targetUserId: string;
  fullWidth?: boolean;
};
const FollowButton = ({ targetUserId, fullWidth }: Props) => {
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkFollowStatus = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
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
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;
    if (following) {
      await supabase
        .from("followers")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", targetUserId);
      setFollowing(false);
    } else {
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

  if (loading) return null;
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={toggleFollow}
      style={[{
        backgroundColor: following ? "#2A2A2C" : DarkTheme.PRIMARY_BUTTON,
        alignItems: "center",
        justifyContent: "center",
      }, fullWidth ? {
        width: "100%",
        paddingVertical: 10,
        borderRadius: 12,
      } : {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        minWidth: 100,
        height: 36,
      }]}
    >
      <Text
        style={{
          color: following ? "#EBEBF5" : "#000",
          fontWeight: "700",
          fontSize: fullWidth ? 15 : 14,
        }}
      >
        {following ? "Following" : "Follow"}
      </Text>
    </TouchableOpacity>
  );
};
export default FollowButton;
