import { Button, Input, Layout, Text, Icon } from '@ui-kitten/components';
import CryptoJS from 'crypto-js';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Image, TouchableOpacity, View, TouchableWithoutFeedback, KeyboardAvoidingView, ScrollView, Platform, StyleSheet, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import ScreenWrapper from '../../components/ScreenWrapper';
import { API_CONFIG } from '../../constants/Config';
import { useUser } from '../../hooks';
import { loginServices } from '../../services/Login/loginServices';
import { loginStyles } from '../../styles';
import { ApiResponse, UserInterface } from '../../types';
import { RootStackParamList } from '../../types/navigation';

// Asegúrate de tener estos tipos

type FormData = {
    username: string;
    password: string;
};
type NavigationProps = StackNavigationProp<RootStackParamList, 'Login'>;

export default function LoginScreen() {
    const { control, handleSubmit, formState: { errors } } = useForm<FormData>();
    const navigation = useNavigation<NavigationProps>();
    const { setUser } = useUser();
    const [secureTextEntry, setSecureTextEntry] = React.useState(true);
    const [alertModal, setAlertModal] = React.useState({
        visible: false,
        title: '',
        message: '',
        type: 'success' // 'success' o 'error'
    });

    const toggleSecureEntry = () => {
        setSecureTextEntry(!secureTextEntry);
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
            // Encripta la contraseña con SHA-256
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
                            message: 'Su usuario no tiene comercializadora asignada. No podrá generar ni revisar pedidos hasta que un administrador le asigne una. Contacte al administrador.',
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
                                source={require('../../../assets/infinityOne.png')}
                                style={loginStyles.image}
                                resizeMode="contain"
                            />
                        </View>

                        <Text style={loginStyles.title}>¡Bienvenido!</Text>
                        <Text style={loginStyles.SubtituloPequeno}>INGRESA TUS CREDENCIALES</Text>

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
                                            value={value}
                                            onChangeText={onChange}
                                            onBlur={onBlur}
                                            status={errors.username ? 'danger' : 'basic'}
                                            textStyle={loginStyles.inputText}
                                        />
                                    </View>
                                )}
                            />
                            {errors.username && <Text style={loginStyles.error}>{errors.username.message}</Text>}

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
        ...StyleSheet.absoluteFillObject,
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