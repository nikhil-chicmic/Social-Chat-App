import { Session, User } from "@supabase/supabase-js";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import React, {
  createContext,
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "../../lib/supabase";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
};
const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
});
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasRegisteredPush, setHasRegisteredPush] = useState(false);
  useEffect(() => {
    const initialize = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };
    initialize();
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      },
    );
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user?.id || hasRegisteredPush) return;

    const registerPushToken = async () => {
      try {
        if (!Device.isDevice) {
          console.log("Push notifications require a physical device.");
          return;
        }

        const { status: existingStatus } =
          await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== "granted") {
          console.log("Notification permissions not granted.");
          return;
        }

        const tokenResponse = await Notifications.getExpoPushTokenAsync();
        const token = tokenResponse.data;

        if (!token) return;

        const { error } = await supabase
          .from("users")
          .update({ expo_push_token: token })
          .eq("id", user.id);

        if (error) {
          console.error("Error saving expo_push_token:", error);
          return;
        }

        setHasRegisteredPush(true);
        console.log("Registered Expo push token:", token);
      } catch (err) {
        console.error("Error registering push token:", err);
      }
    };

    registerPushToken();
  }, [user?.id, hasRegisteredPush]);

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`push-notifications-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `receiver_id=eq.${user.id}`,
        },
        async (payload) => {
          const notif = payload.new;
          const { data: sender } = await supabase
            .from("users")
            .select("username")
            .eq("id", notif.sender_id)
            .single();
          const senderName = sender?.username || "Someone";
          let title = "New Notification";
          let body = "You have a new notification";
          if (notif.type === "like") {
            title = "New Like";
            body = `${senderName} liked your post!`;
          } else if (notif.type === "follow") {
            title = "New Follower";
            body = `${senderName} started following you!`;
          }
          await Notifications.scheduleNotificationAsync({
            content: { title, body },
            trigger: null,
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        async (payload) => {
          const msg = payload.new;
          if (msg.sender_id === user.id) return;
          const { data: parts } = await supabase
            .from("conversation_participants")
            .select("id")
            .eq("conversation_id", msg.conversation_id)
            .eq("user_id", user.id)
            .maybeSingle();
          if (parts) {
            const { data: sender } = await supabase
              .from("users")
              .select("username")
              .eq("id", msg.sender_id)
              .single();
            await Notifications.scheduleNotificationAsync({
              content: {
                title: `New message from ${sender?.username || "Someone"}`,
                body: msg.content,
              },
              trigger: null,
            });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const value = useMemo(
    () => ({ user, session, loading }),
    [user, session, loading],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
export default AuthContext;
