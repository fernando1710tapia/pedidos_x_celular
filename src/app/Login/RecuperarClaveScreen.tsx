import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Button, Input, Layout, Text, Icon, IndexPath } from '@ui-kitten/components';
import CryptoJS from 'crypto-js';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import { API_CONFIG } from '../../constants/Config';
import { useUser } from '../../hooks';
import {
    loginServices,
    searchDistributorEnvironments,
    searchUserInAllEnvironments,
    updatePassword
} from '../../services/Login/loginServices';
import { loginStyles } from '../../styles';
import { ApiResponse, RootStackParamList, UserInterface } from '../../types';

type FormData = {
    codigo: string;
    correo: string;
    cedula: string;
    password: string;
    repeatPassword: string;
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

export default function RecuperarClaveScreen() {
    const { control, handleSubmit, setValue, formState: { errors } } = useForm<FormData>();
    const navigation = useNavigation<NavigationProps>();
    const { user } = useUser();

    const [datosCorrectos, setDatosCorrectos] = useState<boolean>(false);
    const [datosUsuario, setDatosUsuario] = useState<UserInterface | null>(null);
    const [primerAcceso, setPrimerAcceso] = useState<boolean>(false);
    const [titulo, setTitulo] = useState<string>('Olvidé mi clave');
    const [leyenda, setLeyenda] = useState<string>('Generaremos una nueva');

    // Estados para comercializadora y logo (idéntico al login)
    const [commercializerCode, setCommercializerCode] = useState<string | null>(null);
    const [isSearchingUser, setIsSearchingUser] = useState(false);
    const [distributorEnvironments, setDistributorEnvironments] = useState<
        Array<{ baseUrl: string; name: string; codigocomercializadora: string; user: UserInterface }>
    >([]);
    const [selectedEnvironmentIndex, setSelectedEnvironmentIndex] = useState<IndexPath | null>(null);
    const [comboOpen, setComboOpen] = useState(false);

    // Visibilidad de contraseñas
    const [secureTextEntry, setSecureTextEntry] = useState(true);
    const [secureRepeatTextEntry, setSecureRepeatTextEntry] = useState(true);

    // Modal de Alerta
    const [alertModal, setAlertModal] = useState<{
        visible: boolean;
        title: string;
        message: string;
        type: 'success' | 'error';
        onDismiss?: () => void;
    }>({
        visible: false,
        title: '',
        message: '',
        type: 'success'
    });

    const handleUserBlur = async (username: string) => {
        if (!username) return;
        setIsSearchingUser(true);
        setDistributorEnvironments([]);
        setSelectedEnvironmentIndex(null);

        const isEightDigitUser = /^\d{8}$/.test(username);

        try {
            if (isEightDigitUser) {
                // Buscamos en todos los ambientes para distribuidor
                const environments = await searchDistributorEnvironments(username);
                setDistributorEnvironments(environments);
                // No cambiamos el logo todavía hasta que seleccione la comercializadora
            } else {
                // Para administradores / operadores
                const { baseUrl, user: foundUser } = await searchUserInAllEnvironments(username);
                API_CONFIG.BASE_URL = baseUrl;

                const code = foundUser.codigocomercializadora ? String(foundUser.codigocomercializadora).trim() : null;
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
                message: 'No pudimos localizar este usuario en ningún ambiente.',
                type: 'error'
            });
            setCommercializerCode('default');
        } finally {
            setIsSearchingUser(false);
        }
    };

    const onVerifyUser = async (data: FormData) => {
        try {
            const isEightDigitUser = /^\d{8}$/.test(data.codigo);

            if (isEightDigitUser) {
                let envs = distributorEnvironments;
                // Si el usuario no activó blur antes de enviar, realizamos la búsqueda
                if (envs.length === 0) {
                    setIsSearchingUser(true);
                    try {
                        envs = await searchDistributorEnvironments(data.codigo);
                        setDistributorEnvironments(envs);
                    } catch (e: any) {
                        setAlertModal({
                            visible: true,
                            title: 'Usuario no encontrado',
                            message: 'No pudimos localizar este usuario en ningún ambiente.',
                            type: 'error'
                        });
                        setCommercializerCode('default');
                        return;
                    } finally {
                        setIsSearchingUser(false);
                    }
                }

                if (envs.length > 0 && !selectedEnvironmentIndex) {
                    setAlertModal({
                        visible: true,
                        title: 'Selección Requerida',
                        message: 'Debe seleccionar una comercializadora de la lista antes de continuar.',
                        type: 'error'
                    });
                    return;
                }

                if (selectedEnvironmentIndex) {
                    API_CONFIG.BASE_URL = envs[selectedEnvironmentIndex.row].baseUrl;
                }
            } else if (!primerAcceso && !commercializerCode) {
                // Si el usuario no es de 8 dígitos y no se había hecho blur
                try {
                    const { baseUrl, user: foundUser } = await searchUserInAllEnvironments(data.codigo);
                    API_CONFIG.BASE_URL = baseUrl;
                    const code = foundUser.codigocomercializadora ? String(foundUser.codigocomercializadora).trim() : null;
                    if (code && LOGOS[code]) {
                        setCommercializerCode(code);
                    } else {
                        setCommercializerCode('default');
                    }
                } catch (e: any) {
                    setAlertModal({
                        visible: true,
                        title: 'Usuario no encontrado',
                        message: 'No pudimos localizar este usuario en ningún ambiente.',
                        type: 'error'
                    });
                    return;
                }
            }

            const response = await loginServices.getResource<ApiResponse<UserInterface>>(
                'ec.com.infinity.modelo.usuario/porusuariocedulacorreo',
                '',
                { codigo: data.codigo, correo: data.correo, cedula: data.cedula }
            );

            if (response.retorno !== null && response.retorno !== undefined && response.retorno.length > 0) {
                const userObj = response.retorno[0];
                setDatosUsuario(userObj);
                setDatosCorrectos(true);
            } else {
                setDatosCorrectos(false);
                setAlertModal({
                    visible: true,
                    title: 'Error de Validación',
                    message: 'Datos Incorrectos, contáctese con su administrador',
                    type: 'error'
                });
            }
        } catch (error: any) {
            console.error('Error de red:', error);
            setAlertModal({
                visible: true,
                title: 'Error',
                message: `No se pudo conectar al servidor: ${error.message}`,
                type: 'error'
            });
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
                        setAlertModal({
                            visible: true,
                            title: '¡Éxito!',
                            message: 'Su contraseña ha sido actualizada correctamente.',
                            type: 'success',
                            onDismiss: () => navigation.navigate('Login')
                        });
                    } else {
                        setAlertModal({
                            visible: true,
                            title: 'Error',
                            message: 'Error en la actualización de la contraseña.',
                            type: 'error'
                        });
                    }
                } else {
                    setAlertModal({
                        visible: true,
                        title: 'Error',
                        message: 'Las contraseñas no coinciden.',
                        type: 'error'
                    });
                }
            }
        } catch (error: any) {
            console.error('Error al actualizar clave:', error);
            setAlertModal({
                visible: true,
                title: 'Error',
                message: `No se pudo conectar al servidor: ${error.message}`,
                type: 'error'
            });
        }
    };

    useEffect(() => {
        if (user !== null && user !== undefined) {
            setPrimerAcceso(true);
            setTitulo('Primer Acceso');
            setLeyenda('Por tu seguridad, es necesario cambiar tu clave');
            setValue('codigo', user.codigo);
            const code = user.codigocomercializadora ? String(user.codigocomercializadora).trim() : null;
            if (code && LOGOS[code]) {
                setCommercializerCode(code);
            } else {
                setCommercializerCode('default');
            }
        } else {
            setPrimerAcceso(false);
            setTitulo('Olvidé mi clave');
            setLeyenda('Generaremos una nueva');
            setCommercializerCode('default');
        }
    }, [user, setValue]);

    const renderPersonIcon = (props: any) => (
        <Icon {...props} name='person-outline' fill='#B0B8C8' />
    );

    const renderEmailIcon = (props: any) => (
        <Icon {...props} name='email-outline' fill='#B0B8C8' />
    );

    const renderIdCardIcon = (props: any) => (
        <Icon {...props} name='credit-card-outline' fill='#B0B8C8' />
    );

    const renderLockIcon = (props: any) => (
        <Icon {...props} name='lock-outline' fill='#B0B8C8' />
    );

    const renderEyeIcon = (props: any) => (
        <TouchableWithoutFeedback onPress={() => setSecureTextEntry(!secureTextEntry)}>
            <Icon {...props} name={secureTextEntry ? 'eye-off-outline' : 'eye-outline'} fill='#B0B8C8' />
        </TouchableWithoutFeedback>
    );

    const renderRepeatEyeIcon = (props: any) => (
        <TouchableWithoutFeedback onPress={() => setSecureRepeatTextEntry(!secureRepeatTextEntry)}>
            <Icon {...props} name={secureRepeatTextEntry ? 'eye-off-outline' : 'eye-outline'} fill='#B0B8C8' />
        </TouchableWithoutFeedback>
    );

    return (
        <ScreenWrapper>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1, paddingBottom: 30 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <Layout style={loginStyles.container}>
                        {/* Logo dinámico de la Comercializadora */}
                        <View style={loginStyles.headerContainer}>
                            <Image
                                source={commercializerCode && LOGOS[commercializerCode] ? LOGOS[commercializerCode] : LOGOS['default']}
                                style={loginStyles.image}
                                resizeMode="contain"
                            />
                        </View>

                        <Text style={loginStyles.title}>{titulo}</Text>
                        <Text style={loginStyles.subtitle}>{leyenda}</Text>

                        <Layout style={loginStyles.formContainer}>
                            {/* Campo Usuario */}
                            <Controller
                                control={control}
                                name="codigo"
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
                                            value={user !== null && user !== undefined ? user.codigo : value}
                                            onChangeText={(text) => {
                                                onChange(text);
                                                if (distributorEnvironments.length > 0 || selectedEnvironmentIndex !== null) {
                                                    setDistributorEnvironments([]);
                                                    setSelectedEnvironmentIndex(null);
                                                    setCommercializerCode('default');
                                                }
                                            }}
                                            onBlur={() => {
                                                onBlur();
                                                if (!primerAcceso) {
                                                    handleUserBlur(value);
                                                }
                                            }}
                                            disabled={primerAcceso || isSearchingUser || datosCorrectos}
                                            status={errors.codigo ? 'danger' : 'basic'}
                                            textStyle={loginStyles.inputText}
                                        />
                                    </View>
                                )}
                            />
                            {errors.codigo && <Text style={loginStyles.error}>{errors.codigo.message}</Text>}

                            {/* Combo de Comercializadora (distribuidores) */}
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
                                        disabled={datosCorrectos}
                                    >
                                        <Text style={{
                                            color: selectedEnvironmentIndex ? '#1A2138' : '#C5CEE0',
                                            fontSize: 15,
                                            fontWeight: selectedEnvironmentIndex ? '600' : '400'
                                        }}>
                                            {selectedEnvironmentIndex
                                                ? distributorEnvironments[selectedEnvironmentIndex.row].name
                                                : 'Seleccione una opción'}
                                        </Text>
                                        <Icon
                                            name={comboOpen ? 'arrow-ios-upward' : 'arrow-ios-downward'}
                                            fill="#B0B8C8"
                                            style={{ width: 20, height: 20 }}
                                        />
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
                                                        API_CONFIG.BASE_URL = env.baseUrl;
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

                            {/* Campo Correo */}
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
                                    <View>
                                        <Text style={loginStyles.label}>Correo:</Text>
                                        <Input
                                            style={loginStyles.input}
                                            placeholder="Ingrese su dirección de correo"
                                            placeholderTextColor="#C5CEE0"
                                            value={value}
                                            onChangeText={onChange}
                                            onBlur={onBlur}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            accessoryLeft={renderEmailIcon}
                                            status={errors.correo ? 'danger' : 'basic'}
                                            textStyle={loginStyles.inputText}
                                            disabled={datosCorrectos}
                                        />
                                    </View>
                                )}
                            />
                            {errors.correo && <Text style={loginStyles.error}>{errors.correo.message}</Text>}

                            {/* Campo Cédula */}
                            <Controller
                                control={control}
                                name="cedula"
                                rules={{
                                    required: 'La cédula es obligatoria',
                                    pattern: {
                                        value: /^[0-9]{1,10}$/,
                                        message: 'La cédula solo debe contener números y máximo 10 dígitos',
                                    },
                                    maxLength: {
                                        value: 10,
                                        message: 'La cédula no puede tener más de 10 dígitos',
                                    },
                                }}
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <View>
                                        <Text style={loginStyles.label}>Cédula:</Text>
                                        <Input
                                            style={loginStyles.input}
                                            placeholder="Ingrese su cédula"
                                            placeholderTextColor="#C5CEE0"
                                            value={value}
                                            onChangeText={onChange}
                                            onBlur={onBlur}
                                            keyboardType="numeric"
                                            maxLength={10}
                                            accessoryLeft={renderIdCardIcon}
                                            status={errors.cedula ? 'danger' : 'basic'}
                                            textStyle={loginStyles.inputText}
                                            disabled={datosCorrectos}
                                        />
                                    </View>
                                )}
                            />
                            {errors.cedula && <Text style={loginStyles.error}>{errors.cedula.message}</Text>}

                            {/* Botón Verificar Usuario */}
                            {!datosCorrectos && (
                                <Button
                                    style={loginStyles.button}
                                    onPress={handleSubmit(onVerifyUser)}
                                    disabled={isSearchingUser}
                                >
                                    Verificar Usuario
                                </Button>
                            )}

                            {/* Campos para nueva contraseña */}
                            {datosCorrectos && (
                                <>
                                    <Controller
                                        control={control}
                                        name="password"
                                        rules={{ required: 'La contraseña es obligatoria' }}
                                        render={({ field: { onChange, onBlur, value } }) => (
                                            <View>
                                                <Text style={loginStyles.label}>Nueva Clave:</Text>
                                                <Input
                                                    style={loginStyles.input}
                                                    placeholder="Nueva Clave"
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

                                    <Controller
                                        control={control}
                                        name="repeatPassword"
                                        rules={{ required: 'La confirmación de la contraseña es obligatoria' }}
                                        render={({ field: { onChange, onBlur, value } }) => (
                                            <View>
                                                <Text style={loginStyles.label}>Repite tu nueva clave:</Text>
                                                <Input
                                                    style={loginStyles.input}
                                                    placeholder="Repite tu nueva clave"
                                                    placeholderTextColor="#C5CEE0"
                                                    accessoryLeft={renderLockIcon}
                                                    accessoryRight={renderRepeatEyeIcon}
                                                    secureTextEntry={secureRepeatTextEntry}
                                                    value={value}
                                                    onChangeText={onChange}
                                                    onBlur={onBlur}
                                                    status={errors.repeatPassword ? 'danger' : 'basic'}
                                                    textStyle={loginStyles.inputText}
                                                />
                                            </View>
                                        )}
                                    />
                                    {errors.repeatPassword && <Text style={loginStyles.error}>{errors.repeatPassword.message}</Text>}

                                    <Button style={loginStyles.button} onPress={handleSubmit(updatePasswordUser)}>
                                        Cambiar su clave
                                    </Button>
                                </>
                            )}

                            {/* Botón Cancelar */}
                            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                <Text style={loginStyles.forgotPassword}>Cancelar</Text>
                            </TouchableOpacity>
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
                            onPress={() => {
                                const onDismiss = alertModal.onDismiss;
                                setAlertModal({ ...alertModal, visible: false, onDismiss: undefined });
                                if (onDismiss) {
                                    onDismiss();
                                }
                            }}
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
        marginBottom: 10,
        minWidth: 150,
        alignItems: 'center',
    },
    modalButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
