import { useState, useCallback, useEffect, useRef } from "react";
import {
  View, Text, FlatList, TextInput, Pressable, KeyboardAvoidingView,
  ActivityIndicator, Platform, StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import Colors from "../../src/constants/colors";
import Avatar from "../../src/components/Avatar";
import { supabase } from "../../src/lib/supabase";
import { getRelativeTime } from "../../src/constants/mock-data";

interface GroupMessage {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  senderUsername: string;
  senderAvatarUrl: string | null;
}

interface GroupInfo {
  id: string;
  name: string;
  memberCount: number;
}

export default function GroupThreadScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: me } = await supabase
        .from("User").select("id").eq("supabaseId", session.user.id).single();
      if (!me) return;
      setCurrentUserId((me as any).id);

      const { data: gc } = await supabase
        .from("GroupChat").select("id, name").eq("id", groupId).single();

      const { count } = await supabase
        .from("GroupMember")
        .select("id", { count: "exact", head: true })
        .eq("groupId", groupId);

      if (gc) {
        setGroupInfo({ id: (gc as any).id, name: (gc as any).name, memberCount: count ?? 0 });
      }
    }
    init();
  }, [groupId]);

  const fetchMessages = useCallback(async () => {
    const { data, error } = await supabase
      .from("GroupMessage")
      .select(`id, senderId, content, createdAt, User!senderId (username, avatarUrl)`)
      .eq("groupId", groupId)
      .order("createdAt", { ascending: true });

    if (!error && data) {
      setMessages((data as any[]).map((m) => ({
        id: m.id,
        senderId: m.senderId,
        content: m.content,
        createdAt: m.createdAt,
        senderUsername: m.User?.username ?? "unknown",
        senderAvatarUrl: m.User?.avatarUrl ?? null,
      })));
    }
    setLoading(false);
  }, [groupId]);

  useEffect(() => {
    if (!currentUserId) return;
    fetchMessages();

    const channel = supabase
      .channel(`group-${groupId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "GroupMessage",
        filter: `groupId=eq.${groupId}`,
      }, async (payload) => {
        const msg = payload.new as any;
        const { data: sender } = await supabase
          .from("User").select("username, avatarUrl").eq("id", msg.senderId).single();
        setMessages((prev) => [...prev, {
          id: msg.id,
          senderId: msg.senderId,
          content: msg.content,
          createdAt: msg.createdAt,
          senderUsername: (sender as any)?.username ?? "unknown",
          senderAvatarUrl: (sender as any)?.avatarUrl ?? null,
        }]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUserId, groupId, fetchMessages]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    const content = text.trim();
    if (!content || !currentUserId || sending) return;
    setText("");
    setSending(true);

    const { error } = await supabase
      .from("GroupMessage")
      .insert({ groupId, senderId: currentUserId, content });

    if (error) setText(content);
    setSending(false);
  };

  const renderMessage = ({ item, index }: { item: GroupMessage; index: number }) => {
    const isMe = item.senderId === currentUserId;
    const prevMsg = index > 0 ? messages[index - 1] : null;
    const showTime = !prevMsg ||
      new Date(item.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() > 5 * 60 * 1000;
    const showSender = !isMe && (!prevMsg || prevMsg.senderId !== item.senderId);

    return (
      <View>
        {showTime && <Text style={styles.timeLabel}>{getRelativeTime(item.createdAt)}</Text>}
        <View style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowThem]}>
          {!isMe && (
            <View style={styles.avatarCol}>
              {showSender
                ? <Avatar uri={item.senderAvatarUrl} name={item.senderUsername} size={28} />
                : <View style={{ width: 28 }} />
              }
            </View>
          )}
          <View style={styles.bubbleCol}>
            {showSender && !isMe && (
              <Text style={styles.senderName}>{item.senderUsername}</Text>
            )}
            <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
              <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextThem]}>
                {item.content}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

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
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.headerName}>{groupInfo?.name ?? "Group"}</Text>
          <Text style={styles.headerSub}>{groupInfo?.memberCount ?? 0} members</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>👋</Text>
              <Text style={styles.emptyText}>Start the conversation!</Text>
            </View>
          }
        />

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Message..."
            placeholderTextColor={Colors.grayDark}
            multiline
            maxLength={1000}
            selectionColor={Colors.gold}
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          <Pressable
            style={[styles.sendButton, (!text.trim() || sending) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!text.trim() || sending}
          >
            {sending
              ? <ActivityIndicator size="small" color={Colors.black} />
              : <Text style={styles.sendIcon}>↑</Text>
            }
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.black },
  flex: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: Colors.dark800, gap: 12,
  },
  backButton: { padding: 4 },
  backIcon: { fontSize: 22, color: Colors.gold },
  headerText: { flex: 1 },
  headerName: { fontSize: 16, fontWeight: "700", color: Colors.white },
  headerSub: { fontSize: 12, color: Colors.grayDark },
  messagesList: { paddingHorizontal: 16, paddingVertical: 16, paddingBottom: 8 },
  timeLabel: { textAlign: "center", fontSize: 11, color: Colors.grayDark, marginVertical: 12 },
  msgRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: 4, gap: 8 },
  msgRowMe: { justifyContent: "flex-end" },
  msgRowThem: { justifyContent: "flex-start" },
  avatarCol: { marginBottom: 2 },
  bubbleCol: { maxWidth: "72%" },
  senderName: { fontSize: 11, color: Colors.gold, fontWeight: "600", marginBottom: 3, marginLeft: 4 },
  bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMe: { backgroundColor: Colors.gold, borderBottomRightRadius: 4 },
  bubbleThem: { backgroundColor: Colors.dark800, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 15, lineHeight: 21 },
  bubbleTextMe: { color: Colors.black, fontWeight: "500" },
  bubbleTextThem: { color: Colors.white },
  emptyContainer: { alignItems: "center", paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 15, color: Colors.gray },
  inputRow: {
    flexDirection: "row", alignItems: "flex-end",
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 0.5, borderTopColor: Colors.dark800, gap: 10,
  },
  input: {
    flex: 1, backgroundColor: Colors.dark800, borderRadius: 22,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 15,
    color: Colors.white, maxHeight: 120,
    borderWidth: 1, borderColor: Colors.dark700,
  },
  sendButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.gold, alignItems: "center", justifyContent: "center",
  },
  sendButtonDisabled: { backgroundColor: Colors.dark700 },
  sendIcon: { fontSize: 18, fontWeight: "700", color: Colors.black },
});
