import React from 'react';
import { StyleSheet, View, Image, TouchableOpacity, Alert } from 'react-native';
import { Layout, Text } from '@ui-kitten/components';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/Ionicons';
import ScreenWrapper from '../../components/ScreenWrapper';
import { RootStackParamList } from '../../types/navigation';
import { useUser } from '../../hooks';
import BrandLogo from '../../components/BrandLogo';
import AppHeader from '../../components/AppHeader';

type NavigationProps = StackNavigationProp<RootStackParamList, 'MenuOperativo'>;

export default function MenuOperativoScreen() {
    const navigation = useNavigation<NavigationProps>();
    const { user, logout } = useUser();

    const onLogout = async () => {
        await logout();
        navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
        });
    }

    const MenuButton = ({ title, iconName, onPress, disabled = false }: { title: string, iconName: string, onPress: () => void, disabled?: boolean }) => (
        <TouchableOpacity
            style={[styles.menuButton, disabled && styles.menuButtonDisabled]}
            onPress={disabled ? undefined : onPress}
            disabled={disabled}
        >
            <View style={[styles.iconContainer, disabled && styles.iconContainerDisabled]}>
                <Icon name={iconName} size={30} color={disabled ? "#A0A0A0" : "#1565C0"} />
            </View>
            <Text style={[styles.menuButtonText, disabled && styles.menuButtonTextDisabled]}>{title}</Text>
        </TouchableOpacity>
    );

    // Verificar si el usuario tiene 8 dígitos
    const isEightDigitUser = user?.codigo ? /^\d{8}$/.test(user.codigo) : false;

    return (
        <ScreenWrapper>
            <AppHeader
                codigoComercializadora={user?.codigocomercializadora || ''}

            />

            <Layout style={styles.container}>

                {/* Sección de Saludo */}
                <View style={styles.greetingSection}>
                    <Text style={styles.greetingTitle}>
                        Hola, {user?.nombre || 'Usuario'}
                    </Text>
                    <Text style={styles.greetingSubtitle}>
                        Bienvenido a tu panel de gestión.
                    </Text>
                </View>

                {/* Grid de Botones */}
                <View style={styles.gridContainer}>
                    <View style={styles.gridRow}>
                        <MenuButton
                            title="Genera tu pedido"
                            iconName="cart-outline"
                            onPress={() => navigation.navigate('NotaPedido')}
                        />
                        {isEightDigitUser ? (
                            <MenuButton
                                title="Valida tus sellos"
                                iconName="checkmark-done-circle-outline"
                                onPress={() => navigation.navigate('ValidaSellos')}
                            />
                        ) : (
                            <MenuButton
                                title="Observa el volumen total"
                                iconName="bar-chart-outline"
                                onPress={() => navigation.navigate('VolumenTotal')}
                            />
                        )}
                    </View>
                    <View style={styles.gridRow}>
                        {isEightDigitUser && (
                            <MenuButton
                                title="Observa el volumen total"
                                iconName="bar-chart-outline"
                                onPress={() => navigation.navigate('VolumenTotal')}
                            />
                        )}
                        {/* 
                        <MenuButton
                            title="Revisa tus pedidos"
                            iconName="eye-outline"
                            onPress={() => navigation.navigate('ListaNotaPedido')}
                        />
                        */}
                    </View>
                </View>

                {/* Footer con Botón Salir y Branding Infinity */}
                <View style={styles.footer}>
                    <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
                        <Icon name="log-out-outline" size={24} color="#374151" style={styles.logoutIcon} />
                        <Text style={styles.logoutText}>Cerrar sesión</Text>
                    </TouchableOpacity>

                    <View style={styles.poweredByContainer}>
                        <Text style={styles.poweredByText}>Powered by</Text>
                        <Image
                            source={require('../../../assets/infinityOne.png')}
                            style={styles.poweredByLogo}
                            resizeMode="contain"
                        />
                    </View>
                </View>

            </Layout>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        paddingHorizontal: 24,
        paddingTop: 20,
    },
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
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerButtonRight: {
        position: 'absolute',
        right: 15,
        zIndex: 10,
        padding: 6,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 40,
        marginTop: 10,
    },
    logoInfinity: {
        width: 100,
        height: 30,
    },
    logoPetrolrios: {
        width: 120,
        height: 40,
    },
    greetingSection: {
        marginBottom: 30,
    },
    greetingTitle: {
        fontSize: 18,
        color: '#1565C0',
        fontWeight: 'bold',
    },
    userName: {
        color: '#1565C0', // El azul del diseño
        fontWeight: 'bold',
    },
    greetingSubtitle: {
        fontSize: 16,
        color: '#6B7280', // Gris suave
        marginTop: 8,
    },
    gridContainer: {
        flex: 1,
    },
    gridRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    menuButton: {
        width: '47%',
        aspectRatio: 1, // Hace que sea cuadrado
        backgroundColor: '#E0F2FE', // Azul muy pálido (Sky 100)
        borderRadius: 24,
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
        // Sombra suave
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    iconContainer: {
        backgroundColor: '#FFFFFF',
        width: 64,
        height: 64,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    menuButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
        textAlign: 'center',
        marginTop: 4,
    },
    footer: {
        marginTop: 'auto',
        marginBottom: 20,
    },
    poweredByContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 25,
    },
    poweredByText: {
        fontSize: 12,
        color: '#9CA3AF',
        marginRight: 8,
        fontWeight: '500',
    },
    poweredByLogo: {
        width: 80,
        height: 24,
        opacity: 0.8,
    },

    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E5E7EB', // Gris claro
        paddingVertical: 16,
        borderRadius: 16,
        width: '100%',
    },
    logoutIcon: {
        marginRight: 10,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
    },
    menuButtonDisabled: {
        backgroundColor: '#F3F4F6', // Un gris más claro para indicar deshabilitado
        borderColor: '#E5E7EB',
        borderWidth: 1,
        shadowOpacity: 0, // Sin sombra
        elevation: 0,
    },
    iconContainerDisabled: {
        backgroundColor: '#E5E7EB', // Gris claro para el fondo del icono
        shadowOpacity: 0,
        elevation: 0,
    },
    menuButtonTextDisabled: {
        color: '#9CA3AF', // Gris para el texto
    },
});
