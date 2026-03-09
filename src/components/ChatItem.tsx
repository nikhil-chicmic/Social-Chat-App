// Simple replacement to improve premium feeling
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
    <TouchableOpacity activeOpacity={0.7} style={styles.container} onPress={onPress}>
      <View style={styles.avatarContainer}>
        <Image source={{ uri: avatar }} style={styles.avatar} />
        {/* Optional: Add an online indicator dot here if needed in future */}
      </View>

      <View style={styles.textContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.username}>{username}</Text>
          {time ? <Text style={styles.time}>{time}</Text> : null}
        </View>

        <Text numberOfLines={1} style={styles.message}>
          {message}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2a2a2a", // Fallback background
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    fontWeight: "700",
    color: "#EAEAEA",
    letterSpacing: 0.2,
  },
  message: {
    fontSize: 15,
    color: "#8E8E93", // Premium iOS dark mode secondary color
    flexShrink: 1,
  },
  time: {
    fontSize: 13,
    color: "#6B6B70",
    fontWeight: "500",
  },
});
