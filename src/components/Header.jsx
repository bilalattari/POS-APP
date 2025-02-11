import React, {useContext} from 'react';
import {StyleSheet, View, TouchableOpacity, Text} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/MaterialCommunityIcons';
import Txt from '../components/Txt';
import {COLORS, TxtWeight} from '../Constants';
import {useCart} from '../context/CartContext';
import {UserContext} from '../context/UserContext';

const Header = ({isBack, headerTxt, showLogout}) => {
  const navigation = useNavigation();
  const {cartItems} = useCart();
  const {logoutUser} = useContext(UserContext);

  const totalQuantity = cartItems.reduce(
    (total, item) => total + item.quantity,
    0,
  );

  return (
    <View style={styles.header}>
      {/* 🔹 Back Button & Title */}
      <View style={{flexDirection: 'row', alignItems: 'center'}}>
        {isBack && (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}>
            <Ionicons name="arrow-left" size={25} />
          </TouchableOpacity>
        )}
        <Txt weight={TxtWeight.Bold} style={styles.logo}>
          {headerTxt ? headerTxt : 'POS'}
        </Txt>
      </View>

      {/* 🔹 Right Side: Cart, Wishlist, Profile OR Logout */}
      {showLogout ? (
        <TouchableOpacity onPress={logoutUser} style={styles.iconContainer}>
          <Ionicons name="logout" size={24} color="black" />
        </TouchableOpacity>
      ) : (
        <View style={styles.icons}>
          <TouchableOpacity
            style={styles.iconContainer}
            onPress={() => navigation.navigate('Search')}>
            <Ionicons name="magnify" size={24} color="black" />
            {totalQuantity > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{totalQuantity}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Cart Icon with Badge */}
          <TouchableOpacity
            style={styles.iconContainer}
            onPress={() => navigation.navigate('Cart')}>
            <Ionicons name="shopping-outline" size={24} color="black" />
            {totalQuantity > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{totalQuantity}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Wishlist Icon */}
          <TouchableOpacity
            style={styles.iconContainer}
            onPress={() => navigation.navigate('LikedProducts')}>
            <Ionicons name="cards-heart-outline" size={24} color="black" />
          </TouchableOpacity>

          {/* Profile Icon */}
          <TouchableOpacity
            style={styles.iconContainer}
            onPress={() => navigation.navigate('Profile')}>
            <Ionicons
              name="account-supervisor-circle-outline"
              size={24}
              color="black"
            />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default Header;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  logo: {
    fontSize: 22,
    color: COLORS.theme,
  },
  icons: {
    flexDirection: 'row',
    gap: 15,
  },
  badge: {
    position: 'absolute',
    right: -5,
    top: -5,
    backgroundColor: 'red',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  backButton: {
    paddingRight: 12,
  },
});
