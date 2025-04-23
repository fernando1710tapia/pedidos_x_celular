import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Button, Input, Layout, Text } from '@ui-kitten/components';
import CryptoJS from 'crypto-js';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, TouchableOpacity } from 'react-native';
import { useUser } from '../../hooks';
import { loginServices, updatePassword } from '../../services/Login/loginServices';
import { loginStyles } from '../../styles';
import { ApiResponse, RootStackParamList, UserInterface } from '../../types';
import SafeLayout from '../../components/ScreenWrapper';


type FormData = {
    codigo: string;
    correo: string;
    cedula: string;
    password: string;
    repeatPassword: string;
};
type NavigationProps = StackNavigationProp<RootStackParamList, 'Login'>;

export default function RecuperarClaveScreen() {
    const { control, handleSubmit, setValue, formState: { errors } } = useForm<FormData>();
    const [datosCorrectos, setDatosCorrectos] = useState<boolean>(false);
    const [datosUsuario, setDatosUsuario] = useState<UserInterface | null>();
    const navigation = useNavigation<NavigationProps>();
    const { user } = useUser();
    const [primerAcceso, setPrimerAcceso] = useState<boolean>(false);
    const [titulo, setTitulo] = useState<string>("");
    const [leyenda, setLeyenda] = useState<string>("");

    const onVerifyUser = async (data: FormData) => {
        try {
            const response = await loginServices.getResource<ApiResponse<UserInterface>>(
                'ec.com.infinity.modelo.usuario/porusuariocedulacorreo',
                '',
                { codigo: data.codigo, correo: data.correo, cedula: data.cedula }
            );

            if (response.retorno !== null && response.retorno !== undefined && response.retorno.length > 0) {
                const user = response.retorno.length > 0 ? response.retorno[0] : null;
                setDatosUsuario(user);
                setDatosCorrectos(true);
            } else {
                setDatosCorrectos(false);
                Alert.alert('Error', `Datos Incorrectos, contáctese con su administrador`);
            }
        } catch (error: any) {
            console.error("Error de red:", error);
            Alert.alert('Error', `No se pudo conectar al servidor: ${error.message}`);
        }
    };

    const updatePasswordUser = async (data: FormData) => {
        try {

            if (datosUsuario !== null && datosUsuario !== undefined) {
                if (data.password === data.repeatPassword) {
                    const encryptedPassword = CryptoJS.SHA256(data.password).toString(CryptoJS.enc.Hex);
                    datosUsuario.clave = encryptedPassword;

                    const response = await updatePassword.postUser(datosUsuario);
                    if (response.statusCode === 200) {
                        navigation.navigate('Login');
                    } else {
                        Alert.alert('Error', `Error en la actualización`);
                    }
                } else {
                    setDatosCorrectos(false);
                    Alert.alert('Error', `Las claves no coinciden`);
                }
            }
        } catch (error: any) {
            console.error("Error de red:", error);
            Alert.alert('Error', `No se pudo conectar al servidor: ${error.message}`);
        }
    };

    useEffect(() => {
        if (user !== null && user !== undefined) {
            setPrimerAcceso(true);
            setTitulo("Primer Acceso");
            setLeyenda("Por tu seguridad, es necesario cambiar tu clave");
            setValue("codigo", user.codigo)
        } else {
            setTitulo("Olvidé mi clave");
            setLeyenda("Generaremos una nueva");
        }
    }, [user, datosUsuario]);

    return (
        <SafeLayout>
            <Layout style={loginStyles.container}>
                <Text style={loginStyles.title}>{titulo}</Text>
                <Text style={loginStyles.subtitle}>{leyenda}</Text>
                <Layout style={loginStyles.formContainer}>
                    <Controller
                        control={control}
                        name="codigo"
                        rules={{ required: 'El usuario es obligatorio' }}
                        render={({ field: { onChange, onBlur, value } }) => (
                            <Input
                                style={loginStyles.input}
                                label="Usuario"
                                placeholder="Ingrese su usuario"
                                value={user !== null && user !== undefined ? user.codigo : value}
                                onChangeText={onChange}
                                onBlur={onBlur}
                                disabled={primerAcceso}
                                status={errors.codigo ? 'danger' : 'basic'}
                            />
                        )}
                    />
                    {errors.codigo && <Text style={loginStyles.error}>{errors.codigo.message}</Text>}
                    <Controller
                        control={control}
                        name="correo"
                        rules={{
                            required: 'El correo es obligatorio',
                            pattern: {
                                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                message: 'El formato del correo no es válido',
                            },
                        }}
                        render={({ field: { onChange, onBlur, value } }) => (
                            <Input
                                style={loginStyles.input}
                                label="Correo"
                                placeholder="Ingrese su dirección de correo"
                                value={value}
                                onChangeText={onChange}
                                onBlur={onBlur}
                                status={errors.correo ? 'danger' : 'basic'}
                            />
                        )}
                    />
                    {errors.correo && <Text style={loginStyles.error}>{errors.correo.message}</Text>}
                    <Controller
                        control={control}
                        name="cedula"
                        rules={{
                            required: 'La cédula es obligatoria',
                            pattern: {
                                value: /^[0-9]{1,10}$/, // Asegura que solo números y hasta 10 dígitos
                                message: 'La cédula solo debe contener números y máximo 10 dígitos',
                            },
                            maxLength: {
                                value: 10,
                                message: 'La cédula no puede tener más de 10 dígitos',
                            },
                        }}
                        render={({ field: { onChange, onBlur, value } }) => (
                            <Input
                                style={loginStyles.input}
                                label="Cédula"
                                placeholder="Ingrese su cédula"
                                value={value}
                                onChangeText={onChange}
                                onBlur={onBlur}
                                keyboardType="numeric" // Muestra teclado numérico en móviles
                                maxLength={10} // Limita el número de caracteres a 10
                                status={errors.cedula ? 'danger' : 'basic'}
                            />
                        )}
                    />
                    {errors.cedula && <Text style={loginStyles.error}>{errors.cedula.message}</Text>}
                    {datosCorrectos === false && (
                        <Button style={loginStyles.button} onPress={handleSubmit(onVerifyUser)}>
                            Verificar Usuario
                        </Button>
                    )}
                    {datosCorrectos === true && (
                        <>
                            <Controller
                                control={control}
                                name="password"
                                rules={{ required: 'La contraseña es obligatoria' }}
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <Input
                                        style={loginStyles.input}
                                        label="Clave"
                                        placeholder="Nueva Clave"
                                        secureTextEntry
                                        value={value}
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        status={errors.password ? 'danger' : 'basic'}
                                    />
                                )}
                            />
                            {errors.password && <Text style={loginStyles.error}>{errors.password.message}</Text>}
                            <Controller
                                control={control}
                                name="repeatPassword"
                                rules={{ required: 'La contraseña es obligatoria' }}
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <Input
                                        style={loginStyles.input}
                                        label="Repite tu nueva clave"
                                        placeholder="Nueva Clave"
                                        secureTextEntry
                                        value={value}
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        status={errors.password ? 'danger' : 'basic'}
                                    />
                                )}
                            />
                            {errors.password && <Text style={loginStyles.error}>{errors.password.message}</Text>}
                            <Button style={loginStyles.button} onPress={handleSubmit(updatePasswordUser)}>
                                Cambiar su clave
                            </Button>
                        </>
                    )}
                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={loginStyles.forgotPassword}>Cancelar</Text>
                    </TouchableOpacity>
                </Layout>
            </Layout>
        </SafeLayout>
    );
}

