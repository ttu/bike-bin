import { StyleSheet, Pressable } from 'react-native';
import { Tabs } from 'expo-router';
import { Text, Badge, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUnreadCount } from '@/features/messaging';
import type { AppTheme } from '@/shared/theme';
import { navigateToTabRoot } from '@/shared/utils/navigateToTabRoot';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

function GlassTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const theme = useTheme<AppTheme>();
  const insets = useSafeAreaInsets();
  const isDark = theme.dark;

  return (
    <BlurView
      accessibilityRole="tablist"
      intensity={20}
      tint={isDark ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'}
      style={[
        tabBarStyles.container,
        {
          paddingBottom: insets.bottom,
          backgroundColor: theme.colors.surface + 'CC',
          shadowColor: theme.colors.onSurface,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const color = isFocused ? theme.colors.primary : theme.colors.onSurfaceVariant;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (event.defaultPrevented) {
            return;
          }
          if (!isFocused) {
            navigation.navigate(route.name, route.params);
            return;
          }
          navigateToTabRoot(navigation, route.name);
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            accessibilityRole="tab"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            style={tabBarStyles.tab}
          >
            {options.tabBarIcon?.({ focused: isFocused, color, size: 24 })}
            <Text variant="labelSmall" style={[tabBarStyles.label, { color }]}>
              {typeof options.title === 'string' ? options.title : route.name}
            </Text>
            {options.tabBarBadge !== undefined && (
              <Badge style={[tabBarStyles.badge, options.tabBarBadgeStyle]}>
                {options.tabBarBadge}
              </Badge>
            )}
          </Pressable>
        );
      })}
    </BlurView>
  );
}

const tabBarStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 0,
    borderTopWidth: 0,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    paddingBottom: 4,
    gap: 2,
  },
  label: {
    fontSize: 10,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: '25%',
  },
});

export default function TabLayout() {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation();
  const { data: unreadCount } = useUnreadCount();

  return (
    <Tabs
      tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
      }}
    >
      <Tabs.Screen
        name="inventory"
        options={{
          title: t('tabs.inventory'),
          tabBarAccessibilityLabel: t('tabs.inventory'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="bikes"
        options={{
          title: t('tabs.bikes'),
          tabBarAccessibilityLabel: t('tabs.bikes'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="bicycle" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: t('tabs.search'),
          tabBarAccessibilityLabel: t('tabs.search'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="magnify" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: t('tabs.groups'),
          tabBarAccessibilityLabel: t('tabs.groups'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-group" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: t('tabs.messages'),
          tabBarAccessibilityLabel: t('tabs.messages'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="chat" size={size} color={color} />
          ),
          tabBarBadge: unreadCount && unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: theme.colors.primary,
            color: theme.colors.onPrimary,
            fontSize: 10,
          },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarAccessibilityLabel: t('tabs.profile'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
