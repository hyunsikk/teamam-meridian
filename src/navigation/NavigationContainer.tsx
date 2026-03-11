import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography, type ThemeColors, themedTypography } from '../styles/theme';
import { useTheme } from '../context/ThemeContext';
import { NetworkScreen } from '../screens/NetworkScreen';
import { InsightsScreen } from '../screens/InsightsScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { SignalsScreen } from '../screens/SignalsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { useData } from '../context/DataContext';
import { OnboardingScreen } from '../screens/OnboardingScreen';

type Tab = 'network' | 'insights' | 'history' | 'signals' | 'settings';

const tabs: { key: Tab; label: string; icon: string; activeIcon: string }[] = [
  { key: 'network', label: 'network', icon: 'git-network-outline', activeIcon: 'git-network' },
  { key: 'insights', label: 'insights', icon: 'bulb-outline', activeIcon: 'bulb' },
  { key: 'history', label: 'history', icon: 'calendar-outline', activeIcon: 'calendar' },
  { key: 'signals', label: 'signals', icon: 'options-outline', activeIcon: 'options' },
  { key: 'settings', label: 'settings', icon: 'settings-outline', activeIcon: 'settings' },
];

export function NavigationContainer() {
  const [activeTab, setActiveTab] = useState<Tab>('network');
  const { settings } = useData();
  const { colors, isDark } = useTheme();

  // Show onboarding if not complete
  if (!settings.onboardingComplete) {
    return <OnboardingScreen />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.deepSpace }]}>
      <View style={styles.content}>
        {activeTab === 'network' && <NetworkScreen />}
        {activeTab === 'insights' && <InsightsScreen />}
        {activeTab === 'history' && <HistoryScreen />}
        {activeTab === 'signals' && <SignalsScreen />}
        {activeTab === 'settings' && <SettingsScreen />}
      </View>
      <View style={[
        styles.tabBar,
        {
          backgroundColor: isDark ? colors.surface2 + 'E6' : colors.surface2 + 'F5',
          borderTopColor: colors.divider,
        },
        Platform.OS === 'ios' ? {
          shadowColor: isDark ? '#000' : '#8888AA',
          shadowOpacity: isDark ? 0.15 : 0.08,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: -4 },
        } : { elevation: 8 },
      ]}>
        {tabs.map(tab => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key} style={styles.tab}
              onPress={() => setActiveTab(tab.key)}
              accessibilityLabel={tab.label} accessibilityRole="tab"
            >
              <Ionicons name={active ? tab.activeIcon as any : tab.icon as any} size={22}
                color={active ? colors.nebulaPurple : colors.starlightFaint} />
              <Text style={[
                styles.tabLabel,
                { color: active ? colors.nebulaPurple : colors.starlightFaint },
              ]}>
                {tab.label}
              </Text>
              {active && (
                <View style={[styles.activeIndicator, { backgroundColor: colors.nebulaPurple }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    paddingBottom: 28, paddingTop: 10,
    borderTopWidth: 1,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 44 },
  tabLabel: { ...Typography.small, marginTop: 3, fontSize: 10 },
  activeIndicator: {
    position: 'absolute', bottom: -2,
    width: 5, height: 5, borderRadius: 2.5,
  },
});
