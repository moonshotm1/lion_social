import { useState } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  Dimensions,
} from "react-native";
import Colors from "../constants/colors";
import { type MockPost, getRelativeTime, formatCount } from "../constants/mock-data";
import Avatar from "./Avatar";
import PostTypeBadge from "./PostTypeBadge";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface PostCardProps {
  post: MockPost;
}

export default function PostCard({ post }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount);

  const handleLike = () => {
    setIsLiked((prev) => !prev);
    setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1));
  };

  return (
    <View style={styles.container}>
      {/* User Header */}
      <View style={styles.header}>
        <Pressable style={styles.userInfo}>
          <Avatar
            uri={post.user.avatarUrl}
            name={post.user.displayName}
            size={40}
          />
          <View style={styles.userText}>
            <View style={styles.usernameRow}>
              <Text style={styles.username}>{post.user.username}</Text>
              {post.user.isVerified && (
                <View style={styles.verifiedDot}>
                  <Text style={styles.verifiedText}>✓</Text>
                </View>
              )}
            </View>
            <Text style={styles.timestamp}>
              {getRelativeTime(post.createdAt)}
            </Text>
          </View>
        </Pressable>
        <PostTypeBadge type={post.type} />
      </View>

      {/* Image */}
      {post.imageUrl && (
        <Pressable style={styles.imageContainer}>
          <Image
            source={{ uri: post.imageUrl }}
            style={styles.postImage}
            resizeMode="cover"
          />
          {/* Subtle gradient overlay at bottom of image */}
          <View style={styles.imageGradient} />
        </Pressable>
      )}

      {/* Caption */}
      <View style={styles.captionContainer}>
        <Text style={styles.caption}>
          <Text style={styles.captionUsername}>{post.user.username}</Text>
          {"  "}
          {post.caption}
        </Text>
      </View>

      {/* Action Row */}
      <View style={styles.actionRow}>
        <View style={styles.actionLeft}>
          <Pressable onPress={handleLike} style={styles.actionButton}>
            <Text
              style={[
                styles.actionIcon,
                isLiked && styles.actionIconLiked,
              ]}
            >
              {isLiked ? "♥" : "♡"}
            </Text>
            <Text
              style={[
                styles.actionCount,
                isLiked && styles.actionCountLiked,
              ]}
            >
              {formatCount(likesCount)}
            </Text>
          </Pressable>

          <Pressable style={styles.actionButton}>
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={styles.actionCount}>
              {formatCount(post.commentsCount)}
            </Text>
          </Pressable>

          <Pressable style={styles.actionButton}>
            <Text style={styles.actionIcon}>↗</Text>
          </Pressable>
        </View>

        <Pressable style={styles.actionButton}>
          <Text style={styles.actionIcon}>🔖</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.black,
    paddingVertical: 12,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  userText: {
    flex: 1,
  },
  usernameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  username: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.white,
  },
  verifiedDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  verifiedText: {
    fontSize: 9,
    fontWeight: "800",
    color: Colors.black,
  },
  timestamp: {
    fontSize: 12,
    color: Colors.grayDark,
    marginTop: 1,
  },

  // Image
  imageContainer: {
    position: "relative",
    marginBottom: 12,
  },
  postImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.65,
  },
  imageGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: "transparent",
    // A subtle bottom fade for polish
  },

  // Caption
  captionContainer: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  caption: {
    fontSize: 14,
    color: Colors.grayLight,
    lineHeight: 21,
  },
  captionUsername: {
    fontWeight: "700",
    color: Colors.white,
  },

  // Actions
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  actionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 4,
  },
  actionIcon: {
    fontSize: 20,
    color: Colors.grayLight,
  },
  actionIconLiked: {
    color: "#EF4444",
  },
  actionCount: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.gray,
  },
  actionCountLiked: {
    color: "#EF4444",
  },
});
