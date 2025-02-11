import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import axios from 'axios';
import Txt from '../../components/Txt';
import {COLORS, TxtWeight} from '../../Constants';
import Header from '../../components/Header';
import Ionicons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useCart} from '../../context/CartContext';
import {debounce} from 'lodash';

const Search = () => {
  const {addToCart, removeFromCart, cartItems} = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDefaultProducts(); // Fetch 10-20 default products on mount
  }, []);

  useEffect(() => {
    if (searchQuery.length > 1) {
      fetchProductsDebounced(searchQuery);
    } else {
      fetchDefaultProducts(); // Reset to default products if search is cleared
    }
  }, [searchQuery]);

  const fetchDefaultProducts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `https://pos-api-dot-ancient-episode-256312.de.r.appspot.com/api/v1/product?limit=20&page=1`,
      );

      if (!response.data.error) {
        setProducts(response.data.data.docs || []);
        setWishlist(
          response.data.data.docs
            .map(product => (product.isLiked ? product._id : null))
            .filter(Boolean),
        );
      }
    } catch (error) {
      console.error('Error fetching default products:', error);
    }
    setLoading(false);
  };

  const fetchProducts = async query => {
    setLoading(true);
    try {
      const response = await axios.get(
        `https://pos-api-dot-ancient-episode-256312.de.r.appspot.com/api/v1/product?name=${query}`,
      );

      if (!response.data.error) {
        setProducts(response.data.data.docs || []);
        setWishlist(
          response.data.data.docs
            .map(product => (product.isLiked ? product._id : null))
            .filter(Boolean),
        );
      }
    } catch (error) {
      console.error('Error fetching search products:', error);
    }
    setLoading(false);
  };

  const fetchProductsDebounced = debounce(fetchProducts, 500);

  const toggleWishlist = async productId => {
    try {
      const response = await axios.post(
        'https://pos-api-dot-ancient-episode-256312.de.r.appspot.com/api/v1/user/likeUnlikeProducts',
        {productId},
      );

      if (!response.data.error) {
        setWishlist(prev =>
          prev.includes(productId)
            ? prev.filter(id => id !== productId)
            : [...prev, productId],
        );
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Header isBack={true} headerTxt={'Search'} />

      {/* 🔹 Search Input */}
      <View style={styles.searchContainer}>
        <Ionicons name="magnify" size={24} color={COLORS.gray} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search for products..."
          placeholderTextColor={COLORS.theme}
          value={searchQuery}
          onChangeText={text => setSearchQuery(text)}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={22} color={COLORS.gray} />
          </TouchableOpacity>
        )}
      </View>

      {/* 🔹 Product List */}
      <View style={{paddingHorizontal: 16}}>
        <Txt weight={TxtWeight.Semi} mt={20} style={styles.heading}>
          {searchQuery.length > 1 ? 'Search Results' : 'Popular Products'}
        </Txt>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.theme} />
        ) : products.length === 0 ? (
          <Txt style={styles.emptyText}>No products found.</Txt>
        ) : (
          <FlatList
            data={products}
            numColumns={2}
            keyExtractor={item => item._id}
            columnWrapperStyle={styles.productRow}
            renderItem={({item}) => {
              const cartItem = cartItems.find(p => p._id === item._id);

              return (
                <View style={styles.productCard}>
                  {/* Like/Unlike Icon */}
                  <TouchableOpacity
                    onPress={() => toggleWishlist(item._id)}
                    style={styles.wishlistIcon}>
                    <Ionicons
                      name={
                        wishlist.includes(item._id) ? 'heart' : 'heart-outline'
                      }
                      size={24}
                      color="red"
                    />
                  </TouchableOpacity>

                  <Image
                    source={{
                      uri: item.image || 'https://via.placeholder.com/100',
                    }}
                    style={styles.productImage}
                  />
                  <Txt style={styles.productName}>{item.name}</Txt>
                  <Txt style={styles.productPrice}>
                    Rs. <Txt weight={TxtWeight.Bold}>{item.salesPrice}</Txt>
                  </Txt>

                  {/* Add to Cart Button */}
                  <View style={styles.quantityContainer}>
                    <TouchableOpacity onPress={() => removeFromCart(item._id)}>
                      <Ionicons
                        name="minus-circle-outline"
                        size={24}
                        color="red"
                      />
                    </TouchableOpacity>
                    <Txt weight={TxtWeight.Bold}>{cartItem?.quantity || 0}</Txt>
                    <TouchableOpacity onPress={() => addToCart(item)}>
                      <Ionicons
                        name="plus-circle-outline"
                        size={24}
                        color="green"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }}
          />
        )}
      </View>
    </View>
  );
};

export default Search;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
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
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: COLORS.gray,
  },
  productRow: {
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 10,
  },
  productCard: {
    flex: 1,
    backgroundColor: COLORS.bgGrey,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    position: 'relative',
    marginHorizontal: 5,
  },
  wishlistIcon: {
    position: 'absolute',
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
    flexDirection: 'row',
    gap: 20,
  },
});
