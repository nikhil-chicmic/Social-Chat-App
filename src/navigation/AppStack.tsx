import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import PostScreen from "../components/PostScreen";
import BottomTabs from "./BottomTabs";
const Stack = createNativeStackNavigator();
const AppStack = () => {
    return (<Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={BottomTabs}/>
      <Stack.Screen name="Post" component={PostScreen}/>
    </Stack.Navigator>);
};
export default AppStack;
