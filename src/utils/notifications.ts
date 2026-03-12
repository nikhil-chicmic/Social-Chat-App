import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export async function registerForPushNotifications() {
  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    if (!Device.isDevice) {
      console.log("Push notifications require a physical device.");
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      await AsyncStorage.setItem("NOTIFICATIONS_PERMISSION_DENIED", "true");
      return null;
    }

    const devicePushToken = await Notifications.getDevicePushTokenAsync();
    const token = devicePushToken.data;

    console.log("FCM device token:", token);

    return token ?? null;
  } catch (err) {
    console.error("Error registering for push notifications:", err);
    return null;
  }
}