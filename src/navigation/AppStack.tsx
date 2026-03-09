import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import PostScreen from "../components/PostScreen";
import MessageScreen from "../screens/Message/MessageScreen";
import ChatRoomScreen from "../screens/Message/ChatRoomScreen";
import BottomTabs from "./BottomTabs";
import OtherProfileScreen from "../screens/Profile/OtherProfileScreen";
import FollowStatsScreen from "../screens/Profile/FollowStatsScreen";

const Stack = createNativeStackNavigator();

const AppStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={BottomTabs} />
      <Stack.Screen name="Post" component={PostScreen} />
      <Stack.Screen name="Message" component={MessageScreen} />
      <Stack.Screen name="ChatRoom" component={ChatRoomScreen} />
      <Stack.Screen name="OtherProfile" component={OtherProfileScreen} />
      <Stack.Screen name="FollowStats" component={FollowStatsScreen} />
    </Stack.Navigator>
  );
};
export default AppStack;
