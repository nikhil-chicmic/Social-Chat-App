import React from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DarkTheme } from "../theme/DarkTheme";

const SearchScreen = () => {
  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: DarkTheme.PRIMARY_BACKGROUND }}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TextInput
            placeholder="Search for users"
            placeholderTextColor="#fff"
            style={styles.input}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            spellCheck={false}
            textContentType="username"
            returnKeyType="search"
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default SearchScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
  },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: DarkTheme.PRIMARY_BACKGROUND,
    borderRadius: 8,
    paddingHorizontal: 12,
    color: "#fff",
  },
});
