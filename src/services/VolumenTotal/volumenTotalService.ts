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
                timeout: 15000,
                headers: {
                    'Accept': 'application/json'
                }
            });

            return response.data;
        } catch (error: any) {
            console.error('FT-volumenTotalService-Error fetching data:', error?.response?.status, error?.message);
            throw error;
        }
    }
};

export default volumenTotalService;