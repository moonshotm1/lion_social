import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Colors from "../../src/constants/colors";
import { getRelativeTime, formatCount } from "../../src/constants/mock-data";
import Avatar from "../../src/components/Avatar";
import PostTypeBadge from "../../src/components/PostTypeBadge";
import { supabase } from "../../src/lib/supabase";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type PostData = {
  id: string;
  caption: string;
  imageUrl: string | null;
  type: "workout" | "meal" | "quote" | "story";
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    isVerified: boolean;
  };
};

type CommentItem = {
  id: string;
  username: string;
  avatarUrl: string | null;
  text: string;
  createdAt: string;
};

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [post, setPost] = useState<PostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [localComments, setLocalComments] = useState<CommentItem[]>([]);
  const [appUserId, setAppUserId] = useState<string | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string>("you");

  const fetchPost = useCallback(async () => {
    const { data, error } = await supabase
      .from("Post")
      .select(`
        id, caption, imageUrl, type, createdAt,
        User!inner (id, username, displayName, avatarUrl, isVerified),
        Like (id),
        Comment (id)
      `)
      .eq("id", id)
      .single();

    if (error || !data) {
      console.error("[PostDetail] fetchPost error:", error?.message);
      setLoading(false);
      return;
    }

    const p = data as any;
    setPost({
      id: p.id,
      caption: p.caption,
      imageUrl: p.imageUrl ?? null,
      type: p.type,
      createdAt: p.createdAt,
      likesCount: (p.Like as any[]).length,
      commentsCount: (p.Comment as any[]).length,
      user: {
        id: p.User.id,
        username: p.User.username,
        displayName: p.User.displayName,
        avatarUrl: p.User.avatarUrl ?? null,
        isVerified: p.User.isVerified ?? false,
      },
    });
    setLoading(false);
  }, [id]);

  const fetchComments = useCallback(async () => {
    const { data, error } = await supabase
      .from("Comment")
      .select(`
        id, content, createdAt,
        User!inner (id, username, avatarUrl)
      `)
      .eq("postId", id)
      .order("createdAt", { ascending: true });

    if (error || !data) {
      console.error("[PostDetail] fetchComments error:", error?.message);
      return;
    }

    setLocalComments(
      (data as any[]).map((c) => ({
        id: c.id,
        username: c.User.username,
        avatarUrl: c.User.avatarUrl ?? null,
        text: c.content,
        createdAt: c.createdAt,
      }))
    );
  }, [id]);

  // Record view + load data on mount
  useEffect(() => {
    supabase.rpc("increment_post_view", { post_id: id }).then(({ error }) => {
      if (error) console.error("[PostDetail] increment_post_view error:", error.message);
      else console.log("[PostDetail] View recorded for:", id);
    });

    fetchPost();
    fetchComments();
  }, [id, fetchPost, fetchComments]);

  // Resolve current user + check existing like
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      const { data: appUser } = await supabase
        .from("User")
        .select("id, username")
        .eq("supabaseId", session.user.id)
        .single();
      if (!appUser) return;
      const uid = (appUser as any).id;
      setAppUserId(uid);
      setCurrentUsername((appUser as any).username);
      const { data: like } = await supabase
        .from("Like")
        .select("id")
        .eq("postId", id)
        .eq("userId", uid)
        .maybeSingle();
      setIsLiked(!!like);
    });
  }, [id]);

  const handleLike = useCallback(async () => {
    const wasLiked = isLiked;
    setIsLiked(!wasLiked);

    if (!appUserId) return;

    if (wasLiked) {
      const { error } = await supabase
        .from("Like")
        .delete()
        .eq("postId", id)
        .eq("userId", appUserId);
      if (error) setIsLiked(wasLiked);
    } else {
      const { error } = await supabase
        .from("Like")
        .insert({ postId: id, userId: appUserId });
      if (error) setIsLiked(wasLiked);
    }
  }, [isLiked, appUserId, id]);

  const handleCommentSubmit = useCallback(async () => {
    const text = commentText.trim();
    if (!text) return;
    setCommentText("");

    const tempComment: CommentItem = {
      id: `temp-${Date.now()}`,
      username: currentUsername,
      avatarUrl: null,
      text,
      createdAt: new Date().toISOString(),
    };
    setLocalComments((prev) => [...prev, tempComment]);

    if (!appUserId) return;

    const { error } = await supabase
      .from("Comment")
      .insert({ postId: id, userId: appUserId, content: text });

    if (error) {
      console.error("[PostDetail] Comment insert error:", error.message);
      setLocalComments((prev) => prev.filter((c) => c.id !== tempComment.id));
      setCommentText(text);
    }
  }, [commentText, appUserId, id, currentUsername]);

  if (loading || !post) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
            <Text style={styles.backIcon}>←</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Post</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.gold} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
            <Text style={styles.backIcon}>←</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Post</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Author row */}
          <View style={styles.authorRow}>
            <View style={styles.authorInfo}>
              <Avatar uri={post.user.avatarUrl} name={post.user.displayName} size={44} />
              <View style={styles.authorText}>
                <View style={styles.usernameRow}>
                  <Text style={styles.username}>{post.user.username}</Text>
                  {post.user.isVerified && (
                    <View style={styles.verifiedDot}>
                      <Text style={styles.verifiedText}>✓</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.timestamp}>{getRelativeTime(post.createdAt)}</Text>
              </View>
            </View>
            <PostTypeBadge type={post.type} />
          </View>

          {/* Image */}
          {post.imageUrl && (
            <Image
              source={{ uri: post.imageUrl }}
              style={styles.postImage}
              resizeMode="cover"
            />
          )}

          {/* Caption */}
          <View style={styles.captionContainer}>
            <Text style={styles.caption}>{post.caption}</Text>
          </View>

          {/* Action row */}
          <View style={styles.actionRow}>
            <View style={styles.actionLeft}>
              <Pressable onPress={handleLike} style={styles.actionButton}>
                <Text style={[styles.actionIcon, isLiked && styles.actionIconLiked]}>
                  {isLiked ? "♥" : "♡"}
                </Text>
                <Text style={[styles.actionCount, isLiked && styles.actionCountLiked]}>
                  {formatCount(post.likesCount + (isLiked ? 1 : 0))}
                </Text>
              </Pressable>
              <View style={styles.actionButton}>
                <Text style={styles.actionIcon}>💬</Text>
                <Text style={styles.actionCount}>{formatCount(localComments.length)}</Text>
              </View>
            </View>
            <Pressable style={styles.actionButton}>
              <Text style={styles.actionIcon}>🔖</Text>
            </Pressable>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Comments section */}
          <Text style={styles.commentsHeading}>
            {localComments.length > 0
              ? `${localComments.length} Comments`
              : "No comments yet"}
          </Text>

          {localComments.map((c) => (
            <View key={c.id} style={styles.commentRow}>
              <Avatar uri={c.avatarUrl} name={c.username} size={36} />
              <View style={styles.commentBubble}>
                <Text style={styles.commentUsername}>{c.username}</Text>
                <Text style={styles.commentText}>{c.text}</Text>
                <Text style={styles.commentTime}>{getRelativeTime(c.createdAt)}</Text>
              </View>
            </View>
          ))}

          <View style={{ height: 80 }} />
        </ScrollView>

        {/* Comment input */}
        <View style={styles.commentInputRow}>
          <TextInput
            style={styles.commentInput}
            placeholder="Add a comment…"
            placeholderTextColor={Colors.grayDark}
            value={commentText}
            onChangeText={setCommentText}
            multiline={false}
            returnKeyType="send"
            onSubmitEditing={handleCommentSubmit}
          />
          {commentText.trim().length > 0 && (
            <Pressable style={styles.sendButton} onPress={handleCommentSubmit}>
              <Text style={styles.sendText}>Post</Text>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.dark800,
  },
  backButton: {
    width: 36,
    alignItems: "center",
  },
  backIcon: {
    fontSize: 22,
    color: Colors.gold,
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.white,
  },

  // Author
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  authorInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  authorText: { flex: 1 },
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

  // Post content
  postImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.75,
  },
  captionContainer: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  caption: {
    fontSize: 15,
    color: Colors.grayLight,
    lineHeight: 23,
  },

  // Actions
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
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
    fontSize: 22,
    color: Colors.grayLight,
  },
  actionIconLiked: { color: "#EF4444" },
  actionCount: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.gray,
  },
  actionCountLiked: { color: "#EF4444" },

  // Comments
  divider: {
    height: 0.5,
    backgroundColor: Colors.dark800,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  commentsHeading: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.white,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  commentRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 10,
    alignItems: "flex-start",
  },
  commentBubble: {
    flex: 1,
    backgroundColor: Colors.dark900,
    borderRadius: 12,
    padding: 10,
  },
  commentUsername: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.white,
    marginBottom: 3,
  },
  commentText: {
    fontSize: 14,
    color: Colors.grayLight,
    lineHeight: 20,
  },
  commentTime: {
    fontSize: 11,
    color: Colors.grayDark,
    marginTop: 4,
  },

  // Comment input
  commentInputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 0.5,
    borderTopColor: Colors.dark800,
    backgroundColor: Colors.black,
    gap: 10,
  },
  commentInput: {
    flex: 1,
    height: 40,
    backgroundColor: Colors.dark900,
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 14,
    color: Colors.white,
    borderWidth: 0.5,
    borderColor: Colors.dark700,
  },
  sendButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: Colors.gold,
    borderRadius: 16,
  },
  sendText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.black,
  },
});
