import { StyleSheet } from "react-native";
import { DarkTheme } from "../../theme/DarkTheme";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DarkTheme.PRIMARY_BACKGROUND,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: DarkTheme.PRIMARY_BACKGROUND,
  },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
  },
  topBarTitle: {
    color: DarkTheme.PRIMARY_BUTTON,
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -1,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#161618",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2A2C",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },

  avatarContainer: {
    position: "relative",
    marginRight: 24,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#2A2A2C",
    borderWidth: 1,
    borderColor: "#333",
  },
  uploadingIndicator: {
    position: "absolute",
    top: "40%",
    left: "40%",
  },

  statsContainer: {
    flexDirection: "row",
    flex: 1,
    justifyContent: "space-between",
    paddingRight: 10,
    paddingLeft: 20,
  },
  statBox: {
    alignItems: "center",
  },
  statNumber: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  statLabel: {
    color: "#8E8E93",
    fontSize: 13,
    marginTop: 4,
    fontWeight: "500",
  },

  userInfoSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  usernameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  username: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  editIcon: {
    marginLeft: 7,
    marginTop: 15,
  },
  bio: {
    color: "#EBEBF5",
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
  },

  buttonRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  editButton: {
    flex: 1,
    backgroundColor: "#2A2A2C",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  editText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },

  logoutButton: {
    flex: 1,
    backgroundColor: DarkTheme.PRIMARY_BUTTON,
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  logoutText: {
    color: "#000",
    fontWeight: "bold",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "88%",
    backgroundColor: "#1C1C1E",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "#2A2A2C",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 24,
    color: "#fff",
    textAlign: "center",
  },
  inputLabel: {
    color: "#8E8E93",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  inputUsername: {
    borderWidth: 1,
    borderColor: "#333",
    backgroundColor: "#000",
    padding: 14,
    borderRadius: 12,
    fontSize: 16,
    color: "#fff",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#333",
    backgroundColor: "#000",
    padding: 14,
    borderRadius: 12,
    height: 100,
    fontSize: 16,
    textAlignVertical: "top",
    color: "#fff",
  },
  saveButton: {
    marginTop: 32,
    backgroundColor: DarkTheme.PRIMARY_BUTTON,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  saveText: {
    fontWeight: "700",
    color: "#000",
    fontSize: 16,
  },
  cancelButton: {
    marginTop: 16,
    alignItems: "center",
  },
  cancelText: {
    color: "#8E8E93",
    fontSize: 15,
    fontWeight: "600",
  },
});
