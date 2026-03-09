import React from "react";
import { Image, Text, View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import FollowButton from "./FollowButton";
import { useChatNavigation } from "../../hooks/useChatNavigation";
import { useNavigation } from "@react-navigation/native";
import { DarkTheme } from "../../theme/DarkTheme";
import { supabase } from "../../../lib/supabase";

const FollowingListItem = ({ user }: any) => {
  const { handleMessageUser } = useChatNavigation();
  const navigation = useNavigation<any>();
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setCurrentUserId(data.user.id);
    });
  }, []);

  return (
    <View style={{
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 12,
    }}>
      <TouchableOpacity 
        style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
        onPress={() => {
          if (currentUserId !== user.id) {
            navigation.push("OtherProfile", { userId: user.id });
          }
        }}
        activeOpacity={currentUserId === user.id ? 1 : 0.2}
      >
        <Image source={{ uri: user.photo_url }} style={{ width: 44, height: 44, borderRadius: 22, marginRight: 12, backgroundColor: "#2A2A2C" }}/>
        <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>{user.username}</Text>
      </TouchableOpacity>

      {currentUserId !== user.id && (
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity 
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "rgba(198, 255, 0, 0.1)",
              justifyContent: "center",
              alignItems: "center",
              marginRight: 10,
            }}
            onPress={() => handleMessageUser(user)}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={18} color={DarkTheme.PRIMARY_BUTTON} />
          </TouchableOpacity>
          <FollowButton targetUserId={user.id}/>
        </View>
      )}
    </View>
  );
};
export default FollowingListItem;
