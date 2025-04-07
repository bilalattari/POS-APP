import React, {useState, useContext} from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Text,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import {useNavigation} from '@react-navigation/native';
import {UserContext} from '../../context/UserContext';

const LoginScreen = () => {
  const {loginUser} = useContext(UserContext);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const handleLogin = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Phone',
        text2: 'Please enter a valid phone number.',
      });
      return;
    }
    if (!password || password.length < 6) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Password',
        text2: 'Password must be at least 6 characters.',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        'https://pos-api-dot-ancient-episode-256312.de.r.appspot.com/api/v1/user/login',
        {phoneNumber, password},
      );

      if (!response.data.error) {
        const userData = response.data.data;
        loginUser(userData);

        Toast.show({
          type: 'success',
          text1: 'Login Success',
          text2: `Welcome ${userData.name}`,
        });

        setTimeout(() => {
          navigation.replace('Home'); // Redirect to Home after login
        }, 1500);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Login Failed',
          text2: response.data.msg || 'Invalid credentials',
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Something went wrong. Please try again.',
      });
      console.error('Login error:', error);
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.subtitle}>Login to your account</Text>

      <TextInput
        style={styles.input}
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        keyboardType="phone-pad"
        placeholder="Enter phone number"
        placeholderTextColor={'#ccc'}
      />

      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="Enter your password"
        placeholderTextColor={'#ccc'}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
        disabled={loading}>
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </TouchableOpacity>

      <Toast />
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: 'gray',
    marginBottom: 20,
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    color: '#000',
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
