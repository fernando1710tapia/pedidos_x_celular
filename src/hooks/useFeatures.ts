import { useContext, useMemo } from 'react';
import { UserContext } from '../context/UserContext';
import { getActiveFeatures, AppFeatures } from '../config/features';

export const useFeatures = (): AppFeatures => {
    // Al suscribirnos a UserContext, forzamos un re-render si el usuario cambia (ej: login/logout)
    // Esto asegura que si API_CONFIG.BASE_URL cambió durante el login, obtengamos las nuevas features.
    const userContext = useContext(UserContext);
    
    // Utilizamos useMemo para no recalcular en cada render a menos que cambie el usuario
    const features = useMemo(() => {
        return getActiveFeatures();
    }, [userContext?.user]);

    return features;
};
