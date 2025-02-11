import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Txt from '../../components/Txt';
import {COLORS, TxtWeight} from '../../Constants';
import Header from '../../components/Header';
import Ionicons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useCart} from '../../context/CartContext';
import {TabView, SceneMap, TabBar} from 'react-native-tab-view';
import dayjs from 'dayjs';
import {useNavigation} from '@react-navigation/native';
import Toast from 'react-native-toast-message';

const CartScreen = () => {
  const {cartItems, removeFromCart, addToCart, clearCart} = useCart();
  const [userId, setUserId] = useState(null);
  const [customerId, setCustomerId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [pickupLocation, setPickupLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [index, setIndex] = useState(0);
  const navigation = useNavigation();
  const [routes] = useState([
    {key: 'cart', title: 'Cart Items'},
    {key: 'checkout', title: 'Checkout'},
  ]);

  useEffect(() => {
    getUserData();
  }, []);

  const getUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUserId(parsedUser._id);
        setCustomerId(parsedUser._id);
      }
    } catch (error) {
      console.error('Error fetching userId:', error);
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce(
      (total, item) => total + item.salesPrice * item.quantity,
      0,
    );
  };

  const handleCheckout = async () => {
    if (!customerId || cartItems.length === 0) {
      Alert.alert('No items in cart or user not found');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        customer: customerId,
        discount: 0,
        paidPayment: 0, // No payment during checkout
        payments: [],
        salesDate: dayjs().format('YYYY-MM-DDTHH:mm:ssZ'), // Current timestamp
        orderStatus: 'Pending',
        orderTax: 0,
        shipping: 0,
        termsConditions: 'No returns after 7 days.',
        notes: `Pickup from 'Default location'}`,

        products: cartItems.map(product => ({
          product: product._id,
          quantity: Number(product.quantity || 0),
          unitPrice: product.salesPrice,
          cartonPrice: product.salesPriceofCarton,
          subtotal: (product.quantity || 0) * (product.salesPrice || 0),
        })),
      };

      const response = await axios.post(
        `https://pos-api-dot-ancient-episode-256312.de.r.appspot.com/api/v1/sales/create`,
        orderData,
      );

      console.log('response.data=>', response.data);

      if (!response.data.error) {
        Toast.show({
          type: 'success',
          text1: 'Order Placed Successfully',
        });
        clearCart();
        navigation.navigate('Profile');
      }
    } catch (error) {
      console.log('response.data=>', error?.response?.data);
      Alert.alert(error?.response?.data?.msg || 'Failed to process order');
      console.error('Error processing checkout:', error);
    }
    setLoading(false);
  };

  // 🛒 **Cart Items Tab**
  const CartItemsTab = () => (
    <View style={styles.container}>
      {cartItems.length > 0 ? (
        <FlatList
          data={cartItems}
          keyExtractor={item => item._id}
          renderItem={({item}) => (
            <View style={styles.cartItem}>
              <Image source={{uri: item.image}} style={styles.productImage} />
              <View style={styles.productDetails}>
                <Txt style={styles.productName}>{item.name}</Txt>
                <Txt style={styles.productPrice}>
                  Rs. <Txt weight={TxtWeight.Bold}>{item.salesPrice}</Txt>
                </Txt>
                <View style={styles.quantityContainer}>
                  <TouchableOpacity onPress={() => removeFromCart(item._id)}>
                    <Ionicons
                      name="minus-circle-outline"
                      size={24}
                      color="red"
                    />
                  </TouchableOpacity>
                  <Txt weight={TxtWeight.Bold}>{item.quantity}</Txt>
                  <TouchableOpacity onPress={() => addToCart(item)}>
                    <Ionicons
                      name="plus-circle-outline"
                      size={24}
                      color="green"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        />
      ) : (
        <Txt weight={TxtWeight.Regular} style={styles.noDataText}>
          No items in cart.
        </Txt>
      )}
    </View>
  );

  // ✅ **Checkout Tab**
  const CheckoutTab = () => (
    <View style={styles.container}>
      <View style={{flex: 1}}>
        <Txt weight={TxtWeight.Semi} style={styles.summaryText}>
          Total Amount: Rs. {calculateTotal()}
        </Txt>

        {/* Payment Method Selection */}
        <Txt weight={TxtWeight.Semi} style={styles.label}>
          Select Payment Method
        </Txt>
        <View style={styles.paymentMethodContainer}>
          <TouchableOpacity
            style={[
              styles.paymentButton,
              paymentMethod === 'Cash' && styles.selectedPayment,
            ]}
            onPress={() => setPaymentMethod('Cash')}>
            <Txt>Cash</Txt>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.paymentButton,
              paymentMethod === 'Online Transfer' && styles.selectedPayment,
            ]}
            onPress={() => setPaymentMethod('Online Transfer')}>
            <Txt>Online Transfer</Txt>
          </TouchableOpacity>
        </View>

        {/* Pickup Location */}
        <Txt weight={TxtWeight.Semi} style={styles.label}>
          Pickup Location
        </Txt>

        <Txt mt={2} mb={20}>
          Gulshane Iqbaal Block 15 Karachi
        </Txt>
      </View>

      {/* Complete Order Button */}
      <TouchableOpacity
        style={styles.checkoutButton}
        onPress={handleCheckout}
        disabled={loading}>
        <Txt weight={TxtWeight.Bold} style={styles.checkoutText}>
          {loading ? 'Processing...' : 'Complete Order'}
        </Txt>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header isBack={true} headerTxt={'My Cart'} />
      <TabView
        navigationState={{index, routes}}
        renderScene={SceneMap({
          cart: CartItemsTab,
          checkout: CheckoutTab,
        })}
        onIndexChange={setIndex}
        initialLayout={{width: '100%'}}
        renderTabBar={props => (
          <TabBar
            {...props}
            indicatorStyle={styles.tabIndicator}
            style={styles.tabBar}
          />
        )}
      />
    </View>
  );
};

export default CartScreen;

const styles = StyleSheet.create({
  container: {flex: 1, padding: 16, backgroundColor: '#fff'},
  cartItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgGrey,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    alignItems: 'center',
  },
  productImage: {width: 80, height: 80, borderRadius: 5},
  productDetails: {marginLeft: 10, flex: 1},
  productName: {fontSize: 14, marginBottom: 5},
  productPrice: {fontSize: 14},
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginTop: 5,
  },
  summaryText: {fontSize: 16, marginBottom: 10},
  label: {fontSize: 14, marginTop: 10},
  paymentMethodContainer: {flexDirection: 'row', gap: 10, marginBottom: 10},
  paymentButton: {padding: 10, borderRadius: 5, borderWidth: 1},
  selectedPayment: {borderColor: COLORS.theme, borderWidth: 2},
  input: {borderWidth: 1, borderRadius: 5, padding: 10, marginBottom: 10},
  checkoutButton: {
    backgroundColor: COLORS.theme,
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  checkoutText: {color: '#fff', fontSize: 16},
  tabBar: {backgroundColor: COLORS.theme},
  tabIndicator: {backgroundColor: '#fff'},
});
