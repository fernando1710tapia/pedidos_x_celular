import axios, { AxiosResponse } from "axios";
import { API_CONFIG } from "../../constants/Config";
import { GlobalServiceInterface } from "../../types";

const obtenerComercializadoraCliente: GlobalServiceInterface = {
    getResource: async <T>(resource: string, id: string = '', queryParams: Record<string, any> = {}): Promise<T> => {
        try {
            //ftft antes del 20260126- const url = `${API_CONFIG.BASE_URL}/ec.com.infinity.modelo.cliente/${resource}`;
            const url = `${API_CONFIG.BASE_URL}/ec.com.infinity.modelo.comercializadora/${resource}`;
  
            // const queryString = new URLSearchParams(queryParams).toString();
            // const fullUrl = queryString ? `${url}?${queryString}` : url;

            // console.error('FT-obtenerComercializadoraCliente::URL FINAL LLAMADA:', fullUrl);
            // console.error('FT-obtenerComercializadoraCliente::PARAMETROS:', queryParams);

  
            const response: AxiosResponse<T> = await axios.get(url, {
                params: queryParams,
                timeout: API_CONFIG.TIMEOUT,
                headers: API_CONFIG.HEADERS,
            });
            // console.error('FT-obtenerComercializadoraCliente::RESPUESTA:', response.data);
            return response.data;
        } catch (error: any) {
            const status = error?.response?.status;
            const data = error?.response?.data;
            console.error('FT::-obtenerComercializadoraCliente-Error:', status, data || error?.message);
            throw error;
        }
    },
};

export default obtenerComercializadoraCliente;