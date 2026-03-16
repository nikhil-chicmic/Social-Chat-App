import React, { useEffect, useRef } from "react";
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { DarkTheme } from "../theme/DarkTheme";
import { Props } from "../types";

type ChatItemProps = Props & {
  isUnread?: boolean;
  onDelete?: () => void;
};

export default function ChatItem({
  username,
  avatar,
  message,
  time,
  onPress,
  isUnread = false,
}: ChatItemProps) {
  const dotAnim = useRef(new Animated.Value(isUnread ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(dotAnim, {
      toValue: isUnread ? 1 : 0,
      tension: 180,
      friction: 9,
      useNativeDriver: true,
    }).start();
  }, [isUnread]);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Image source={{ uri: avatar }} style={styles.avatar} />

      <View style={styles.textContainer}>
        <View style={styles.headerRow}>
          <Text style={[styles.username, isUnread && styles.unreadText]}>
            {username}
          </Text>

          <View style={styles.rightActions}>
            <Animated.View
              style={[
                styles.unreadDot,
                { opacity: dotAnim, transform: [{ scale: dotAnim }] },
              ]}
            />

            {time && (
              <Text style={[styles.time, isUnread && styles.unreadTime]}>
                {time}
              </Text>
            )}
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

  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2a2a2a",
    marginRight: 14,
  },

  textContainer: {
    flex: 1,
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
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#EAEAEA",
  },

  message: {
    fontSize: 15,
    color: "#8E8E93",
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
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: DarkTheme.PRIMARY_BUTTON,
  },
});
