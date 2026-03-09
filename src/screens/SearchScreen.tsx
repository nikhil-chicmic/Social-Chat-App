import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  DeviceEventEmitter,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../../lib/supabase";
import FollowButton from "../components/Profile/FollowButton";
import { DarkTheme } from "../theme/DarkTheme";
import { useChatNavigation } from "../hooks/useChatNavigation";
const blankProfile = require("../../assets/BlankProfile.png");

const SearchScreen = () => {
  const navigation = useNavigation<any>();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadRecommendedUsers = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data } = await supabase
      .from("users")
      .select("*")
      .neq("id", user?.id)
      .limit(20);

    if (data) setUsers(data);
    setLoading(false);
  };

  const searchUsers = async (text: string) => {
    if (text.trim() === "") {
      loadRecommendedUsers();
      return;
    }
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data } = await supabase
      .from("users")
      .select("*")
      .ilike("username", `%${text}%`)
      .neq("id", user?.id)
      .limit(20);

    if (data) setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    loadRecommendedUsers();
    const sub = DeviceEventEmitter.addListener("followChanged", () => {
      if (query.trim() === "") loadRecommendedUsers();
      else searchUsers(query);
    });
    return () => sub.remove();
  }, [query]);

  const handleSearch = (text: string) => {
    setQuery(text);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      searchUsers(text);
    }, 300);
  };

  const { handleMessageUser } = useChatNavigation();

  const renderUser = useCallback(({ item }: any) => {
    return (
      <View style={styles.userRow}>
        <View style={styles.userInfo}>
          <Image
            source={item.photo_url ? { uri: item.photo_url } : blankProfile}
            style={styles.avatar}
          />
          <View>
            <Text style={styles.username}>{item.username}</Text>
            {item.bio && <Text style={styles.bioText} numberOfLines={1}>{item.bio}</Text>}
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.messageButtonIcon} 
            onPress={() => handleMessageUser(item)}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={20} color={DarkTheme.PRIMARY_BUTTON} />
          </TouchableOpacity>
          <FollowButton targetUserId={item.id} />
        </View>
      </View>
    );
  }, [handleMessageUser]);

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: DarkTheme.PRIMARY_BACKGROUND }}
    >
      <View style={styles.container}>
        <Text style={styles.headerTitle}>Discover</Text>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#777" style={styles.searchIcon} />
          <TextInput
            placeholder="Search for people..."
            placeholderTextColor="#777"
            style={styles.input}
            value={query}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            onChangeText={handleSearch}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch("")}>
              <Ionicons name="close-circle" size={18} color="#777" />
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color={DarkTheme.PRIMARY_BUTTON}
            style={{ marginTop: 30 }}
          />
        ) : (
          <>
            {query.length === 0 && <Text style={styles.sectionTitle}>Suggestions for you</Text>}
            <FlatList
              data={users}
              keyExtractor={(item) => item.id}
              renderItem={renderUser}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

export default SearchScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "800",
    marginTop: 10,
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1C",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#2A2A2C",
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  sectionTitle: {
    color: "#EBEBF5",
    opacity: 0.6,
    fontSize: 15,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 16,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 14,
    borderWidth: 1,
    borderColor: "#2A2A2C",
  },
  username: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  bioText: {
    color: "#8E8E93",
    fontSize: 13,
    maxWidth: 160,
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  messageButtonIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(198, 255, 0, 0.1)", // Dimmed primary color
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
});
