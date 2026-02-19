import { useState, useCallback } from "react";
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
import { MOCK_POSTS, type MockPost } from "../../src/constants/mock-data";
import PostCard from "../../src/components/PostCard";

type FeedTab = "following" | "explore";

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState<FeedTab>("following");
  const [refreshing, setRefreshing] = useState(false);
  const [posts, setPosts] = useState<MockPost[]>(MOCK_POSTS);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simulate network request
    setTimeout(() => {
      setPosts([...MOCK_POSTS]);
      setRefreshing(false);
    }, 1500);
  }, []);

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* App Title */}
      <View style={styles.titleRow}>
        <Text style={styles.titleText}>GAINS</Text>
        <View style={styles.titleAccent} />
      </View>

      {/* Feed Toggle */}
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
