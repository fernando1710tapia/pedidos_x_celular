import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Text } from '@ui-kitten/components';
import Icon from 'react-native-vector-icons/Ionicons';
import BrandLogo from './BrandLogo';

interface AppHeaderProps {
    title?: string;
    codigoComercializadora?: string;
    onBackPress?: () => void;
    rightElement?: React.ReactNode;
}

const AppHeader: React.FC<AppHeaderProps> = ({
    title,
    codigoComercializadora,
    onBackPress,
    rightElement
}) => {
    return (
        <View style={styles.header}>
            {onBackPress && (
                <TouchableOpacity
                    style={styles.headerButtonLeft}
                    onPress={onBackPress}
                >
                    <Icon name="chevron-back" size={32} color="#9CA3AF" />
                </TouchableOpacity>
            )}

            <View style={styles.headerCenter}>
                <BrandLogo
                    codigoComercializadora={codigoComercializadora || ''}
                    style={(!title && codigoComercializadora === '0002') ? { width: 280, height: 78 } : undefined}
                />
                {title && (
                    <Text
                        style={[
                            styles.headerTitle,
                            codigoComercializadora === '0002' && { marginTop: -6 }
                        ]}
                        numberOfLines={1}
                    >
                        {title}
                    </Text>
                )}
            </View>

            {rightElement && (
                <View style={styles.headerButtonRight}>
                    {rightElement}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        paddingHorizontal: 15,
        paddingVertical: 0,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 80,
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerButtonLeft: {
        position: 'absolute',
        left: 15,
        zIndex: 10,
        padding: 5,
    },
    headerButtonRight: {
        position: 'absolute',
        right: 15,
        zIndex: 10,
        padding: 6,
    },
    headerTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#9CA3AF',
        textAlign: 'center',
        marginTop: 2, // Subtítulo colgante bajo el logo, funciona para todos los tamaños de logo
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
});

export default AppHeader;
