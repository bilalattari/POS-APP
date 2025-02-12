import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  findNodeHandle,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRoute } from "@react-navigation/native";
import Txt from "../../components/Txt";
import { COLORS, TxtWeight } from "../../Constants";
import Header from "../../components/Header";
import Ionicons from "react-native-vector-icons/MaterialCommunityIcons";
import { useCart } from "../../context/CartContext";

const CompanyDetail = () => {
  const route = useRoute();
  const { companyId } = route.params;
  const scrollViewRef = useRef(null);
  const brandRefs = useRef({});

  const { addToCart, removeFromCart, cartItems } = useCart();
  const [brands, setBrands] = useState([]);
  const [products, setProducts] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    getUserId();
  }, []);

  useEffect(() => {
    console.log("all products =>", products);
  }, [products]);

  useEffect(() => {
    if (userId) {
      fetchBrands();
    }
  }, [userId]);

  const scrollToBrand = (brandId) => {
    setSelectedBrand(brandId);
    if (brandId === "all") {
      fetchCompanyData();
    } else {
      fetchProducts(brandId);
    }

    const node = findNodeHandle(brandRefs.current[brandId]);
    if (node && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: node - 50, animated: true });
    }
  };

  // useEffect(() => {
  //   if (selectedBrand && userId) {
  //     fetchProducts(selectedBrand);
  //   }
  // }, [selectedBrand, userId]);

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

  const fetchCompanyData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `https://pos-api-dot-ancient-episode-256312.de.r.appspot.com/api/v1/company/companyProducts/${companyId}`
      );

      if (!response.data.error) {
        const brandsData = response.data.data.brands;
        const sectionsData = brandsData.map((brand) => ({
          title: brand.name,
          brandId: brand._id,
          data: brand.products || [],
        }));

        setBrands([{ name: "All", _id: "all" }, ...brandsData]);
        setSections(sectionsData);

        // Extract wishlist products
        setWishlist(
          brandsData
            .flatMap((brand) => brand.products)
            .map((product) => (product.isLiked ? product._id : null))
            .filter(Boolean)
        );
      }
    } catch (error) {
      console.error("Error fetching company data:", error);
    }
    setLoading(false);
  };

  const fetchBrands = async () => {
    try {
      const response = await axios.get(
        `https://pos-api-dot-ancient-episode-256312.de.r.appspot.com/api/v1/brand?limit=10&page=1&company=${companyId}`
      );
      if (!response.data.error && response.data.data.length > 0) {
        let fetchBrands = response.data.data;
        setBrands([{ name: "All", _id: "all" }, ...response.data.data]);
        setSelectedBrand("all");
        fetchCompanyData();
      }
    } catch (error) {
      console.error("Error fetching brands:", error);
    }
  };

  const fetchProducts = async (brandId) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `https://pos-api-dot-ancient-episode-256312.de.r.appspot.com/api/v1/product?limit=10&page=1&brand=${brandId}`
      );
      if (!response.data.error) {
        setProducts(response.data.data.docs);
        setWishlist(
          response.data.data.docs
            .map((product) => (product.isLiked ? product._id : null))
            .filter(Boolean)
        );
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
    setLoading(false);
  };

  const toggleWishlist = async (productId) => {
    if (!userId) return;

    try {
      const response = await axios.post(
        `https://pos-api-dot-ancient-episode-256312.de.r.appspot.com/api/v1/user/likeUnlikeProducts`,
        {
          userId: userId,
          productId: productId,
        }
      );

      if (!response.data.error) {
        setWishlist(
          (prev) =>
            prev.includes(productId)
              ? prev.filter((id) => id !== productId) // Remove from wishlist
              : [...prev, productId] // Add to wishlist
        );
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Header isBack={true} />
      <ScrollView>
        {/* 🔹 Brands List */}
        <View style={{ paddingHorizontal: 16 }}>
          <Txt weight={TxtWeight.Semi} style={styles.heading}>
            Select a Brand
          </Txt>
          <FlatList
            data={brands}
            horizontal
            keyExtractor={(item) => item._id}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.brandCard,
                  selectedBrand === item._id && styles.selectedBrandCard,
                ]}
                onPress={() => scrollToBrand(item._id)}
              >
                <Txt numberOfLines={1} style={styles.brandText}>
                  {item.name}
                </Txt>
              </TouchableOpacity>
            )}
          />
        </View>

        <View style={{ paddingHorizontal: 16 }}>
          <Txt weight={TxtWeight.Semi} mt={20} style={styles.heading}>
            Products
          </Txt>
          {loading ? (
            <ActivityIndicator size="large" color={COLORS.theme} />
          ) : (
            <View>
              {sections
                ?.filter(
                  (section) =>
                    section.brandId === selectedBrand || selectedBrand === "all"
                )
                ?.map((section) => {
                  return (
                    <View
                      key={section.brandId}
                      ref={(ref) => (brandRefs.current[section.brandId] = ref)}
                    >
                      <Txt weight={TxtWeight.Bold} mb={10}>
                        {section.title}
                      </Txt>

                      <FlatList
                        data={section.data}
                        numColumns={2}
                        keyExtractor={(item) => item._id}
                        columnWrapperStyle={styles.productRow}
                        renderItem={({ item }) => {
                          const cartItem = cartItems.find(
                            (p) => p._id === item._id
                          );
                          const quantityInCart = cartItem
                            ? cartItem.quantity
                            : 0;
                          const isOutOfStock = item.remainingStock === 0;
                          const isMaxReached =
                            quantityInCart >= item.remainingStock;

                          return (
                            <View
                              style={[
                                styles.productCard,
                                isMaxReached && styles.disabledCard,
                              ]}
                            >
                              {/* Like/Unlike Icon */}
                              <TouchableOpacity
                                onPress={() => toggleWishlist(item._id)}
                                style={styles.wishlistIcon}
                                disabled={isOutOfStock}
                              >
                                <Ionicons
                                  name={
                                    wishlist.includes(item._id)
                                      ? "heart"
                                      : "heart-outline"
                                  }
                                  size={24}
                                  color="red"
                                />
                              </TouchableOpacity>

                              <Image
                                source={{ uri: item.image || ""}}
                                style={styles.productImage}
                              />
                              <Txt style={styles.productName}>{item.name}</Txt>
                              <Txt style={styles.productPrice}>
                                Rs.{" "}
                                <Txt weight={TxtWeight.Bold}>
                                  {item.salesPrice}
                                </Txt>
                              </Txt>

                              {/* Show "Out of Stock" Label */}
                              {isMaxReached && (
                                <Txt style={styles.outOfStockLabel}>
                                  Out of Stock
                                </Txt>
                              )}

                              {/* Quantity Controls */}
                              <View style={styles.quantityContainer}>
                                <TouchableOpacity
                                  onPress={() => removeFromCart(item._id)}
                                  disabled={
                                    quantityInCart === 0 || isOutOfStock
                                  }
                                >
                                  <Ionicons
                                    name="minus-circle-outline"
                                    size={24}
                                    color="black"
                                  />
                                </TouchableOpacity>

                                <Txt>{quantityInCart}</Txt>

                                <TouchableOpacity
                                  onPress={() => addToCart(item)}
                                  disabled={isMaxReached || isOutOfStock}
                                >
                                  <Ionicons
                                    name="plus-circle-outline"
                                    size={24}
                                    color={
                                      isMaxReached || isOutOfStock
                                        ? "gray"
                                        : "black"
                                    }
                                  />
                                </TouchableOpacity>
                              </View>
                            </View>
                          );
                        }}
                      />
                    </View>
                  );
                })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* 🔹 Products List */}
    </View>
  );
};

export default CompanyDetail;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  heading: {
    fontSize: 18,
    marginVertical: 10,
  },
  brandCard: {
    padding: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    alignItems: "center",
    marginRight: 10,
  },
  selectedBrandCard: {
    borderColor: COLORS.theme,
    borderWidth: 2,
  },
  brandImage: {
    width: 50,
    height: 50,
  },
  brandText: {
    fontSize: 14,
    textAlign: "center",
    maxWidth: 100,
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
  },
  productPrice: {
    fontSize: 14,
    marginTop: 5,
  },
  quantityContainer: {
    flexDirection: "row",
    gap: 20,
  },
  disabledCard: {
    opacity: 0.5,
  },
  outOfStockLabel: {
    color: "red",
    fontWeight: "bold",
    marginVertical: 5,
  },
});
