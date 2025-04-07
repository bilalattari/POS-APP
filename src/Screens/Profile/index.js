import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Txt from '../../components/Txt';
import {COLORS, TxtWeight} from '../../Constants';
import Header from '../../components/Header';
import Ionicons from 'react-native-vector-icons/MaterialCommunityIcons';
import {TabView, SceneMap, TabBar} from 'react-native-tab-view';

const ProfileScreen = () => {
  const [userId, setUserId] = useState(null);
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    {key: 'orders', title: 'Orders'},
    {key: 'credit', title: 'Credit'},
    {key: 'payments', title: 'Payments'},
    // {key: 'userOrders', title: 'User Orders'},
  ]);

  useEffect(() => {
    getUserId();
  }, []);

  const getUserId = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUserId(parsedUser?._id);
      }
    } catch (error) {
      console.error('Error fetching userId:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Header isBack={true} headerTxt="Profile" showLogout={true} />
      <TabView
        navigationState={{index, routes}}
        renderScene={SceneMap({
          orders: () => <OrdersTab userId={userId} />,
          credit: () => <CreditTab userId={userId} />,
          payments: () => <PaymentsTab userId={userId} />
        //   userOrders: () => <UserOrdersTab userId={userId} />,
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

export default ProfileScreen;

// 🔹 **Orders Tab**
const OrdersTab = ({userId}) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
console.log(orders , "==> this is orders");

  useEffect(() => {
    if (userId) fetchOrders();
  }, [userId]);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(
        `https://pos-api-dot-ancient-episode-256312.de.r.appspot.com/api/v1/user/user-info?userId=${userId}&type=orderHistory`,
      );
      if (!response.data.error) {
        setOrders(response.data.data.orders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
    setLoading(false);
  };

  return (
    <View style={styles.tabContainer}>
      <Txt weight={TxtWeight.Semi} style={styles.heading}>
        Order History
      </Txt>
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.theme} />
      ) : orders.length > 0 ? (
        <FlatList
          data={orders}
          keyExtractor={item => item?._id}
          renderItem={({item}) => (
            <View style={styles.orderCard}>
              <Txt weight={TxtWeight.Semi}>Invoice : {item?.invoiceNumber || item?._id}</Txt>
              <Txt>Status: {item?.orderStatus}</Txt>

              {/* 🔹 Ordered Items */}
              <FlatList
                data={item.products}
                keyExtractor={product => product?.product?._id}
                renderItem={({item: product}) => (
                  <View style={styles.productCard}>
                    <Image
                      source={{uri: product?.product?.image}}
                      style={styles.productImage}
                    />
                    <View style={styles.productDetails}>
                      <Txt weight={TxtWeight.Medium}>
                        {product?.product?.name}
                      </Txt>
                      <Txt>Qty: {product?.quantity}</Txt>
                      <Txt>Price: Rs. {product?.unitPrice}</Txt>
                    </View>
                  </View>
                )}
              />
            </View>
          )}
        />
      ) : (
        <Txt>No Orders Found</Txt>
      )}
    </View>
  );
};

// 🔹 **Credit Tab**
const CreditTab = ({userId}) => {
  const [credit, setCredit] = useState(0);

  useEffect(() => {
    if (userId) fetchCredit();
  }, [userId]);

  const fetchCredit = async () => {
    try {
      const response = await axios.get(
        `https://pos-api-dot-ancient-episode-256312.de.r.appspot.com/api/v1/user/user-info?userId=${userId}&type=userCredit`,
      );
      if (!response.data.error) setCredit(response.data.data.totalCredit);
    } catch (error) {
      console.error('Error fetching credit:', error);
    }
  };

  return (
    <View style={styles.tabContainer}>
      <Txt weight={TxtWeight.Semi} style={styles.heading}>
        Remaining Credit
      </Txt>
      <Txt>Rs. {credit}</Txt>
    </View>
  );
};

// 🔹 **Payments Tab**
const PaymentsTab = ({userId}) => {
  const [paymentSummary, setPaymentSummary] = useState({
    totalPaid: 0,
    totalUnpaid: 0,
  });

  useEffect(() => {
    if (userId) fetchPayments();
  }, [userId]);

  const fetchPayments = async () => {
    try {
      const response = await axios.get(
        `https://pos-api-dot-ancient-episode-256312.de.r.appspot.com/api/v1/user/user-info?userId=${userId}&type=paymentSummary`,
      );
      if (!response.data.error)
        setPaymentSummary(response.data.data.paymentSummary);
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  return (
    <View style={styles.tabContainer}>
      <Txt weight={TxtWeight.Semi} style={styles.heading}>
        Payment Summary
      </Txt>
      <Txt>Total Paid: Rs. {paymentSummary.totalPaid}</Txt>
      <Txt>Total Unpaid: Rs. {paymentSummary.totalUnpaid}</Txt>
    </View>
  );
};

// 🔹 **User Orders Tab**
const UserOrdersTab = ({userId}) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) fetchUserOrders();
  }, [userId]);

  const fetchUserOrders = async () => {
    try {
      const response = await axios.get(
        `https://pos-api-dot-ancient-episode-256312.de.r.appspot.com/api/v1/user/user-info?userId=${userId}&type=userOrders`,
      );
      if (!response.data.error) setOrders(response.data.data.orders);
    } catch (error) {
      console.error('Error fetching user orders:', error);
    }
    setLoading(false);
  };

  return (
    <View style={styles.tabContainer}>
      <Txt weight={TxtWeight.Semi} style={styles.heading}>
        User Orders
      </Txt>
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.theme} />
      ) : orders.length > 0 ? (
        <FlatList
          data={orders}
          keyExtractor={item => item._id}
          renderItem={({item}) => (
            <View style={styles.card}>
              <Txt>Order ID: {item._id}</Txt>
              <Txt>Status: {item.orderStatus}</Txt>
            </View>
          )}
        />
      ) : (
        <Txt>No User Orders Found</Txt>
      )}
    </View>
  );
};

// 🔹 **Header with Logout**
// const Header = ({headerTxt, showLogout}) => {
//   const handleLogout = async () => {
//     await AsyncStorage.removeItem('userData'); // Clear user data
//   };

//   return (
//     <View style={styles.header}>
//       <Txt weight={TxtWeight.Bold} style={styles.headerText}>
//         {headerTxt}
//       </Txt>
//       {showLogout && (
//         <TouchableOpacity onPress={handleLogout}>
//           <Ionicons name="logout" size={24} color="red" />
//         </TouchableOpacity>
//       )}
//     </View>
//   );
// };

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},
  tabContainer: {flex: 1, padding: 16},
  heading: {fontSize: 18, marginBottom: 10},
  card: {
    padding: 10,
    backgroundColor: '#f5f5f5',
    marginBottom: 10,
    borderRadius: 5,
  },
  header: {flexDirection: 'row', justifyContent: 'space-between', padding: 16},
  headerText: {fontSize: 18},
  tabBar: {backgroundColor: COLORS.theme},
  tabIndicator: {backgroundColor: '#fff'},
  orderCard: {
    padding: 12,
    backgroundColor: COLORS.bgGrey,
    borderRadius: 8,
    marginBottom: 10,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  productImage: {
    width: 50,
    height: 50,
    borderRadius: 5,
  },
  productDetails: {
    marginLeft: 10,
  },
});
