import { useContext } from "react";
import { ActivityIndicator, View } from "react-native";
import AppStack from "./AppStack";
import AuthContext from "./AuthContext";
import AuthStack from "./AuthStack";
export default function RootNavigator() {
  const { user, loading } = useContext(AuthContext);
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  return user ? <AppStack /> : <AuthStack />;
}
