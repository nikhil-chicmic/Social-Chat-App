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

    const isAndroidEmulator = Platform.OS === "android";

    if (!Device.isDevice && !isAndroidEmulator) {
      console.log("Push notifications require a physical device.");
      return null;
    }

    const permission = await Notifications.getPermissionsAsync();

    let status = permission.status;

    if (status !== "granted") {
      const request = await Notifications.requestPermissionsAsync();
      status = request.status;
    }

    if (status !== "granted") {
      await AsyncStorage.setItem("NOTIFICATIONS_PERMISSION_DENIED", "true");
      return null;
    }

    const { data: token } = await Notifications.getDevicePushTokenAsync();

    console.log("FCM device token:", token);

    return token ?? null;
  } catch (err) {
    console.error("Push notification registration error:", err);
    return null;
  }
}
