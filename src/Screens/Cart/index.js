import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Txt from "../../components/Txt";
import { COLORS, TxtWeight } from "../../Constants";
import Header from "../../components/Header";
import Ionicons from "react-native-vector-icons/MaterialCommunityIcons";
import { useCart } from "../../context/CartContext";
import dayjs from "dayjs";
import { useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";

const CartScreen = () => {
  const { cartItems, removeFromCart, addToCart, clearCart } = useCart();
  const [userId, setUserId] = useState(null);
  const [customerId, setCustomerId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [loading, setLoading] = useState(false);
  const [isCheckout, setIsCheckout] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    getUserData();
  }, []);

  const getUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem("userData");
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUserId(parsedUser._id);
        setCustomerId(parsedUser._id);
      }
    } catch (error) {
      console.error("Error fetching userId:", error);
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce(
      (total, item) => total + item.salesPrice * item.quantity,
      0
    );
  };

  const handleCheckout = async () => {
    if (!customerId || cartItems.length === 0) {
      Alert.alert("No items in cart or user not found");
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        customer: customerId,
        discount: 0,
        paidPayment: 0, // No payment during checkout
        payments: [],
        salesDate: dayjs().format("YYYY-MM-DDTHH:mm:ssZ"),
        orderStatus: "Pending",
        orderTax: 0,
        shipping: 0,
        termsConditions: "No returns after 7 days.",
        isOnline: true,
        notes: `Pickup from 'Default location'`,
        products: cartItems.map((product) => ({
          product: product._id,
          quantity: Number(product.quantity || 0),
          unitPrice: product.salesPrice,
          cartonPrice: product.salesPriceofCarton,
          subtotal: (product.quantity || 0) * (product.salesPrice || 0),
        })),
      };

      const response = await axios.post(
        `https://pos-api-dot-ancient-episode-256312.de.r.appspot.com/api/v1/sales/create`,
        orderData
      );

      if (!response.data.error) {
        Toast.show({
          type: "success",
          text1: "Order Placed Successfully",
        });
        clearCart();
        navigation.navigate("Profile");
      }
    } catch (error) {
      Alert.alert(error?.response?.data?.msg || "Failed to process order");
      console.error("Error processing checkout:", error);
    }
    setLoading(false);
  };

  console.log("this is the cart items ===>", cartItems);
  
  // Renders each product card in the cart
  const renderCartItem = ({ item }) => {
    const cartItem = cartItems.find((p) => p._id === item._id);
    const quantityInCart = cartItem ? cartItem.quantity : 0;
    return (
      <View style={styles.cartItem}>
        <Image source={{ uri: item.image }} style={styles.productImage} />
        <View style={styles.productDetails}>
          <Txt style={styles.productName}>{item.name}</Txt>
          <Txt style={styles.productPrice}>
            Rs. <Txt weight={TxtWeight.Bold}>{item.salesPrice}</Txt>
          </Txt>
          <View style={styles.quantityContainer}>
            <TouchableOpacity onPress={() => removeFromCart(item._id)}>
              <Ionicons name="minus-circle-outline" size={24} color="red" />
            </TouchableOpacity>
            <Txt weight={TxtWeight.Bold}>{item.quantity}</Txt>
            <TouchableOpacity onPress={() => addToCart(item)}>
              <Ionicons name="plus-circle-outline" size={24} color="green" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // Cart View with list of items and a Checkout button
  const renderCartView = () => (
    <View style={styles.contentContainer}>
      {cartItems.length > 0 ? (
        <FlatList
          data={cartItems}
          keyExtractor={(item) => item._id}
          renderItem={renderCartItem}
        />
      ) : (
        <Txt weight={TxtWeight.Regular} style={styles.noDataText}>
          No items in cart.
        </Txt>
      )}
      {cartItems.length > 0 && (
        <TouchableOpacity
          style={styles.checkoutButton}
          onPress={() => setIsCheckout(true)}
        >
          <Txt weight={TxtWeight.Bold} style={styles.checkoutText}>
            Proceed to Checkout
          </Txt>
        </TouchableOpacity>
      )}
    </View>
  );

  // Checkout View with order summary and payment selection
  const renderCheckoutView = () => (
    <View style={styles.contentContainer}>
      <ScrollView>
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
              paymentMethod === "Cash" && styles.selectedPayment,
            ]}
            onPress={() => setPaymentMethod("Cash")}
          >
            <Txt>Cash</Txt>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.paymentButton,
              paymentMethod === "Online Transfer" && styles.selectedPayment,
            ]}
            onPress={() => setPaymentMethod("Online Transfer")}
          >
            <Txt>Online Transfer</Txt>
          </TouchableOpacity>
        </View>

        {/* Pickup Location (Hard-coded) */}
        <Txt weight={TxtWeight.Semi} style={styles.label}>
          Pickup Location
        </Txt>
        <Txt mt={2} mb={20}>
          Gulshane Iqbaal Block 15 Karachi
        </Txt>

        {paymentMethod === "Online Transfer" && (
          <View>
            <Txt weight={TxtWeight.Bold}>
              Bank : <Txt weight={TxtWeight.Medium}>Bank Alfalah</Txt>{" "}
            </Txt>
            <Txt weight={TxtWeight.Bold}>
              Account Number :{" "}
              <Txt weight={TxtWeight.Medium}>1236125317256317263</Txt>{" "}
            </Txt>
            <Txt mt={10} weight={TxtWeight.Bold}>
              Bank : <Txt weight={TxtWeight.Medium}>Habib Bank Limited</Txt>{" "}
            </Txt>
            <Txt weight={TxtWeight.Bold}>
              Account Number :{" "}
              <Txt weight={TxtWeight.Medium}>1236125317256317263</Txt>{" "}
            </Txt>
          </View>
        )}
      </ScrollView>

      {/* Complete Order Button */}
      <TouchableOpacity
        style={styles.checkoutButton}
        onPress={handleCheckout}
        disabled={loading}
      >
        <Txt weight={TxtWeight.Bold} style={styles.checkoutText}>
          {loading ? "Processing..." : "Complete Order"}
        </Txt>
      </TouchableOpacity>

      {/* Back to Cart Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setIsCheckout(false)}
      >
        <Txt style={styles.backText}>Back to Cart</Txt>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header isBack={true} headerTxt={"My Cart"} />
      <View style={{ paddingHorizontal: 12, flex: 1, paddingBottom: 16 }}>
        {isCheckout ? renderCheckoutView() : renderCartView()}
      </View>
    </View>
  );
};

export default CartScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  contentContainer: { flex: 1, marginTop: 10 },
  cartItem: {
    flexDirection: "row",
    backgroundColor: COLORS.bgGrey,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    alignItems: "center",
  },
  productImage: { width: 80, height: 80, borderRadius: 5 },
  productDetails: { marginLeft: 10, flex: 1 },
  productName: { fontSize: 14, marginBottom: 5 },
  productPrice: { fontSize: 14 },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    marginTop: 5,
  },
  noDataText: {
    fontSize: 16,
    color: "gray",
    textAlign: "center",
    marginTop: 20,
  },
  summaryText: { fontSize: 16, marginBottom: 10 },
  label: { fontSize: 14, marginTop: 10 },
  paymentMethodContainer: { flexDirection: "row", gap: 10, marginBottom: 10 },
  paymentButton: { padding: 10, borderRadius: 5, borderWidth: 1 },
  selectedPayment: { borderColor: COLORS.theme, borderWidth: 2 },
  checkoutButton: {
    backgroundColor: COLORS.theme,
    padding: 12,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 20,
  },
  checkoutText: { color: "#fff", fontSize: 16 },
  backButton: {
    marginTop: 15,
    alignItems: "center",
  },
  backText: { color: COLORS.theme, fontSize: 16 },
});
