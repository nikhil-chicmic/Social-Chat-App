import { useNavigation } from "@react-navigation/native";
import React from "react";
import {
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");
const imageSize = width / 3;

type Post = {
  id: string;
  image_url: string;
  caption?: string;
  username?: string;
};

type Props = {
  posts: Post[];
  refreshPosts?: () => Promise<void>; // optional prop
};

const PostsGrid = ({ posts }: Props) => {
  const navigation: any = useNavigation();

  if (!posts || posts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No Posts Yet</Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: Post }) => {
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() =>
          navigation.navigate("Post", {
            post: item,
          })
        }
      >
        <Image source={{ uri: item.image_url }} style={styles.image} />
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      numColumns={3}
      scrollEnabled={false}
      showsVerticalScrollIndicator={false}
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
