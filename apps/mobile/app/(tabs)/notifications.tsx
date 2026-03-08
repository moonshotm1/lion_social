import { useCallback } from "react";
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
import { getRelativeTime } from "../../src/constants/mock-data";
import Avatar from "../../src/components/Avatar";
import { useNotifications, type RealNotification } from "../../src/hooks/use-notifications";

const NOTIFICATION_ICONS: Record<string, string> = {
  follow: "👤",
  like: "❤️",
  comment: "💬",
};

export default function NotificationsScreen() {
  const { notifications, unreadCount, loading, markAllRead, markRead } =
    useNotifications();

  const onRefresh = useCallback(() => {
    // Realtime subscription handles live updates; pull-to-refresh is a no-op here
    // until a manual refetch method is exposed from the hook.
  }, []);

  const renderNotification = ({ item }: { item: RealNotification }) => (
    <Pressable
      style={[
        styles.notificationRow,
        !item.isRead && styles.notificationUnread,
      ]}
      onPress={() => markRead(item.id)}
    >
      {/* Unread Indicator */}
      {!item.isRead && <View style={styles.unreadDot} />}

      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <Avatar
          uri={item.actor.avatarUrl}
          name={item.actor.username}
          size={48}
        />
        <View style={styles.notifIconBadge}>
          <Text style={styles.notifIconText}>
            {NOTIFICATION_ICONS[item.type]}
          </Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.notifContent}>
        <Text style={styles.notifMessage}>
          <Text style={styles.notifUsername}>{item.actor.username}</Text>
          {" "}
          {item.message}
        </Text>
        <Text style={styles.notifTime}>
          {getRelativeTime(item.createdAt)}
        </Text>
      </View>

      {/* Follow-back button */}
      {item.type === "follow" && (
        <Pressable style={styles.followBackButton}>
          <Text style={styles.followBackText}>Follow</Text>
        </Pressable>
      )}
    </Pressable>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
          </View>
        )}
      </View>
      {unreadCount > 0 && (
        <Pressable onPress={markAllRead} style={styles.markReadButton}>
          <Text style={styles.markReadText}>Mark all read</Text>
        </Pressable>
      )}
    </View>
  );

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={Colors.gold} />
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🔔</Text>
        <Text style={styles.emptyTitle}>No notifications yet</Text>
        <Text style={styles.emptySubtitle}>
          When someone interacts with your posts, you'll see it here
        </Text>
      </View>
    );
  };

  const newNotifications = notifications.filter((n) => !n.isRead);
  const earlierNotifications = notifications.filter((n) => n.isRead);

  type ListItem =
    | { id: string; type: "section"; title: string }
    | (RealNotification & { type: "notification" });

  const listData: ListItem[] = [
    ...(newNotifications.length > 0
      ? [{ id: "header-new", type: "section" as const, title: "New" }]
      : []),
    ...newNotifications.map((n) => ({ ...n, type: "notification" as const })),
    ...(earlierNotifications.length > 0
      ? [{ id: "header-earlier", type: "section" as const, title: "Earlier" }]
      : []),
    ...earlierNotifications.map((n) => ({ ...n, type: "notification" as const })),
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <FlatList
        data={listData}
        renderItem={({ item }) => {
          if (item.type === "section") {
            return (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderText}>
                  {(item as { title: string }).title}
                </Text>
              </View>
            );
          }
          return renderNotification({ item: item as RealNotification });
        }}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={onRefresh}
            tintColor={Colors.gold}
            colors={[Colors.gold]}
            progressBackgroundColor={Colors.dark800}
          />
        }
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.white,
    letterSpacing: 0.5,
  },
  unreadBadge: {
    backgroundColor: Colors.gold,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  unreadBadgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.black,
  },
  markReadButton: {
    marginTop: 4,
  },
  markReadText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.gold,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.dark900,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.dark700,
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.grayLight,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  notificationRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.dark800,
    position: "relative",
  },
  notificationUnread: {
    backgroundColor: "rgba(212, 168, 67, 0.05)",
  },
  unreadDot: {
    position: "absolute",
    left: 8,
    top: "50%",
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.gold,
    marginTop: -3,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 14,
  },
  notifIconBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.dark900,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.black,
  },
  notifIconText: {
    fontSize: 10,
  },
  notifContent: {
    flex: 1,
    marginRight: 12,
  },
  notifMessage: {
    fontSize: 14,
    color: Colors.grayLight,
    lineHeight: 20,
  },
  notifUsername: {
    fontWeight: "700",
    color: Colors.white,
  },
  notifTime: {
    fontSize: 12,
    color: Colors.grayDark,
    marginTop: 3,
  },
  followBackButton: {
    backgroundColor: Colors.gold,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 10,
  },
  followBackText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.black,
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
