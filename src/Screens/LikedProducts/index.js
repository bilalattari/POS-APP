import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Txt from "../../components/Txt";
import { COLORS, TxtWeight } from "../../Constants";
import Header from "../../components/Header";
import Ionicons from "react-native-vector-icons/MaterialCommunityIcons";
import { useCart } from "../../context/CartContext";
import { useNavigation } from "@react-navigation/native";

const LikedProducts = () => {
  const [likedProducts, setLikedProducts] = useState([]);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToCart, removeFromCart, cartItems } = useCart();
  const navigation = useNavigation()

  useEffect(() => {
    getUserId();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchLikedProducts();
    }
  }, [userId]);

  const getUserId = async () => {
    try {
      const userData = await AsyncStorage.getItem("userData");
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUserId(parsedUser._id);
      }
    } catch (error) {
      console.error("Error fetching userId:", error);
    }
  };

  const fetchLikedProducts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `https://pos-api-dot-ancient-episode-256312.de.r.appspot.com/api/v1/user/likedProducts?userId=${userId}`
      );
      if (!response.data.error) {
        setLikedProducts(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching liked products:", error);
    }
    setLoading(false);
  };

  const toggleWishlist = async (productId) => {
    try {
      await axios.post(
        `https://pos-api-dot-ancient-episode-256312.de.r.appspot.com/api/v1/user/likeUnlikeProducts`,
        {
          userId: userId,
          productId: productId,
        }
      );
      // Refresh the list after toggling like/unlike
      fetchLikedProducts();
    } catch (error) {
      console.error("Error toggling wishlist:", error);
    }
  };

  const renderProductCard = ({ item }) => {
    const cartItem = cartItems.find((p) => p._id === item._id);
    const quantityInCart = cartItem ? cartItem.quantity : 0;
    const isOutOfStock = item.remainingStock === 0;
    const isMaxReached = quantityInCart >= item.remainingStock;

    return (
      <TouchableOpacity 
      onPress={() =>
        navigation.navigate("ProductDetail", {
          productId: item._id,
        })
      }
      style={styles.productCard}>
        {/* Heart Icon to Unlike */}
        <TouchableOpacity
          onPress={() => toggleWishlist(item._id)}
          style={styles.wishlistIcon}
        >
          <Ionicons name="heart" size={24} color="red" />
        </TouchableOpacity>

        <Image source={{ uri: item.image }} style={styles.productImage} />
        <Txt style={styles.productName}>{item.name}</Txt>
        <Txt style={styles.productPrice}>
          Rs. <Txt weight={TxtWeight.Bold}>{item.salesPrice}</Txt>
        </Txt>

        {/* Quantity Controls */}
        <View style={styles.quantityContainer}>
          <TouchableOpacity
            onPress={() => removeFromCart(item._id)}
            disabled={quantityInCart === 0 || isOutOfStock}
          >
            <Ionicons name="minus-circle-outline" size={24} color="black" />
          </TouchableOpacity>
          <Txt style={styles.quantityText}>{quantityInCart}</Txt>
          <TouchableOpacity
            onPress={() => addToCart(item)}
            disabled={isMaxReached || isOutOfStock}
          >
            <Ionicons
              name="plus-circle-outline"
              size={24}
              color={isMaxReached || isOutOfStock ? "gray" : "black"}
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Header isBack={true} headerTxt={"My Wishlist"} />
      <View style={{ padding: 16 }}>
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.theme} />
        ) : likedProducts.length > 0 ? (
          <FlatList
            data={likedProducts}
            keyExtractor={(item) => item._id}
            numColumns={2}
            columnWrapperStyle={styles.productRow}
            renderItem={renderProductCard}
          />
        ) : (
          <Txt weight={TxtWeight.Regular} style={styles.noDataText}>
            No liked products found.
          </Txt>
        )}
      </View>
    </View>
  );
};

export default LikedProducts;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
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
  },
  wishlistIcon: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 10,
  },
  productImage: {
    height: 120,
    width: 120,
  },
  productName: {
    fontSize: 14,
    marginTop: 10,
    textAlign: "center",
  },
  productPrice: {
    fontSize: 14,
    marginTop: 5,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 10,
  },
  quantityText: {
    fontSize: 16,
    minWidth: 20,
    textAlign: "center",
  },
  noDataText: {
    fontSize: 16,
    color: "gray",
    textAlign: "center",
    marginTop: 20,
  },
});
