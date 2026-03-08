import axios, { AxiosResponse } from 'axios';
import { API_CONFIG } from '../../constants/Config';
import { GlobalServiceInterface } from '../../types';

export const volumenTotalService: GlobalServiceInterface = {
    getResource: async <T>(resource: string, id: string = '', queryParams: Record<string, any> = {}): Promise<T> => {
        try {
            const url = `${API_CONFIG.BASE_URL}/${resource}`;
            console.log('FT-volumenTotalService::URL LLAMADA:', url);
            console.log('FT-volumenTotalService::PARAMS:', JSON.stringify(queryParams));

            const response: AxiosResponse<T> = await axios.get(url, {
                params: queryParams,
                timeout: API_CONFIG.TIMEOUT,
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