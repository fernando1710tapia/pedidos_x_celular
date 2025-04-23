import axios, { AxiosResponse } from 'axios';
import { API_CONFIG } from '../../constants/Config';
import { GlobalServiceInterface, UserInterface } from '../../types';

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
            console.error('Error fetching data:', error);
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

export {loginServices, updatePassword};

