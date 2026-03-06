import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

type Props = {
  activeTab: "posts" | "likes" | "save";
  setActiveTab: (tab: "posts" | "likes" | "save") => void;
};

const ProfileTabs = ({ activeTab, setActiveTab }: Props) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => setActiveTab("posts")}
        style={styles.tab}
      >
        <Ionicons
          name="grid-outline"
          size={24}
          color={activeTab === "posts" ? "#fff" : "#777"}
        />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setActiveTab("likes")}
        style={styles.tab}
      >
        <Ionicons
          name="heart-outline"
          size={24}
          color={activeTab === "likes" ? "#fff" : "#777"}
        />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setActiveTab("save")} style={styles.tab}>
        <Ionicons
          name="bookmark-outline"
          size={24}
          color={activeTab === "save" ? "#fff" : "#777"}
        />
      </TouchableOpacity>
    </View>
  );
};

export default ProfileTabs;
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
