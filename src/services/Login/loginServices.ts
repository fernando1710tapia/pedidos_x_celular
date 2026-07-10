import axios, { AxiosResponse } from 'axios';
import { API_CONFIG } from '../../constants/Config';
import { GlobalServiceInterface, UserInterface, ApiResponse } from '../../types';

const loginServices: GlobalServiceInterface = {
    getResource: async <T>(resource: string, id: string = '', queryParams: Record<string, any> = {}): Promise<T> => {
        try {
            const url = `${API_CONFIG.BASE_URL}/${resource}`;
      
            const response: AxiosResponse<T> = await axios.get(url, {
                params: queryParams,
                timeout: API_CONFIG.TIMEOUT,
                headers: API_CONFIG.HEADERS,
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    putResource: async <T>(resource: string, body: any, queryParams: Record<string, any> = {}): Promise<T> => {
        try {
            const url = `${API_CONFIG.BASE_URL}/${resource}`;
            const response: AxiosResponse<T> = await axios.put(url, body, {
                params: queryParams,
                timeout: API_CONFIG.TIMEOUT,
                headers: API_CONFIG.HEADERS,
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },
};

const updatePassword = {
    postUser: async <T>(body: UserInterface ): Promise<any> => {
        try {
            const url = `${API_CONFIG.BASE_URL}/ec.com.infinity.modelo.usuario/porId`; // URL correcta
            
            const response: AxiosResponse<T> = await axios.put(url, body, {
                timeout: API_CONFIG.TIMEOUT,
                headers: API_CONFIG.HEADERS,
            });

            return response.data;
        } catch (error) {
            console.error("Error al actualizar clave:", error);
            throw error;
        }
    },
};

const searchUserInAllEnvironments = async (username: string): Promise<{ baseUrl: string; user: UserInterface }> => {
    const urls = API_CONFIG.GLOBAL_URLS || [];
    if (!urls.length) throw new Error("No global URLs configured");

    const promises = urls.map(async (baseUrl) => {
        const url = `${baseUrl}/ec.com.infinity.modelo.usuario/porUsuario`;
        try {
            const response = await axios.get<ApiResponse<UserInterface>>(url, {
                params: { codigo: username },
                timeout: 5000,
                headers: API_CONFIG.HEADERS
            });
            if (response.data && response.data.retorno && response.data.retorno.length > 0) {
                return { baseUrl, user: response.data.retorno[0] };
            }
            throw new Error("User not found in this environment");
        } catch (error) {
            throw error;
        }
    });

    try {
        return await Promise.any(promises);
    } catch (error) {
        throw new Error("Usuario no encontrado en ningún ambiente.");
    }
};

export {loginServices, updatePassword, searchUserInAllEnvironments};
