import { Session, User } from "@supabase/supabase-js";
import * as Notifications from "expo-notifications";
import React, {
  createContext,
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";

import { supabase } from "../../lib/supabase";
import { registerForPushNotifications } from "../utils/notifications";

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

  const getCurrentSession = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session;
  };

  const savePushToken = async (userId: string) => {
    const token = await registerForPushNotifications();
    if (!token) return;

    const { error } = await supabase
      .from("users")
      .update({ expo_push_token: token })
      .eq("id", userId);

    if (error) {
      console.error("Error saving push token:", error);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      const session = await getCurrentSession();

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    initialize();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    savePushToken(user.id);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`user-events-${user.id}`)

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

          const { data } = await supabase
            .from("users")
            .select("username")
            .eq("id", notif.sender_id)
            .single();

          const senderName = data?.username ?? "Someone";

          let title = "Notification";
          let body = "You have a new notification";

          if (notif.type === "like") {
            title = "New Like";
            body = `${senderName} liked your post`;
          }

          if (notif.type === "follow") {
            title = "New Follower";
            body = `${senderName} started following you`;
          }

          console.log("Foreground notification:", { title, body });
        },
      )

      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        async (payload) => {
          const msg = payload.new;

          if (msg.sender_id === user.id) return;

          const { data } = await supabase
            .from("conversation_participants")
            .select("id")
            .eq("conversation_id", msg.conversation_id)
            .eq("user_id", user.id)
            .maybeSingle();

          if (!data) return;

          console.log("Foreground message received:", msg.conversation_id);
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
