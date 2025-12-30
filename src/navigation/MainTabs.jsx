import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import CustomTabBarIcon from '../../components/CustomTabBarIcon';

import DashboardScreen from '../screens/DashboardScreen';
import ReportStack from './ReportStack';
import SettingsStack from './SettingsStack';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <CustomTabBarIcon route={{ name: 'Home' }} focused={focused} />
          ),
        }}
      />

      <Tab.Screen
        name="Report"
        component={ReportStack}
        options={{
          tabBarIcon: ({ focused }) => (
            <CustomTabBarIcon route={{ name: 'Report' }} focused={focused} />
          ),
        }}
      />

      <Tab.Screen
        name="Settings"
        component={SettingsStack}
        options={{
          tabBarIcon: ({ focused }) => (
            <CustomTabBarIcon route={{ name: 'Settings' }} focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
