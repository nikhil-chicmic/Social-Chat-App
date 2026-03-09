import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { supabase } from "../../../lib/supabase";
import { DarkTheme } from "../../theme/DarkTheme";
import FollowButton from "./FollowButton";

const FollowingListItem = ({ user }: any) => {
  const navigation = useNavigation<any>();
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setCurrentUserId(data.user.id);
    });
  }, []);

  const handleMessageUser = async (targetUser: any) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) return;

    const { data: myConvs } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", user.id);

    let existingConvId: string | null = null;

    if (myConvs && myConvs.length > 0) {
      const convIds = myConvs.map((c) => c.conversation_id);

      const { data: theirConvs } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", targetUser.id)
        .in("conversation_id", convIds);

      if (theirConvs && theirConvs.length > 0) {
        existingConvId = theirConvs[0].conversation_id;
      }
    }

    if (existingConvId) {
      navigation.navigate("ChatRoom", {
        conversationId: existingConvId,
        otherUser: targetUser,
      });
      return;
    }

    const { data: newConv, error } = await supabase
      .from("conversations")
      .insert({})
      .select()
      .single();

    if (error || !newConv) {
      console.error(error);
      return;
    }

    await supabase.from("conversation_participants").insert([
      { conversation_id: newConv.id, user_id: user.id },
      { conversation_id: newConv.id, user_id: targetUser.id },
    ]);

    navigation.navigate("ChatRoom", {
      conversationId: newConv.id,
      otherUser: targetUser,
    });
  };

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 12,
      }}
    >
      <TouchableOpacity
        style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
        onPress={() => {
          if (currentUserId !== user.id) {
            navigation.push("OtherProfile", { userId: user.id });
          }
        }}
        activeOpacity={currentUserId === user.id ? 1 : 0.2}
      >
        <Image
          source={{ uri: user.photo_url }}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            marginRight: 12,
            backgroundColor: "#2A2A2C",
          }}
        />
        <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
          {user.username}
        </Text>
      </TouchableOpacity>

      {currentUserId !== user.id && (
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "rgba(198,255,0,0.1)",
              justifyContent: "center",
              alignItems: "center",
              marginRight: 10,
            }}
            onPress={() => handleMessageUser(user)}
          >
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={18}
              color={DarkTheme.PRIMARY_BUTTON}
            />
          </TouchableOpacity>

          <FollowButton targetUserId={user.id} />
        </View>
      )}
    </View>
  );
};

export default FollowingListItem;
