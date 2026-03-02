import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../styles/theme';
import { NetworkScreen } from '../screens/NetworkScreen';
import { InsightsScreen } from '../screens/InsightsScreen';
import { HistoryScreen } from '../screens/HistoryScreen';

type Tab = 'network' | 'insights' | 'history';

const tabs: { key: Tab; label: string; icon: string; activeIcon: string }[] = [
  { key: 'network', label: 'network', icon: 'git-network-outline', activeIcon: 'git-network' },
  { key: 'insights', label: 'insights', icon: 'bulb-outline', activeIcon: 'bulb' },
  { key: 'history', label: 'history', icon: 'calendar-outline', activeIcon: 'calendar' },
];

export function NavigationContainer() {
  const [activeTab, setActiveTab] = useState<Tab>('network');

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {activeTab === 'network' && <NetworkScreen />}
        {activeTab === 'insights' && <InsightsScreen />}
        {activeTab === 'history' && <HistoryScreen />}
      </View>
      <View style={styles.tabBar}>
        {tabs.map(tab => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tab}
              onPress={() => setActiveTab(tab.key)}
              accessibilityLabel={tab.label}
              accessibilityRole="tab"
            >
              <Ionicons
                name={active ? tab.activeIcon as any : tab.icon as any}
                size={24}
                color={active ? Colors.nebulaPurple : Colors.starlightFaint}
              />
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.deepSpace,
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface2,
    paddingBottom: 28,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  tabLabel: {
    ...Typography.small,
    color: Colors.starlightFaint,
    marginTop: 4,
  },
  tabLabelActive: {
    color: Colors.nebulaPurple,
  },
});
