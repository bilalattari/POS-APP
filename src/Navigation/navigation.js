import React, {useContext} from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {NavigationContainer} from '@react-navigation/native';
import {ActivityIndicator, View, StyleSheet} from 'react-native';
import Home from '../Screens/Home';
import Login from '../Screens/Login';
import CompanyDetail from '../Screens/CompanyProducts';
import LikedProducts from '../Screens/LikedProducts';
import CartScreen from '../Screens/Cart';
import ProfileScreen from '../Screens/Profile';
import {UserContext} from '../context/UserContext';
import Search from '../Screens/Search';

const Stack = createNativeStackNavigator();

function Navigator() {
  const {user, isLoading} = useContext(UserContext);

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        {user ? (
          <>
            <Stack.Screen name="Home" component={Home} />
            <Stack.Screen name="CompanyDetail" component={CompanyDetail} />
            <Stack.Screen name="Search" component={Search} />
            <Stack.Screen name="LikedProducts" component={LikedProducts} />
            <Stack.Screen name="Cart" component={CartScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
          </>
        ) : (
          <Stack.Screen name="Login" component={Login} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Navigator;
