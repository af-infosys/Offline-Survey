import React, { useContext, useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import AddArea from '../screens/AddArea';
import { AuthContext } from './AppNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SettingsStack = () => {
  const { signOut } = useContext(AuthContext);

  const [user, setUser] = useState({});

  useEffect(() => {
    async function fetchUser() {
      setUser(JSON.parse(await AsyncStorage.getItem('user')));

      console.log('user', user);
    }

    fetchUser();
  }, []);

  return (
    <ScrollView>
      <View style={{ flex: 1, padding: 15, paddingTop: 40 }}>
        <Text style={{ fontSize: 17, fontWeight: 'bold' }}>
          My Account: {user?.name || '...'}{' '}
        </Text>

        <TouchableOpacity
          style={{
            backgroundColor: 'red',
            padding: 10,
            margin: 10,
            borderRadius: 5,
            alignItems: 'center',
            justifyContent: 'center',
            width: 100,
            alignSelf: 'center',
            marginBottom: 30,
          }}
          onPress={signOut}
        >
          <Text style={{ color: 'white' }}>Logout</Text>
        </TouchableOpacity>

        <AddArea />
      </View>
    </ScrollView>
  );
};

export default SettingsStack;
