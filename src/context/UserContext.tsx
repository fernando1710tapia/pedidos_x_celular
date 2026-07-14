
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, ReactNode, useEffect, useState } from "react";
import { UserInterface } from "../types";
import { API_CONFIG } from "../constants/Config";

const SESSION_BASE_URL_KEY = 'sessionBaseUrl';
const DEFAULT_BASE_URL = 'https://www.supertech.ec:8443/infinityone1/resources';

// Define la interfaz del contexto
interface UserContextType {
    user: UserInterface | null;
    setUser: (user: UserInterface | null) => Promise<void>; // Permite null en logout
    logout: () => Promise<void>;
}

// Crea el contexto con valores iniciales
export const UserContext = createContext<UserContextType | undefined>(undefined);

// Proveedor del contexto
export const UserProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<UserInterface | null>(null);

    // Cargar usuario desde AsyncStorage al iniciar la app
    useEffect(() => {
        const loadUser = async () => {
            try {
                const storedUser = await AsyncStorage.getItem('user');
                // Restaurar la URL del ambiente donde el usuario fue encontrado
                // Esto es lo que fijó searchUserInAllEnvironments en el último login
                const storedBaseUrl = await AsyncStorage.getItem(SESSION_BASE_URL_KEY);
                if (storedBaseUrl) {
                    API_CONFIG.BASE_URL = storedBaseUrl;
                }
                if (storedUser) {
                    const parsedUser = JSON.parse(storedUser);
                    setUser(parsedUser);
                }
            } catch (error) {
                console.error("Error loading user from AsyncStorage:", error);
            }
        };
        loadUser();
    }, []);

    // Guardar usuario en AsyncStorage
    const saveUser = async (userData: UserInterface | null) => {
        try {
            if (userData) {
                await AsyncStorage.setItem('user', JSON.stringify(userData));
                // Persistir la URL actual (ya fijada por searchUserInAllEnvironments en el onBlur)
                // para que al reiniciar la app se restaure el mismo ambiente
                await AsyncStorage.setItem(SESSION_BASE_URL_KEY, API_CONFIG.BASE_URL);
            } else {
                await AsyncStorage.removeItem('user');
                await AsyncStorage.removeItem(SESSION_BASE_URL_KEY);
                // Restaurar URL por defecto
                API_CONFIG.BASE_URL = DEFAULT_BASE_URL;
            }
            setUser(userData);
        } catch (error) {
            console.error("Error saving user to AsyncStorage:", error);
        }
    };

    // Cerrar sesión
    const logout = async () => {
        try {
            await AsyncStorage.removeItem('user');
            await AsyncStorage.removeItem(SESSION_BASE_URL_KEY);
            setUser(null);
            // Restaurar URL por defecto al desloguear
            API_CONFIG.BASE_URL = DEFAULT_BASE_URL;
        } catch (error) {
            console.error("Error logging out:", error);
        }
    };

    return (
        <UserContext.Provider value={{ user, setUser: saveUser, logout }}>
            {children}
        </UserContext.Provider>
    );
};

