import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import TabIconSVG from './TabIconSVG.jsx';

const CustomTabBarIcon = ({ route, focused }) => {
  const tabName = route.name;

  const activeColor = '#0e1a13';
  const inactiveColor = '#51946b';
  const color = focused ? activeColor : inactiveColor;
  const fontWeight = focused ? '600' : '500';

  return (
    <View style={styles.container}>
      <View style={[styles.iconWrapper, focused && styles.activeIconWrapper]}>
        <TabIconSVG name={tabName} color={color} />
      </View>

      <Text style={[styles.text, { color, fontWeight }]}>{tabName}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 3,
    paddingTop: 4,
  },
  iconWrapper: {
    height: 32,
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 1,
  },
  activeIconWrapper: {
    backgroundColor: '#e8f2ec',
    borderRadius: 999,
  },
  text: {
    fontSize: 10,
    fontWeight: '500',
    lineHeight: 12,
    letterSpacing: 0.15,

    width: 80,
    textAlign: 'center',
    numberOfLines: 1,
  },
});

export default CustomTabBarIcon;
