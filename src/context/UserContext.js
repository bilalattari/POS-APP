import React, {createContext, useState, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const UserContext = createContext();

export const UserProvider = ({children}) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('userData');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
    setIsLoading(false);
  };

  const loginUser = async userData => {
    try {
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  };

  const logoutUser = async () => {
    try {
      await AsyncStorage.removeItem('userData');
      setUser(null);
    } catch (error) {
      console.error('Error removing user data:', error);
    }
  };

  return (
    <UserContext.Provider value={{user, isLoading, loginUser, logoutUser}}>
      {children}
    </UserContext.Provider>
  );
};
