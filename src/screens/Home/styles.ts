import { StyleSheet } from "react-native";
import { DarkTheme } from "../../theme/DarkTheme";
export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: DarkTheme.PRIMARY_BACKGROUND,
        justifyContent: "center",
        padding: 20,
    },
    logoContainer: {
        paddingTop: 50,
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
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
    logo: {
        height: 50,
        width: 50,
        borderRadius: "20%",
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
        backgroundColor: "#BAF533",
        padding: 15,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 5,
    },
    primaryButtonText: {
        color: "#000",
        fontWeight: "600",
        fontSize: 15,
    },
    dividerContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 20,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: "#E5E7EB",
    },
    dividerText: {
        marginHorizontal: 10,
        color: "#9CA3AF",
        fontSize: 12,
    },
    googleButton: {
        flexDirection: "row",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "grey",
        padding: 15,
        borderRadius: 12,
        alignItems: "center",
        backgroundColor: "#FFFFFF",
    },
    googleButtonText: {
        color: "#111827",
        fontWeight: "500",
        fontSize: 15,
    },
    footer: {
        marginTop: 20,
        alignItems: "center",
    },
    footerText: {
        color: "#6B7280",
        fontSize: 13,
        padding: 7,
    },
    footerLink: {
        color: "tomato",
        fontWeight: "600",
    },
});
