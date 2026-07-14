import axios, { AxiosResponse } from 'axios';
import { API_CONFIG } from '../../constants/Config';
import { GlobalServiceInterface } from '../../types';

/**
 * Servicio para el modelo ec.com.infinity.modelo.terminal.
 * GET sin path devuelve todas las terminales.
 */
const terminalService: GlobalServiceInterface = {
    getResource: async <T>(resource: string = '', id: string = '', queryParams: Record<string, any> = {}): Promise<T> => {
        try {
            // Se construye dinámicamente en cada llamada para respetar API_CONFIG.BASE_URL
            // actualizado al momento del login (ambiente del usuario)
            const BASE_TERMINAL = `${API_CONFIG.BASE_URL}/ec.com.infinity.modelo.terminal`;
            const url = resource ? `${BASE_TERMINAL}/${resource}` : BASE_TERMINAL;
            const response: AxiosResponse<T> = await axios.get(url, {
                params: Object.keys(queryParams).length ? queryParams : undefined,
                timeout: API_CONFIG.TIMEOUT,
                headers: API_CONFIG.HEADERS,
            });
            return response.data;
        } catch (error) {
            console.error('FT::terminalService-Error fetching data:', error);
            throw error;
        }
    },
};

export default terminalService;
