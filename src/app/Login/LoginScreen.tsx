import { Button, Input, Layout, Text, Icon, IndexPath } from '@ui-kitten/components';
import CryptoJS from 'crypto-js';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Image, TouchableOpacity, View, TouchableWithoutFeedback, KeyboardAvoidingView, ScrollView, Platform, StyleSheet, Linking, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Constants from 'expo-constants';
import ScreenWrapper from '../../components/ScreenWrapper';
import { API_CONFIG } from '../../constants/Config';
import { useUser } from '../../hooks';
import { loginServices, searchUserInAllEnvironments, searchDistributorEnvironments } from '../../services/Login/loginServices';
import { loginStyles } from '../../styles';
import { ApiResponse, UserInterface } from '../../types';
import { RootStackParamList } from '../../types/navigation';

// AsegÃºrate de tener estos tipos

type FormData = {
    username: string;
    password: string;
};
type NavigationProps = StackNavigationProp<RootStackParamList, 'Login'>;

const LOGOS: Record<string, any> = {
    '0002': require('../../../assets/logo0002.png'),
    '0008': require('../../../assets/logo0008.png'),
    '0095': require('../../../assets/logo0095.jpeg'),
    '7011': require('../../../assets/logo7011.jpeg'),
    '0061': require('../../../assets/logo0061.jpeg'),
    'default': require('../../../assets/infinityOne.png')
};

export default function LoginScreen() {
    const { control, handleSubmit, formState: { errors } } = useForm<FormData>();
    const navigation = useNavigation<NavigationProps>();
    const { setUser } = useUser();
    const [secureTextEntry, setSecureTextEntry] = React.useState(true);
    const [commercializerCode, setCommercializerCode] = React.useState<string | null>(null);
    const [isSearchingUser, setIsSearchingUser] = React.useState(false);
    const [alertModal, setAlertModal] = React.useState({
        visible: false,
        title: '',
        message: '',
        type: 'success' // 'success' o 'error'
    });
    const [distributorEnvironments, setDistributorEnvironments] = React.useState<Array<{ baseUrl: string; name: string; codigocomercializadora: string; user: UserInterface }>>([]);
    const [selectedEnvironmentIndex, setSelectedEnvironmentIndex] = React.useState<IndexPath | null>(null);
    const [comboOpen, setComboOpen] = React.useState(false);

    const toggleSecureEntry = () => {
        setSecureTextEntry(!secureTextEntry);
    };

    const handleUserBlur = async (username: string) => {
        if (!username) return;
        setIsSearchingUser(true);
        // Reiniciamos los estados de distribuidores por si cambian de usuario
        setDistributorEnvironments([]);
        setSelectedEnvironmentIndex(null);

        const isEightDigitUser = /^\d{8}$/.test(username);

        try {
            if (isEightDigitUser) {
                // Buscamos en todos los ambientes para distribuidor
                const environments = await searchDistributorEnvironments(username);
                setDistributorEnvironments(environments);
                // NO cambiamos el logo todavÃ­a
            } else {
                // Comportamiento original para administradores
                const { baseUrl, user } = await searchUserInAllEnvironments(username);
                API_CONFIG.BASE_URL = baseUrl;

                const code = user.codigocomercializadora ? String(user.codigocomercializadora).trim() : null;
                if (code && LOGOS[code]) {
                    setCommercializerCode(code);
                } else {
                    setCommercializerCode('default');
                }
            }
        } catch (error: any) {
            setAlertModal({
                visible: true,
                title: 'Usuario no encontrado',
                message: 'No pudimos localizar este usuario en ningÃºn ambiente.',
                type: 'error'
            });
            setCommercializerCode('default');
        } finally {
            setIsSearchingUser(false);
        }
    };

    const renderPersonIcon = (props: any) => (
        <Icon {...props} name='person-outline' fill='#B0B8C8' />
    );

    const renderLockIcon = (props: any) => (
        <Icon {...props} name='lock-outline' fill='#B0B8C8' />
    );

    const renderEyeIcon = (props: any) => (
        <TouchableWithoutFeedback onPress={toggleSecureEntry}>
            <Icon {...props} name={secureTextEntry ? 'eye-off-outline' : 'eye-outline'} fill='#B0B8C8' />
        </TouchableWithoutFeedback>
    );
    const renderInfoIcon = (props: any) => (
        <Icon {...props} name='info-outline' fill='#33C5F6' style={{ width: 20, height: 20 }} />
    );

    // FT. PARA INICIALIZAR EL USUARIO A NULL
    React.useEffect(() => {
        setUser(null); // Limpia el usuario en memoria
        //Alert.alert('Error', 'react.useeffect->setuser(null)');
    }, []);


    const onLogin = async (data: FormData) => {
        try {
            const isEightDigitUser = /^\d{8}$/.test(data.username);

            if (isEightDigitUser) {
                if (distributorEnvironments.length > 0 && !selectedEnvironmentIndex) {
                    setAlertModal({
                        visible: true,
                        title: 'SelecciÃ³n Requerida',
                        message: 'Debe seleccionar una comercializadora de la lista antes de continuar.',
                        type: 'error'
                    });
                    return;
                }

                if (selectedEnvironmentIndex) {
                    API_CONFIG.BASE_URL = distributorEnvironments[selectedEnvironmentIndex.row].baseUrl;
                }
            }

            // Encripta la contraseÃ±a con SHA-256
            const encryptedPassword = CryptoJS.SHA256(data.password).toString(CryptoJS.enc.Hex);

            const response = await loginServices.getResource<ApiResponse<UserInterface>>(
                'usuario/login',
                '',
                { user: data.username, password: encryptedPassword }
            );
            if (response.retorno !== null && response.retorno !== undefined) {
                const user = response.retorno.length > 0 ? response.retorno[0] : null;
                setUser(user);

                if (user && !user.habilitadoapp) {
                    setAlertModal({
                        visible: true,
                        title: '¡Lo sentimos!',
                        message: '¡InfinityOne APP No está disponible para usted!',
                        type: 'error'
                    });
                    return;
                }

                if (encryptedPassword === CryptoJS.SHA256(API_CONFIG.FIRST_ACCES).toString(CryptoJS.enc.Hex)) {
                    navigation.navigate('RecuperarClave');
                } else {

                    const hasComercializadora = user?.codigocomercializadora != null && String(user.codigocomercializadora).trim() !== '';
                    if (!hasComercializadora) {
                        setAlertModal({
                            visible: true,
                            title: 'Aviso',
                            message: 'Su usuario no tiene comercializadora asignada. No podrÃ¡ generar ni revisar pedidos hasta que un administrador le asigne una. Contacte al administrador.',
                            type: 'error'
                        });
                    }

                    const isEightDigitUser = /^\d{8}$/.test(data.username);
                    const isAlphabeticUser = /[a-zA-Z]/.test(data.username);

                    if (isEightDigitUser || isAlphabeticUser) {
                        navigation.navigate('MenuOperativo');
                    } else {
                        navigation.navigate('NotaPedido');
                    }
                }
            } else {
                setAlertModal({
                    visible: true,
                    title: 'Error',
                    message: 'Usuario o contraseña incorrectos',
                    type: 'error'
                });
            }
        } catch (error: any) {
            console.log("Error de red:", error);
            setAlertModal({
                visible: true,
                title: 'Error',
                message: `No se pudo conectar al servidor: ${error.message}`,
                type: 'error'
            });
        }
    };

    return (
        <ScreenWrapper>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <Layout style={loginStyles.container}>
                        <View style={loginStyles.headerContainer}>
                            <Image
                                source={commercializerCode && LOGOS[commercializerCode] ? LOGOS[commercializerCode] : LOGOS['default']}
                                style={loginStyles.image}
                                resizeMode="contain"
                            />
                        </View>

                        <Text style={loginStyles.title}>¡Bienvenido!</Text>
                        <Text style={loginStyles.subtitle}>INGRESA TUS CREDENCIALES</Text>

                        <Layout style={loginStyles.formContainer}>
                            <Controller
                                control={control}
                                name="username"
                                rules={{ required: 'El usuario es obligatorio' }}
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <View>
                                        <Text style={loginStyles.label}>Usuario:</Text>
                                        <Input
                                            style={loginStyles.input}
                                            placeholder="Ingrese su usuario"
                                            placeholderTextColor="#C5CEE0"
                                            keyboardType="default"
                                            accessoryLeft={renderPersonIcon}
                                            accessoryRight={isSearchingUser ? () => <ActivityIndicator size="small" color="#33C5F6" /> : undefined}
                                            value={value}
                                            onChangeText={onChange}
                                            onBlur={() => {
                                                onBlur();
                                                handleUserBlur(value);
                                            }}
                                            status={errors.username ? 'danger' : 'basic'}
                                            textStyle={loginStyles.inputText}
                                            disabled={isSearchingUser}
                                        />
                                    </View>
                                )}
                            />
                            {errors.username && <Text style={loginStyles.error}>{errors.username.message}</Text>}

                            {distributorEnvironments.length > 0 && (
                                <View style={{ marginBottom: 15 }}>
                                    <Text style={loginStyles.label}>Comercializadora:</Text>
                                    <TouchableOpacity
                                        style={[loginStyles.input, {
                                            paddingHorizontal: 20,
                                            minHeight: 48,
                                            borderWidth: 0,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'space-between'
                                        }]}
                                        onPress={() => setComboOpen(!comboOpen)}
                                    >
                                        <Text style={{ color: selectedEnvironmentIndex ? '#1A2138' : '#C5CEE0', fontSize: 15, fontWeight: selectedEnvironmentIndex ? '600' : '400' }}>
                                            {selectedEnvironmentIndex ? distributorEnvironments[selectedEnvironmentIndex.row].name : 'Seleccione una opción'}
                                        </Text>
                                        <Icon name={comboOpen ? 'arrow-ios-upward' : 'arrow-ios-downward'} fill="#B0B8C8" style={{ width: 20, height: 20 }} />
                                    </TouchableOpacity>

                                    {comboOpen && (
                                        <View style={{
                                            backgroundColor: '#fff',
                                            borderRadius: 20,
                                            marginTop: -10,
                                            marginBottom: 10,
                                            overflow: 'hidden',
                                            shadowColor: '#000',
                                            shadowOffset: { width: 0, height: 4 },
                                            shadowOpacity: 0.05,
                                            shadowRadius: 10,
                                            elevation: 2,
                                        }}>
                                            {distributorEnvironments.map((env, index) => (
                                                <TouchableOpacity
                                                    key={index}
                                                    style={{
                                                        paddingVertical: 14,
                                                        paddingHorizontal: 20,
                                                        backgroundColor: selectedEnvironmentIndex?.row === index ? '#F2F8FF' : '#fff',
                                                        borderBottomWidth: index === distributorEnvironments.length - 1 ? 0 : 1,
                                                        borderBottomColor: '#F3F4F6'
                                                    }}
                                                    onPress={() => {
                                                        setSelectedEnvironmentIndex({ row: index } as IndexPath);
                                                        setComboOpen(false);
                                                        const code = env.codigocomercializadora;
                                                        if (code && LOGOS[code]) {
                                                            setCommercializerCode(code);
                                                        } else {
                                                            setCommercializerCode('default');
                                                        }
                                                    }}
                                                >
                                                    <Text style={{
                                                        color: selectedEnvironmentIndex?.row === index ? '#3366FF' : '#4B5563',
                                                        fontSize: 15,
                                                        fontWeight: selectedEnvironmentIndex?.row === index ? 'bold' : 'normal'
                                                    }}>
                                                        {env.name}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    )}
                                </View>
                            )}

                            <Controller
                                control={control}
                                name="password"
                                rules={{ required: 'La contraseña es obligatoria' }}
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <View>
                                        <Text style={loginStyles.label}>Contraseña:</Text>
                                        <Input
                                            style={loginStyles.input}
                                            placeholder="Ingrese su contraseña"
                                            placeholderTextColor="#C5CEE0"
                                            accessoryLeft={renderLockIcon}
                                            accessoryRight={renderEyeIcon}
                                            secureTextEntry={secureTextEntry}
                                            value={value}
                                            onChangeText={onChange}
                                            onBlur={onBlur}
                                            status={errors.password ? 'danger' : 'basic'}
                                            textStyle={loginStyles.inputText}
                                        />
                                    </View>
                                )}
                            />
                            {errors.password && <Text style={loginStyles.error}>{errors.password.message}</Text>}

                            <Button style={loginStyles.button} onPress={handleSubmit(onLogin)}>
                                Entrar
                            </Button>

                            <TouchableOpacity onPress={() => navigation.navigate('RecuperarClave')}>
                                <Text style={loginStyles.forgotPassword}>Olvidé mi contraseña</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => navigation.navigate('BorrarUsuario')}>
                                <Text style={loginStyles.forgotPassword}>
                                    ¿Deseas eliminar tu usuario de InfinityMobile?
                                </Text>
                            </TouchableOpacity>

                            {/* <TouchableOpacity onPress={() => Linking.openURL('https://supertechsupport.onrender.com')}>
                                <Text style={loginStyles.forgotPassword}>
                                    ¿Eliminar tu usuario? Utiliza el formulario o, la gestión del Administrador.
                                </Text>
                            </TouchableOpacity> */}

                        </Layout>
                        <Text style={[loginStyles.subtitle, { marginTop: 20, fontSize: 12 }]}>
                            Versión {Constants.expoConfig?.version || '1.0.0'}
                        </Text>
                    </Layout>
                </ScrollView>
            </KeyboardAvoidingView>
            {/* Modal de Alerta Custom */}
            {alertModal.visible && (
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={[
                            styles.iconCircle,
                            { backgroundColor: alertModal.type === 'success' ? '#10B981' : '#EF4444' }
                        ]}>
                            <Icon
                                name={alertModal.type === 'success' ? 'checkmark' : 'close'}
                                fill="#FFFFFF"
                                style={{ width: 40, height: 40 }}
                            />
                        </View>
                        <Text style={styles.modalTitle}>{alertModal.title}</Text>
                        <Text style={styles.modalMessage}>{alertModal.message}</Text>
                        <TouchableOpacity
                            style={[
                                styles.modalButton,
                                { backgroundColor: alertModal.type === 'success' ? '#10B981' : '#EF4444' }
                            ]}
                            onPress={() => setAlertModal({ ...alertModal, visible: false })}
                        >
                            <Text style={styles.modalButtonText}>Entendido</Text>
                        </TouchableOpacity>

                    </View>
                </View>
            )}
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999,
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        width: '85%',
        maxWidth: 400,
        borderRadius: 24,
        padding: 30,
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 10,
        textAlign: 'center',
    },
    modalMessage: {
        fontSize: 16,
        color: '#4B5563',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 25,
    },
    modalButton: {
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 12,
        marginBottom: 20,
        minWidth: 150,
        alignItems: 'center'
    },
    modalButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    loadingBarContainer: {
        width: '100%',
        height: 4,
        backgroundColor: '#E5E7EB',
        borderRadius: 2,
        overflow: 'hidden',
    },
    loadingBarFill: {
        width: '100%',
        height: '100%',
    },
});