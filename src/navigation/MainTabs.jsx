import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import CustomTabBarIcon from '../../components/CustomTabBarIcon';

import SurvayFormApp from '../screens/SurvayFormApp';
import SyncScreen from './SyncScreen';
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
        component={SurvayFormApp}
        options={{
          tabBarIcon: ({ focused }) => (
            <CustomTabBarIcon route={{ name: 'Home' }} focused={focused} />
          ),
        }}
      />

      <Tab.Screen
        name="Report"
        component={SyncScreen}
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
