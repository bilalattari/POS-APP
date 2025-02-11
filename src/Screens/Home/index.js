import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import axios from 'axios';
import {useNavigation} from '@react-navigation/native';
import Txt from '../../components/Txt';
import {COLORS, TxtWeight} from '../../Constants';
import ReanimatedCarousel from 'react-native-reanimated-carousel';
import Ionicons from 'react-native-vector-icons/MaterialCommunityIcons'; // ✅ Correct Import
import Header from '../../components/Header';

const {width} = Dimensions.get('window');

const Home = () => {
  const [banners, setBanners] = useState([
    {
      id: 1,
      image:
        'https://images.unsplash.com/photo-1629198688000-71f23e745b6e?w=800&auto=format&fit=crop&q=60',
    },
    {
      id: 2,
      image:
        'https://images.unsplash.com/photo-1530745342582-0795f23ec976?w=800&auto=format&fit=crop&q=60',
    },
    {
      id: 3,
      image:
        'https://images.unsplash.com/photo-1567365607350-aa8ebcd4e0da?w=800&auto=format&fit=crop&q=60',
    },
  ]);
  const [companies, setCompanies] = useState([]);
  const navigation = useNavigation();

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await axios.get(
        'https://pos-api-dot-ancient-episode-256312.de.r.appspot.com/api/v1/company?limit=9&page=1',
      );
      if (!response.data.error) {
        setCompanies(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const handleCompanyPress = company => {
    navigation.navigate('CompanyDetail', {companyId: company._id}); // ✅ Navigate
  };

  return (
    <View style={styles.container}>
      {/* 🔹 Header */}
      <Header />

      {/* 🔹 Banner Carousel */}
      <View style={{height: 200}}>
        <ReanimatedCarousel
          loop
          pagingEnabled
          width={width - 20}
          style={{height: 200}}
          height={200}
          autoPlay={true}
          autoPlayInterval={3000} // ✅ Adjust autoplay speed
          data={banners}
          scrollAnimationDuration={1000}
          renderItem={({item}) => (
            <Image source={{uri: item.image}} style={styles.bannerImage} />
          )}
        />
      </View>

      {/* 🔹 Companies List - 3 per Row */}
      <Txt weight={TxtWeight.Semi} mt={20} style={styles.heading}>
        Select a Company
      </Txt>
      <FlatList
        data={companies}
        numColumns={3}
        keyExtractor={item => item._id}
        columnWrapperStyle={styles.companyRow}
        renderItem={({item}) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => handleCompanyPress(item)}>
            <Image
              source={{uri: item.companyLogo}}
              style={styles.companyImage}
              resizeMode="contain"
            />
            <Txt numberOfLines={1} style={styles.text}>
              {item.name}
            </Txt>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12, // ✅ Better Spacing
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  logo: {
    fontSize: 22,
    color: COLORS.theme,
  },
  icons: {
    flexDirection: 'row',
    gap: 15,
  },
  bannerImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginVertical: 10,
  },
  heading: {
    fontSize: 18,
    marginVertical: 10,
  },
  companyRow: {
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  card: {
    flex: 1,
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    margin: 5,
  },
  companyImage: {
    width: 50,
    height: 50,
  },
  text: {
    fontSize: 14,
    textAlign: 'center',
  },
});
