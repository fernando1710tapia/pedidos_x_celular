import axios, { AxiosResponse } from "axios";
import { API_CONFIG } from "../../constants/Config";
import { GlobalServiceInterface } from "../../types";

const obtenerTerminalCliente: GlobalServiceInterface = {
    getResource: async <T>(resource: string, id: string = '', queryParams: Record<string, any> = {}): Promise<T> => {
        try {
            const url = `${API_CONFIG.BASE_URL}/ec.com.infinity.modelo.cliente/${resource}`;
            
            // const queryString = new URLSearchParams(queryParams).toString();
            // const fullUrl = queryString ? `${url}?${queryString}` : url;

            // console.error('FT-obtenerTerminalCliente::URL FINAL LLAMADA:', fullUrl);
            // console.error('FT-obtenerTerminalCliente::PARAMETROS:', queryParams);

            const response: AxiosResponse<T> = await axios.get(url, {
                params: queryParams,
                timeout: API_CONFIG.TIMEOUT,
                headers: API_CONFIG.HEADERS,
            });
            // console.error('FT-obtenerTerminalCliente::RESPUESTA:', response.data);
            return response.data;
        } catch (error) {
            console.error('FT:.-obtenerTerminalCliente-Error fetching data:', error);
            throw error;
        }
    },
}; 

export default obtenerTerminalCliente;