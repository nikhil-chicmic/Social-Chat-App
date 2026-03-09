import { NavigationContainer } from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import { AuthProvider } from "./src/navigation/AuthContext";
import RootNavigator from "./src/navigation/RootNavigator";

Notifications.setNotificationHandler({
  handleNotification:
    async (): Promise<Notifications.NotificationBehavior> => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
});

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
