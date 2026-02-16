import { Button, Input, Layout, Text, Icon } from '@ui-kitten/components';
import CryptoJS from 'crypto-js';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Image, TouchableOpacity, View, TouchableWithoutFeedback } from 'react-native';

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

                if (encryptedPassword === CryptoJS.SHA256(API_CONFIG.FIRST_ACCES).toString(CryptoJS.enc.Hex)) {
                    navigation.navigate('RecuperarClave');
                } else {
                    const hasComercializadora = user?.codigocomercializadora != null && String(user.codigocomercializadora).trim() !== '';
                    if (!hasComercializadora) {
                        Alert.alert(
                            'Aviso',
                            'Su usuario no tiene comercializadora asignada. No podrá generar ni revisar pedidos hasta que un administrador le asigne una. Contacte al administrador.'
                        );
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
                Alert.alert('Error', 'Usuario o contraseña incorrectos');
            }
        } catch (error: any) {
            console.error("Error de red:", error);
            Alert.alert('Error', `No se pudo conectar al servidor: ${error.message}`);
        }
    };

    return (
        <ScreenWrapper>
            <Layout style={loginStyles.container}>
                <View style={loginStyles.headerContainer}>
                    <Image
                        source={require('../../../assets/logo.png')}
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
                </Layout>

                <View style={loginStyles.footerlogin}>
                    <Text style={loginStyles.footerText}>Esta App es parte de infinityOne</Text>
                    <Image
                        source={require('../../../assets/logoinfinity.png')}
                        style={loginStyles.footerLogo}
                        resizeMode="contain"
                    />
                </View>
            </Layout>
        </ScreenWrapper>
    );
}