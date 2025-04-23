import axios, { AxiosResponse } from "axios";
import { API_CONFIG } from "../../constants/Config";
import { EnvioNotaPedidoInterface, GlobalServiceInterface } from "../../types"; // Asegúrate de importar la interfaz correcta

const crearNotaPedido = {
    postNotaPedido: async <T>(body: EnvioNotaPedidoInterface ): Promise<any> => {
        try {
            const url = `${API_CONFIG.BASE_URL}/ec.com.infinity.modelo.notapedido`; // URL correcta
            
            const response: AxiosResponse<T> = await axios.post(url, body, {
                timeout: API_CONFIG.TIMEOUT,
                headers: API_CONFIG.HEADERS,
            });

            return response.data;
        } catch (error) {
            console.error("Error al enviar la Nota de Pedido:", error);
            throw error;
        }
    },
};

const getListasNotasPedido: GlobalServiceInterface = {
    getResource: async <T>(resource: string, id: string = '', queryParams: Record<string, any> = {}): Promise<T> => {
        try {
            const url = `${API_CONFIG.BASE_URL}/${resource}`;
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


export {crearNotaPedido, getListasNotasPedido}
