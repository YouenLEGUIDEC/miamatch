import React from 'react';
import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { theme as t } from '../../src/ui/theme';
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.colors.coralDark,
        tabBarInactiveTintColor: t.colors.muted,
        tabBarStyle: { backgroundColor: t.colors.cream, borderTopColor: t.colors.line },
        tabBarLabelStyle: { fontFamily: t.font.bold, fontSize: 11 },
      }}
    >
      {[
        ['index', 'Envies', '✳'],
        ['plan', 'Semaine', '▦'],
        ['shopping', 'Courses', '✓'],
        ['profile', 'Nous', '◉'],
      ].map(([name, title, icon]) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 23 }}>{icon}</Text>,
          }}
        />
      ))}
    </Tabs>
  );
}
