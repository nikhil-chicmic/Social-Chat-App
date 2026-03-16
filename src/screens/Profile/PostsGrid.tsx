import { useNavigation } from "@react-navigation/native";
import React, { memo, useCallback } from "react";
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
};

const PostsGrid = ({ posts }: Props) => {
  const navigation: any = useNavigation();

  const openPost = useCallback(
    (post: Post) => {
      navigation.navigate("Post", { post });
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({ item }: { item: Post }) => (
      <TouchableOpacity activeOpacity={0.9} onPress={() => openPost(item)}>
        <Image source={{ uri: item.image_url }} style={styles.image} />
      </TouchableOpacity>
    ),
    [openPost],
  );

  if (!posts?.length) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No Posts Yet</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      numColumns={3}
      scrollEnabled={false}
      showsVerticalScrollIndicator={false}
      removeClippedSubviews
      initialNumToRender={12}
      maxToRenderPerBatch={12}
      windowSize={5}
    />
  );
};

export default memo(PostsGrid);

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
