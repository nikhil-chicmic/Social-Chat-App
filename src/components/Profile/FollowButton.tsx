import React, { useEffect, useState } from "react";
import {
  DeviceEventEmitter,
  Text,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
} from "react-native";
import { supabase } from "../../../lib/supabase";
import { DarkTheme } from "../../theme/DarkTheme";

type Props = {
  targetUserId: string;
  fullWidth?: boolean;
};

const FollowButton = ({ targetUserId, fullWidth }: Props) => {
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  const getCurrentUser = async () => {
    const { data } = await supabase.auth.getUser();
    return data.user;
  };

  const checkFollowStatus = async () => {
    const user = await getCurrentUser();
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

    const sub = DeviceEventEmitter.addListener(
      "followChanged",
      checkFollowStatus,
    );

    return () => sub.remove();
  }, [targetUserId]);

  const followUser = async (userId: string) => {
    await supabase.from("followers").insert({
      follower_id: userId,
      following_id: targetUserId,
    });

    await supabase.from("notifications").insert({
      sender_id: userId,
      receiver_id: targetUserId,
      type: "follow",
    });

    setFollowing(true);
  };

  const unfollowUser = async (userId: string) => {
    await supabase
      .from("followers")
      .delete()
      .eq("follower_id", userId)
      .eq("following_id", targetUserId);

    setFollowing(false);
  };

  const toggleFollow = async () => {
    const user = await getCurrentUser();
    if (!user) return;

    if (following) {
      await unfollowUser(user.id);
    } else {
      await followUser(user.id);
    }

    DeviceEventEmitter.emit("followChanged");
  };

  if (loading) return null;

  const containerStyle: ViewStyle = {
    backgroundColor: following ? "#2A2A2C" : DarkTheme.PRIMARY_BUTTON,
    alignItems: "center",
    justifyContent: "center",
    ...(fullWidth
      ? { width: "100%", paddingVertical: 10, borderRadius: 12 }
      : {
          paddingVertical: 8,
          paddingHorizontal: 16,
          borderRadius: 8,
          minWidth: 100,
          height: 36,
        }),
  };

  const textStyle: TextStyle = {
    color: following ? "#EBEBF5" : "#000",
    fontWeight: "700",
    fontSize: fullWidth ? 15 : 14,
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={toggleFollow}
      style={containerStyle}
    >
      <Text style={textStyle}>{following ? "Following" : "Follow"}</Text>
    </TouchableOpacity>
  );
};

export default FollowButton;
