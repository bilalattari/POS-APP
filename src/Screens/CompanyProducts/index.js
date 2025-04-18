import { useEffect, useRef, useState } from "react"
import { StyleSheet, View, FlatList, Image, TouchableOpacity, ScrollView } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import axios from "axios"
import { useNavigation, useRoute } from "@react-navigation/native"
import Txt from "../../components/Txt"
import { COLORS, TxtWeight } from "../../Constants"
import Header from "../../components/Header"
import Ionicons from "react-native-vector-icons/MaterialCommunityIcons"
import { useCart } from "../../context/CartContext"


const ITEM_HEIGHT = 100;


const CompanyDetail = () => {
  const route = useRoute()
  const { companyId } = route.params || {}
  const scrollViewRef = useRef(null)
  const brandRefs = useRef({})
  const brandListRef = useRef(null)
  // New ref for companies list
  const companyListRef = useRef(null)

  const { addToCart, removeFromCart, cartItems } = useCart()
  const [brands, setBrands] = useState([])
  const [products, setProducts] = useState([])
  const [wishlist, setWishlist] = useState([])
  const [sections, setSections] = useState([])
  const [selectedBrand, setSelectedBrand] = useState("all")
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState(null)
  const [companies, setCompanies] = useState([])
  const [selectedCompany, setSelectedCompany] = useState(companyId)

  const [sectionTops, setSectionTops] = useState({})
  const flatListRef = useRef(null)

  const scrollToItem = (index) => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
  };

  const navigation = useNavigation()
  useEffect(() => {
    getUserId()
    fetchCompanies()
    // if (companyId) {
    //   setSelectedCompany(companyId);
    // }
  }, [])

  useEffect(() => {
    if (userId) {
      fetchBrands()
    }
  }, [userId])

  useEffect(() => {
    if (selectedCompany) {
      fetchCompanyData(selectedCompany)
    }
    // Scroll the companies list so that the selected company is centered
    const index = companies.findIndex((c) => c._id === selectedCompany)
    if (companyListRef.current && index >= 0) {
      companyListRef.current.scrollToIndex({ index, viewPosition: 0.5 })
    }
  }, [selectedCompany, companies])

  // Handle vertical scrolling for products/brands
  const handleScroll = (event) => {
    const scrollY = event.nativeEvent.contentOffset.y
    if (scrollY <= 50) {
      if (selectedBrand !== "all") {
        setSelectedBrand("all")
        if (brandListRef.current) {
          brandListRef.current.scrollToIndex({ index: 0, animated: true })
        }
      }
      return
    }

    const headerOffset = 50
    let currentBrand = selectedBrand
    let minDiff = Number.MAX_VALUE
    Object.entries(sectionTops).forEach(([brandId, layoutY]) => {
      const diff = Math.abs(layoutY - (scrollY + headerOffset))
      if (diff < minDiff) {
        minDiff = diff
        currentBrand = brandId
      }
    })
    if (currentBrand && currentBrand !== selectedBrand) {
      setSelectedBrand(currentBrand)
      const index = brands.findIndex((b) => b._id === currentBrand)
      if (brandListRef.current && index >= 0) {
        brandListRef.current.scrollToIndex({ index, viewPosition: 0.5 })
      }
    }
  }

  const fetchCompanies = async () => {
    try {
      const response = await axios.get(
        "https://pos-api-dot-ancient-episode-256312.de.r.appspot.com/api/v1/company?limit=9&page=1",
      )
      if (!response.data.error) {
        setCompanies(response.data.data)
      }
    } catch (error) {
      console.error("Error fetching companies:", error)
    }
  }

  const scrollToBrand = (brandId) => {
    setSelectedBrand(brandId)
    const index = brands.findIndex((b) => b._id === brandId)
    if (brandListRef.current && index >= 0) {
      brandListRef.current.scrollToIndex({ index, viewPosition: 0.5 })
    }

    if (brandId === "all") {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: true })
      }
      fetchCompanyData()
    } else {
      const yPos = sectionTops[brandId]
      if (yPos !== undefined && scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: yPos - 50, animated: true })
      }
    }
  }

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

  const fetchCompanyData = async () => {
    setLoading(true)
    try {
      const response = await axios.get(
        `https://pos-api-dot-ancient-episode-256312.de.r.appspot.com/api/v1/company/companyProducts/${selectedCompany}`,
      )

      if (!response.data.error) {
        const brandsData = response.data.data.brands

        // Process each brand's products to expand variant products
        const processedBrandsData = brandsData.map((brand) => {
          const processedProducts = []

          // Process each product
          ;(brand.products || []).forEach((product) => {
            if (product.productType === "Variant Type Product" && product.variants && product.variants.length > 0) {
              // For variant products, create a separate entry for each variant
              product.variants.forEach((variant) => {
                processedProducts.push({
                  ...product,
                  _id: `${product._id}-${variant.variantId}`, // Create unique ID for each variant
                  displayName: `${product.name} (${variant.variantValue})`,
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
              processedProducts.push({
                ...product,
                displayName: product.name,
                isVariant: false,
              })
            }
          })

          return {
            ...brand,
            products: processedProducts,
          }
        })

        const sectionsData = processedBrandsData.map((brand) => ({
          title: brand.name,
          brandId: brand._id,
          data: brand.products || [],
        }))

        setBrands([{ name: "All", _id: "all" }, ...brandsData])
        setSections(sectionsData)

        // Update wishlist
        const allProductIds = processedBrandsData
          .flatMap((brand) => brand.products)
          .map((product) => {
            // For variants, check the parent product's liked status
            if (product.isVariant) {
              return product.isLiked ? product.parentProductId : null
            }
            return product.isLiked ? product._id : null
          })
          .filter(Boolean)

        setWishlist([...new Set(allProductIds)]) // Remove duplicates
      }
    } catch (error) {
      console.error("Error fetching company data:", error)
    }
    setLoading(false)
  }

  const fetchBrands = async () => {
    try {
      const response = await axios.get(
        `https://pos-api-dot-ancient-episode-256312.de.r.appspot.com/api/v1/brand?limit=10&page=1&company=${companyId}`,
      )
      if (!response.data.error && response.data.data.length > 0) {
        setBrands([{ name: "All", _id: "all" }, ...response.data.data])
        setSelectedBrand("all")
        fetchCompanyData()
      }
    } catch (error) {
      console.error("Error fetching brands:", error)
    }
  }

  const toggleWishlist = async (productId, parentProductId) => {
    if (!userId) return

    // For variants, use the parent product ID for wishlist operations
    const actualProductId = parentProductId || productId

    try {
      const response = await axios.post(
        `https://pos-api-dot-ancient-episode-256312.de.r.appspot.com/api/v1/user/likeUnlikeProducts`,
        {
          userId: userId,
          productId: actualProductId,
        },
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
        onPress={() =>
          navigation.navigate("ProductDetail", {
            productId: productId,
            variantId: variantId,
          })
        }
        style={[styles.productCard, isMaxReached && styles.disabledCard, isVariant && styles.variantCard]}
      >

        {/* Wishlist Icon */}
        <TouchableOpacity
          onPress={() => toggleWishlist(item._id, item.parentProductId)}
          style={styles.wishlistIcon}
          disabled={isOutOfStock}
        >
          <Ionicons name={isInWishlist ? "heart" : "heart-outline"} size={24} color="red" />
        </TouchableOpacity>

        {/* Product Image */}
        <Image source={{ uri: item.image || "" }} style={styles.productImage} />

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

        {/* View Details Button */}
        {/* <TouchableOpacity
          style={styles.viewDetailsButton}
          onPress={() =>
            navigation.navigate("ProductDetail", {
              productId: productId,
              variantId: variantId,
            })
          }
        >
          <Txt style={styles.viewDetailsText}>View Details</Txt>
        </TouchableOpacity> */}
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.container}>
      <Header isBack={true} />
      <ScrollView ref={scrollViewRef} onScroll={handleScroll} scrollEventThrottle={16} stickyHeaderIndices={[0]}>
        {/* Companies List */}
        <View
          style={[
            {
              paddingHorizontal: 16,
              paddingVertical: 10,
              backgroundColor: "#fff",
            },
          ]}
        >
          <FlatList
            ref={companyListRef}
            data={companies}
            horizontal
            keyExtractor={(item) => item._id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.companyList}
            onScrollToIndexFailed={(info) => {
              setTimeout(() => {
                flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
              }, 500);
            }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.brandCard, selectedCompany === item._id && styles.selectedBrandCard]}
                onPress={() => setSelectedCompany(item._id)}
              >
                <Txt numberOfLines={1} style={styles.companyText}>
                  {item.name}
                </Txt>
              </TouchableOpacity>
            )}
          />
          <Txt weight={TxtWeight.Semi} style={styles.heading}>
            Select a Brand
          </Txt>

          {/* Brands List */}
          <FlatList
            ref={brandListRef}
            data={brands}
            horizontal
            keyExtractor={(item) => item._id}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.brandCard, selectedBrand === item._id && styles.selectedBrandCard]}
                onPress={() => scrollToBrand(item._id)}
              >
                <Txt numberOfLines={1} style={styles.brandText}>
                  {item.name}
                </Txt>
              </TouchableOpacity>
            )}
            onScrollToIndexFailed={(info) => {
              setTimeout(() => {
                flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
              }, 500);
            }}
          />
        </View>

        {/* Products List */}
        <View style={{ paddingHorizontal: 16 }}>
          {sections?.map((section) => {
            return (
              <View
                key={section.brandId}
                ref={(ref) => (brandRefs.current[section.brandId] = ref)}
                onLayout={(event) => {
                  const layoutY = event.nativeEvent.layout.y
                  setSectionTops((prev) => ({
                    ...prev,
                    [section.brandId]: layoutY,
                  }))
                }}
              >
                <Txt weight={TxtWeight.Bold} mb={10}>
                  {section.title}
                </Txt>
                <FlatList
                  data={section.data}
                  numColumns={2}
                  keyExtractor={(item) => item._id}
                  columnWrapperStyle={styles.productRow}
                  renderItem={renderProductCard}
                  onScrollToIndexFailed={(info) => {
                    setTimeout(() => {
                      flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
                    }, 500);
                  }}
                />
              </View>
            )
          })}
        </View>
      </ScrollView>
    </View>
  )
}

export default CompanyDetail

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
  brandText: {
    fontSize: 14,
    textAlign: "center",
    maxWidth: 100,
  },
  companyText: {
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
  quantityContainer: {
    flexDirection: "row",
    gap: 20,
    marginTop: 10,
  },
  disabledCard: {
    opacity: 0.5,
  },
  outOfStockLabel: {
    color: "red",
    fontWeight: "bold",
    marginVertical: 5,
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
















// import React, { useEffect, useRef, useState } from "react";
// import {
//   StyleSheet,
//   View,
//   FlatList,
//   Image,
//   TouchableOpacity,
//   ScrollView,
// } from "react-native";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import axios from "axios";
// import { useNavigation, useRoute } from "@react-navigation/native";
// import Txt from "../../components/Txt";
// import { COLORS, TxtWeight } from "../../Constants";
// import Header from "../../components/Header";
// import Ionicons from "react-native-vector-icons/MaterialCommunityIcons";
// import { useCart } from "../../context/CartContext";

// const CompanyDetail = () => {
//   const route = useRoute();
//   const { companyId } = route.params;
//   const scrollViewRef = useRef(null);
//   const brandRefs = useRef({});
//   const brandListRef = useRef(null);
//   // New ref for companies list
//   const companyListRef = useRef(null);

//   const { addToCart, removeFromCart, cartItems } = useCart();
//   const [brands, setBrands] = useState([]);
//   const [products, setProducts] = useState([]);
//   const [wishlist, setWishlist] = useState([]);
//   const [sections, setSections] = useState([]);
//   const [selectedBrand, setSelectedBrand] = useState("all");
//   const [loading, setLoading] = useState(true);
//   const [userId, setUserId] = useState(null);
//   const [companies, setCompanies] = useState([]);
//   const [selectedCompany, setSelectedCompany] = useState(companyId);

//   const [sectionTops, setSectionTops] = useState({});

//   const navigation = useNavigation();
//   useEffect(() => {
//     getUserId();
//     fetchCompanies();
//     // if (companyId) {
//     //   setSelectedCompany(companyId);
//     // }
//   }, []);

//   useEffect(() => {
//     if (userId) {
//       fetchBrands();
//     }
//   }, [userId]);

//   useEffect(() => {
//     if (selectedCompany) {
//       fetchCompanyData(selectedCompany);
//     }
//     // Scroll the companies list so that the selected company is centered
//     const index = companies.findIndex((c) => c._id === selectedCompany);
//     if (companyListRef.current && index >= 0) {
//       companyListRef.current.scrollToIndex({ index, viewPosition: 0.5 });
//     }
//   }, [selectedCompany, companies]);

//   // Handle vertical scrolling for products/brands
//   const handleScroll = (event) => {
//     const scrollY = event.nativeEvent.contentOffset.y;
//     if (scrollY <= 50) {
//       if (selectedBrand !== "all") {
//         setSelectedBrand("all");
//         if (brandListRef.current) {
//           brandListRef.current.scrollToIndex({ index: 0, animated: true });
//         }
//       }
//       return;
//     }

//     const headerOffset = 50;
//     let currentBrand = selectedBrand;
//     let minDiff = Number.MAX_VALUE;
//     Object.entries(sectionTops).forEach(([brandId, layoutY]) => {
//       const diff = Math.abs(layoutY - (scrollY + headerOffset));
//       if (diff < minDiff) {
//         minDiff = diff;
//         currentBrand = brandId;
//       }
//     });
//     if (currentBrand && currentBrand !== selectedBrand) {
//       setSelectedBrand(currentBrand);
//       const index = brands.findIndex((b) => b._id === currentBrand);
//       if (brandListRef.current && index >= 0) {
//         brandListRef.current.scrollToIndex({ index, viewPosition: 0.5 });
//       }
//     }
//   };

//   const fetchCompanies = async () => {
//     try {
//       const response = await axios.get(
//         "https://pos-api-dot-ancient-episode-256312.de.r.appspot.com/api/v1/company?limit=9&page=1"
//       );
//       if (!response.data.error) {
//         setCompanies(response.data.data);
//       }
//     } catch (error) {
//       console.error("Error fetching companies:", error);
//     }
//   };

//   const scrollToBrand = (brandId) => {
//     setSelectedBrand(brandId);
//     const index = brands.findIndex((b) => b._id === brandId);
//     if (brandListRef.current && index >= 0) {
//       brandListRef.current.scrollToIndex({ index, viewPosition: 0.5 });
//     }

//     if (brandId === "all") {
//       if (scrollViewRef.current) {
//         scrollViewRef.current.scrollTo({ y: 0, animated: true });
//       }
//       fetchCompanyData();
//     } else {
//       const yPos = sectionTops[brandId];
//       if (yPos !== undefined && scrollViewRef.current) {
//         scrollViewRef.current.scrollTo({ y: yPos - 50, animated: true });
//       }
//     }
//   };

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

//   const fetchCompanyData = async () => {
//     setLoading(true);
//     try {
//       const response = await axios.get(
//         `https://pos-api-dot-ancient-episode-256312.de.r.appspot.com/api/v1/company/companyProducts/${selectedCompany}`
//       );

//       if (!response.data.error) {
//         const brandsData = response.data.data.brands;
//         const sectionsData = brandsData.map((brand) => ({
//           title: brand.name,
//           brandId: brand._id,
//           data: brand.products || [],
//         }));

//         setBrands([{ name: "All", _id: "all" }, ...brandsData]);
//         setSections(sectionsData);

//         setWishlist(
//           brandsData
//             .flatMap((brand) => brand.products)
//             .map((product) => (product.isLiked ? product._id : null))
//             .filter(Boolean)
//         );
//       }
//     } catch (error) {
//       console.error("Error fetching company data:", error);
//     }
//     setLoading(false);
//   };

//   const fetchBrands = async () => {
//     try {
//       const response = await axios.get(
//         `https://pos-api-dot-ancient-episode-256312.de.r.appspot.com/api/v1/brand?limit=10&page=1&company=${companyId}`
//       );
//       if (!response.data.error && response.data.data.length > 0) {
//         setBrands([{ name: "All", _id: "all" }, ...response.data.data]);
//         setSelectedBrand("all");
//         fetchCompanyData();
//       }
//     } catch (error) {
//       console.error("Error fetching brands:", error);
//     }
//   };

//   const fetchProducts = async (brandId) => {
//     setLoading(true);
//     try {
//       const response = await axios.get(
//         `https://pos-api-dot-ancient-episode-256312.de.r.appspot.com/api/v1/product?limit=10&page=1&brand=${brandId}`
//       );
//       if (!response.data.error) {
//         setProducts(response.data.data.docs);
//         setWishlist(
//           response.data.data.docs
//             .map((product) => (product.isLiked ? product._id : null))
//             .filter(Boolean)
//         );
//       }
//     } catch (error) {
//       console.error("Error fetching products:", error);
//     }
//     setLoading(false);
//   };

//   const toggleWishlist = async (productId) => {
//     if (!userId) return;

//     try {
//       const response = await axios.post(
//         `https://pos-api-dot-ancient-episode-256312.de.r.appspot.com/api/v1/user/likeUnlikeProducts`,
//         {
//           userId: userId,
//           productId: productId,
//         }
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
//       <Header isBack={true} />
//       <ScrollView
//         ref={scrollViewRef}
//         onScroll={handleScroll}
//         scrollEventThrottle={16}
//         stickyHeaderIndices={[0]}
//       >
//         {/* Companies List */}
//         <View
//           style={[
//             {
//               paddingHorizontal: 16,
//               paddingVertical: 10,
//               backgroundColor: "#fff",
//             },
//           ]}
//         >
//           <FlatList
//             ref={companyListRef}
//             data={companies}
//             horizontal
//             keyExtractor={(item) => item._id}
//             showsHorizontalScrollIndicator={false}
//             contentContainerStyle={styles.companyList}
//             renderItem={({ item }) => (
//               <TouchableOpacity
//                 style={[
//                   styles.brandCard,
//                   selectedCompany === item._id && styles.selectedBrandCard,
//                 ]}
//                 onPress={() => setSelectedCompany(item._id)}
//               >
//                 <Txt numberOfLines={1} style={styles.companyText}>
//                   {item.name}
//                 </Txt>
//               </TouchableOpacity>
//             )}
//           />
//           <Txt weight={TxtWeight.Semi} style={styles.heading}>
//             Select a Brand
//           </Txt>

//           {/* Brands List */}
//           <FlatList
//             ref={brandListRef}
//             data={brands}
//             horizontal
//             keyExtractor={(item) => item._id}
//             showsHorizontalScrollIndicator={false}
//             renderItem={({ item }) => (
//               <TouchableOpacity
//                 style={[
//                   styles.brandCard,
//                   selectedBrand === item._id && styles.selectedBrandCard,
//                 ]}
//                 onPress={() => scrollToBrand(item._id)}
//               >
//                 <Txt numberOfLines={1} style={styles.brandText}>
//                   {item.name}
//                 </Txt>
//               </TouchableOpacity>
//             )}
//           />
//         </View>

//         {/* Products List */}
//         <View style={{ paddingHorizontal: 16 }}>
//           {sections?.map((section) => {
//             return (
//               <View
//                 key={section.brandId}
//                 ref={(ref) => (brandRefs.current[section.brandId] = ref)}
//                 onLayout={(event) => {
//                   const layoutY = event.nativeEvent.layout.y;
//                   setSectionTops((prev) => ({
//                     ...prev,
//                     [section.brandId]: layoutY,
//                   }));
//                 }}
//               >
//                 <Txt weight={TxtWeight.Bold} mb={10}>
//                   {section.title}
//                 </Txt>
//                 <FlatList
//                   data={section.data}
//                   numColumns={2}
//                   keyExtractor={(item) => item._id}
//                   columnWrapperStyle={styles.productRow}
//                   renderItem={({ item }) => {
//                     const cartItem = cartItems.find((p) => p._id === item._id);
//                     const quantityInCart = cartItem ? cartItem.quantity : 0;
//                     const isOutOfStock = item.remainingStock === 0;
//                     const isMaxReached = quantityInCart >= item.remainingStock;
//                     return (
//                       <TouchableOpacity
//                         onPress={() =>
//                           navigation.navigate("ProductDetail", {
//                             productId: item._id,
//                           })
//                         }
//                         style={[
//                           styles.productCard,
//                           isMaxReached && styles.disabledCard,
//                         ]}
//                       >
//                         <TouchableOpacity
//                           onPress={() => toggleWishlist(item._id)}
//                           style={styles.wishlistIcon}
//                           disabled={isOutOfStock}
//                         >
//                           <Ionicons
//                             name={
//                               wishlist.includes(item._id)
//                                 ? "heart"
//                                 : "heart-outline"
//                             }
//                             size={24}
//                             color="red"
//                           />
//                         </TouchableOpacity>
//                         <Image
//                           source={{ uri: item.image || "" }}
//                           style={styles.productImage}
//                         />
//                         <Txt style={styles.productName}>{item.name}</Txt>
//                         <Txt style={styles.productPrice}>
//                           Rs.{" "}
//                           <Txt weight={TxtWeight.Bold}>{item.salesPrice}</Txt>
//                         </Txt>
//                         {isMaxReached && (
//                           <Txt style={styles.outOfStockLabel}>Out of Stock</Txt>
//                         )}
//                         <View style={styles.quantityContainer}>
//                           <TouchableOpacity
//                             onPress={() => removeFromCart(item._id)}
//                             disabled={quantityInCart === 0 || isOutOfStock}
//                           >
//                             <Ionicons
//                               name="minus-circle-outline"
//                               size={24}
//                               color="black"
//                             />
//                           </TouchableOpacity>
//                           <Txt>{quantityInCart}</Txt>
//                           <TouchableOpacity
//                             onPress={() => addToCart(item)}
//                             disabled={isMaxReached || isOutOfStock}
//                           >
//                             <Ionicons
//                               name="plus-circle-outline"
//                               size={24}
//                               color={
//                                 isMaxReached || isOutOfStock ? "gray" : "black"
//                               }
//                             />
//                           </TouchableOpacity>
//                         </View>
//                       </TouchableOpacity>
//                     );
//                   }}
//                 />
//               </View>
//             );
//           })}
//         </View>
//       </ScrollView>
//     </View>
//   );
// };

// export default CompanyDetail;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#fff",
//   },
//   heading: {
//     fontSize: 18,
//     marginVertical: 10,
//   },
//   brandCard: {
//     padding: 10,
//     backgroundColor: "#f5f5f5",
//     borderRadius: 8,
//     alignItems: "center",
//     marginRight: 10,
//   },
//   selectedBrandCard: {
//     borderColor: COLORS.theme,
//     borderWidth: 2,
//   },
//   brandText: {
//     fontSize: 14,
//     textAlign: "center",
//     maxWidth: 100,
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
//   disabledCard: {
//     opacity: 0.5,
//   },
//   outOfStockLabel: {
//     color: "red",
//     fontWeight: "bold",
//     marginVertical: 5,
//   },
// });
