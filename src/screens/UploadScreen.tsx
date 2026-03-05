import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, } from "react-native";
import { supabase } from "../../lib/supabase";
const UploadScreen = () => {
    const [image, setImage] = useState<string | null>(null);
    const [caption, setCaption] = useState("");
    const [uploading, setUploading] = useState(false);
    const pickImage = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Alert.alert("Permission required");
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
        });
        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };
    const handleUpload = async () => {
        if (!image) {
            Alert.alert("Error", "Image missing");
            return;
        }
        try {
            setUploading(true);
            const { data: { user }, } = await supabase.auth.getUser();
            if (!user) {
                throw new Error("User not authenticated");
            }
            const fileExt = image.split(".").pop();
            const fileName = `${user.id}/${Date.now()}.${fileExt}`;
            const response = await fetch(image);
            const arrayBuffer = await response.arrayBuffer();
            const { error: uploadError } = await supabase.storage
                .from("Posts")
                .upload(fileName, arrayBuffer, {
                contentType: "image/jpeg",
            });
            if (uploadError)
                throw uploadError;
            const { data } = supabase.storage.from("Posts").getPublicUrl(fileName);
            const imageUrl = data.publicUrl;
            const { error: insertError } = await supabase.from("posts").insert([
                {
                    user_id: user.id,
                    image_url: imageUrl,
                    caption: caption.trim(),
                },
            ]);
            if (insertError)
                throw insertError;
            setImage(null);
            setCaption("");
            Alert.alert("Success", "Post uploaded successfully");
        }
        catch (error: any) {
            Alert.alert("Upload failed", error.message);
        }
        finally {
            setUploading(false);
        }
    };
    return (<ScrollView style={styles.container}>
      <Text style={styles.title}>Create Post</Text>

      <TouchableOpacity style={styles.imageBox} onPress={pickImage} activeOpacity={0.8}>
        {image ? (<Image source={{ uri: image }} style={styles.preview}/>) : (<View style={styles.placeholder}>
            <Ionicons name="image-outline" size={50} color="#555"/>
            <Text style={styles.placeholderText}>Tap to select image</Text>
          </View>)}
      </TouchableOpacity>

      <TextInput style={styles.input} placeholder="Write a caption..." placeholderTextColor="#666" multiline maxLength={150} value={caption} onChangeText={setCaption}/>

      <TouchableOpacity style={[styles.uploadButton, (!image || uploading) && { opacity: 0.6 }]} disabled={!image || uploading} onPress={handleUpload}>
        {uploading ? (<ActivityIndicator color="#000"/>) : (<Text style={styles.uploadText}>Upload</Text>)}
      </TouchableOpacity>
    </ScrollView>);
};
export default UploadScreen;
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
        padding: 20,
    },
    title: {
        color: "#fff",
        fontSize: 22,
        fontWeight: "600",
        marginBottom: 20,
    },
    imageBox: {
        width: "100%",
        height: 300,
        backgroundColor: "#111",
        borderRadius: 16,
        overflow: "hidden",
        justifyContent: "center",
        alignItems: "center",
    },
    preview: {
        width: "100%",
        height: "100%",
    },
    placeholder: {
        alignItems: "center",
    },
    placeholderText: {
        color: "#666",
        marginTop: 10,
    },
    input: {
        marginTop: 20,
        borderWidth: 1,
        borderColor: "#222",
        borderRadius: 12,
        padding: 12,
        color: "#fff",
        minHeight: 80,
        textAlignVertical: "top",
    },
    uploadButton: {
        marginTop: 20,
        backgroundColor: "#C6FF00",
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: "center",
    },
    uploadText: {
        fontWeight: "600",
        fontSize: 16,
        color: "#000",
    },
});
