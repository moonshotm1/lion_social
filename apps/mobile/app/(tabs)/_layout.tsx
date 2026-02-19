import { Tabs } from "expo-router";
import { View, Text, StyleSheet, Platform } from "react-native";
import Colors from "../../src/constants/colors";

/**
 * Custom tab bar icon with label
 */
function TabIcon({
  icon,
  label,
  focused,
  isCreate,
}: {
  icon: string;
  label: string;
  focused: boolean;
  isCreate?: boolean;
}) {
  if (isCreate) {
    return (
      <View style={styles.createButtonOuter}>
        <View
          style={[
            styles.createButton,
            focused && styles.createButtonActive,
          ]}
        >
          <Text style={styles.createButtonIcon}>+</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.tabIconContainer}>
      <Text
        style={[
          styles.tabIcon,
          { color: focused ? Colors.gold : Colors.grayDark },
        ]}
      >
        {icon}
      </Text>
      <Text
        style={[
          styles.tabLabel,
          { color: focused ? Colors.gold : Colors.grayDark },
          focused && styles.tabLabelActive,
        ]}
      >
        {label}
      </Text>
      {focused && <View style={styles.activeIndicator} />}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.gold,
        tabBarInactiveTintColor: Colors.grayDark,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="🏠" label="Home" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="🔍" label="Explore" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: "Create",
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="+" label="Create" focused={focused} isCreate />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Alerts",
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="🔔" label="Alerts" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="👤" label="Profile" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.dark900,
    borderTopColor: Colors.dark700,
    borderTopWidth: 0.5,
    height: Platform.OS === "ios" ? 88 : 68,
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 28 : 8,
    elevation: 0,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  tabIconContainer: {
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    minWidth: 48,
  },
  tabIcon: {
    fontSize: 20,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  tabLabelActive: {
    fontWeight: "700",
  },
  activeIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.gold,
    marginTop: 2,
  },
  createButtonOuter: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: -12,
  },
  createButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.gold,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  createButtonActive: {
    backgroundColor: Colors.goldLight,
    transform: [{ scale: 1.05 }],
  },
  createButtonIcon: {
    fontSize: 28,
    fontWeight: "300",
    color: Colors.black,
    marginTop: -2,
  },
});
