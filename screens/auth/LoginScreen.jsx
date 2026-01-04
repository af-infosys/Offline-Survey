import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { AuthContext } from '../../src/navigation/AppNavigator';

import BASE_URL from '../../config';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn } = useContext(AuthContext);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Kripya phone aur password bharein.');
      return;
    }
    console.log(email, password);

    try {
      setLoading(true);

      const response = await axios.post(
        `${BASE_URL}/api/auth/login`,
        {
          email,
          password,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      const token = response.data.token;
      const user = response.data.user;

      await AsyncStorage.setItem('user', JSON.stringify(user));
      signIn(token);

      setLoading(false);
    } catch (e) {
      setLoading(false);
      console.log('Axios Error Object:', e);
      Alert.alert('Error', e.response.data.message);

      if (!e.response) {
        console.log('This is a Network Failure (e.g., Timeout or DNS error).');
        Alert.alert('Network Error');
      }
    }
  };

  return (
    <LinearGradient colors={['#96a4cc', '#ffab9c']} style={styles.loginPage}>
      <View style={styles.loginBox}>
        <Text style={styles.brand}>A.F. Infosys</Text>
        <Text style={styles.title}>Login</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.btn}
            onPress={() => {
              if (loading) return;
              handleLogin();
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.btnText}>
              {loading ? 'Logging in...' : 'Login'}{' '}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  loginPage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  loginBox: {
    backgroundColor: '#fff',
    paddingVertical: 40,
    paddingHorizontal: 30,
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    elevation: 8,
    alignItems: 'center',
  },

  brand: {
    fontSize: 24,
    color: '#555',
    fontWeight: '600',
    marginBottom: 8,
  },

  title: {
    fontSize: 32,
    color: '#222',
    marginBottom: 24,
  },

  form: {
    width: '100%',
  },

  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
    color: '#000',
  },

  btn: {
    backgroundColor: '#4a90e2',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },

  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LoginScreen;
