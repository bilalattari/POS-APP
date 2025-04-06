import React, {createContext, useContext, useState, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CartContext = createContext();

export const CartProvider = ({children}) => {
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    loadCart();
  }, []);

  // Load cart data from AsyncStorage
  const loadCart = async () => {
    try {
      const storedCart = await AsyncStorage.getItem('cart');
      if (storedCart) {
        setCartItems(JSON.parse(storedCart));
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  };

  // Save cart data to AsyncStorage
  const saveCart = async cart => {
    try {
      await AsyncStorage.setItem('cart', JSON.stringify(cart));
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  };

  const clearCart = async () => {
    try {
      await AsyncStorage.removeItem('cart');
      setCartItems([]);
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  };

  const addToCart = product => {
    setCartItems(prev => {
      const existingItem = prev.find(item => item._id === product._id);
      let updatedCart;

      if (existingItem) {
        updatedCart = prev.map(item =>
          item._id === product._id
            ? {...item, quantity: item.quantity + 1}
            : item,
        );
      } else {
        updatedCart = [...prev, {...product, quantity: 1}];
      }

      saveCart(updatedCart);
      return updatedCart;
    });
  };

  const removeFromCart = productId => {
    setCartItems(prev => {
      let updatedCart = prev
        .map(item =>
          item._id === productId
            ? {...item, quantity: item.quantity - 1}
            : item,
        )
        .filter(item => item.quantity > 0); // Remove item if quantity is 0

      saveCart(updatedCart);
      return updatedCart;
    });
  };


  const updateCartItem = (product) => {
    setCartItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex((item) => item._id === product._id)

      if (existingItemIndex !== -1) {
        // Item exists, update it completely
        const updatedItems = [...prevItems]
        updatedItems[existingItemIndex] = {
          ...product,
        }
        return updatedItems
      } else {
        // Item doesn't exist, add it
        return [...prevItems, product]
      }
    })
  }
  return (
    <CartContext.Provider
      value={{cartItems, addToCart, removeFromCart, clearCart , updateCartItem}}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
