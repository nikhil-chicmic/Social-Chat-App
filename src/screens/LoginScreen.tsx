import { Ionicons } from "@expo/vector-icons";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View, } from "react-native";
import { supabase } from "../../lib/supabase";
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
    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert("Error", "Please fill all fields");
            return;
        }
        try {
            setLoading(true);
            const { error } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password,
            });
            if (error)
                throw error;
        }
        catch (error: any) {
            Alert.alert("Login Failed", error.message);
        }
        finally {
            setLoading(false);
        }
    };
    const handleGoogleLogin = async () => {
        try {
            setGoogleLoading(true);
            await GoogleSignin.hasPlayServices();
            await GoogleSignin.signOut();
            const userInfo = await GoogleSignin.signIn();
            if (!userInfo?.data?.user) {
                setGoogleLoading(false);
                return;
            }
            const { idToken } = await GoogleSignin.getTokens();
            if (!idToken)
                throw new Error("No ID token received");
            const { data, error } = await supabase.auth.signInWithIdToken({
                provider: "google",
                token: idToken,
            });
            if (error)
                throw error;
            const user = data.user;
            if (user) {
                const { data: existing } = await supabase
                    .from("users")
                    .select("*")
                    .eq("id", user.id)
                    .single();
                if (!existing) {
                    const baseUsername = user.email?.split("@")[0].toLowerCase() || "user";
                    let finalUsername = baseUsername;
                    let counter = 1;
                    while (true) {
                        const { data: usernameCheck } = await supabase
                            .from("users")
                            .select("username")
                            .eq("username", finalUsername)
                            .single();
                        if (!usernameCheck)
                            break;
                        finalUsername = `${baseUsername}${counter}`;
                        counter++;
                    }
                    const { error: insertError } = await supabase.from("users").insert([
                        {
                            id: user.id,
                            username: finalUsername,
                            photo_url: user.user_metadata?.avatar_url || "",
                            bio: "",
                            followers_count: 0,
                            following_count: 0,
                        },
                    ]);
                    if (insertError)
                        throw insertError;
                }
            }
        }
        catch (error: any) {
            Alert.alert("Google Login Failed", error.message);
        }
        finally {
            setGoogleLoading(false);
        }
    };
    return (<View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appText}>
          Social<Text style={{ color: "#fff" }}>Hub</Text>
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        <TextInput placeholder="Email address" placeholderTextColor="#9CA3AF" style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address"/>

        <TextInput placeholder="Password" placeholderTextColor="#9CA3AF" style={styles.input} value={password} onChangeText={setPassword} secureTextEntry/>

        <TouchableOpacity style={[styles.primaryButton, loading && { opacity: 0.7 }]} onPress={handleLogin} disabled={loading}>
          <Text style={styles.primaryButtonText}>
            {loading ? "Signing in..." : "Sign In"}
          </Text>
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={styles.divider}/>
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.divider}/>
        </View>

        <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin} disabled={googleLoading}>
          {googleLoading ? (<ActivityIndicator size="large" color="black"/>) : (<>
              <Ionicons style={{ marginRight: 10 }} name="logo-google" size={24}/>
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </>)}
        </TouchableOpacity>

        <TouchableOpacity style={styles.footer} onPress={() => navigation.navigate("Signup")}>
          <Text style={styles.footerText}>
            Don’t have an account?{" "}
            <Text style={styles.footerLink}>Create one</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>);
};
export default LoginScreen;
