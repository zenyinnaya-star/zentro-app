import { View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';

const ACTIVE = '#FF383C';
const INACTIVE = '#25131A';

function TabIcon({
  focused,
  children,
}: {
  focused: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.iconWrap}>
      {focused && <View style={styles.activeBar} />}
      {children}
    </View>
  );
}

// Bottom tab navigator — Home / Tickets / Favorites / Map / Profile
// Search and Map top-level entry points live off the Home search bar,
// so they're kept as routes but hidden from the tab bar (href: null).
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused}>
              <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="tickets"
        options={{
          title: 'Tickets',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused}>
              <Ionicons name={focused ? 'ticket' : 'ticket-outline'} size={24} color={color} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Favorites',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused}>
              <Ionicons name={focused ? 'heart' : 'heart-outline'} size={24} color={color} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused}>
              <Feather name="hexagon" size={22} color={color} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused}>
              <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen name="search" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopColor: '#F0EEF1',
    borderTopWidth: 1,
    height: 84,
    paddingTop: 10,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
  },
  activeBar: {
    position: 'absolute',
    top: -20,
    width: 28,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#FF383C',
  },
});
