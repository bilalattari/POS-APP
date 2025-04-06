"use client"

import { useEffect, useState } from "react"
import { StyleSheet, View, ScrollView, Image, TouchableOpacity, Dimensions, FlatList } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import axios from "axios"
import { useRoute } from "@react-navigation/native"
import Txt from "../../components/Txt"
import { COLORS, TxtWeight } from "../../Constants"
import Header from "../../components/Header"
import Ionicons from "react-native-vector-icons/MaterialCommunityIcons"
import { useCart } from "../../context/CartContext"

const { width } = Dimensions.get("window")

const ProductDetail = () => {
  const route = useRoute()
  const { productId } = route.params // ensure productId is passed in navigation
  const [product, setProduct] = useState(null)
  const [userId, setUserId] = useState(null)
  const [wishlist, setWishlist] = useState([])
  const [selectedVariant, setSelectedVariant] = useState(null)
  const { addToCart, removeFromCart, cartItems } = useCart()

  useEffect(() => {
    getUserId()
    fetchProductDetail()
  }, [])

  useEffect(() => {
    // Set the first variant as default when product loads and has variants
    if (product && product.productType === "Variant Type Product" && product.variants.length > 0) {
      setSelectedVariant(product.variants[0])
      console.log(product.variants[0], "===> first variant this is selected by default");
      
    }
  }, [product])

  const getUserId = async () => {
    try {
      const userData = await AsyncStorage.getItem("userData")
      if (userData) {
        const parsedUser = JSON.parse(userData)
        setUserId(parsedUser._id)
      }
    } catch (error) {
      console.error("Error fetching userId:", error)
    }
  }

  const fetchProductDetail = async () => {
    try {
      // Update the API endpoint as per your backend
      const response = await axios.get(
        `https://pos-api-dot-ancient-episode-256312.de.r.appspot.com/api/v1/product/${productId}`,
      )
      if (!response.data.error) {
        setProduct(response.data.data)
        console.log(response?.data?.data, "product detail data")
      }
    } catch (error) {
      console.error("Error fetching product detail:", error)
    }
  }

  const toggleWishlist = async () => {
    if (!userId || !product) return
    try {
      const response = await axios.post(
        `https://pos-api-dot-ancient-episode-256312.de.r.appspot.com/api/v1/user/likeUnlikeProducts`,
        { userId, productId: product._id },
      )
      if (!response.data.error) {
        setWishlist((prev) =>
          prev.includes(product._id) ? prev.filter((id) => id !== product._id) : [...prev, product._id],
        )
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error)
    }
  }

  const handleAddToCart = () => {
    if (!product) return

    if (product.productType === "Variant Type Product" && selectedVariant) {
      // For variant products, create a custom payload
      const variantCartItem = {
        product: product._id,
        productName: product.name,
        unitPrice: selectedVariant.salesPrice,
        cartonPrice: selectedVariant.salesPriceOfCarton,
        subtotal: selectedVariant.salesPrice, // Initial subtotal for 1 item
        variantId: selectedVariant.variantId,
        variantName: selectedVariant.variantValue,
        noOfPieces: 1,
        quantity: 1,
        image: product.image,
        remainingStock: selectedVariant.remainingStock,
        _id: `${product._id}-${selectedVariant.variantId}`, // Create a unique ID for the cart item
      }
      console.log("this item is added to cart ==>" , variantCartItem);
      
      addToCart(variantCartItem)
    } else {
      // For single products, use the existing logic
      addToCart(product)
    }
  }

  const handleRemoveFromCart = () => {
    if (!product) return

    if (product.productType === "Variant Type Product" && selectedVariant) {
      removeFromCart(`${product._id}-${selectedVariant.variantId}`)
    } else {
      removeFromCart(product._id)
    }
  }

  const getCartQuantity = () => {
    if (!product) return 0

    if (product.productType === "Variant Type Product" && selectedVariant) {
      const variantCartItem = cartItems.find((item) => item._id === `${product._id}-${selectedVariant.variantId}`)
      return variantCartItem ? variantCartItem.quantity : 0
    } else {
      const cartItem = cartItems.find((p) => p._id === product._id)
      return cartItem ? cartItem.quantity : 0
    }
  }

  const isOutOfStock = () => {
    if (!product) return true

    if (product.productType === "Variant Type Product" && selectedVariant) {
      return selectedVariant.remainingStock === 0
    } else {
      return product.remainingStock === 0
    }
  }

  const isMaxReached = () => {
    if (!product) return true

    if (product.productType === "Variant Type Product" && selectedVariant) {
      return getCartQuantity() >= selectedVariant.remainingStock
    } else {
      return getCartQuantity() >= product.remainingStock
    }
  }

  const getCurrentPrice = () => {
    if (!product) return 0

    if (product.productType === "Variant Type Product" && selectedVariant) {
      return selectedVariant.salesPrice
    } else {
      return product.salesPrice
    }
  }

  const getCurrentStock = () => {
    if (!product) return 0

    if (product.productType === "Variant Type Product" && selectedVariant) {
      return selectedVariant.remainingStock
    } else {
      return product.remainingStock
    }
  }

  if (!product) {
    return (
      <View>
        <Header isBack={true} />
        <Txt mt={40} center style={styles.loadingText}>
          Loading product details...
        </Txt>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Header isBack={true} />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Product Image with wishlist icon */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: product.image || "" }} style={styles.productImage} />
          <TouchableOpacity style={styles.wishlistIcon} onPress={toggleWishlist}>
            <Ionicons name={wishlist.includes(product._id) ? "heart" : "heart-outline"} size={28} color="red" />
          </TouchableOpacity>
        </View>

        {/* Product Title & Price */}
        <View style={styles.titleContainer}>
          <Txt weight={TxtWeight.Bold} size={20}>
            {product.name}
            {product.productType === "Variant Type Product" && selectedVariant && (
              <Txt weight={TxtWeight.Medium} size={16}>
                {" "}
                ({selectedVariant.variantValue})
              </Txt>
            )}
          </Txt>
          <Txt>
            Rs.{" "}
            <Txt weight={TxtWeight.Bold} size={20}>
              {getCurrentPrice()}
            </Txt>
          </Txt>
        </View>

        {/* Variants Section (only for variant products) */}
        {product.productType === "Variant Type Product" && product.variants.length > 0 && (
          <View style={styles.variantsContainer}>
            <Txt weight={TxtWeight.Semi} size={16} style={styles.variantsTitle}>
              Available Variants
            </Txt>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={product.variants}
              keyExtractor={(item) => item.variantId}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.variantItem,
                    selectedVariant && selectedVariant.variantId === item.variantId && styles.selectedVariant,
                  ]}
                  onPress={() => {
                    setSelectedVariant(item)
                    console.log("this is the varaint selected ===>", item);
                    
                  }}
                >
                  <Txt
                    weight={
                      selectedVariant && selectedVariant.variantId === item.variantId
                        ? TxtWeight.Bold
                        : TxtWeight.Medium
                    }
                    style={
                      selectedVariant && selectedVariant.variantId === item.variantId ? styles.selectedVariantText : {}
                    }
                  >
                    {item.variantValue}
                  </Txt>
                  <Txt
                    size={12}
                    style={
                      selectedVariant && selectedVariant.variantId === item.variantId ? styles.selectedVariantText : {}
                    }
                  >
                    Rs. {item.salesPrice}
                  </Txt>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.variantsList}
            />
          </View>
        )}

        {/* Details Section */}
        <View style={styles.detailsCard}>
          <Txt weight={TxtWeight.Semi} size={20}>
            Product Details
          </Txt>
          <View style={styles.detailRow}>
            <Txt style={styles.detailLabel}>Brand:</Txt>
            <Txt style={styles.detailValue}>{product.brand && product.brand.name}</Txt>
          </View>
          <View style={styles.detailRow}>
            <Txt style={styles.detailLabel}>Category:</Txt>
            <Txt style={styles.detailValue}>{product.category && product.category.name}</Txt>
          </View>
          <View style={styles.detailRow}>
            <Txt style={styles.detailLabel}>Remaining Stock:</Txt>
            <Txt style={styles.detailValue}>{getCurrentStock()}</Txt>
          </View>
          {product.productType === "Variant Type Product" && selectedVariant && (
            <>
              <View style={styles.detailRow}>
                <Txt style={styles.detailLabel}>Item Code:</Txt>
                <Txt style={styles.detailValue}>{selectedVariant.itemCode || "N/A"}</Txt>
              </View>
              <View style={styles.detailRow}>
                <Txt style={styles.detailLabel}>Carton Price:</Txt>
                <Txt style={styles.detailValue}>Rs. {selectedVariant.salesPriceOfCarton}</Txt>
              </View>
              <View style={styles.detailRow}>
                <Txt style={styles.detailLabel}>Rule:</Txt>
                <Txt style={styles.detailValue}>{selectedVariant.rule} pcs/carton</Txt>
              </View>
            </>
          )}
          {product.productType === "Single Type Product" && (
            <>
              <View style={styles.detailRow}>
                <Txt style={styles.detailLabel}>Item Code:</Txt>
                <Txt style={styles.detailValue}>{product.itemCode || "N/A"}</Txt>
              </View>
              <View style={styles.detailRow}>
                <Txt style={styles.detailLabel}>Carton Price:</Txt>
                <Txt style={styles.detailValue}>Rs. {product.salesPriceOfCarton}</Txt>
              </View>
              <View style={styles.detailRow}>
                <Txt style={styles.detailLabel}>Rule:</Txt>
                <Txt style={styles.detailValue}>{product.rule} pcs/carton</Txt>
              </View>
            </>
          )}
        </View>

        {/* Cart Controls */}
        <View style={styles.cartContainer}>
          <TouchableOpacity
            onPress={handleRemoveFromCart}
            disabled={getCartQuantity() === 0 || isOutOfStock()}
            style={styles.cartButton}
          >
            <Ionicons name="minus-circle-outline" size={28} color="black" />
          </TouchableOpacity>
          <Txt style={styles.quantityText}>{getCartQuantity()}</Txt>
          <TouchableOpacity
            onPress={handleAddToCart}
            disabled={isMaxReached() || isOutOfStock()}
            style={styles.cartButton}
          >
            <Ionicons
              name="plus-circle-outline"
              size={28}
              color={isMaxReached() || isOutOfStock() ? "gray" : "black"}
            />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  )
}

export default ProductDetail

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    paddingTop: 50,
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    alignItems: "center",
  },
  imageContainer: {
    width: width,
    height: 250,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: COLORS.bgGrey,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  productImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  wishlistIcon: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 4,
    elevation: 4,
  },
  titleContainer: {
    marginTop: 20,
    width: "90%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  productName: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 20,
    color: COLORS.theme,
  },
  variantsContainer: {
    width: "90%",
    marginTop: 15,
  },
  variantsTitle: {
    marginBottom: 8,
  },
  variantsList: {
    paddingVertical: 8,
  },
  variantItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
  },
  selectedVariant: {
    backgroundColor: COLORS.theme,
  },
  selectedVariantText: {
    color: "#fff",
  },
  detailsCard: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 10,
    marginTop: 20,
    padding: 1,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 12,
    color: "#333",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderColor: "#ccc",
  },
  detailLabel: {
    fontSize: 16,
    color: "#555",
  },
  detailValue: {
    fontSize: 16,
    color: "#000",
    fontWeight: "500",
  },
  cartContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 30,
  },
  cartButton: {
    padding: 8,
  },
  quantityText: {
    fontSize: 20,
    marginHorizontal: 20,
    fontWeight: "bold",
  },
})

















// import React, { useEffect, useState } from "react";
// import {
//   StyleSheet,
//   View,
//   ScrollView,
//   Image,
//   TouchableOpacity,
//   Dimensions,
// } from "react-native";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import axios from "axios";
// import { useRoute } from "@react-navigation/native";
// import Txt from "../../components/Txt";
// import { COLORS, TxtWeight } from "../../Constants";
// import Header from "../../components/Header";
// import Ionicons from "react-native-vector-icons/MaterialCommunityIcons";
// import { useCart } from "../../context/CartContext";

// const { width } = Dimensions.get("window");

// const ProductDetail = () => {
//   const route = useRoute();
//   const { productId } = route.params; // ensure productId is passed in navigation
//   const [product, setProduct] = useState(null);
//   const [userId, setUserId] = useState(null);
//   const [wishlist, setWishlist] = useState([]);
//   const { addToCart, removeFromCart, cartItems } = useCart();

//   useEffect(() => {
//     getUserId();
//     fetchProductDetail();
//   }, []);

//   const getUserId = async () => {
//     try {
//       const userData = await AsyncStorage.getItem("userData");
//       if (userData) {
//         const parsedUser = JSON.parse(userData);
//         setUserId(parsedUser._id);
//       }
//     } catch (error) {
//       console.error("Error fetching userId:", error);
//     }
//   };

//   const fetchProductDetail = async () => {
//     try {
//       // Update the API endpoint as per your backend
//       const response = await axios.get(
//         `https://pos-api-dot-ancient-episode-256312.de.r.appspot.com/api/v1/product/${productId}`
//       );
//       if (!response.data.error) {
//         setProduct(response.data.data);
//         console.log(response?.data?.data, "product detail data");
        
//       }
//     } catch (error) {
//       console.error("Error fetching product detail:", error);
//     }
//   };

//   const toggleWishlist = async () => {
//     if (!userId || !product) return;
//     try {
//       const response = await axios.post(
//         `https://pos-api-dot-ancient-episode-256312.de.r.appspot.com/api/v1/user/likeUnlikeProducts`,
//         { userId, productId: product._id }
//       );
//       if (!response.data.error) {
//         setWishlist((prev) =>
//           prev.includes(product._id)
//             ? prev.filter((id) => id !== product._id)
//             : [...prev, product._id]
//         );
//       }
//     } catch (error) {
//       console.error("Error toggling wishlist:", error);
//     }
//   };

//   const cartItem = product
//     ? cartItems.find((p) => p._id === product._id)
//     : null;
//   const quantityInCart = cartItem ? cartItem.quantity : 0;
//   const isOutOfStock = product && product.remainingStock === 0;
//   const isMaxReached = product && quantityInCart >= product.remainingStock;

//   if (!product) {
//     return (
//       <View>
//         <Header isBack={true} />
//         <Txt mt={40} center style={styles.loadingText}>
//           Loading product details...
//         </Txt>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <Header isBack={true} />
//       <ScrollView contentContainerStyle={styles.content}>
//         {/* Product Image with wishlist icon */}
//         <View style={styles.imageContainer}>
//           <Image
//             source={{ uri: product.image || "" }}
//             style={styles.productImage}
//           />
//           <TouchableOpacity
//             style={styles.wishlistIcon}
//             onPress={toggleWishlist}
//           >
//             <Ionicons
//               name={wishlist.includes(product._id) ? "heart" : "heart-outline"}
//               size={28}
//               color="red"
//             />
//           </TouchableOpacity>
//         </View>

//         {/* Product Title & Price */}
//         <View style={styles.titleContainer}>
//           <Txt weight={TxtWeight.Bold} size={20}>
//             {product.name}
//           </Txt>
//           <Txt>
//             Rs.{" "}
//             <Txt weight={TxtWeight.Bold} size={20}>
//               {product.salesPrice}
//             </Txt>
//           </Txt>
//         </View>

//         {/* Details Section */}
//         <View style={styles.detailsCard}>
//           <Txt weight={TxtWeight.Semi} size={20}>
//             Product Details
//           </Txt>
//           <View style={styles.detailRow}>
//             <Txt style={styles.detailLabel}>Brand:</Txt>
//             <Txt style={styles.detailValue}>
//               {product.brand && product.brand.name}
//             </Txt>
//           </View>
//           <View style={styles.detailRow}>
//             <Txt style={styles.detailLabel}>Category:</Txt>
//             <Txt style={styles.detailValue}>
//               {product.category && product.category.name}
//             </Txt>
//           </View>
//           {/* <View style={styles.detailRow}>
//             <Txt style={styles.detailLabel}>Company:</Txt>
//             <Txt style={styles.detailValue}>{product.company}</Txt>
//           </View> */}
//           <View style={styles.detailRow}>
//             <Txt style={styles.detailLabel}>Remaining Stock:</Txt>
//             <Txt style={styles.detailValue}>{product.remainingStock}</Txt>
//           </View>
//           {/* <View style={styles.detailRow}>
//             <Txt style={styles.detailLabel}>Rule:</Txt>
//             <Txt style={styles.detailValue}>{product.rule}</Txt>
//           </View> */}
//           {/* <View style={styles.detailRow}>
//             <Txt style={styles.detailLabel}>Expiry Date:</Txt>
//             <Txt style={styles.detailValue}>
//               {new Date(product.expiryDate).toLocaleDateString()}
//             </Txt>
//           </View> */}
//         </View>

//         {/* Cart Controls */}
//         <View style={styles.cartContainer}>
//           <TouchableOpacity
//             onPress={() => removeFromCart(product._id)}
//             disabled={quantityInCart === 0 || isOutOfStock}
//             style={styles.cartButton}
//           >
//             <Ionicons name="minus-circle-outline" size={28} color="black" />
//           </TouchableOpacity>
//           <Txt style={styles.quantityText}>{quantityInCart}</Txt>
//           <TouchableOpacity
//             onPress={() => addToCart(product)}
//             disabled={isMaxReached || isOutOfStock}
//             style={styles.cartButton}
//           >
//             <Ionicons
//               name="plus-circle-outline"
//               size={28}
//               color={isMaxReached || isOutOfStock ? "gray" : "black"}
//             />
//           </TouchableOpacity>
//         </View>
//       </ScrollView>
//     </View>
//   );
// };

// export default ProductDetail;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#fff",
//   },
//   loadingContainer: {
//     flex: 1,
//     paddingTop: 50,
//     backgroundColor: "#fff",
//   },
//   loadingText: {
//     marginTop: 20,
//     fontSize: 16,
//   },
//   content: {
//     padding: 16,
//     paddingBottom: 40,
//     alignItems: "center",
//   },
//   imageContainer: {
//     width: width,
//     height: 250,
//     borderRadius: 10,
//     overflow: "hidden",
//     backgroundColor: COLORS.bgGrey,
//     justifyContent: "center",
//     alignItems: "center",
//     position: "relative",
//   },
//   productImage: {
//     width: "100%",
//     height: "100%",
//     resizeMode: "cover",
//   },
//   wishlistIcon: {
//     position: "absolute",
//     top: 10,
//     right: 10,
//     backgroundColor: "#fff",
//     borderRadius: 20,
//     padding: 4,
//     elevation: 4,
//   },
//   titleContainer: {
//     marginTop: 20,
//     width: "90%",
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//   },
//   productName: {
//     fontSize: 22,
//     fontWeight: "bold",
//     textAlign: "center",
//     marginBottom: 8,
//   },
//   productPrice: {
//     fontSize: 20,
//     color: COLORS.theme,
//   },
//   detailsCard: {
//     width: "90%",
//     backgroundColor: "#fff",
//     borderRadius: 10,
//     marginTop: 20,
//     padding: 1,
//     paddingVertical: 10,
//     // elevation: 1,
//     // shadowColor: "#000"
//     // shadowOpacity: 0.1,
//     // shadowRadius: 5,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     marginBottom: 12,
//     color: "#333",
//   },
//   detailRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     paddingVertical: 10,
//     borderBottomWidth: 0.5,
//     borderColor: "#ccc",
//   },
//   detailLabel: {
//     fontSize: 16,
//     color: "#555",
//   },
//   detailValue: {
//     fontSize: 16,
//     color: "#000",
//     fontWeight: "500",
//   },
//   cartContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginTop: 30,
//   },
//   cartButton: {
//     padding: 8,
//   },
//   quantityText: {
//     fontSize: 20,
//     marginHorizontal: 20,
//     fontWeight: "bold",
//   },
// });
