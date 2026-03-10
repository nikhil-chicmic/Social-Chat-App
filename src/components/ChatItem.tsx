import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { DarkTheme } from "../theme/DarkTheme";
import { Props } from "../types";

export default function ChatItem({
  username,
  avatar,
  message,
  time,
  onPress,
  isUnread,
  onDelete,
}: Props & { isUnread?: boolean; onDelete?: () => void }) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={styles.container}
      onPress={onPress}
    >
      <View style={styles.avatarContainer}>
        <Image source={{ uri: avatar }} style={styles.avatar} />
      </View>

      <View style={styles.textContainer}>
        <View style={styles.headerRow}>
          <Text style={[styles.username, isUnread && styles.unreadText]}>
            {username}
          </Text>
          <View style={styles.rightActions}>
            {isUnread && <View style={styles.unreadDot} />}
            {time ? (
              <Text style={[styles.time, isUnread && styles.unreadTime]}>
                {time}
              </Text>
            ) : null}
          </View>
        </View>

        <Text
          numberOfLines={1}
          style={[styles.message, isUnread && styles.unreadText]}
        >
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
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  username: {
    fontSize: 16,
    fontWeight: "600",
    color: "#EAEAEA",
    letterSpacing: 0.2,
    flex: 1,
  },
  message: {
    fontSize: 15,
    color: "#8E8E93",
    flexShrink: 1,
  },
  time: {
    fontSize: 13,
    color: "#6B6B70",
    fontWeight: "500",
  },
  unreadText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  unreadTime: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: DarkTheme.PRIMARY_BUTTON, // Use primary theme color
  },
  deleteBtn: {
    marginLeft: 12,
    justifyContent: "center",
  },
});
