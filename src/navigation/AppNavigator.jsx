import { createContext, useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import AuthStack from './AuthStack';
import MainTabs from './MainTabs';

export const AuthContext = createContext();

const AppNavigator = () => {
  const [userToken, setUserToken] = useState(null);

  useEffect(() => {
    const loadToken = async () => {
      const token = await AsyncStorage.getItem('userToken');
      setUserToken(token);
    };

    loadToken();
  }, []);

  const authContext = {
    signIn: async token => {
      await AsyncStorage.setItem('userToken', token);
      setUserToken(token);
    },

    signOut: async () => {
      await AsyncStorage.removeItem('userToken');
      setUserToken(null);
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
