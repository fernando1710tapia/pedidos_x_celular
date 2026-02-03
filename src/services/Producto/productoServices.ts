import axios, { AxiosResponse } from 'axios';
import { API_CONFIG } from '../../constants/Config';
import { GlobalServiceInterface } from '../../types';

const ProductoServices: GlobalServiceInterface = {
    getResource: async <T>(resource: string, id: string = '', queryParams: Record<string, any> = {}): Promise<T> => {
        try {
            // console.error('FT-ProductoServices::INICIA METODO:');
            const url = `${API_CONFIG.BASE_URL}/ec.com.infinity.modelo.clienteproducto/${resource}`;
      
            // const queryString = new URLSearchParams(queryParams).toString();
            // const fullUrl = queryString ? `${url}?${queryString}` : url;

            // console.error('FT-ProductoServices::URL FINAL LLAMADA:', fullUrl);
            // console.error('FT-ProductoServices::PARAMETROS:', queryParams);

      
            const response: AxiosResponse<T> = await axios.get(url, {
                params: queryParams,
                timeout: API_CONFIG.TIMEOUT,
                headers: API_CONFIG.HEADERS,
            });
            // console.error('FT-ProductoServices::RESPUESTA:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('FT-ProductoServices::Error fetching data:', error);
             console.error('FT-ProductoServices::STATUS REAL:', error.response?.status);
            console.error('FT-ProductoServices::DATA:', error.response?.data);
            throw error;
        }
    },
};

export default ProductoServices;