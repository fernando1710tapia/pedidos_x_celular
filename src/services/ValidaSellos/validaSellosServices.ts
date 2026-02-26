import axios, { AxiosResponse } from "axios";
import { API_CONFIG } from "../../constants/Config";
import { GlobalServiceInterface } from "../../types";

const SUPERTECH_URL = 'http://www.supertech.ec:8080/infinityone1/resources';

export const usoSelloService: GlobalServiceInterface = {
    getResource: async <T>(resource: string, id: string = '', queryParams: Record<string, any> = {}): Promise<T> => {
        try {
            const url = `${SUPERTECH_URL}/${resource}`;
            console.log('FT-usoSelloService::URL LLAMADA:', url);
            console.log('FT-usoSelloService::PARAMS:', JSON.stringify(queryParams));

            // Log de la URI exacta que generará axios (con parámetros)
            const fullUri = axios.getUri({ url, params: queryParams });
            console.log('FT-usoSelloService::URI FINAL:', fullUri);

            const response: AxiosResponse<T> = await axios.get(url, {
                params: queryParams,
                timeout: API_CONFIG.TIMEOUT,
                // No enviamos headers globales para evitar el 404 por Content-Type en GET
                headers: {
                    'Accept': 'application/json'
                }
            });

            return response.data;
        } catch (error: any) {
            const fullUriError = axios.getUri({ url: `${API_CONFIG.BASE_URL}/${resource}`, params: queryParams });
            console.error('FT:.-usoSelloService-Error fetching data:', error?.response?.status, fullUriError);
            throw error;
        }
    },
    putResource: async <T>(resource: string, body: any): Promise<T> => {
        try {
            const url = `${SUPERTECH_URL}/${resource}`;
            console.log('FT-usoSelloService::PUT URL:', url);

            const response: AxiosResponse<T> = await axios.put(url, body, {
                timeout: API_CONFIG.TIMEOUT,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            return response.data;
        } catch (error: any) {
            console.error('FT:.-usoSelloService-Error updating data:', error?.response?.status, error?.response?.data || error?.message);
            throw error;
        }
    },
};

export default usoSelloService;
