import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

interface BrandLogoProps {
  codigoComercializadora?: string;
  style?: StyleProp<ImageStyle>;
}

const BrandLogo: React.FC<BrandLogoProps> = ({ codigoComercializadora, style }) => {
  let logoSource;




  switch (codigoComercializadora) {
    case '0002':
      logoSource = require('../../assets/logoPYS.png');
      break;
    case '0008':
      logoSource = require('../../assets/logo.png');
      break;
    case '7011':
      logoSource = require('../../assets/ecucomsa.jpeg');
      break;
    default:
      logoSource = require('../../assets/infinityOne.png');
      break;
  }

  return (
    <Image
      source={logoSource}
      style={[{ width: 120, height: 40 }, style]}
      resizeMode="contain"
    />
  );
};

export default BrandLogo;
