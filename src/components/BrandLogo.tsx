import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

interface BrandLogoProps {
  codigoComercializadora?: string;
  style?: StyleProp<ImageStyle>;
}

const BrandLogo: React.FC<BrandLogoProps> = ({ codigoComercializadora, style }) => {
  let logoSource;




  let logoSize = { width: 150, height: 50 };

  switch (codigoComercializadora?.trim()) {
    case '0002':
      logoSource = require('../../assets/logo0002.png');
      logoSize = { width: 220, height: 65 };
      break;
    case '0008':
      logoSource = require('../../assets/logo0008.png');
      break;
    case '7011':
      logoSource = require('../../assets/logo7011.jpeg');
      break;
    case '0095':
      logoSource = require('../../assets/logo0095.jpeg');
      break;
    case '0061':
      logoSource = require('../../assets/logo0061.jpeg');
      break;
    case '0010':
      logoSource = require('../../assets/logo0010.png');
      break;
    case '0029':
      logoSource = require('../../assets/logo0029.png');
      break;
    case '7017':
      logoSource = require('../../assets/logo7017.png');
      break;
    default:
      logoSource = require('../../assets/infinityOne.png');
      break;
  }

  return (
    <Image
      source={logoSource}
      style={[logoSize, style, { alignSelf: 'center' }]}
      resizeMode="contain"
    />
  );
};

export default BrandLogo;
