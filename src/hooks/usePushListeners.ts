import { useContext, useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { NavigationContainerRefWithCurrent } from '@react-navigation/native';
import { UserContext } from '../context/UserContext';
import { RootStackParamList } from '../types/navigation';
import {
    configurarNotificaciones,
    PUSH_TIPO_PREPEDIDO_AUTORIZADO,
} from '../services/Push/pushNotificationService';

/**
 * Configura las notificaciones y atiende el toque sobre una notificación.
 * Debe usarse dentro de UserProvider y NavigationContainer.
 * Si no hay usuario logueado, el toque se ignora (no se salta el login).
 */
export const usePushListeners = (
    navigationRef: NavigationContainerRefWithCurrent<RootStackParamList>
): void => {
    const user = useContext(UserContext)?.user;

    useEffect(() => {
        configurarNotificaciones();
    }, []);

    useEffect(() => {
        const manejarRespuesta = (response: Notifications.NotificationResponse | null) => {
            if (!response || !user || !navigationRef.isReady()) return;

            const data = response.notification.request.content.data as
                | { tipo?: string }
                | undefined;

            if (data?.tipo === PUSH_TIPO_PREPEDIDO_AUTORIZADO) {
                navigationRef.navigate('ListaPrePedido', {
                    codigocliente: user.codigocliente ?? undefined,
                });
            }
        };

        // App abierta o en segundo plano
        const subscription = Notifications.addNotificationResponseReceivedListener(manejarRespuesta);

        // App cerrada y abierta al tocar la notificación
        Notifications.getLastNotificationResponseAsync().then(manejarRespuesta);

        return () => subscription.remove();
    }, [user, navigationRef]);
};
