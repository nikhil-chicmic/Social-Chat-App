import { StyleSheet } from "react-native";
import { DarkTheme } from "../../theme/DarkTheme";

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DarkTheme.PRIMARY_BACKGROUND },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },

  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginLeft: 12,
    marginRight: 10,
  },

  headerName: { color: "#fff", fontSize: 18, fontWeight: "bold" },

  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 10,
  },

  rowRight: { justifyContent: "flex-end" },
  rowLeft: { justifyContent: "flex-start" },

  avatar: { width: 26, height: 26, borderRadius: 13, marginRight: 8 },

  bubble: {
    maxWidth: "75%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },

  myBubble: {
    backgroundColor: DarkTheme.PRIMARY_BUTTON,
    borderBottomRightRadius: 4,
  },

  otherBubble: {
    backgroundColor: "#2A2A2A",
    borderBottomLeftRadius: 4,
  },

  messageText: { fontSize: 15, lineHeight: 20 },

  timeText: { fontSize: 11, marginTop: 4, textAlign: "right" },

  loader: { flex: 1, justifyContent: "center", alignItems: "center" },

  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#222",
  },

  input: {
    flex: 1,
    backgroundColor: "#1A1A1A",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: "#fff",
    fontSize: 16,
    maxHeight: 120,
  },

  sendButton: {
    marginLeft: 10,
    backgroundColor: DarkTheme.PRIMARY_BUTTON,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
});
