import axios, { AxiosResponse } from 'axios';
import { API_CONFIG } from '../../constants/Config';
import { GlobalServiceInterface } from '../../types';

const ProductoServices: GlobalServiceInterface = {
    getResource: async <T>(resource: string, id: string = '', queryParams: Record<string, any> = {}): Promise<T> => {
        try {
            const url = `${API_CONFIG.BASE_URL}/ec.com.infinity.modelo.clienteproducto/${resource}`;
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

export default ProductoServices;