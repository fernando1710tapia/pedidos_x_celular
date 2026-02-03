import { Button, Input, Layout, Text } from '@ui-kitten/components';
import CryptoJS from 'crypto-js';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Image, TouchableOpacity, View } from 'react-native';

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
                    navigation.navigate('NotaPedido');
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
                <Image
                    //source={require('../../../assets/logopys.png')} // Cambia la ruta según tu imagen
                    source={require('../../../assets/logo.png')} // Cambia la ruta según tu imagen
                    //source={require('../../../assets/logofen.png')} // Cambia la ruta según tu imagen
                    style={loginStyles.image}
                    resizeMode="cover" // O "contain" según el diseño que desees
                />
                <Text style={loginStyles.title}>Bien venido</Text>
                <Text style={loginStyles.SubtituloPequeno}>Nos volvemos a encotrar</Text>
                <Layout style={loginStyles.formContainer}>
                    <Controller
                        control={control}
                        name="username"
                        rules={{ required: 'El usuario es obligatorio' }}
                        render={({ field: { onChange, onBlur, value } }) => (
                            <Input
                                style={loginStyles.input}
                                label="Usuario"
                                placeholder="Ingrese su usuario"
                                keyboardType="numeric"
                                value={value}
                                onChangeText={onChange}
                                onBlur={onBlur}
                                status={errors.username ? 'danger' : 'basic'}
                            />
                        )}
                    />
                    {errors.username && <Text style={loginStyles.error}>{errors.username.message}</Text>}
                    <Controller
                        control={control}
                        name="password"
                        rules={{ required: 'La contraseña es obligatoria' }}
                        render={({ field: { onChange, onBlur, value } }) => (
                            <Input
                                style={loginStyles.input}
                                label="Contraseña"
                                placeholder="Ingrese su contraseña"
                                secureTextEntry
                                value={value}
                                onChangeText={onChange}
                                onBlur={onBlur}
                                status={errors.password ? 'danger' : 'basic'}
                            />
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
                    <Text style={loginStyles.footerText}>esta App es parte de infinityOne</Text>
                    {/*<Text style={loginStyles.footerTextinfinity}>InfinityOne</Text>*/}
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