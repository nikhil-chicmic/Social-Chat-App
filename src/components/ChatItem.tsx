import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Props } from "../types";

export default function ChatItem({
  username,
  avatar,
  message,
  time,
  onPress,
}: Props) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Image source={{ uri: avatar }} style={styles.avatar} />

      <View style={styles.textContainer}>
        <Text style={styles.username}>{username}</Text>

        <View style={styles.messageRow}>
          <Text numberOfLines={1} style={styles.message}>
            {message}
          </Text>
          <Text style={styles.time}> • {time}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  avatar: {
    width: 55,
    height: 55,
    borderRadius: 30,
    marginRight: 12,
  },

  textContainer: {
    flex: 1,
  },

  username: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },

  messageRow: {
    flexDirection: "row",
    marginTop: 3,
  },

  message: {
    fontSize: 14,
    color: "#aaa",
    flexShrink: 1,
  },

  time: {
    fontSize: 14,
    color: "#aaa",
  },
});
