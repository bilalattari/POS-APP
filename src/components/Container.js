import React, {useEffect, useState} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  Image,
  Keyboard,
  KeyboardAvoidingView,
} from 'react-native';
import {COLORS, Space, TxtWeight} from '../Constants';
import {images} from '../assets';
import Txt from '../components/Txt';
import {useNavigation} from '@react-navigation/native';

const Container = ({title = 'Home', showBottom = true, children, onBack}) => {
  const navigation = useNavigation();
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.headerButton}>
          <Image style={styles.headerIcon} source={images.backIcon} />
        </TouchableOpacity>

        <Txt
          center
          style={styles.headerTitle}
          mt={8}
          size={25}
          weight={TxtWeight.Bold}>
          {title}
        </Txt>

        <TouchableOpacity style={styles.headerButton}></TouchableOpacity>
      </View>

      <ScrollView>{children}</ScrollView>
    </SafeAreaView>
  );
};

export default Container;

const styles = StyleSheet.create({
  container: {flex: 1},
  header: {
    height: 60,
    flexDirection: 'row',
    borderBottomColor: COLORS.borderColor,
    borderBottomWidth: 0.5,
    alignItems: 'center',
  },
  headerButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
  },
  headerIcon: {
    height: 20,
    width: 20,
    resizeMode: 'contain',
  },
  headerTitle: {
    flex: 1,
  },
  backgroundImage: {
    width: '100%',
    position: 'absolute',
    height: '100%',
  },
  bottomCircleWrapper: {
    backgroundColor: COLORS.white,
    height: 55,
    width: 60,
    zIndex: 12,
    marginBottom: -14,
    padding: 5,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  bottomCircleButton: {
    backgroundColor: COLORS.theme,
    height: 45,
    width: 45,
    borderRadius: 125,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomCircleIcon: {
    height: 23,
    width: 23,
    resizeMode: 'contain',
  },
  bottomImageBackground: {
    height: 40,
  },
});
