import React, { useContext, useEffect } from "react";
import { View, Image, StyleSheet, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { UserContext } from "../../context/UserContext";

const Splash = () => {
  const { user, isLoading } = useContext(UserContext);
  const navigation = useNavigation();

  useEffect(() => {
    if (!isLoading) {
      setTimeout(() => {
        if (user) {
          navigation.replace("Home");
        } else {
          navigation.replace("Login");
        }
      }, 3000);
    }
  }, [user, isLoading, navigation]);

  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets//images/pos-logo.png")}
        style={styles.logo}
      />
      {isLoading && (
        <ActivityIndicator
          style={styles.indicator}
          size="large"
          color="#4a90e2"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  logo: {
    width: 250,
    height: 250,
    resizeMode: "contain",
    marginBottom: 20,
  },
  indicator: {
    marginTop: 20,
  },
});

export default Splash;
