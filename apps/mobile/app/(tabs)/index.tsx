import { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Colors from "../../src/constants/colors";
import { type MockPost } from "../../src/constants/mock-data";
import PostCard from "../../src/components/PostCard";
import { supabase } from "../../src/lib/supabase";

type FeedTab = "following" | "explore";

async function fetchFeedPosts(): Promise<MockPost[]> {
  console.log("[Feed] starting load");
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) { console.log("[Feed] no session — returning empty"); return []; }
  console.log("[Feed] session ok, userId:", session.user.id);

  const { data: appUser } = await supabase
    .from("User")
    .select("id")
    .eq("supabaseId", session.user.id)
    .single();

  const currentUserId = (appUser as any)?.id ?? null;
  console.log("[Feed] appUser:", currentUserId);

  const { data, error } = await supabase
    .from("Post")
    .select(`
      id, caption, imageUrl, type, createdAt,
      User!inner (id, username, displayName, avatarUrl, isVerified),
      Like (id, userId),
      Comment (id)
    `)
    .order("createdAt", { ascending: false })
    .limit(20);

  console.log("[Feed] posts returned:", data?.length, "error:", error?.message);
  console.log("[Feed] first post:", JSON.stringify((data as any)?.[0]));

  if (error || !data) {
    console.error("[Feed] fetchFeedPosts error:", error?.message);
    return [];
  }

  const mapped = (data as any[]).map((p) => ({
    id: p.id,
    userId: p.User.id,
    user: {
      id: p.User.id,
      username: p.User.username,
      displayName: p.User.displayName,
      avatarUrl: p.User.avatarUrl ?? null,
      bio: "",
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      isVerified: p.User.isVerified ?? false,
    },
    type: p.type as MockPost["type"],
    caption: p.caption,
    imageUrl: p.imageUrl ?? null,
    likesCount: p.Like.length,
    commentsCount: p.Comment.length,
    isLiked: currentUserId
      ? p.Like.some((l: any) => l.userId === currentUserId)
      : false,
    createdAt: p.createdAt,
  }));
  console.log("[Feed] mapped posts:", mapped.length);
  return mapped;
}

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState<FeedTab>("following");
  const [refreshing, setRefreshing] = useState(false);
  const [posts, setPosts] = useState<MockPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const result = await fetchFeedPosts();
      if (!cancelled) {
        setPosts(result);
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const result = await fetchFeedPosts();
    setPosts(result);
    setRefreshing(false);
  }, []);

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.titleRow}>
        <Text style={styles.titleText}>GAINS</Text>
        <View style={styles.titleAccent} />
      </View>

      <View style={styles.tabRow}>
        <Pressable
          onPress={() => setActiveTab("following")}
          style={[styles.tab, activeTab === "following" && styles.tabActive]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "following" && styles.tabTextActive,
            ]}
          >
            Following
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab("explore")}
          style={[styles.tab, activeTab === "explore" && styles.tabActive]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "explore" && styles.tabTextActive,
            ]}
          >
            Explore
          </Text>
        </Pressable>
      </View>
    </View>
  );

  const renderPost = ({ item }: { item: MockPost }) => (
    <PostCard post={item} />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🦁</Text>
      <Text style={styles.emptyTitle}>Your feed awaits</Text>
      <Text style={styles.emptySubtitle}>
        Follow others to see their posts here
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.gold} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.gold}
            colors={[Colors.gold]}
            progressBackgroundColor={Colors.dark800}
          />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    paddingBottom: 100,
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  titleText: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.gold,
    letterSpacing: 4,
  },
  titleAccent: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.gold,
    marginLeft: 8,
    opacity: 0.6,
  },
  tabRow: {
    flexDirection: "row",
    gap: 8,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: Colors.dark800,
    borderWidth: 1,
    borderColor: Colors.dark700,
  },
  tabActive: {
    backgroundColor: Colors.goldMuted,
    borderColor: Colors.goldBorder,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.gray,
  },
  tabTextActive: {
    color: Colors.gold,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.dark800,
    marginHorizontal: 20,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.white,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: Colors.gray,
    textAlign: "center",
    lineHeight: 22,
  },
});
