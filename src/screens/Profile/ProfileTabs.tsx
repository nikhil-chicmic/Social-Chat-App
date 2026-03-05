import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
const ProfileTabs = () => {
    const [activeTab, setActiveTab] = useState("posts");
    return (<View style={styles.container}>
      <TouchableOpacity onPress={() => setActiveTab("posts")} style={styles.tab}>
        <Ionicons name="grid-outline" size={24} color={activeTab === "posts" ? "#fff" : "#777"}/>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setActiveTab("reels")} style={styles.tab}>
        <Ionicons name="film-outline" size={24} color={activeTab === "reels" ? "#fff" : "#777"}/>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setActiveTab("tagged")} style={styles.tab}>
        <Ionicons name="person-outline" size={24} color={activeTab === "tagged" ? "#fff" : "#777"}/>
      </TouchableOpacity>
    </View>);
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
