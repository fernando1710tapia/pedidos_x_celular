import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

interface BrandLogoProps {
  codigoComercializadora?: string;
  style?: StyleProp<ImageStyle>;
}

const BrandLogo: React.FC<BrandLogoProps> = ({ codigoComercializadora, style }) => {
  let logoSource;




  let logoSize = { width: 150, height: 50 };

  switch (codigoComercializadora) {
    case '0002':
      logoSource = require('../../assets/logoPYS.png');
      logoSize = { width: 220, height: 75 };
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
      style={[logoSize, style]}
      resizeMode="contain"
    />
  );
};

export default BrandLogo;
