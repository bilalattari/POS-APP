import React from 'react';
import {StyleSheet, TouchableOpacity, ActivityIndicator} from 'react-native';
import {COLORS, Space, TxtSize, TxtWeight} from '../Constants';
import Txt from './Txt';
export const Btn = ({
  children,
  onPress,
  txtStyle,
  style,
  loading,
  disabled,
  txtWeight,
  txtColor,
  txtSize,
}) => {
  return (
    <TouchableOpacity
      disabled={loading || disabled}
      activeOpacity={0.8}
      style={[
        styles.touchableBtn,
        style,
        (loading || disabled) && {backgroundColor: '#e3d5c5'},
      ]}
      onPress={onPress}>
      {loading && (
        <ActivityIndicator color={'white'} style={{marginRight: 12}} />
      )}
      <Txt
        color={
          loading || disabled ? '#fff' : txtColor ? txtColor : COLORS.white
        }
        size={txtSize ? txtSize : TxtSize.LG - 2}
        weight={txtWeight ? txtWeight : TxtWeight.Medium}
        style={[txtStyle]}>
        {children}
      </Txt>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  touchableBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.theme,
    height: 43,
    marginHorizontal: Space.XL,
    flexDirection: 'row',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
