import axios, { AxiosResponse } from 'axios';
import { API_CONFIG } from '../../constants/Config';
import { GlobalServiceInterface } from '../../types';

const SUPERTECH_URL = 'http://www.supertech.ec:8080/infinityone1/resources';

export const volumenTotalService: GlobalServiceInterface = {
    getResource: async <T>(resource: string, id: string = '', queryParams: Record<string, any> = {}): Promise<T> => {
        try {
            const url = `${SUPERTECH_URL}/${resource}`;
            const response: AxiosResponse<T> = await axios.get(url, {
                params: queryParams,
                timeout: API_CONFIG.TIMEOUT,
                headers: {
                    'Accept': 'application/json'
                }
            });
            return response.data;
        } catch (error: any) {
            console.error('Error fetching volumen total data:', error);
            throw error;
        }
    }
};

export default volumenTotalService;