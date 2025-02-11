import React from 'react';
import {View, TextInput, StyleSheet} from 'react-native';
import {COLORS, Space, TxtWeight} from '../Constants';
import Txt from './Txt';

export const Input = ({
  icon,
  label,
  onChange,
  style,
  input,
  meta,
  placeholder,
  labelFont,
  containerSyle,
  keyboardType,
  required,
  value,
  setValue,
  phoneNumber,
  autoFocus,
  onEndEditing,
  ...inputProps
}) => {
  return (
    <View
      style={[
        {
          marginHorizontal: Space.XL,
          marginVertical : Space.SM,
          zIndex: -12,
        },
        containerSyle,
      ]}>
      {label ? (
        <View style={{flexDirection: 'row'}}>
          <Txt
            size={labelFont ? labelFont : 14}
            mb={2}
            color={COLORS.Black}
            weight={TxtWeight.Medium}>
            {label}
          </Txt>
          {required && (
            <Txt size={20} color={'#F45656'}>
              {''} *
            </Txt>
          )}
        </View>
      ) : null}
      <View style={{flexDirection: 'row'}}>
        {phoneNumber && (
          <View style={styles.phoneNumber}>
            <Txt weight={TxtWeight.Bold}>+92</Txt>
          </View>
        )}

        <TextInput
          placeholderTextColor={COLORS.secondary}
          style={[styles.input, style]}
          placeholder={placeholder}
          keyboardType={keyboardType}
          autoFocus={autoFocus}
          value={value}
          onEndEditing={onEndEditing}
          onChangeText={onChange}
          {...inputProps}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  input: {
    minHeight: 51,
    borderWidth: 1,
    paddingLeft: 12,
    borderColor: COLORS.borderColor,
    borderRadius: 6,
    color: COLORS.Black,
    flex: 1,
    fontFamily: 'Poppins-Regular',
  },

  inputIcon: {
    paddingHorizontal: Space.SM,
  },
  phoneNumber: {
    height: 51,
    width: 50,
    borderColor: COLORS.borderColor,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 5,
  },
  imagesView: {
    borderColor: COLORS.borderColor,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },

  imageUploadView: {
    borderColor: COLORS.skyBlueDark,
    borderWidth: 1,
    backgroundColor: COLORS.lightBlue,
    padding: 4,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
