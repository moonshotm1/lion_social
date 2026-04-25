import { useState, useEffect } from "react";
import {
  View, Text, TextInput, Pressable, FlatList,
  ActivityIndicator, Alert, StyleSheet, KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Colors from "../src/constants/colors";
import Avatar from "../src/components/Avatar";
import { supabase } from "../src/lib/supabase";

interface UserResult {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

export default function CreateGroupScreen() {
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [groupName, setGroupName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<UserResult[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      const { data } = await supabase
        .from("User").select("id").eq("supabaseId", session.user.id).single();
      if (data) setCurrentUserId((data as any).id);
    });
  }, []);

  useEffect(() => {
    if (!searchQuery.trim() || !currentUserId) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("User")
        .select("id, username, displayName, avatarUrl")
        .ilike("username", `%${searchQuery.trim()}%`)
        .neq("id", currentUserId)
        .limit(10);
      if (data) {
        setSearchResults((data as any[]).map((u) => ({
          id: u.id,
          username: u.username,
          displayName: u.displayName || u.username,
          avatarUrl: u.avatarUrl ?? null,
        })));
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, currentUserId]);

  const toggleUser = (user: UserResult) => {
    setSelectedUsers((prev) => {
      const exists = prev.find((u) => u.id === user.id);
      return exists ? prev.filter((u) => u.id !== user.id) : [...prev, user];
    });
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      Alert.alert("Name required", "Please enter a group name.");
      return;
    }
    if (!currentUserId) return;
    setCreating(true);

    try {
      // Create the group
      const { data: gc, error: gcError } = await supabase
        .from("GroupChat")
        .insert({ name: groupName.trim(), createdBy: currentUserId })
        .select("id")
        .single();

      if (gcError || !gc) {
        Alert.alert("Error", "Could not create group. Please try again.");
        return;
      }

      const groupId = (gc as any).id;

      // Add all members (self as admin + selected users as members)
      const members = [
        { groupId, userId: currentUserId, role: "admin" },
        ...selectedUsers.map((u) => ({ groupId, userId: u.id, role: "member" })),
      ];

      const { error: membersError } = await supabase
        .from("GroupMember")
        .insert(members);

      if (membersError) {
        Alert.alert("Error", "Group created but could not add all members.");
      }

      router.replace(`/group/${groupId}`);
    } finally {
      setCreating(false);
    }
  };

  const isSelected = (id: string) => selectedUsers.some((u) => u.id === id);

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.headerBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Text style={styles.headerTitle}>New Group</Text>
          <Pressable
            onPress={handleCreate}
            style={[styles.headerBtn, styles.createBtn, creating && styles.createBtnDisabled]}
            disabled={creating}
          >
            {creating
              ? <ActivityIndicator size="small" color={Colors.black} />
              : <Text style={styles.createText}>Create</Text>
            }
          </Pressable>
        </View>

        {/* Group Name */}
        <View style={styles.nameSection}>
          <Text style={styles.label}>GROUP NAME</Text>
          <TextInput
            style={styles.nameInput}
            value={groupName}
            onChangeText={setGroupName}
            placeholder="e.g. Morning Crew"
            placeholderTextColor={Colors.grayDark}
            maxLength={50}
            selectionColor={Colors.gold}
          />
        </View>

        {/* Selected Members */}
        {selectedUsers.length > 0 && (
          <View style={styles.selectedSection}>
            <Text style={styles.label}>MEMBERS ({selectedUsers.length})</Text>
            <FlatList
              data={selectedUsers}
              horizontal
              keyExtractor={(u) => u.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.selectedList}
              renderItem={({ item }) => (
                <Pressable style={styles.selectedChip} onPress={() => toggleUser(item)}>
                  <Avatar uri={item.avatarUrl} name={item.displayName} size={36} />
                  <Text style={styles.selectedName} numberOfLines={1}>{item.username}</Text>
                  <Text style={styles.removeChip}>✕</Text>
                </Pressable>
              )}
            />
          </View>
        )}

        {/* Search */}
        <View style={styles.searchSection}>
          <Text style={styles.label}>ADD PEOPLE</Text>
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by username..."
              placeholderTextColor={Colors.grayDark}
              value={searchQuery}
              onChangeText={setSearchQuery}
              selectionColor={Colors.gold}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery("")}>
                <Text style={styles.clearBtn}>✕</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Search Results */}
        <FlatList
          data={searchResults}
          keyExtractor={(u) => u.id}
          contentContainerStyle={styles.resultsList}
          renderItem={({ item }) => {
            const selected = isSelected(item.id);
            return (
              <Pressable style={styles.resultRow} onPress={() => toggleUser(item)}>
                <Avatar uri={item.avatarUrl} name={item.displayName} size={44} />
                <View style={styles.resultText}>
                  <Text style={styles.resultName}>{item.displayName}</Text>
                  <Text style={styles.resultUsername}>@{item.username}</Text>
                </View>
                <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                  {selected && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            searchQuery.trim().length > 0
              ? <Text style={styles.emptyText}>No users found</Text>
              : null
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.black },
  flex: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: Colors.dark800,
  },
  headerBtn: { minWidth: 60 },
  headerTitle: { fontSize: 17, fontWeight: "700", color: Colors.white },
  cancelText: { fontSize: 16, color: Colors.gray },
  createBtn: {
    backgroundColor: Colors.gold, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 6, alignItems: "center",
  },
  createBtnDisabled: { opacity: 0.7 },
  createText: { fontSize: 15, fontWeight: "700", color: Colors.black },
  nameSection: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  label: { fontSize: 11, fontWeight: "700", color: Colors.gold, letterSpacing: 1.5, marginBottom: 10 },
  nameInput: {
    backgroundColor: Colors.dark800, borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16, color: Colors.white,
    borderWidth: 1, borderColor: Colors.dark700,
  },
  selectedSection: { paddingHorizontal: 20, paddingBottom: 12 },
  selectedList: { gap: 10, paddingVertical: 4 },
  selectedChip: { alignItems: "center", gap: 4, width: 60 },
  selectedName: { fontSize: 10, color: Colors.grayLight, textAlign: "center" },
  removeChip: { fontSize: 10, color: Colors.gold },
  searchSection: { paddingHorizontal: 20, paddingBottom: 8 },
  searchBar: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.dark800, borderRadius: 14,
    paddingHorizontal: 16, height: 48,
    borderWidth: 1, borderColor: Colors.dark700,
  },
  searchIcon: { fontSize: 16, marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15, color: Colors.white },
  clearBtn: { fontSize: 14, color: Colors.gray, padding: 4 },
  resultsList: { paddingBottom: 40 },
  resultRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 20, paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: Colors.dark800,
  },
  resultText: { flex: 1, marginLeft: 12 },
  resultName: { fontSize: 15, fontWeight: "700", color: Colors.white },
  resultUsername: { fontSize: 13, color: Colors.grayDark, marginTop: 2 },
  checkbox: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, borderColor: Colors.dark600,
    alignItems: "center", justifyContent: "center",
  },
  checkboxSelected: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  checkmark: { fontSize: 13, fontWeight: "700", color: Colors.black },
  emptyText: { fontSize: 15, color: Colors.gray, textAlign: "center", paddingTop: 20 },
});
