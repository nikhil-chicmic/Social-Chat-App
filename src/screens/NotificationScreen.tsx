import React from "react";
import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DarkTheme } from "../theme/DarkTheme";

const NotificationScreen = () => {
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: DarkTheme.PRIMARY_BACKGROUND }}
    >
      <Text style={{ color: "white" }}>NotificationScreen</Text>
    </SafeAreaView>
  );
};

export default NotificationScreen;
