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

    for (const baseUrl of urls) {
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
        } catch (error) {
            // Esta URL no respondió o el usuario no existe aquí → continuar con la siguiente
            continue;
        }
    }

    throw new Error("Usuario no encontrado en ningún ambiente.");
};

const COMERCIALIZADORAS_NAMES: Record<string, string> = {
    'https://infinity.petroleosyservicios.com:8443/infinityone1/resources': 'Petróleos y Servicios',
    'https://infinity.petrolrios.ec:8443/infinityone1/resources': 'Petrolríos',
    'https://infinity.combustibles.com.ec:8443/infinityone1/resources': 'Fenapet / Combustibles',
    'https://infinity.secsacombustibles.ec:8443/infinityone1/resources': 'Secsa'
};

const searchDistributorEnvironments = async (username: string): Promise<Array<{ baseUrl: string; name: string; codigocomercializadora: string; user: UserInterface }>> => {
    const urls = API_CONFIG.GLOBAL_URLS || [];
    if (!urls.length) throw new Error("No global URLs configured");

    const foundEnvironments: Array<{ baseUrl: string; name: string; codigocomercializadora: string; user: UserInterface }> = [];

    // Promesas para buscar en paralelo en todas las URLs
    const searchPromises = urls.map(async (baseUrl) => {
        // Excluir supertech
        if (baseUrl.includes('supertech.ec')) return null;

        const url = `${baseUrl}/ec.com.infinity.modelo.usuario/porUsuario`;
        try {
            const response = await axios.get<ApiResponse<UserInterface>>(url, {
                params: { codigo: username },
                timeout: 5000,
                headers: API_CONFIG.HEADERS
            });
            if (response.data && response.data.retorno && response.data.retorno.length > 0) {
                const user = response.data.retorno[0];
                return {
                    baseUrl,
                    name: COMERCIALIZADORAS_NAMES[baseUrl] || baseUrl,
                    codigocomercializadora: user.codigocomercializadora ? String(user.codigocomercializadora).trim() : '',
                    user
                };
            }
        } catch (error) {
            // Ignorar errores individuales para no bloquear otras respuestas
        }
        return null;
    });

    const results = await Promise.all(searchPromises);
    results.forEach(res => {
        if (res) foundEnvironments.push(res);
    });

    if (foundEnvironments.length === 0) {
        throw new Error("Usuario no encontrado en ningún ambiente.");
    }

    return foundEnvironments;
};

export {loginServices, updatePassword, searchUserInAllEnvironments, searchDistributorEnvironments};
