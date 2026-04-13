import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Button, Input, Layout, Text } from '@ui-kitten/components';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, TouchableOpacity } from 'react-native';

import { loginServices } from '../../services/Login/loginServices';
import { loginStyles } from '../../styles';
import { ApiResponse, RootStackParamList, UserInterface } from '../../types';
import SafeLayout from '../../components/ScreenWrapper';

type FormData = {
    codigo: string;
    correo: string;
    cedula: string;
};

type NavigationProps = StackNavigationProp<RootStackParamList, 'Login'>;

export default function BorrarUsuarioScreen() {

    const { control, handleSubmit, formState: { errors } } = useForm<FormData>();
    const navigation = useNavigation<NavigationProps>();

    const [datosCorrectos, setDatosCorrectos] = useState<boolean>(false);
    const [datosUsuario, setDatosUsuario] = useState<UserInterface | null>(null);

    // 🔍 1. Verificar usuario
    const onVerifyUser = async (data: FormData) => {
        try {
            const response = await loginServices.getResource<ApiResponse<UserInterface>>(
                'ec.com.infinity.modelo.usuario/porusuariocedulacorreo',
                '',
                {
                    codigo: data.codigo,
                    correo: data.correo,
                    cedula: data.cedula
                }
            );

            if (response?.retorno?.length > 0) {
                const user = response.retorno[0];
                setDatosUsuario(user);
                setDatosCorrectos(true);
            } else {
                setDatosCorrectos(false);
                Alert.alert('Error', 'Datos incorrectos, contáctese con su administrador');
            }

        } catch (error: any) {
            Alert.alert('Error', `No se pudo conectar: ${error.message}`);
        }
    };

    // ❌ 2. Eliminar usuario
    const deleteUserConfirmed = async () => {
        try {
            if (datosUsuario?.codigo) {

                const response = await loginServices.getResource<ApiResponse<UserInterface>>(
                'ec.com.infinity.modelo.usuario/borraroprid',
                '',
                {
                    codigo: datosUsuario?.codigo
                    
                });

                if (response.statusCode === 200) {
                    Alert.alert('Esperamos volverte a ver!', 'Has sido eliminado de InfinityMobile');
                    navigation.navigate('Login');
                } else {
                    Alert.alert('Error', 'No se pudo eliminar el usuario');
                }
            }
        } catch (error: any) {
            Alert.alert('Error', `Error de red: ${error.message}`);
        }
    };

    // ⚠️ 3. Confirmación
    const confirmDelete = () => {
        Alert.alert(
            'Confirmación',
            '¿Está seguro de eliminarse como usuario de InfinityMobile?',
            [
                { text: 'NO', style: 'cancel' },
                { text: 'SI', onPress: deleteUserConfirmed }
            ]
        );
    };

    return (
        <SafeLayout>
            <Layout style={loginStyles.container}>

                <Text style={loginStyles.title}>Eliminar Usuario</Text>
                <Text style={loginStyles.SubtituloPequeno}>
                    Confirme sus datos para continuar
                </Text>

                <Layout style={loginStyles.formContainer}>

                    {/* Usuario */}
                    <Controller
                        control={control}
                        name="codigo"
                        rules={{ required: 'El usuario es obligatorio' }}
                        render={({ field: { onChange, onBlur, value } }) => (
                            <Input
                                style={loginStyles.input}
                                label="Usuario"
                                placeholder="Ingrese su usuario"
                                value={value}
                                onChangeText={onChange}
                                onBlur={onBlur}
                                status={errors.codigo ? 'danger' : 'basic'}
                            />
                        )}
                    />
                    {errors.codigo && <Text style={loginStyles.error}>{errors.codigo.message}</Text>}

                    {/* Correo */}
                    <Controller
                        control={control}
                        name="correo"
                        rules={{
                            required: 'El correo es obligatorio',
                            pattern: {
                                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                message: 'Formato de correo no válido',
                            },
                        }}
                        render={({ field: { onChange, onBlur, value } }) => (
                            <Input
                                style={loginStyles.input}
                                label="Correo"
                                placeholder="Ingrese su correo"
                                value={value}
                                onChangeText={onChange}
                                onBlur={onBlur}
                                status={errors.correo ? 'danger' : 'basic'}
                            />
                        )}
                    />
                    {errors.correo && <Text style={loginStyles.error}>{errors.correo.message}</Text>}

                    {/* Cédula */}
                    <Controller
                        control={control}
                        name="cedula"
                        rules={{
                            required: 'La cédula es obligatoria',
                            pattern: {
                                value: /^[0-9]{1,10}$/,
                                message: 'Solo números (máx 10 dígitos)',
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
                                keyboardType="numeric"
                                maxLength={10}
                                status={errors.cedula ? 'danger' : 'basic'}
                            />
                        )}
                    />
                    {errors.cedula && <Text style={loginStyles.error}>{errors.cedula.message}</Text>}

                    {/* Botón verificar */}
                    {!datosCorrectos && (
                        <Button style={loginStyles.button} onPress={handleSubmit(onVerifyUser)}>
                            Verificar Usuario
                        </Button>
                    )}

                    {/* Botón eliminar */}
                    {datosCorrectos && (
                        <>
                            <Text style={{ marginVertical: 10 }}>
                                Usuario verificado: {datosUsuario?.codigo}
                            </Text>

                            <Button
                                style={loginStyles.button}
                                status="danger"
                                onPress={confirmDelete}
                            >
                                Eliminar Usuario
                            </Button>
                        </>
                    )}

                    {/* Cancelar */}
                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={loginStyles.forgotPassword}>Cancelar</Text>
                    </TouchableOpacity>

                </Layout>
            </Layout>
        </SafeLayout>
    );
}