import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { supabase } from "../../../lib/supabase";
import { DarkTheme } from "../../theme/DarkTheme";

const FollowersListItem = ({ user }: any) => {
  const navigation = useNavigation<any>();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      setCurrentUserId(data.user?.id ?? null);
    };

    loadUser();
  }, []);

  const openChat = async (targetUser: any) => {
    const { data } = await supabase.auth.getUser();
    const me = data.user;

    if (!me) return;

    // get my conversations
    const { data: myConvs } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", me.id);

    let conversationId: string | null = null;

    if (myConvs?.length) {
      const ids = myConvs.map((c) => c.conversation_id);

      const { data: shared } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", targetUser.id)
        .in("conversation_id", ids);

      conversationId = shared?.[0]?.conversation_id ?? null;
    }

    // create conversation if not exists
    if (!conversationId) {
      const { data: conv } = await supabase
        .from("conversations")
        .insert({})
        .select()
        .single();

      if (!conv) return;

      conversationId = conv.id;

      await supabase.from("conversation_participants").insert([
        { conversation_id: conv.id, user_id: me.id },
        { conversation_id: conv.id, user_id: targetUser.id },
      ]);
    }

    navigation.navigate("ChatRoom", {
      conversationId,
      otherUser: targetUser,
    });
  };

  const goToProfile = () => {
    if (currentUserId === user.id) return;
    navigation.push("OtherProfile", { userId: user.id });
  };

  const isSelf = currentUserId === user.id;

  return (
    <View style={{ flexDirection: "row", alignItems: "center", padding: 12 }}>
      <TouchableOpacity
        style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
        onPress={goToProfile}
        activeOpacity={isSelf ? 1 : 0.7}
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

      {!isSelf && (
        <TouchableOpacity
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: "rgba(198,255,0,0.1)",
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={() => openChat(user)}
        >
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={18}
            color={DarkTheme.PRIMARY_BUTTON}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default FollowersListItem;
