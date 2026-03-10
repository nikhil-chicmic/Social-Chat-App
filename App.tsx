import {
  NavigationContainer,
  createNavigationContainerRef,
} from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import { useEffect, useRef } from "react";
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

export const navigationRef = createNavigationContainerRef<any>();

export default function App() {
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data: any = response.notification.request.content.data || {};

        if (!navigationRef.isReady()) return;

        if (data.type === "message" && data.conversationId) {
          navigationRef.navigate("ChatRoom", {
            conversationId: data.conversationId,
            otherUser: data.otherUser || null,
          });
        } else if (data.type === "like" && data.postId) {
          navigationRef.navigate("Post", { postId: data.postId });
        } else if (data.type === "follow" && data.userId) {
          navigationRef.navigate("OtherProfile", { userId: data.userId });
        }
      });

    return () => {
      responseListener.current?.remove();
    };
  }, []);

  return (
    <AuthProvider>
      <NavigationContainer ref={navigationRef}>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
