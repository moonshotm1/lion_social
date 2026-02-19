import { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Colors from "../../src/constants/colors";
import {
  MOCK_NOTIFICATIONS,
  type MockNotification,
  getRelativeTime,
} from "../../src/constants/mock-data";
import Avatar from "../../src/components/Avatar";

const NOTIFICATION_ICONS: Record<string, string> = {
  follow: "👤",
  like: "❤️",
  comment: "💬",
};

export default function NotificationsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] =
    useState<MockNotification[]>(MOCK_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setNotifications([...MOCK_NOTIFICATIONS]);
      setRefreshing(false);
    }, 1200);
  }, []);

  const markAllRead = () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, isRead: true }))
    );
  };

  const renderNotification = ({ item }: { item: MockNotification }) => (
    <Pressable
      style={[
        styles.notificationRow,
        !item.isRead && styles.notificationUnread,
      ]}
    >
      {/* Unread Indicator */}
      {!item.isRead && <View style={styles.unreadDot} />}

      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <Avatar
          uri={item.user.avatarUrl}
          name={item.user.displayName}
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
          <Text style={styles.notifUsername}>{item.user.username}</Text>
          {" "}
          {item.message}
        </Text>
        <Text style={styles.notifTime}>
          {getRelativeTime(item.createdAt)}
        </Text>
      </View>

      {/* Action (optional) */}
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

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🔔</Text>
      <Text style={styles.emptyTitle}>No notifications yet</Text>
      <Text style={styles.emptySubtitle}>
        When someone interacts with your posts, you'll see it here
      </Text>
    </View>
  );

  const renderSectionHeader = (title: string) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );

  // Split into new and earlier
  const newNotifications = notifications.filter((n) => !n.isRead);
  const earlierNotifications = notifications.filter((n) => n.isRead);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <FlatList
        data={[
          ...(newNotifications.length > 0
            ? [{ id: "header-new", type: "section" as const, title: "New" }]
            : []),
          ...newNotifications.map((n) => ({
            ...n,
            type: "notification" as const,
          })),
          ...(earlierNotifications.length > 0
            ? [
                {
                  id: "header-earlier",
                  type: "section" as const,
                  title: "Earlier",
                },
              ]
            : []),
          ...earlierNotifications.map((n) => ({
            ...n,
            type: "notification" as const,
          })),
        ]}
        renderItem={({ item }) => {
          if (item.type === "section") {
            return renderSectionHeader(
              (item as { title: string }).title
            );
          }
          return renderNotification({
            item: item as MockNotification,
          });
        }}
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

  // Header
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

  // Section Headers
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

  // Notification Row
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

  // Follow Back Button
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

  // Empty
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
