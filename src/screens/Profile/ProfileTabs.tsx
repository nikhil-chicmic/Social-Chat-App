import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

type Tab = "posts" | "likes" | "save";

type Props = {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
};

const tabs: { key: Tab; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "posts", icon: "grid-outline" },
  { key: "likes", icon: "heart-outline" },
  { key: "save", icon: "bookmark-outline" },
];

const ProfileTabs = ({ activeTab, setActiveTab }: Props) => {
  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;

        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            activeOpacity={0.7}
            onPress={() => setActiveTab(tab.key)}
          >
            <Ionicons
              name={tab.icon}
              size={24}
              color={isActive ? "#fff" : "#777"}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default React.memo(ProfileTabs);

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: "#222",
  },

  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
  },
});
