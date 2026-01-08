import { createContext, useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import AuthStack from './AuthStack';
import MainTabs from './MainTabs';

import SQLite from 'react-native-sqlite-storage';
import { Alert } from 'react-native';

export const AuthContext = createContext();

const db = SQLite.openDatabase(
  { name: 'SurveyOffline.db', location: 'default' },
  () => {},
  err => console.log('DB Error', err),
);

const WORK_ID_KEY = 'WORK_ID';
const NEXT_SERIAL_KEY = 'NEXT_SERIAL';

const AppNavigator = () => {
  const [userToken, setUserToken] = useState(null);

  useEffect(() => {
    const loadToken = async () => {
      const token = await AsyncStorage.getItem('userToken');
      setUserToken(token);
    };

    loadToken();
  }, []);

  const logoutUser = async () => {
    await AsyncStorage.removeItem('userToken');
    db.transaction(tx => {
      tx.executeSql('DELETE FROM surveys');
    });

    await AsyncStorage.multiRemove([
      WORK_ID_KEY,
      NEXT_SERIAL_KEY,
      'cached_areas',
    ]);

    setUserToken(null);
  };

  const authContext = {
    signIn: async token => {
      await AsyncStorage.setItem('userToken', token);
      setUserToken(token);
    },

    signOut: async () => {
      // confirm from user
      Alert.alert(
        'Logout',
        'Are you sure to logout? all Data will be Removed after logout!',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Logout',
            onPress: () => {
              // yahan actual logout logic
              logoutUser();
            },
            style: 'destructive',
          },
        ],
        { cancelable: true },
      );
    },
  };

  return (
    <AuthContext.Provider value={authContext}>
      <NavigationContainer>
        {userToken ? <MainTabs /> : <AuthStack />}
      </NavigationContainer>
    </AuthContext.Provider>
  );
};

export default AppNavigator;
