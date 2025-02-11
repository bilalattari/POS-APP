import React, {useState} from 'react';
import {Text, StyleSheet, Animated} from 'react-native';
import {COLORS, TxtWeight} from '../Constants';

function Txt({
  size,
  weight,
  color,
  center,
  mt,
  mr,
  mb,
  ml,
  lh,
  style,
  lang,
  underline,
  ...restProps
}) {
  const getFontFamily = weight => {
    if (weight === TxtWeight.Semi) {
      return 'Poppins-SemiBold';
    }
    if (weight === TxtWeight.Bold) {
      return 'Poppins-Bold';
    }
    if (weight === TxtWeight.Medium) {
      return 'Poppins-Medium';
    }
    if (weight === TxtWeight.Regular) {
      return 'Poppins-Regular';
    }
    if (weight === TxtWeight.Light) {
      return 'Poppins-Light';
    }
    return 'Poppins-Medium';
  };
  const allStyles = [
    styles.default,
    style,
    !!color && {color},
    {fontFamily: getFontFamily(weight)},
    !!size && {fontSize: size},
    !!center && {textAlign: 'center'},
    !!mt && {marginTop: mt},
    !!mr && {marginRight: mr},
    !!mb && {marginBottom: mb},
    !!ml && {marginLeft: ml},
    underline && {textDecorationLine: 'underline'},
  ];
  return <Text style={allStyles} {...restProps} />;
}

export default Txt;

const styles = StyleSheet.create({
  default: {
    color: COLORS.borderColor,
    fontSize  : 16
    // lineHeight : 27.4
  },
});
