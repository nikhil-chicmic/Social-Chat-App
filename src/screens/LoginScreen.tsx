import { Ionicons } from "@expo/vector-icons";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { supabase } from "../../lib/supabase";
import { DarkTheme } from "../theme/DarkTheme";
import { registerForPushNotifications } from "../utils/notifications";
import { styles } from "./Home/styles";

const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      offlineAccess: true,
    });
  }, []);

  const updatePushToken = async (userId: string) => {
    const token = await registerForPushNotifications();
    if (!token) return;

    await supabase
      .from("users")
      .update({ expo_push_token: token })
      .eq("id", userId);
  };

  const createUserIfNotExists = async (user: any) => {
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (data) return;

    const baseUsername = user.email?.split("@")[0].toLowerCase() || "user";
    let username = baseUsername;
    let counter = 1;

    while (true) {
      const { data: exists } = await supabase
        .from("users")
        .select("username")
        .eq("username", username)
        .single();

      if (!exists) break;

      username = `${baseUsername}${counter}`;
      counter++;
    }

    await supabase.from("users").insert([
      {
        id: user.id,
        username,
        photo_url: user.user_metadata?.avatar_url || "",
        bio: "",
        followers_count: 0,
        following_count: 0,
      },
    ]);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      return Alert.alert("Error", "Please fill all fields");
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      if (data.user) {
        await updatePushToken(data.user.id);
      }
    } catch (err: any) {
      Alert.alert("Login Failed", err.message);
    }

    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);

      await GoogleSignin.hasPlayServices();
      await GoogleSignin.signOut();

      const userInfo = await GoogleSignin.signIn();
      if (!userInfo?.data?.user) return;

      const { idToken } = await GoogleSignin.getTokens();
      if (!idToken) throw new Error("No ID token received");

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: idToken,
      });

      if (error) throw error;

      if (!data.user) return;

      await updatePushToken(data.user.id);
      await createUserIfNotExists(data.user);
    } catch (err: any) {
      Alert.alert("Google Login Failed", err.message);
    }

    setGoogleLoading(false);
  };

  return (
    <View
      style={{ ...styles.container, alignContent: "center", paddingTop: "30%" }}
    >
      <View
        style={{
          ...styles.header,
          justifyContent: "center",
          paddingBottom: "2.5%",
        }}
      >
        <Text
          style={{
            color: DarkTheme.PRIMARY_BUTTON,
            fontWeight: "900",
            fontSize: 42,
            letterSpacing: -1,
          }}
        >
          Social<Text style={{ color: "#fff" }}>Hub</Text>
        </Text>
      </View>

      <View style={{ ...styles.card, marginHorizontal: "5%" }}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        <TextInput
          placeholder="Email address"
          placeholderTextColor="#9CA3AF"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          placeholder="Password"
          placeholderTextColor="#9CA3AF"
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.primaryButton, loading && { opacity: 0.7 }]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.primaryButtonText}>
            {loading ? "Signing in..." : "Sign In"}
          </Text>
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.divider} />
        </View>

        <TouchableOpacity
          style={styles.googleButton}
          onPress={handleGoogleLogin}
          disabled={googleLoading}
        >
          {googleLoading ? (
            <ActivityIndicator size="large" color="black" />
          ) : (
            <>
              <Ionicons
                name="logo-google"
                size={24}
                style={{ marginRight: 10 }}
              />
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footer}
          onPress={() => navigation.navigate("Signup")}
        >
          <Text style={styles.footerText}>
            Don’t have an account?{" "}
            <Text style={styles.footerLink}>Create one</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default LoginScreen;
