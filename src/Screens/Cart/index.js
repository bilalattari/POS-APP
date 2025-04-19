"use client";

import { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  Image,
  TouchableOpacity,
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
  const { cartItems, removeFromCart, addToCart, clearCart, updateCartItem } =
    useCart();
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
    return cartItems.reduce((total, item) => {
      const pieceTotal = (item.noOfPieces || 0) * (item.salesPrice || 0);
      const cartonTotal =
        (item.noOfCartons || 0) *
        (item.salesPriceOfCarton || item.salesPriceofCarton || 0);
      return total + pieceTotal + cartonTotal;
    }, 0);
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
        totalAmount :cartItems.reduce((acc, product) => acc + (product.subtotal || 0), 0),
        termsConditions: "No returns after 7 days.",
        isOnline: true,
        salesPerson: "67f5a28e310ad54d5b2d9c65",
        notes: `Pickup from 'Default location'`,
        products: cartItems.map((product) => ({
          product: product.product || product._id,
          productType: product.productType,
          variantName: product.variantName,
          variantId: product.variantId,
          productName: product.name || product.productName,
          productImage: product.image,
          brand: product.brand,
          category: product.category,
          itemCode: product.itemCode,
          quantity: Number(product.quantity || 0),
          unitPrice: product.salesPrice,
          cartonPrice: product.salesPriceOfCarton || product.salesPriceofCarton,
          subtotal: product.subtotal || 0,
          rule: product.rule,
          noOfPieces: Number(product.noOfPieces || 0),
          noOfCartons: Number(product.noOfCartons || 0),
          noOfCartons: Number(product.noOfCartons || 0),
        })),
      };

      console.log("Order Data:", orderData);

      const response = await axios.post(
        `https://pos-api-dot-ancient-episode-256312.de.r.appspot.com/api/v1/sales/create`,
        orderData
      );

      console.log(response , "response in order data");
      

      if (!response?.data?.error) {
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

  // Handle incrementing pieces
  const handleIncrementPieces = (item) => {
    const updatedItem = { ...item };
    updatedItem.noOfPieces = Number(updatedItem.noOfPieces || 0) + 1;

    // Update total quantity
    const rule = Number(updatedItem.rule || 1);
    updatedItem.quantity =
      Number(updatedItem.noOfPieces || 0) +
      Number(updatedItem.noOfCartons || 0) * rule;

    // Calculate subtotal
    const piecePrice = Number(updatedItem.salesPrice || 0);
    const cartonPrice = Number(
      updatedItem.salesPriceOfCarton || updatedItem.salesPriceofCarton || 0
    );
    updatedItem.subtotal =
      updatedItem.noOfPieces * piecePrice +
      updatedItem.noOfCartons * cartonPrice;

    updateCartItem(updatedItem);
  };

  // Handle decrementing pieces
  const handleDecrementPieces = (item) => {
    if (Number(item.noOfPieces || 0) <= 0) return;

    const updatedItem = { ...item };
    updatedItem.noOfPieces = Number(updatedItem.noOfPieces || 0) - 1;

    // If both pieces and cartons are 0, remove item from cart
    if (
      updatedItem.noOfPieces === 0 &&
      Number(updatedItem.noOfCartons || 0) === 0
    ) {
      removeFromCart(item._id);
      return;
    }

    // Update total quantity
    const rule = Number(updatedItem.rule || 1);
    updatedItem.quantity =
      Number(updatedItem.noOfPieces || 0) +
      Number(updatedItem.noOfCartons || 0) * rule;

    // Calculate subtotal
    const piecePrice = Number(updatedItem.salesPrice || 0);
    const cartonPrice = Number(
      updatedItem.salesPriceOfCarton || updatedItem.salesPriceofCarton || 0
    );
    updatedItem.subtotal =
      updatedItem.noOfPieces * piecePrice +
      updatedItem.noOfCartons * cartonPrice;

    updateCartItem(updatedItem);
  };


  // Handle incrementing cartons
  const handleIncrementCartons = (item) => {
    const updatedItem = { ...item };
    updatedItem.noOfCartons = Number(updatedItem.noOfCartons || 0) + 1;

    // Update total quantity
    const rule = Number(updatedItem.rule || 1);
    updatedItem.quantity =
      Number(updatedItem.noOfPieces || 0) +
      Number(updatedItem.noOfCartons || 0) * rule;

    // Calculate subtotal
    const piecePrice = Number(updatedItem.salesPrice || 0);
    const cartonPrice = Number(
      updatedItem.salesPriceOfCarton || updatedItem.salesPriceofCarton || 0
    );
    updatedItem.subtotal =
      updatedItem.noOfPieces * piecePrice +
      updatedItem.noOfCartons * cartonPrice;

    updateCartItem(updatedItem);
  };

  // Handle decrementing cartons
  const handleDecrementCartons = (item) => {
    if (Number(item.noOfCartons || 0) <= 0) return;

    const updatedItem = { ...item };
    updatedItem.noOfCartons = Number(updatedItem.noOfCartons || 0) - 1;

    // If both pieces and cartons are 0, remove item from cart
    if (
      updatedItem.noOfCartons === 0 &&
      Number(updatedItem.noOfPieces || 0) === 0
    ) {
      removeFromCart(item._id);
      return;
    }

    // Update total quantity
    const rule = Number(updatedItem.rule || 1);
    updatedItem.quantity =
      Number(updatedItem.noOfPieces || 0) +
      Number(updatedItem.noOfCartons || 0) * rule;

    // Calculate subtotal
    const piecePrice = Number(updatedItem.salesPrice || 0);
    const cartonPrice = Number(
      updatedItem.salesPriceOfCarton || updatedItem.salesPriceofCarton || 0
    );
    updatedItem.subtotal =
      updatedItem.noOfPieces * piecePrice +
      updatedItem.noOfCartons * cartonPrice;

    updateCartItem(updatedItem);
  };

  // Renders each product card in the cart
  const renderCartItem = ({ item }) => {
    const rule = Number(item.rule || 1);

    return (
      <View style={styles.cartItem}>
        <Image source={{ uri: item.image || item.product.image }} style={styles.productImage} />
        <View style={styles.productDetails}>
          <Txt style={styles.productName}>
            {item.name || item.productName || item.product.name}
            {item.productType === "Variant Type Product" &&
              item.variantName &&
              ` (${item.variantName})`}
          </Txt>

          {/* Piece price */}
          <Txt style={styles.productPrice}>
            Unit Price: <Txt weight={TxtWeight.Bold}>Rs. {item.salesPrice}</Txt>
          </Txt>

          {/* Carton price */}
          <Txt style={styles.productPrice}>
            Carton Price:{" "}
            <Txt weight={TxtWeight.Bold}>
              Rs. {item.salesPriceOfCarton || item.salesPriceofCarton}
            </Txt>
            {rule > 1 && (
              <Txt style={styles.ruleText}> ({rule} pcs/carton)</Txt>
            )}
          </Txt>

          {/* Pieces quantity control */}
          <View style={styles.quantityRow}>
            <Txt style={styles.quantityLabel}>Pieces:</Txt>
            <View style={styles.quantityContainer}>
              <TouchableOpacity onPress={() => handleDecrementPieces(item)}>
                <Ionicons
                  name="minus-circle-outline"
                  size={24}
                  color={Number(item.noOfPieces || 0) <= 0 ? "gray" : "red"}
                />
              </TouchableOpacity>
              <Txt weight={TxtWeight.Bold}>{item.noOfPieces || 0}</Txt>
              <TouchableOpacity onPress={() => handleIncrementPieces(item)}>
                <Ionicons name="plus-circle-outline" size={24} color="green" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Cartons quantity control */}
          <View style={styles.quantityRow}>
            <Txt style={styles.quantityLabel}>crt :</Txt>
            <View style={styles.quantityContainer}>
              <TouchableOpacity onPress={() => handleDecrementCartons(item)}>
                <Ionicons
                  name="minus-circle-outline"
                  size={24}
                  color={Number(item.noOfCartons || 0) <= 0 ? "gray" : "red"}
                />
              </TouchableOpacity>
              <Txt weight={TxtWeight.Bold}>{item.noOfCartons || 0}</Txt>
              <TouchableOpacity onPress={() => handleIncrementCartons(item)}>
                <Ionicons name="plus-circle-outline" size={24} color="green" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Subtotal */}
          <Txt style={styles.subtotalText}>
            Subtotal:{" "}
            <Txt weight={TxtWeight.Bold}>Rs. {item.subtotal || 0}</Txt>
          </Txt>
        </View>
      </View>
    );
  };

  // Cart View with list of items and a Checkout button
  const renderCartView = () => (
    <View style={styles.contentContainer}>
      {cartItems.length > 0 ? (
        <>

        <FlatList
          data={cartItems}
          keyExtractor={(item) => item._id}
          renderItem={renderCartItem}
        />

        <Txt weight={TxtWeight.Bold} style={styles.subtotalText}>
          Total Amount: Rs. {calculateTotal()}
          </Txt>
        </>
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

  console.log(cartItems , "====> this is the cart items");
  

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
    alignItems: "flex-start",
  },
  productImage: { width: 80, height: 80, borderRadius: 5 },
  productDetails: { marginLeft: 10, flex: 1 },
  productName: { fontSize: 14, marginBottom: 5, fontWeight: "500" },
  productPrice: { fontSize: 13, marginBottom: 3 },
  ruleText: { fontSize: 11, color: "#666" },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 5,
  },
  quantityLabel: {
    fontSize: 13,
    color: "#555",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  subtotalText: {
    fontSize: 14,
    marginTop: 8,
    color: COLORS.theme,
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

// Uncomment the following code if you want to use the original CartScreen component

// import React, { useEffect, useState } from "react";
// import {
//   StyleSheet,
//   View,
//   FlatList,
//   Image,
//   TouchableOpacity,
//   ActivityIndicator,
//   Alert,
//   ScrollView,
// } from "react-native";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import axios from "axios";
// import Txt from "../../components/Txt";
// import { COLORS, TxtWeight } from "../../Constants";
// import Header from "../../components/Header";
// import Ionicons from "react-native-vector-icons/MaterialCommunityIcons";
// import { useCart } from "../../context/CartContext";
// import dayjs from "dayjs";
// import { useNavigation } from "@react-navigation/native";
// import Toast from "react-native-toast-message";

// const CartScreen = () => {
//   const { cartItems, removeFromCart, addToCart, clearCart } = useCart();
//   const [userId, setUserId] = useState(null);
//   const [customerId, setCustomerId] = useState(null);
//   const [paymentMethod, setPaymentMethod] = useState("Cash");
//   const [loading, setLoading] = useState(false);
//   const [isCheckout, setIsCheckout] = useState(false);
//   const navigation = useNavigation();

//   useEffect(() => {
//     getUserData();
//   }, []);

//   const getUserData = async () => {
//     try {
//       const userData = await AsyncStorage.getItem("userData");
//       if (userData) {
//         const parsedUser = JSON.parse(userData);
//         setUserId(parsedUser._id);
//         setCustomerId(parsedUser._id);
//       }
//     } catch (error) {
//       console.error("Error fetching userId:", error);
//     }
//   };

//   const calculateTotal = () => {
//     return cartItems.reduce(
//       (total, item) => total + item.salesPrice * item.quantity,
//       0
//     );
//   };

//   const handleCheckout = async () => {
//     if (!customerId || cartItems.length === 0) {
//       Alert.alert("No items in cart or user not found");
//       return;
//     }

//     setLoading(true);
//     try {
//       const orderData = {
//         customer: customerId,
//         discount: 0,
//         paidPayment: 0, // No payment during checkout
//         payments: [],
//         salesDate: dayjs().format("YYYY-MM-DDTHH:mm:ssZ"),
//         orderStatus: "Pending",
//         orderTax: 0,
//         shipping: 0,
//         termsConditions: "No returns after 7 days.",
//         isOnline: true,
//         notes: `Pickup from 'Default location'`,
//         products: cartItems.map((product) => ({
//           product: product._id,
//           productType: product.productType,
//           variantName: product.variantName,
//           variantId: product.variantId,
//           productName: product.name,
//           productImage: product.image,
//           brand: product.brand,
//           category: product.category,
//           itemCode: product.itemCode,
//           quantity: Number(product.quantity || 0),
//           unitPrice: product.salesPrice,
//           cartonPrice: product.salesPriceofCarton,
//           subtotal: (product.quantity || 0) * (product.salesPrice || 0),
//         })),
//       };

//       console.log("Order Data:", orderData);

//       const response = await axios.post(
//         `https://pos-api-dot-ancient-episode-256312.de.r.appspot.com/api/v1/sales/create`,
//         orderData
//       );

//       if (!response.data.error) {
//         Toast.show({
//           type: "success",
//           text1: "Order Placed Successfully",
//         });
//         clearCart();
//         navigation.navigate("Profile");
//       }
//     } catch (error) {
//       Alert.alert(error?.response?.data?.msg || "Failed to process order");
//       console.error("Error processing checkout:", error);
//     }
//     setLoading(false);
//   };

//   console.log("this is the cart items ===>", cartItems);

//   // Renders each product card in the cart
//   const renderCartItem = ({ item }) => {
//     const cartItem = cartItems.find((p) => p._id === item._id);
//     const quantityInCart = cartItem ? cartItem.quantity : 0;
//     return (
//       <View style={styles.cartItem}>
//         <Image source={{ uri: item.image }} style={styles.productImage} />
//         <View style={styles.productDetails}>
//           <Txt style={styles.productName}>{item.name} {item.productType ===  "Variant Type Product" && `( ${item.variantName} )`}</Txt>
//           <Txt style={styles.productPrice}>
//             Rs. <Txt weight={TxtWeight.Bold}>{item.salesPrice}</Txt>
//           </Txt>
//           <View style={styles.quantityContainer}>
//             <TouchableOpacity onPress={() => removeFromCart(item._id)}>
//               <Ionicons name="minus-circle-outline" size={24} color="red" />
//             </TouchableOpacity>
//             <Txt weight={TxtWeight.Bold}>{item.quantity}</Txt>
//             <TouchableOpacity onPress={() => addToCart(item)}>
//               <Ionicons name="plus-circle-outline" size={24} color="green" />
//             </TouchableOpacity>
//           </View>
//         </View>
//       </View>
//     );
//   };

//   // Cart View with list of items and a Checkout button
//   const renderCartView = () => (
//     <View style={styles.contentContainer}>
//       {cartItems.length > 0 ? (
//         <FlatList
//           data={cartItems}
//           keyExtractor={(item) => item._id}
//           renderItem={renderCartItem}
//         />
//       ) : (
//         <Txt weight={TxtWeight.Regular} style={styles.noDataText}>
//           No items in cart.
//         </Txt>
//       )}
//       {cartItems.length > 0 && (
//         <TouchableOpacity
//           style={styles.checkoutButton}
//           onPress={() => setIsCheckout(true)}
//         >
//           <Txt weight={TxtWeight.Bold} style={styles.checkoutText}>
//             Proceed to Checkout
//           </Txt>
//         </TouchableOpacity>
//       )}
//     </View>
//   );

//   // Checkout View with order summary and payment selection
//   const renderCheckoutView = () => (
//     <View style={styles.contentContainer}>
//       <ScrollView>
//         <Txt weight={TxtWeight.Semi} style={styles.summaryText}>
//           Total Amount: Rs. {calculateTotal()}
//         </Txt>

//         {/* Payment Method Selection */}
//         <Txt weight={TxtWeight.Semi} style={styles.label}>
//           Select Payment Method
//         </Txt>
//         <View style={styles.paymentMethodContainer}>
//           <TouchableOpacity
//             style={[
//               styles.paymentButton,
//               paymentMethod === "Cash" && styles.selectedPayment,
//             ]}
//             onPress={() => setPaymentMethod("Cash")}
//           >
//             <Txt>Cash</Txt>
//           </TouchableOpacity>
//           <TouchableOpacity
//             style={[
//               styles.paymentButton,
//               paymentMethod === "Online Transfer" && styles.selectedPayment,
//             ]}
//             onPress={() => setPaymentMethod("Online Transfer")}
//           >
//             <Txt>Online Transfer</Txt>
//           </TouchableOpacity>
//         </View>

//         {/* Pickup Location (Hard-coded) */}
//         <Txt weight={TxtWeight.Semi} style={styles.label}>
//           Pickup Location
//         </Txt>
//         <Txt mt={2} mb={20}>
//           Gulshane Iqbaal Block 15 Karachi
//         </Txt>

//         {paymentMethod === "Online Transfer" && (
//           <View>
//             <Txt weight={TxtWeight.Bold}>
//               Bank : <Txt weight={TxtWeight.Medium}>Bank Alfalah</Txt>{" "}
//             </Txt>
//             <Txt weight={TxtWeight.Bold}>
//               Account Number :{" "}
//               <Txt weight={TxtWeight.Medium}>1236125317256317263</Txt>{" "}
//             </Txt>
//             <Txt mt={10} weight={TxtWeight.Bold}>
//               Bank : <Txt weight={TxtWeight.Medium}>Habib Bank Limited</Txt>{" "}
//             </Txt>
//             <Txt weight={TxtWeight.Bold}>
//               Account Number :{" "}
//               <Txt weight={TxtWeight.Medium}>1236125317256317263</Txt>{" "}
//             </Txt>
//           </View>
//         )}
//       </ScrollView>

//       {/* Complete Order Button */}
//       <TouchableOpacity
//         style={styles.checkoutButton}
//         onPress={handleCheckout}
//         disabled={loading}
//       >
//         <Txt weight={TxtWeight.Bold} style={styles.checkoutText}>
//           {loading ? "Processing..." : "Complete Order"}
//         </Txt>
//       </TouchableOpacity>

//       {/* Back to Cart Button */}
//       <TouchableOpacity
//         style={styles.backButton}
//         onPress={() => setIsCheckout(false)}
//       >
//         <Txt style={styles.backText}>Back to Cart</Txt>
//       </TouchableOpacity>
//     </View>
//   );

//   return (
//     <View style={styles.container}>
//       <Header isBack={true} headerTxt={"My Cart"} />
//       <View style={{ paddingHorizontal: 12, flex: 1, paddingBottom: 16 }}>
//         {isCheckout ? renderCheckoutView() : renderCartView()}
//       </View>
//     </View>
//   );
// };

// export default CartScreen;

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: "#fff" },
//   contentContainer: { flex: 1, marginTop: 10 },
//   cartItem: {
//     flexDirection: "row",
//     backgroundColor: COLORS.bgGrey,
//     borderRadius: 8,
//     padding: 12,
//     marginBottom: 10,
//     alignItems: "center",
//   },
//   productImage: { width: 80, height: 80, borderRadius: 5 },
//   productDetails: { marginLeft: 10, flex: 1 },
//   productName: { fontSize: 14, marginBottom: 5 },
//   productPrice: { fontSize: 14 },
//   quantityContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 15,
//     marginTop: 5,
//   },
//   noDataText: {
//     fontSize: 16,
//     color: "gray",
//     textAlign: "center",
//     marginTop: 20,
//   },
//   summaryText: { fontSize: 16, marginBottom: 10 },
//   label: { fontSize: 14, marginTop: 10 },
//   paymentMethodContainer: { flexDirection: "row", gap: 10, marginBottom: 10 },
//   paymentButton: { padding: 10, borderRadius: 5, borderWidth: 1 },
//   selectedPayment: { borderColor: COLORS.theme, borderWidth: 2 },
//   checkoutButton: {
//     backgroundColor: COLORS.theme,
//     padding: 12,
//     borderRadius: 5,
//     alignItems: "center",
//     marginTop: 20,
//   },
//   checkoutText: { color: "#fff", fontSize: 16 },
//   backButton: {
//     marginTop: 15,
//     alignItems: "center",
//   },
//   backText: { color: COLORS.theme, fontSize: 16 },
// });
