import { useContext } from "react";
import { UserContext } from "../context";

// Hook para usar el contexto en otros componentes
export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error("useUser debe usarse dentro de un UserProvider");
    }
    return context;
};
