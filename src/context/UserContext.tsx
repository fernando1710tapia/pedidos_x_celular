
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, ReactNode, useEffect, useState, useContext } from "react";
import { UserInterface } from "../types";


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
                if (storedUser) {
                    setUser(JSON.parse(storedUser));
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
            } else {
                await AsyncStorage.removeItem('user');
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
            setUser(null);
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

