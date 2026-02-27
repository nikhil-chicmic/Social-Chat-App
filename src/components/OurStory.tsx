import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

const YourStory = () => {
  return (
    <View style={styles.container}>
      <View style={styles.imageWrapper}>
        <Image
          source={require("../../assets/BlankProfile.png")}
          style={styles.profileImg}
        />

        <View style={styles.plusContainer}>
          <Ionicons name="add" size={14} color="#fff" />
        </View>
      </View>

      <Text style={styles.label}>Your Story</Text>
    </View>
  );
};

export default YourStory;

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginRight: 15,
  },

  imageWrapper: {
    position: "relative",
  },

  profileImg: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
  },

  plusContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#0095F6",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#000",
  },

  label: {
    marginTop: 6,
    fontSize: 12,
    color: "#fff",
  },
});
