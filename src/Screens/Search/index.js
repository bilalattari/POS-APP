import { useEffect, useState } from "react"
import { StyleSheet, View, FlatList, Image, TouchableOpacity, ActivityIndicator, TextInput } from "react-native"
import axios from "axios"
import Txt from "../../components/Txt"
import { COLORS, TxtWeight } from "../../Constants"
import Header from "../../components/Header"
import Ionicons from "react-native-vector-icons/MaterialCommunityIcons"
import { useCart } from "../../context/CartContext"
import { debounce } from "lodash"
import { useNavigation } from "@react-navigation/native"

const Search = () => {
  const { addToCart, removeFromCart, cartItems } = useCart()
  const [searchQuery, setSearchQuery] = useState("")
  const [products, setProducts] = useState([])
  const [processedProducts, setProcessedProducts] = useState([])
  const [wishlist, setWishlist] = useState([])
  const [loading, setLoading] = useState(false)
  const navigation = useNavigation()

  useEffect(() => {
    fetchDefaultProducts() // Fetch 10-20 default products on mount
  }, [])

  useEffect(() => {
    if (searchQuery.length > 1) {
      fetchProductsDebounced(searchQuery)
    } else {
      fetchDefaultProducts() // Reset to default products if search is cleared
    }
  }, [searchQuery])

  // Process products to expand variants
  useEffect(() => {
    const expandedProducts = []

    products.forEach((product) => {
      if (product.productType === "Variant Type Product" && product.variants && product.variants.length > 0) {
        // For variant products, create a separate entry for each variant
        console.log(product , "this is product in expensdedProducts");
        
        product.variants.forEach((variant) => {
          expandedProducts.push({
            ...product,
            _id: `${product._id}-${variant.variantId}`, // Create unique ID for each variant
            displayName: `${product.name} (${variant.variantName})`,
            variantInfo: variant,
            isVariant: true,
            parentProductId: product._id,
            salesPrice: variant.salesPrice,
            remainingStock: variant.remainingStock,
            salesPriceOfCarton: variant.salesPriceOfCarton,
            rule: variant.rule,
          })
        })
      } else {
        // For single products, just add them as is
        expandedProducts.push({
          ...product,
          displayName: product.name,
          isVariant: false,
        })
      }
    })

    setProcessedProducts(expandedProducts)
  }, [products])

  const fetchDefaultProducts = async () => {
    setLoading(true)
    try {
      const response = await axios.get(
        `https://pos-api-dot-ancient-episode-256312.de.r.appspot.com/api/v1/product?limit=20&page=1`,
      )

      if (!response.data.error) {
        setProducts(response.data.data.docs || [])

        // Update wishlist
        const likedProducts = response.data.data.docs
          .map((product) => (product.isLiked ? product._id : null))
          .filter(Boolean)
        setWishlist(likedProducts)
      }
    } catch (error) {
      console.error("Error fetching default products:", error)
    }
    setLoading(false)
  }

  const fetchProducts = async (query) => {
    setLoading(true)
    try {
      const response = await axios.get(
        `https://pos-api-dot-ancient-episode-256312.de.r.appspot.com/api/v1/product?name=${query}`,
      )

      if (!response.data.error) {
        setProducts(response.data.data.docs || [])

        // Update wishlist
        const likedProducts = response.data.data.docs
          .map((product) => (product.isLiked ? product._id : null))
          .filter(Boolean)
        setWishlist(likedProducts)
      }
    } catch (error) {
      console.error("Error fetching search products:", error)
    }
    setLoading(false)
  }

  const fetchProductsDebounced = debounce(fetchProducts, 500)

  const toggleWishlist = async (productId, parentProductId) => {
    // For variants, use the parent product ID for wishlist operations
    const actualProductId = parentProductId || productId

    try {
      const response = await axios.post(
        "https://pos-api-dot-ancient-episode-256312.de.r.appspot.com/api/v1/user/likeUnlikeProducts",
        { productId: actualProductId },
      )

      if (!response.data.error) {
        setWishlist((prev) =>
          prev.includes(actualProductId) ? prev.filter((id) => id !== actualProductId) : [...prev, actualProductId],
        )
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error)
    }
  }

  const renderProductCard = ({ item }) => {
    const isVariant = item.isVariant
    const productId = isVariant ? item.parentProductId : item._id
    const variantId = isVariant ? item.variantInfo.variantId : null

    // Check if this product or its parent is in the wishlist
    const isInWishlist = wishlist.includes(productId)

    // For variants, we need to check if the specific variant is in the cart
    const cartItemId = isVariant ? `${productId}-${variantId}` : item._id
    const cartItem = cartItems.find((p) => p._id === cartItemId)

    const quantityInCart = cartItem ? cartItem.quantity : 0
    const isOutOfStock = Number(item.remainingStock) === 0
    const isMaxReached = quantityInCart >= Number(item.remainingStock)

    return (
      <TouchableOpacity
        style={[styles.productCard, isMaxReached && styles.disabledCard, isVariant && styles.variantCard]}
        onPress={() => {
          navigation.navigate("ProductDetail", {
            productId: productId,
            variantId: variantId,
          })
        }}
      >

        {/* Like/Unlike Icon */}
        <TouchableOpacity onPress={() => toggleWishlist(item._id, item.parentProductId)} style={styles.wishlistIcon}>
          <Ionicons name={isInWishlist ? "heart" : "heart-outline"} size={24} color="red" />
        </TouchableOpacity>

        {/* Product Image */}
        <Image
          source={{
            uri: item.image || "https://via.placeholder.com/100",
          }}
          style={styles.productImage}
        />

        {/* Product Name */}
        <Txt style={styles.productName} numberOfLines={2}>
          {item.displayName}
        </Txt>

        {/* Product Price */}
        <Txt style={styles.productPrice}>
          Rs. <Txt weight={TxtWeight.Bold}>{item.salesPrice}</Txt>
        </Txt>

        {/* Stock Status */}
        {isOutOfStock && <Txt style={styles.outOfStockLabel}>Out of Stock</Txt>}

      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.container}>
      <Header isBack={true} headerTxt={"Search"} />

      {/* 🔹 Search Input */}
      <View style={styles.searchContainer}>
        <Ionicons name="magnify" size={24} color={COLORS.gray} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search for products..."
          placeholderTextColor={COLORS.theme}
          value={searchQuery}
          onChangeText={(text) => setSearchQuery(text)}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={22} color={COLORS.gray} />
          </TouchableOpacity>
        )}
      </View>

      {/* 🔹 Product List */}
      <View style={{ paddingHorizontal: 16 }}>
        <Txt weight={TxtWeight.Semi} mt={20} style={styles.heading}>
          {searchQuery.length > 1 ? "Search Results" : "Popular Products"}
        </Txt>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.theme} />
        ) : processedProducts.length === 0 ? (
          <Txt style={styles.emptyText}>No products found.</Txt>
        ) : (
          <FlatList
            data={processedProducts}
            numColumns={2}
            keyExtractor={(item) => item._id}
            columnWrapperStyle={styles.productRow}
            renderItem={renderProductCard}
          />
        )}
      </View>
    </View>
  )
}

export default Search

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginTop: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 10,
    color: COLORS.black,
  },
  heading: {
    fontSize: 18,
    marginVertical: 10,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: COLORS.gray,
  },
  productRow: {
    justifyContent: "space-between",
    marginBottom: 10,
    gap: 10,
  },
  productCard: {
    flex: 1,
    backgroundColor: COLORS.bgGrey,
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    position: "relative",
    marginHorizontal: 5,
    minHeight: 220,
  },
  variantCard: {
    borderWidth: 1,
    borderColor: COLORS.theme,
    backgroundColor: "#f9f9ff",
  },
  variantBadge: {
    position: "absolute",
    top: 0,
    left: 0,
    backgroundColor: COLORS.theme,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderTopLeftRadius: 8,
    borderBottomRightRadius: 8,
    zIndex: 10,
  },
  variantBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  wishlistIcon: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 10,
  },
  productImage: {
    height: 100,
    width: 100,
    resizeMode: "contain",
    marginTop: 10,
  },
  productName: {
    fontSize: 14,
    marginTop: 10,
    textAlign: "center",
    height: 40,
  },
  productPrice: {
    fontSize: 14,
    marginTop: 5,
  },
  outOfStockLabel: {
    color: "red",
    fontWeight: "bold",
    marginVertical: 5,
  },
  disabledCard: {
    opacity: 0.5,
  },
  viewDetailsButton: {
    backgroundColor: COLORS.theme,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    marginTop: 10,
  },
  viewDetailsText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
})


















// import React, { useEffect, useState } from "react";
// import {
//   StyleSheet,
//   View,
//   FlatList,
//   Image,
//   TouchableOpacity,
//   ActivityIndicator,
//   TextInput,
// } from "react-native";
// import axios from "axios";
// import Txt from "../../components/Txt";
// import { COLORS, TxtWeight } from "../../Constants";
// import Header from "../../components/Header";
// import Ionicons from "react-native-vector-icons/MaterialCommunityIcons";
// import { useCart } from "../../context/CartContext";
// import { debounce } from "lodash";
// import { useNavigation } from "@react-navigation/native";

// const Search = () => {
//   const { addToCart, removeFromCart, cartItems } = useCart();
//   const [searchQuery, setSearchQuery] = useState("");
//   const [products, setProducts] = useState([]);
//   const [wishlist, setWishlist] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const navigation = useNavigation();

//   useEffect(() => {
//     fetchDefaultProducts(); // Fetch 10-20 default products on mount
//   }, []);

//   useEffect(() => {
//     if (searchQuery.length > 1) {
//       fetchProductsDebounced(searchQuery);
//     } else {
//       fetchDefaultProducts(); // Reset to default products if search is cleared
//     }
//   }, [searchQuery]);

//   const fetchDefaultProducts = async () => {
//     setLoading(true);
//     try {
//       const response = await axios.get(
//         `https://pos-api-dot-ancient-episode-256312.de.r.appspot.com/api/v1/product?limit=20&page=1`
//       );

//       if (!response.data.error) {
//         setProducts(response.data.data.docs || []);
//         setWishlist(
//           response.data.data.docs
//             .map((product) => (product.isLiked ? product._id : null))
//             .filter(Boolean)
//         );
//       }
//     } catch (error) {
//       console.error("Error fetching default products:", error);
//     }
//     setLoading(false);
//   };

//   const fetchProducts = async (query) => {
//     setLoading(true);
//     try {
//       const response = await axios.get(
//         `https://pos-api-dot-ancient-episode-256312.de.r.appspot.com/api/v1/product?name=${query}`
//       );

//       if (!response.data.error) {
//         setProducts(response.data.data.docs || []);
//         setWishlist(
//           response.data.data.docs
//             .map((product) => (product.isLiked ? product._id : null))
//             .filter(Boolean)
//         );
//       }
//     } catch (error) {
//       console.error("Error fetching search products:", error);
//     }
//     setLoading(false);
//   };

//   const fetchProductsDebounced = debounce(fetchProducts, 500);

//   const toggleWishlist = async (productId) => {
//     try {
//       const response = await axios.post(
//         "https://pos-api-dot-ancient-episode-256312.de.r.appspot.com/api/v1/user/likeUnlikeProducts",
//         { productId }
//       );

//       if (!response.data.error) {
//         setWishlist((prev) =>
//           prev.includes(productId)
//             ? prev.filter((id) => id !== productId)
//             : [...prev, productId]
//         );
//       }
//     } catch (error) {
//       console.error("Error toggling wishlist:", error);
//     }
//   };
  

//   return (
//     <View style={styles.container}>
//       <Header isBack={true} headerTxt={"Search"} />

//       {/* 🔹 Search Input */}
//       <View style={styles.searchContainer}>
//         <Ionicons name="magnify" size={24} color={COLORS.gray} />
//         <TextInput
//           style={styles.searchInput}
//           placeholder="Search for products..."
//           placeholderTextColor={COLORS.theme}
//           value={searchQuery}
//           onChangeText={(text) => setSearchQuery(text)}
//         />
//         {searchQuery.length > 0 && (
//           <TouchableOpacity onPress={() => setSearchQuery("")}>
//             <Ionicons name="close-circle" size={22} color={COLORS.gray} />
//           </TouchableOpacity>
//         )}
//       </View>

//       {/* 🔹 Product List */}
//       <View style={{ paddingHorizontal: 16 }}>
//         <Txt weight={TxtWeight.Semi} mt={20} style={styles.heading}>
//           {searchQuery.length > 1 ? "Search Results" : "Popular Products"}
//         </Txt>

//         {loading ? (
//           <ActivityIndicator size="large" color={COLORS.theme} />
//         ) : products.length === 0 ? (
//           <Txt style={styles.emptyText}>No products found.</Txt>
//         ) : (
//           <FlatList
//             data={products}
//             numColumns={2}
//             keyExtractor={(item) => item._id}
//             columnWrapperStyle={styles.productRow}
//             renderItem={({ item }) => {
//               const cartItem = cartItems.find((p) => p._id === item._id);

//               return (
//                 <TouchableOpacity
//                   style={styles.productCard}
//                   onPress={() => {
//                     navigation.navigate("ProductDetail", {
//                       productId: item._id,
//                     });
//                   }}
//                 >
//                   {/* Like/Unlike Icon */}
//                   <TouchableOpacity
//                     onPress={() => toggleWishlist(item._id)}
//                     style={styles.wishlistIcon}
//                   >
//                     <Ionicons
//                       name={
//                         wishlist.includes(item._id) ? "heart" : "heart-outline"
//                       }
//                       size={24}
//                       color="red"
//                     />
//                   </TouchableOpacity>

//                   <Image
//                     source={{
//                       uri: item.image || "https://via.placeholder.com/100",
//                     }}
//                     style={styles.productImage}
//                   />
//                   <Txt style={styles.productName}>{item.name}</Txt>
//                   <Txt style={styles.productPrice}>
//                     Rs. <Txt weight={TxtWeight.Bold}>{item.salesPrice}</Txt>
//                   </Txt>

//                   {/* Add to Cart Button */}
//                   <View style={styles.quantityContainer}>
//                     <TouchableOpacity onPress={() => removeFromCart(item._id)}>
//                       <Ionicons
//                         name="minus-circle-outline"
//                         size={24}
//                         color="red"
//                       />
//                     </TouchableOpacity>
//                     <Txt weight={TxtWeight.Bold}>{cartItem?.quantity || 0}</Txt>
//                     <TouchableOpacity onPress={() => addToCart(item)}>
//                       <Ionicons
//                         name="plus-circle-outline"
//                         size={24}
//                         color="green"
//                       />
//                     </TouchableOpacity>
//                   </View>
//                 </TouchableOpacity>
//               );
//             }}
//           />
//         )}
//       </View>
//     </View>
//   );
// };

// export default Search;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#fff",
//   },
//   searchContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#f5f5f5",
//     borderRadius: 8,
//     paddingHorizontal: 12,
//     marginHorizontal: 16,
//     marginTop: 10,
//   },
//   searchInput: {
//     flex: 1,
//     fontSize: 16,
//     padding: 10,
//     color: COLORS.black,
//   },
//   heading: {
//     fontSize: 18,
//     marginVertical: 10,
//   },
//   emptyText: {
//     textAlign: "center",
//     marginTop: 20,
//     fontSize: 16,
//     color: COLORS.gray,
//   },
//   productRow: {
//     justifyContent: "space-between",
//     marginBottom: 10,
//     gap: 10,
//   },
//   productCard: {
//     flex: 1,
//     backgroundColor: COLORS.bgGrey,
//     borderRadius: 8,
//     padding: 12,
//     alignItems: "center",
//     position: "relative",
//     marginHorizontal: 5,
//   },
//   wishlistIcon: {
//     position: "absolute",
//     top: 10,
//     right: 10,
//     zIndex: 10,
//   },
//   productImage: {
//     height: 120,
//     width: 120,
//   },
//   productName: {
//     fontSize: 14,
//     marginTop: 10,
//   },
//   productPrice: {
//     fontSize: 14,
//     marginTop: 5,
//   },
//   quantityContainer: {
//     flexDirection: "row",
//     gap: 20,
//   },
// });
