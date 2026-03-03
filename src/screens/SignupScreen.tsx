import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";
import { DarkTheme } from "../theme/DarkTheme";

const SignupScreen = () => {
  const navigation = useNavigation<any>();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    const trimmedUsername = username.trim().toLowerCase();
    const trimmedEmail = email.trim();

    if (!trimmedUsername || !trimmedEmail || !password) {
      Alert.alert("Error", "All fields are required");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);

      const { data: existingUsername } = await supabase
        .from("users")
        .select("username")
        .eq("username", trimmedUsername)
        .single();

      if (existingUsername) {
        throw new Error("Username already taken");
      }

      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email: trimmedEmail,
          password,
        });

      if (signUpError) throw signUpError;

      const user = signUpData.user;

      if (!user) throw new Error("User creation failed");

      const { error: insertError } = await supabase.from("users").insert([
        {
          id: user.id,
          username: trimmedUsername,
          bio: "",
          photo_url: "",
          followers_count: 0,
          following_count: 0,
        },
      ]);

      if (insertError) {
        await supabase.auth.signOut();
        throw insertError;
      }

      setLoading(false);
    } catch (error: any) {
      setLoading(false);
      Alert.alert("Signup Error", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appText}>
          Social<Text style={{ color: "#fff" }}>Hub</Text>
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Start your journey with us</Text>

        <TextInput
          placeholder="Username"
          placeholderTextColor="#9CA3AF"
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />

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
          style={styles.primaryButton}
          onPress={handleSignup}
          disabled={loading}
        >
          <Text style={styles.primaryButtonText}>
            {loading ? "Creating Account..." : "Create Account"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footer}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.footerText}>
            Already have an account?{" "}
            <Text style={styles.footerLink}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default SignupScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DarkTheme.PRIMARY_BACKGROUND,
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 25,
  },
  header: {
    alignItems: "center",
    marginTop: -100,
    marginBottom: 50,
  },
  appText: {
    color: DarkTheme.PRIMARY_BUTTON,
    fontSize: 40,
    fontWeight: "900",
  },
  input: {
    borderWidth: 1,
    borderColor: "grey",
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 12,
    marginBottom: 15,
    fontSize: 15,
  },
  primaryButton: {
    backgroundColor: DarkTheme.PRIMARY_BUTTON,
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 5,
  },
  primaryButtonText: {
    color: DarkTheme.PRIMARY_BACKGROUND,
    fontWeight: "600",
    fontSize: 15,
  },
  footer: {
    marginTop: 20,
    alignItems: "center",
  },
  footerText: {
    color: DarkTheme.PRIMARY_BACKGROUND,
    fontSize: 13,
  },
  footerLink: {
    color: "tomato",
    fontWeight: "600",
  },
});
