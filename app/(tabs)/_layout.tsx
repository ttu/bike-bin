import { StyleSheet, Pressable, View } from 'react-native';
import { Tabs } from 'expo-router';
import { Text, Badge, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUnreadCount } from '@/features/messaging';
import { spacing } from '@/shared/theme';
import type { AppTheme } from '@/shared/theme';
import { navigateToTabRoot } from '@/shared/utils/navigateToTabRoot';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

function AppTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const theme = useTheme<AppTheme>();
  const insets = useSafeAreaInsets();

  return (
    <View
      accessibilityRole="tablist"
      style={[
        tabBarStyles.container,
        {
          paddingBottom: insets.bottom,
          backgroundColor: theme.customColors.surfaceContainer,
          borderTopColor: theme.colors.outlineVariant,
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
            <Text variant="labelSmall" style={{ color }}>
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
    </View>
  );
}

const tabBarStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 0,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    gap: 2,
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
      tabBar={(props) => <AppTabBar {...props} />}
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
