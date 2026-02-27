import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import OurStory from "../components/OurStory";
import Post from "../components/Post";
import StoryCircle from "../components/StoryCircle";
import { DarkTheme } from "../theme/DarkTheme";

const HomeScreen = () => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }} edges={["top"]}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.appText}>
            Social<Text style={{ color: "#fff" }}>Hub</Text>
          </Text>
          <TouchableOpacity style={styles.chatIcon}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={30}
              color={"white"}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.storySection}>
          <ScrollView
            horizontal
            bounces={false}
            style={styles.stories}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 20, alignItems: "center" }}
          >
            <OurStory />
            <StoryCircle />
            <StoryCircle />
            <StoryCircle />
            <StoryCircle />
            <StoryCircle />
            <StoryCircle />
            <StoryCircle />
            <StoryCircle />
            <StoryCircle />
            <StoryCircle />
          </ScrollView>
        </View>

        <View style={styles.mainSection}>
          <ScrollView
            bounces={false}
            style={styles.stories}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ marginBottom: 10 }}
          >
            <Post />
            <Post />
            <Post />
            <Post />
            <Post />
            <Post />
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    width: "100%",
    paddingBottom: 150,
  },
  header: {
    marginTop: 5,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  appText: {
    color: DarkTheme.PRIMARY_BUTTON,
    fontSize: 30,
    fontWeight: 900,
  },
  chatIcon: {
    position: "absolute",
    right: 20,
  },

  storySection: {
    marginHorizontal: 16,
    marginTop: 10,
  },

  stories: {
    marginBottom: 15,
  },

  mainSection: {
    paddingHorizontal: 16,
  },
});
