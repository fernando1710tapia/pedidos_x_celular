import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Button, Input, Layout, Text } from '@ui-kitten/components';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, TouchableOpacity, StyleSheet, View, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

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

    // Estados para Modales
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalMessage, setModalMessage] = useState('');

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
                setModalTitle('Error de Validación');
                setModalMessage('Datos incorrectos, contáctese con su administrador');
                setShowErrorModal(true);
            }

        } catch (error: any) {
            setModalTitle('Error de Conexión');
            setModalMessage(`No se pudo conectar: ${error.message}`);
            setShowErrorModal(true);
        }
    };

    // ❌ 2. Eliminar usuario
    const deleteUserConfirmed = async () => {
        try {
            if (datosUsuario?.codigo) {

                const response = await loginServices.putResource!<ApiResponse<UserInterface>>(
                    'ec.com.infinity.modelo.usuario/borrarporid',
                    null,
                    {
                        codigo: datosUsuario?.codigo
                    }
                );



                if (response.statusCode === 200) {
                    setModalTitle('¡Éxito!');
                    setModalMessage('Has sido eliminado de InfinityMobile. Esperamos volverte a ver pronto.');
                    setShowSuccessModal(true);
                    
                    // Navegar después de mostrar el éxito
                    setTimeout(() => {
                        setShowSuccessModal(false);
                        navigation.navigate('Login');
                    }, 3000);
                } else {
                    setModalTitle('Error');
                    setModalMessage('No se pudo eliminar el usuario');
                    setShowErrorModal(true);
                }
            }
        } catch (error: any) {
            setModalTitle('Error de Red');
            setModalMessage(`Error de red: ${error.message}`);
            setShowErrorModal(true);
        }
    };

    // ⚠️ 3. Confirmación mejorada
    const confirmDelete = () => {
        setModalTitle('Confirmación');
        setModalMessage('¿Está seguro de eliminarse como usuario de InfinityMobile? esta acción no se puede deshacer.');
        setShowConfirmModal(true);
    };

    return (
        <SafeLayout>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={true}
                >
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.navigate('Login')}
                    >
                        <Icon name="chevron-back" size={32} color="#9CA3AF" />
                    </TouchableOpacity>
                    <Layout style={[loginStyles.container, { flex: 0, minHeight: '100%', justifyContent: 'flex-start', paddingTop: 60 }]}>

                <Text style={[loginStyles.title, { color: '#f70f0fff' }]}>Eliminar Usuario</Text>
                <Text style={loginStyles.subtitle}>
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

                    {/* Mensaje de usuario verificado mejorado */}
                    {datosCorrectos && (
                        <View style={styles.verifiedContainer}>
                            <View style={styles.verifiedHeader}>
                                <Icon name="checkmark-circle" size={24} color="#10B981" />
                                <Text style={styles.verifiedTitle}>Usuario Verificado</Text>
                            </View>
                            <Text style={styles.verifiedName}>Nombre Usuario: {datosUsuario?.nombrever}</Text>
                            <Text style={styles.verifiedSubtitle}>
                                Al continuar, se eliminará permanentemente esta cuenta.
                            </Text>

                            <Button
                                style={[loginStyles.button, { marginTop: 10 }]}
                                status="danger"
                                onPress={confirmDelete}
                            >
                                Eliminar Usuario
                            </Button>
                        </View>
                    )}

                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={loginStyles.forgotPassword}>Cancelar</Text>
                    </TouchableOpacity>

                </Layout>
            </Layout>
        </ScrollView>
    </KeyboardAvoidingView>

        {/* Modal de Éxito Personalizado */}
            {showSuccessModal && (
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.successIconCircle}>
                            <Icon name="checkmark" size={40} color="#FFFFFF" />
                        </View>
                        <Text style={styles.modalTitle}>{modalTitle}</Text>
                        <Text style={styles.modalMessage}>{modalMessage}</Text>
                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={() => setShowSuccessModal(false)}
                        >
                            <Text style={styles.modalButtonText}>Entendido</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Modal de Confirmación Personalizado */}
            {showConfirmModal && (
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.confirmIconCircle}>
                            <Icon name="alert-circle-outline" size={40} color="#FFFFFF" />
                        </View>
                        <Text style={styles.modalTitle}>{modalTitle}</Text>
                        <Text style={styles.modalMessage}>{modalMessage}</Text>
                        
                        <View style={styles.modalButtonRow}>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: '#E5E7EB', minWidth: 100 }]}
                                onPress={() => setShowConfirmModal(false)}
                            >
                                <Text style={[styles.modalButtonText, { color: '#6B7280' }]}>NO</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: '#FF3D71', minWidth: 100, marginLeft: 10 }]}
                                onPress={() => {
                                    setShowConfirmModal(false);
                                    deleteUserConfirmed();
                                }}
                            >
                                <Text style={styles.modalButtonText}>SÍ, BORRAR</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}

            {/* Modal de Error Personalizado */}
            {showErrorModal && (
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.errorIconCircle}>
                            <Icon name="close-outline" size={40} color="#FFFFFF" />
                        </View>
                        <Text style={styles.modalTitle}>{modalTitle}</Text>
                        <Text style={styles.modalMessage}>{modalMessage}</Text>
                        <TouchableOpacity
                            style={[styles.modalButton, { backgroundColor: '#FF3D71' }]}
                            onPress={() => setShowErrorModal(false)}
                        >
                            <Text style={styles.modalButtonText}>Cerrar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </SafeLayout>
    );
}

const styles = StyleSheet.create({
    backButton: {
        position: 'absolute',
        top: 10,
        left: 15,
        zIndex: 10,
        padding: 5,
    },
    // Estilos del Modal (copiados de NotaPedidoScreen)
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1001,
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
    successIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#10B981',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    errorIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FF3D71',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    confirmIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F59E0B', // Amber/Yellow for warning
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
        backgroundColor: '#10B981',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 12,
        minWidth: 150,
        alignItems: 'center'
    },
    modalButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalButtonRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        width: '100%',
    },
    // Estilos para el contenedor de usuario verificado
    verifiedContainer: {
        backgroundColor: '#ECFDF5',
        borderRadius: 16,
        padding: 16,
        marginVertical: 15,
        borderWidth: 1,
        borderColor: '#10B981',
    },
    verifiedHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    verifiedTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#065F46',
        marginLeft: 8,
    },
    verifiedName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 4,
    },
    verifiedSubtitle: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 10,
    },
});