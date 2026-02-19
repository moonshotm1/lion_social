import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Image,
  FlatList,
  Dimensions,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Colors, { PostTypeColors } from "../../src/constants/colors";
import {
  MOCK_POSTS,
  CATEGORIES,
  type MockPost,
} from "../../src/constants/mock-data";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_GAP = 2;
const GRID_COLUMNS = 3;
const GRID_ITEM_SIZE = (SCREEN_WIDTH - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;

export default function ExploreScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const trendingPosts = MOCK_POSTS.slice(0, 3);

  const filteredPosts = activeCategory
    ? MOCK_POSTS.filter((p) => p.type === activeCategory)
    : MOCK_POSTS;

  const renderTrendingCard = ({ item }: { item: MockPost }) => (
    <Pressable style={styles.trendingCard}>
      {item.imageUrl ? (
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.trendingImage}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.trendingImage, styles.trendingPlaceholder]}>
          <Text style={styles.trendingQuoteIcon}>"</Text>
        </View>
      )}
      <View style={styles.trendingOverlay}>
        <View
          style={[
            styles.trendingBadge,
            { backgroundColor: PostTypeColors[item.type] },
          ]}
        >
          <Text style={styles.trendingBadgeText}>{item.type}</Text>
        </View>
        <Text style={styles.trendingCaption} numberOfLines={2}>
          {item.caption}
        </Text>
        <View style={styles.trendingStats}>
          <Text style={styles.trendingStatText}>
            {item.likesCount} likes
          </Text>
        </View>
      </View>
    </Pressable>
  );

  const renderGridItem = ({ item, index }: { item: MockPost; index: number }) => (
    <Pressable
      style={[
        styles.gridItem,
        {
          marginRight: (index + 1) % GRID_COLUMNS === 0 ? 0 : GRID_GAP,
          marginBottom: GRID_GAP,
        },
      ]}
    >
      {item.imageUrl ? (
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.gridImage}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.gridImage, styles.gridPlaceholder]}>
          <Text style={styles.gridQuoteText} numberOfLines={4}>
            {item.caption}
          </Text>
        </View>
      )}
      <View style={styles.gridOverlay}>
        <View style={styles.gridStats}>
          <Text style={styles.gridStatText}>{item.likesCount}</Text>
        </View>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Explore</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search posts, people, tags..."
              placeholderTextColor={Colors.grayDark}
              value={searchQuery}
              onChangeText={setSearchQuery}
              selectionColor={Colors.gold}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery("")}>
                <Text style={styles.clearButton}>✕</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Trending Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Trending</Text>
            <Text style={styles.sectionAction}>See All</Text>
          </View>
          <FlatList
            data={trendingPosts}
            renderItem={renderTrendingCard}
            keyExtractor={(item) => `trending-${item.id}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.trendingList}
            snapToInterval={SCREEN_WIDTH * 0.75 + 12}
            decelerationRate="fast"
          />
        </View>

        {/* Category Pills */}
        <View style={styles.section}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryContainer}
          >
            <Pressable
              onPress={() => setActiveCategory(null)}
              style={[
                styles.categoryPill,
                activeCategory === null && styles.categoryPillActive,
              ]}
            >
              <Text
                style={[
                  styles.categoryText,
                  activeCategory === null && styles.categoryTextActive,
                ]}
              >
                All
              </Text>
            </Pressable>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat.id}
                onPress={() =>
                  setActiveCategory(
                    activeCategory === cat.id ? null : cat.id
                  )
                }
                style={[
                  styles.categoryPill,
                  activeCategory === cat.id && styles.categoryPillActive,
                  activeCategory === cat.id && {
                    borderColor: PostTypeColors[cat.id],
                    backgroundColor: `${PostTypeColors[cat.id]}20`,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    activeCategory === cat.id && {
                      color: PostTypeColors[cat.id],
                    },
                  ]}
                >
                  {cat.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Posts Grid */}
        <View style={styles.gridContainer}>
          {filteredPosts.map((post, index) => (
            <View key={post.id}>
              {renderGridItem({ item: post, index })}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.white,
    letterSpacing: 0.5,
  },

  // Search
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark800,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.dark700,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.white,
    height: 48,
  },
  clearButton: {
    fontSize: 14,
    color: Colors.gray,
    padding: 4,
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.white,
  },
  sectionAction: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.gold,
  },

  // Trending Cards
  trendingList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  trendingCard: {
    width: SCREEN_WIDTH * 0.75,
    height: 200,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: Colors.dark800,
  },
  trendingImage: {
    width: "100%",
    height: "100%",
  },
  trendingPlaceholder: {
    backgroundColor: Colors.dark700,
    alignItems: "center",
    justifyContent: "center",
  },
  trendingQuoteIcon: {
    fontSize: 80,
    color: Colors.goldMuted,
    fontWeight: "700",
  },
  trendingOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
  },
  trendingBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 6,
  },
  trendingBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  trendingCaption: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.white,
    lineHeight: 20,
  },
  trendingStats: {
    marginTop: 6,
  },
  trendingStatText: {
    fontSize: 12,
    color: Colors.grayLight,
  },

  // Category Pills
  categoryContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: Colors.dark800,
    borderWidth: 1,
    borderColor: Colors.dark700,
  },
  categoryPillActive: {
    borderColor: Colors.gold,
    backgroundColor: Colors.goldMuted,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.gray,
  },
  categoryTextActive: {
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
    fontSize: 12,
    color: Colors.grayLight,
    lineHeight: 18,
    fontStyle: "italic",
  },
  gridOverlay: {
    position: "absolute",
    bottom: 8,
    right: 8,
  },
  gridStats: {
    flexDirection: "row",
    alignItems: "center",
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
});
