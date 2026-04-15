import { useState, useCallback, useEffect } from "react";
import {
  View, Text, FlatList, Pressable, TextInput,
  RefreshControl, ActivityIndicator, StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Colors from "../../src/constants/colors";
import Avatar from "../../src/components/Avatar";
import { supabase } from "../../src/lib/supabase";
import { getRelativeTime } from "../../src/constants/mock-data";

interface Conversation {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

interface UserResult {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

async function fetchConversations(currentUserId: string): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from("Message")
    .select(`
      id, content, createdAt, read, senderId, recipientId,
      sender:User!senderId (id, username, displayName, avatarUrl),
      recipient:User!recipientId (id, username, displayName, avatarUrl)
    `)
    .or(`senderId.eq.${currentUserId},recipientId.eq.${currentUserId}`)
    .order("createdAt", { ascending: false });

  if (error || !data) return [];

  const convMap = new Map<string, Conversation>();
  for (const msg of data as any[]) {
    const other = msg.senderId === currentUserId ? msg.recipient : msg.sender;
    if (!other || convMap.has(other.id)) continue;
    const unreadCount = (data as any[]).filter(
      (m) => m.senderId === other.id && m.recipientId === currentUserId && !m.read
    ).length;
    convMap.set(other.id, {
      userId: other.id,
      username: other.username,
      displayName: other.displayName || other.username,
      avatarUrl: other.avatarUrl ?? null,
      lastMessage: msg.content || "Sent a message",
      lastMessageAt: msg.createdAt,
      unreadCount,
    });
  }
  return Array.from(convMap.values());
}

async function searchUsers(query: string, currentUserId: string): Promise<UserResult[]> {
  if (!query.trim()) return [];
  const { data, error } = await supabase
    .from("User")
    .select("id, username, displayName, avatarUrl")
    .ilike("username", `%${query.trim()}%`)
    .neq("id", currentUserId)
    .limit(10);
  if (error || !data) return [];
  return (data as any[]).map((u) => ({
    id: u.id,
    username: u.username,
    displayName: u.displayName || u.username,
    avatarUrl: u.avatarUrl ?? null,
  }));
}

export default function MessagesScreen() {
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadCurrentUser = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;
    const { data } = await supabase
      .from("User").select("id").eq("supabaseId", session.user.id).single();
    return (data as any)?.id ?? null;
  }, []);

  const load = useCallback(async (userId: string) => {
    const result = await fetchConversations(userId);
    setConversations(result);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCurrentUser().then((id) => {
      if (!id) { setLoading(false); return; }
      setCurrentUserId(id);
      load(id);
    });
  }, []);

  useEffect(() => {
    if (!searchQuery.trim() || !currentUserId) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      const results = await searchUsers(searchQuery, currentUserId);
      setSearchResults(results);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, currentUserId]);

  const onRefresh = useCallback(async () => {
    if (!currentUserId) return;
    setRefreshing(true);
    await load(currentUserId);
    setRefreshing(false);
  }, [currentUserId, load]);

  const openThread = (userId: string) => {
    router.push(`/messages/${userId}`);
  };

  const renderConversation = ({ item }: { item: Conversation }) => (
    <Pressable style={styles.convRow} onPress={() => openThread(item.userId)}>
      <View style={styles.avatarWrapper}>
        <Avatar uri={item.avatarUrl} name={item.displayName} size={52} />
        {item.unreadCount > 0 && <View style={styles.unreadDot} />}
      </View>
      <View style={styles.convContent}>
        <View style={styles.convHeader}>
          <Text style={styles.convName}>{item.displayName}</Text>
          <Text style={styles.convTime}>{getRelativeTime(item.lastMessageAt)}</Text>
        </View>
        <View style={styles.convBottom}>
          <Text
            style={[styles.convLastMsg, item.unreadCount > 0 && styles.convLastMsgUnread]}
            numberOfLines={1}
          >
            {item.lastMessage}
          </Text>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );

  const renderSearchResult = ({ item }: { item: UserResult }) => (
    <Pressable style={styles.searchResultRow} onPress={() => openThread(item.id)}>
      <Avatar uri={item.avatarUrl} name={item.displayName || item.username} size={44} />
      <View style={styles.searchResultText}>
        <Text style={styles.searchResultName}>{item.displayName || item.username}</Text>
        <Text style={styles.searchResultUsername}>@{item.username}</Text>
      </View>
      <Text style={styles.searchResultAction}>Message</Text>
    </Pressable>
  );

  const showSearch = searchQuery.trim().length > 0;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search people..."
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

      {showSearch ? (
        <FlatList
          data={searchResults}
          renderItem={renderSearchResult}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No users found</Text>
            </View>
          }
        />
      ) : loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.gold} />
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.userId}
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
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={styles.emptyTitle}>No messages yet</Text>
              <Text style={styles.emptySubtitle}>Search for someone above to start a conversation</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.black },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  headerTitle: { fontSize: 28, fontWeight: "800", color: Colors.white, letterSpacing: 0.5 },
  searchContainer: { paddingHorizontal: 20, paddingVertical: 12 },
  searchBar: {
    flexDirection: "row", alignItems: "center", backgroundColor: Colors.dark800,
    borderRadius: 14, paddingHorizontal: 16, height: 48,
    borderWidth: 1, borderColor: Colors.dark700,
  },
  searchIcon: { fontSize: 16, marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15, color: Colors.white },
  clearButton: { fontSize: 14, color: Colors.gray, padding: 4 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: { paddingBottom: 100 },
  convRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 0.5, borderBottomColor: Colors.dark800,
  },
  avatarWrapper: { position: "relative", marginRight: 14 },
  unreadDot: {
    position: "absolute", top: 0, right: 0,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: Colors.gold, borderWidth: 2, borderColor: Colors.black,
  },
  convContent: { flex: 1 },
  convHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  convName: { fontSize: 15, fontWeight: "700", color: Colors.white },
  convTime: { fontSize: 12, color: Colors.grayDark },
  convBottom: { flexDirection: "row", alignItems: "center" },
  convLastMsg: { flex: 1, fontSize: 14, color: Colors.gray },
  convLastMsgUnread: { color: Colors.grayLight, fontWeight: "600" },
  unreadBadge: {
    backgroundColor: Colors.gold, borderRadius: 10,
    paddingHorizontal: 7, paddingVertical: 2, marginLeft: 8,
  },
  unreadBadgeText: { fontSize: 11, fontWeight: "700", color: Colors.black },
  searchResultRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 20, paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: Colors.dark800,
  },
  searchResultText: { flex: 1, marginLeft: 12 },
  searchResultName: { fontSize: 15, fontWeight: "700", color: Colors.white },
  searchResultUsername: { fontSize: 13, color: Colors.grayDark, marginTop: 2 },
  searchResultAction: { fontSize: 13, fontWeight: "600", color: Colors.gold },
  emptyContainer: { alignItems: "center", paddingTop: 80, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: Colors.white, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: Colors.gray, textAlign: "center", lineHeight: 21 },
  emptyText: { fontSize: 15, color: Colors.gray },
});
