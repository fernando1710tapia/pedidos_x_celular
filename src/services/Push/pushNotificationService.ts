import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { format } from 'date-fns';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { API_CONFIG } from '../../constants/Config';
import { getActiveFeatures } from '../../config/features';

const PUSH_TOKEN_KEY = 'pushToken';
export const PUSH_CHANNEL_ID = 'pys_prepedidos';
export const PUSH_TIPO_PREPEDIDO_AUTORIZADO = 'PREPEDIDO_AUTORIZADO';

/**
 * Configura cómo se muestran las notificaciones con la app abierta y crea el canal Android.
 * Debe llamarse una sola vez al iniciar la app.
 */
export const configurarNotificaciones = async (): Promise<void> => {
    try {
        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowBanner: true,
                shouldShowList: true,
                shouldPlaySound: true,
                shouldSetBadge: false,
            }),
        });

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync(PUSH_CHANNEL_ID, {
                name: 'Prepedidos',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                sound: 'default',
            });
        }
    } catch (error) {
        console.log('FT::push-configurarNotificaciones', error);
    }
};

/**
 * Pide permiso y obtiene el token de Expo. Retorna null si no es posible
 * (emulador, permiso denegado, falta configuración de Firebase, etc.).
 */
export const obtenerExpoPushToken = async (): Promise<string | null> => {
    try {
        if (!Device.isDevice) {
            console.log('FT::push-El push requiere un dispositivo físico');
            return null;
        }

        const { status: existente } = await Notifications.getPermissionsAsync();
        let estadoFinal = existente;
        if (existente !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            estadoFinal = status;
        }
        if (estadoFinal !== 'granted') {
            console.log('FT::push-Permiso de notificaciones denegado');
            return null;
        }

        const projectId =
            Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
        const tokenData = await Notifications.getExpoPushTokenAsync(
            projectId ? { projectId } : undefined
        );
        return tokenData.data;
    } catch (error) {
        console.log('FT::push-obtenerExpoPushToken', error);
        return null;
    }
};

/**
 * PUT ec.com.infinity.modelo.usuario/habilitarpush
 * La fecha se envía en hora local (yyyy-MM-ddTHH:mm:ss), no en UTC.
 */
const habilitarPush = async (codigo: string, token: string, activo: boolean): Promise<void> => {
    const url = `${API_CONFIG.BASE_URL}/ec.com.infinity.modelo.usuario/habilitarpush`;
    const params = {
        codigo,
        ppush_token: token,
        ppush_plataforma: Platform.OS.toUpperCase(),
        ppush_token_activo: activo,
        ppush_token_fecha: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
    };
    console.log('FT::push-PUT habilitarpush', url, params);
    const response = await axios.put(url, null, {
        params,
        headers: API_CONFIG.HEADERS,
        // Timeout propio: el general (4s) es corto para algunos ambientes
        timeout: 15000,
    });
    console.log('FT::push-Respuesta habilitarpush', response.status, response.data);
};

/**
 * Registra el token de ESTE dispositivo para el usuario que acaba de hacer login.
 * Regla: el último dispositivo que hace login es el que queda registrado
 * (el back sobrescribe el token del usuario). Nunca lanza excepciones.
 */
export const registrarPushUsuario = async (codigoUsuario?: string | null): Promise<void> => {
    try {
        if (!codigoUsuario) {
            console.log('FT::push-Sin código de usuario, no se registra');
            return;
        }
        if (!getActiveFeatures().habilitarPush) {
            console.log('FT::push-Push deshabilitado para este ambiente:', API_CONFIG.BASE_URL);
            return;
        }

        const token = await obtenerExpoPushToken();
        if (!token) {
            console.log('FT::push-No se obtuvo token del dispositivo, no se registra');
            return;
        }
        console.log('FT::push-Token del dispositivo', token);

        await habilitarPush(codigoUsuario, token, true);
        await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
        console.log('FT::push-Token registrado para', codigoUsuario);
    } catch (error: any) {
        console.log(
            'FT::push-registrarPushUsuario ERROR',
            error?.response?.status,
            error?.response?.data ?? error?.message ?? error
        );
    }
};

/**
 * Desactiva el token en el back (logout). Nunca lanza excepciones.
 */
export const desregistrarPushUsuario = async (codigoUsuario?: string | null): Promise<void> => {
    try {
        const token = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
        if (!codigoUsuario || !token) return;

        await habilitarPush(codigoUsuario, token, false);
        await AsyncStorage.removeItem(PUSH_TOKEN_KEY);
        console.log('FT::push-Token desactivado para', codigoUsuario);
    } catch (error) {
        console.log('FT::push-desregistrarPushUsuario', error);
    }
};
