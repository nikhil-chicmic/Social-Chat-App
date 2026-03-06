import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ChatItem from "../../components/ChatItem";
import { DarkTheme } from "../../theme/DarkTheme";

const chats = [
  {
    id: "1",
    username: "rahul_.rk123",
    avatar: "https://i.pravatar.cc/150?img=1",
    message: "Reacted 😂 to your message",
    time: "2d",
  },
  {
    id: "2",
    username: "its_lakshya",
    avatar: "https://i.pravatar.cc/150?img=2",
    message: "Mentioned you in their story",
    time: "2d",
  },
  {
    id: "3",
    username: "Instagram user",
    avatar: "https://i.pravatar.cc/150?img=3",
    message: "Sent a reel",
    time: "2d",
  },
];

const MessageScreen = () => {
  const navigation = useNavigation<any>();
  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      style={{ flex: 1, backgroundColor: DarkTheme.PRIMARY_BACKGROUND }}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backIcon}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Messages</Text>
      </View>

      <View style={styles.chatContainer}>
        <FlatList
          bounces={false}
          data={chats}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChatItem
              username={item.username}
              avatar={item.avatar}
              message={item.message}
              time={item.time}
              onPress={() => console.log("Open chat")}
            />
          )}
        />
      </View>
    </SafeAreaView>
  );
};

export default MessageScreen;

const styles = StyleSheet.create({
  header: {
    position: "relative",
    marginTop: 5,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  headerText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "900",
  },

  backIcon: {
    position: "absolute",
    left: "5%",
  },

  chatContainer: {
    top: "1%",
    marginBottom: 50,
  },
});
