import AsyncStorage from '@react-native-async-storage/async-storage';

const addKeyToStorage = async (key, value) => {
  await AsyncStorage.setItem(key, value);
};

const deleteKeyFromStorage = async key => {
  await AsyncStorage.removeItem(key);
};

const updateKey = async (key, value) => {
  await AsyncStorage.setItem(key, value);
};

const getValueFromStorage = async key => {
  const value = await AsyncStorage.getItem(key);
  return value;
};

export {addKeyToStorage, deleteKeyFromStorage, updateKey, getValueFromStorage};
