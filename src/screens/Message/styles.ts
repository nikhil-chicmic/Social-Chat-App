import { StyleSheet } from "react-native";
import { DarkTheme } from "../../theme/DarkTheme";

export const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  headerText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  backIcon: {
    position: "absolute",
    left: 20,
    padding: 4,
  },
  newChatIcon: {
    position: "absolute",
    right: 20,
    padding: 4,
  },
  chatContainer: {
    flex: 1,
  },
  emptyBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    marginTop: -80,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#161618",
    borderWidth: 1,
    borderColor: "#2A2A2C",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  emptyText: {
    color: "#8E8E93",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  findFriendsButton: {
    backgroundColor: DarkTheme.PRIMARY_BUTTON,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
    shadowColor: DarkTheme.PRIMARY_BUTTON,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  findFriendsText: {
    fontWeight: "700",
    fontSize: 16,
    color: "#000",
  },
});
