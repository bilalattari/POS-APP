import React, { useState, useContext } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Image,
} from "react-native";
import axios from "axios";
import Toast from "react-native-toast-message";
import { useNavigation } from "@react-navigation/native";
import { UserContext } from "../../context/UserContext";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { images } from "../../assets";
const LoginScreen = () => {
  const { loginUser } = useContext(UserContext);
  const [phoneNumber, setPhoneNumber] = useState("+92");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const [secureText, setSecureText] = useState(true);

  // const handleLogin = async () => {
  //   if (!phoneNumber || phoneNumber.length < 10) {
  //     Toast.show({
  //       type: 'error',
  //       text1: 'Invalid Phone',
  //       text2: 'Please enter a valid phone number.',
  //     });
  //     return;
  //   }
  //   if (!password || password.length < 6) {
  //     Toast.show({
  //       type: 'error',
  //       text1: 'Invalid Password',
  //       text2: 'Password must be at least 6 characters.',
  //     });
  //     return;
  //   }

  //   setLoading(true);
  //   try {
  //     const response = await axios.post(
  //       'https://pos-api-dot-ancient-episode-256312.de.r.appspot.com/api/v1/user/login',
  //       {phoneNumber, password},
  //     );

  //     console.log("this is the response ===>", response);

  //     if (!response.data.error) {
  //       const userData = response.data.data;
  //       loginUser(userData);

  //       Toast.show({
  //         type: 'success',
  //         text1: 'Login Success',
  //         text2: `Welcome ${userData.name}`,
  //       });

  //       setTimeout(() => {
  //         navigation.replace('Home'); // Redirect to Home after login
  //       }, 1500);
  //     } else {
  //       Toast.show({
  //         type: 'error',
  //         text1: 'Login Failed',
  //         text2: response.data.msg || 'Invalid credentials',
  //       });
  //     }
  //   } catch (error) {
  //     Toast.show({
  //       type: 'error',
  //       text1: 'Error',
  //       text2: 'Something went wrong. Please try again.',
  //     });
  //     console.error('Login error:', error);
  //   }
  //   setLoading(false);
  // };

  const handleLogin = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      Toast.show({
        type: "error",
        text1: "Invalid Phone",
        text2: "Please enter a valid phone number.",
      });
      return;
    }
    if (!password || password.length < 6) {
      Toast.show({
        type: "error",
        text1: "Invalid Password",
        text2: "Password must be at least 6 characters.",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        "https://pos-api-dot-ancient-episode-256312.de.r.appspot.com/api/v1/user/login",
        { phoneNumber, password }
      );

      console.log("this is the response ===>", response);

      if (!response.data.error) {
        const userData = response.data.data;
        loginUser(userData);

        Toast.show({
          type: "success",
          text1: "Login Success",
          text2: `Welcome ${userData.name}`,
        });

        setTimeout(() => {
          navigation.replace("Home");
        }, 1500);
      } else {
        Toast.show({
          type: "error",
          text1: "Login Failed",
          text2: response.data.msg || "Invalid credentials",
        });
      }
    } catch (error) {
      console.log("Login error:", error?.response?.data);

      const errorMsg =
        error?.response?.data?.msg || // Message from backend
        error?.response?.data?.error || // Fallback error string
        "Something went wrong. Please try again."; // Generic fallback

      Toast.show({
        type: "error",
        text1: "Login Error",
        text2: errorMsg,
      });
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={require("../../assets/images/pos-logo.png")}
          style={styles.logo}
        />
      </View>
      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.subtitle}>Login to your account</Text>

      <TextInput
        style={styles.input}
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        keyboardType="phone-pad"
        placeholder="Enter phone number"
        placeholderTextColor={"#ccc"}
      />

      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={secureText}
          placeholder="Enter your password"
          placeholderTextColor={"#ccc"}
        />
        <TouchableOpacity onPress={() => setSecureText(!secureText)}>
          <Icon
            name={secureText ? "eye-off-outline" : "eye-outline"}
            size={22}
            color="#555"
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
        disabled={loading}
      >
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

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//     padding: 20,
//     backgroundColor: '#fff',
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     textAlign: 'center',
//     marginBottom: 5,
//   },
//   subtitle: {
//     fontSize: 16,
//     textAlign: 'center',
//     color: 'gray',
//     marginBottom: 20,
//   },
//   input: {
//     height: 50,
//     borderColor: '#ccc',
//     borderWidth: 1,
//     borderRadius: 8,
//     color: '#000',
//     paddingHorizontal: 15,
//     fontSize: 16,
//     marginBottom: 20,
//   },
//   button: {
//     backgroundColor: '#007bff',
//     paddingVertical: 12,
//     borderRadius: 8,
//     alignItems: 'center',
//   },
//   buttonText: {
//     color: 'white',
//     fontSize: 18,
//     fontWeight: 'bold',
//   },
// });

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    color: "#666",
    textAlign: "center",
  },
  input: {
    backgroundColor: "#f0f0f0",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    color: "#000",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    color: "#000",
  },
  button: {
    backgroundColor: "#4a90e2",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  logo: {
    width: 200,
    height: 100,
    resizeMode: "cover",
  },
});
