import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
const blankProfile = require("../../assets/BlankProfile.png");
const StoryCircle = ({ user }: any) => {
    if (!user)
        return null;
    const avatar = user?.photo_url ? { uri: user.photo_url } : blankProfile;
    return (<View style={styles.container}>
      {user?.hasStory ? (<View style={styles.storyRing}>
          <Image source={avatar} style={styles.avatar}/>
        </View>) : (<Image source={avatar} style={styles.avatar}/>)}

      <Text style={styles.username} numberOfLines={1}>
        {user?.username ?? "user"}
      </Text>
    </View>);
};
export default StoryCircle;
const styles = StyleSheet.create({
    container: {
        alignItems: "center",
        marginRight: 16,
    },
    storyRing: {
        padding: 3,
        borderRadius: 40,
        borderWidth: 2,
        borderColor: "#C6FF00", // DarkTheme.PRIMARY_BUTTON
    },
    avatar: {
        width: 68,
        height: 68,
        borderRadius: 34,
        backgroundColor: "#2A2A2C",
    },
    username: {
        color: "#EBEBF5",
        fontSize: 13,
        fontWeight: "500",
        marginTop: 6,
        width: 74,
        textAlign: "center",
    },
});
