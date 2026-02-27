import { useNavigation } from "@react-navigation/native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import React, { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth } from "../../firebase";
import { DarkTheme } from "../theme/DarkTheme";

const SignupScreen = () => {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigation.popToTop();
      navigation.navigate("Home");
    } catch (error: any) {
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

        <TouchableOpacity style={styles.primaryButton} onPress={handleSignup}>
          <Text style={styles.primaryButtonText}>Create Account</Text>
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
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: -100,
    marginBottom: 50,
  },
  appText: {
    color: DarkTheme.PRIMARY_BUTTON,
    fontSize: 40,
    fontWeight: 900,
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
