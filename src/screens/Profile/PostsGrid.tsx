import React from "react";
import {
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";

const { width } = Dimensions.get("window");
const imageSize = width / 3;

const dummyPosts: string[] = [];

const PostsGrid = () => {
  if (dummyPosts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No Posts Yet</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={dummyPosts}
      keyExtractor={(item, index) => index.toString()}
      numColumns={3}
      scrollEnabled={false}
      renderItem={({ item }) => (
        <Image source={{ uri: item }} style={styles.image} />
      )}
    />
  );
};

export default PostsGrid;

const styles = StyleSheet.create({
  image: {
    width: imageSize,
    height: imageSize,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    color: "#777",
    fontSize: 16,
  },
});
