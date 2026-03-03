import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import Header from "./Header";
import PostsGrid from "./PostsGrid";
import ProfileTabs from "./ProfileTabs";

const ProfileScreen = () => {
  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        <Header />
        <ProfileTabs />
        <PostsGrid />
      </ScrollView>
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
});
