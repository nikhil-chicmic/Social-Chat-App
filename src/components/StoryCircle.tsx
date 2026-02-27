import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

const StoryCircle = () => {
  return (
    <View style={{ flex: 1, marginRight: 5 }}>
      <LinearGradient
        colors={["#feda75", "#fa7e1e", "#d62976", "#962fbf", "#4f5bd5"]}
        style={{
          padding: 5,
          borderRadius: 50,
        }}
      >
        <Image
          source={require("../../assets/BlankProfile.png")}
          style={styles.profileImg}
        />
      </LinearGradient>
      <Text style={styles.profileName}>Nikhil</Text>
    </View>
  );
};

export default StoryCircle;

const styles = StyleSheet.create({
  profileImg: {
    height: 70,
    width: 70,
    borderRadius: 50,
  },
  profileName: {
    color: "#fff",
    alignSelf: "center",
  },
});
