import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const Post = () => {
  return (
    <View style={styles.postContainer}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Image
            source={require("../../assets/BlankProfile.png")}
            style={styles.profileImg}
          />
          <Text style={styles.username}>nikhil_saini</Text>
        </View>

        <Ionicons name="ellipsis-horizontal" size={20} color="#fff" />
      </View>

      <Image
        source={require("../../assets/logo.png")}
        style={styles.postImage}
      />

      <View style={styles.actionsRow}>
        <View style={styles.leftActions}>
          <TouchableOpacity>
            <Ionicons name="heart-outline" size={26} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity>
            <Ionicons name="chatbubble-outline" size={24} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity>
            <Ionicons name="paper-plane-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity>
          <Ionicons name="bookmark-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <Text style={styles.likesText}>1,245 likes</Text>

      <Text style={styles.caption}>
        <Text style={styles.username}>nikhil_saini </Text>
        Building something powerful.
      </Text>

      <Text style={styles.timeText}>2 hours ago</Text>
    </View>
  );
};

export default Post;

const styles = StyleSheet.create({
  postContainer: {},

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
  },

  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },

  profileImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },

  username: {
    color: "#fff",
    fontWeight: "600",
  },

  postImage: {
    width: "100%",
    height: 400,
  },

  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  leftActions: {
    flexDirection: "row",
    gap: 16,
  },

  likesText: {
    color: "#fff",
    fontWeight: "600",
    paddingHorizontal: 12,
  },

  caption: {
    color: "#fff",
    paddingHorizontal: 12,
    marginTop: 4,
  },

  timeText: {
    color: "gray",
    fontSize: 12,
    paddingHorizontal: 12,
    marginTop: 4,
    marginBottom: 10,
  },
});
