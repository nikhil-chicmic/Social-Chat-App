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
        marginRight: 12,
    },
    storyRing: {
        padding: 3,
        borderRadius: 40,
        borderWidth: 2,
        borderColor: "#ff8501",
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
    },
    username: {
        color: "#fff",
        fontSize: 12,
        marginTop: 4,
        width: 70,
        textAlign: "center",
    },
});
