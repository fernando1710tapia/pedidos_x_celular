import axios, { AxiosResponse } from 'axios';
import { API_CONFIG } from '../../constants/Config';
import { GlobalServiceInterface } from '../../types';

export const volumenTotalService: GlobalServiceInterface = {
    getResource: async <T>(resource: string, id: string = '', queryParams: Record<string, any> = {}): Promise<T> => {
        try {
            const baseUrl = `${API_CONFIG.BASE_URL}/${resource}`;

            // Construimos el query string manualmente para evitar que axios
            // codifique las barras de la fecha (2025/11/24 → 2025%2F11%2F24)
            const queryString = Object.entries(queryParams)
                .map(([key, value]) => `${key}=${value}`)
                .join('&');

            const url = queryString ? `${baseUrl}?${queryString}` : baseUrl;

            console.log('FT-volumenTotalService::URL FINAL:', url);

            const response: AxiosResponse<T> = await axios.get(url, {
                timeout: API_CONFIG.TIMEOUT,
                headers: API_CONFIG.HEADERS,
            });

            return response.data;
        } catch (error: any) {
            // Error silenciado para que no aparezca en la UI de desarrollo
            throw error;
        }
    }
};

export default volumenTotalService;