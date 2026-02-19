import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  Dimensions,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Colors from "../../src/constants/colors";
import {
  MOCK_USERS,
  MOCK_POSTS,
  formatCount,
  type MockPost,
} from "../../src/constants/mock-data";
import Avatar from "../../src/components/Avatar";
import PostTypeBadge from "../../src/components/PostTypeBadge";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_GAP = 2;
const GRID_ITEM_SIZE = (SCREEN_WIDTH - GRID_GAP * 2) / 3;

// Use first user as "current user"
const currentUser = MOCK_USERS[0];
const userPosts = MOCK_POSTS.filter((p) => p.userId === currentUser.id);

type ProfileTab = "posts" | "saved";

export default function ProfileScreen() {
  const [activeTab, setActiveTab] = useState<ProfileTab>("posts");

  const displayPosts = activeTab === "posts" ? userPosts : [];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Bar */}
        <View style={styles.headerBar}>
          <Text style={styles.username}>@{currentUser.username}</Text>
          <Pressable style={styles.settingsButton}>
            <Text style={styles.settingsIcon}>⚙️</Text>
          </Pressable>
        </View>

        {/* Profile Header */}
        <View style={styles.profileHeader}>
          {/* Avatar */}
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarRing}>
              <Avatar
                uri={currentUser.avatarUrl}
                name={currentUser.displayName}
                size={96}
              />
            </View>
            {currentUser.isVerified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedIcon}>✓</Text>
              </View>
            )}
          </View>

          {/* Name & Bio */}
          <Text style={styles.displayName}>{currentUser.displayName}</Text>
          <Text style={styles.bio}>{currentUser.bio}</Text>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {formatCount(currentUser.postsCount)}
              </Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {formatCount(currentUser.followersCount)}
              </Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {formatCount(currentUser.followingCount)}
              </Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <Pressable style={styles.editButton}>
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </Pressable>
            <Pressable style={styles.shareButton}>
              <Text style={styles.shareButtonText}>Share</Text>
            </Pressable>
          </View>
        </View>

        {/* Post Tabs */}
        <View style={styles.tabBar}>
          <Pressable
            onPress={() => setActiveTab("posts")}
            style={[styles.tab, activeTab === "posts" && styles.tabActive]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "posts" && styles.tabTextActive,
              ]}
            >
              Posts
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab("saved")}
            style={[styles.tab, activeTab === "saved" && styles.tabActive]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "saved" && styles.tabTextActive,
              ]}
            >
              Saved
            </Text>
          </Pressable>
        </View>

        {/* Post Grid */}
        {displayPosts.length > 0 ? (
          <View style={styles.gridContainer}>
            {displayPosts.map((post, index) => (
              <Pressable
                key={post.id}
                style={[
                  styles.gridItem,
                  {
                    marginRight:
                      (index + 1) % 3 === 0 ? 0 : GRID_GAP,
                    marginBottom: GRID_GAP,
                  },
                ]}
              >
                {post.imageUrl ? (
                  <Image
                    source={{ uri: post.imageUrl }}
                    style={styles.gridImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    style={[styles.gridImage, styles.gridPlaceholder]}
                  >
                    <Text
                      style={styles.gridQuoteText}
                      numberOfLines={5}
                    >
                      {post.caption}
                    </Text>
                  </View>
                )}
                {/* Type Badge */}
                <View style={styles.gridBadge}>
                  <PostTypeBadge type={post.type} size="small" />
                </View>
                {/* Stats Overlay */}
                <View style={styles.gridOverlay}>
                  <Text style={styles.gridStatText}>
                    ♥ {formatCount(post.likesCount)}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={styles.emptyGrid}>
            <Text style={styles.emptyIcon}>📌</Text>
            <Text style={styles.emptyTitle}>No saved posts</Text>
            <Text style={styles.emptySubtitle}>
              Save posts to revisit your favorite content
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },

  // Header Bar
  headerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  username: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.white,
    letterSpacing: 0.3,
  },
  settingsButton: {
    padding: 4,
  },
  settingsIcon: {
    fontSize: 22,
  },

  // Profile Header
  profileHeader: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 16,
  },
  avatarRing: {
    padding: 3,
    borderRadius: 54,
    borderWidth: 2,
    borderColor: Colors.gold,
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 0,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.gold,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: Colors.black,
  },
  verifiedIcon: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.black,
  },
  displayName: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.white,
    marginBottom: 6,
  },
  bio: {
    fontSize: 14,
    color: Colors.grayLight,
    textAlign: "center",
    lineHeight: 21,
    paddingHorizontal: 20,
    marginBottom: 20,
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark800,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.dark700,
    width: "100%",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.white,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.gray,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.dark600,
  },

  // Action Buttons
  actionRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  editButton: {
    flex: 1,
    backgroundColor: Colors.gold,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  editButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.black,
    letterSpacing: 0.5,
  },
  shareButton: {
    paddingHorizontal: 24,
    backgroundColor: Colors.dark800,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.dark600,
  },
  shareButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.white,
  },

  // Tab Bar
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.dark700,
    marginTop: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: Colors.gold,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.gray,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  tabTextActive: {
    color: Colors.gold,
  },

  // Grid
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingBottom: 100,
  },
  gridItem: {
    width: GRID_ITEM_SIZE,
    height: GRID_ITEM_SIZE,
    overflow: "hidden",
    position: "relative",
  },
  gridImage: {
    width: "100%",
    height: "100%",
  },
  gridPlaceholder: {
    backgroundColor: Colors.dark800,
    padding: 12,
    justifyContent: "center",
  },
  gridQuoteText: {
    fontSize: 11,
    color: Colors.grayLight,
    lineHeight: 16,
    fontStyle: "italic",
  },
  gridBadge: {
    position: "absolute",
    top: 8,
    left: 8,
  },
  gridOverlay: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  gridStatText: {
    fontSize: 11,
    color: Colors.white,
    fontWeight: "600",
  },

  // Empty
  emptyGrid: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    paddingHorizontal: 40,
    paddingBottom: 100,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.white,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.gray,
    textAlign: "center",
    lineHeight: 21,
  },
});
