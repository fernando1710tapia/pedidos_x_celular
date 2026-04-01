import axios, { AxiosResponse } from "axios";
import { API_CONFIG } from "../../constants/Config";
import { EnvioNotaPedidoInterface, GlobalServiceInterface } from "../../types"; // Asegúrate de importar la interfaz correcta

// const crearNotaPedido = {
//     postNotaPedido: async <T>(body: EnvioNotaPedidoInterface ): Promise<any> => {
//         try {
//             const url = `${API_CONFIG.BASE_URL}/ec.com.infinity.modelo.notapedido`; // URL correcta

//             //const queryString = new URLSearchParams(queryParams).toString();
//             //const fullUrl = queryString ? `${url}?${queryString}` : url;

//             //console.error('FT-ProductoServices::URL FINAL LLAMADA:', fullUrl);
//             //console.error('FT-ProductoServices::PARAMETROS:', queryParams);

//             const response: AxiosResponse<T> = await axios.post(url, body, {
//                 timeout: API_CONFIG.TIMEOUT,
//                 headers: API_CONFIG.HEADERS,
//             });

//             return response.data;
//         } catch (error) {
//             console.error("Error al enviar la Nota de Pedido:", error);
//             throw error;
//         }
//     },
// };

//FT:: metodo cambiado 20260203

const crearNotaPedido = {
    postNotaPedido: async <T>(
        body: EnvioNotaPedidoInterface
    ): Promise<T> => {
        const url = `${API_CONFIG.BASE_URL}/ec.com.infinity.modelo.notapedido`;
        return sendPostRequest<T>(url, body);
    },

    crearSolicitud: async <T>(
        body: EnvioNotaPedidoInterface
    ): Promise<T> => {
        const url = `${API_CONFIG.BASE_URL}/ec.com.infinity.modelo.notapedido/crearSolicitud`;
        return sendPostRequest<T>(url, body);
    },

    crearyenviar: async <T>(
        body: EnvioNotaPedidoInterface
    ): Promise<T> => {
        const url = `${API_CONFIG.BASE_URL}/ec.com.infinity.modelo.notapedido/crearyenviar`;
        return sendPostRequest<T>(url, body);
    },
};

const sendPostRequest = async <T>(url: string, body: EnvioNotaPedidoInterface): Promise<T> => {
    try {
        const response: AxiosResponse<T> = await axios.post(
            url,
            body,
            {
                timeout: API_CONFIG.TIMEOUT,
                headers: API_CONFIG.HEADERS,
            }
        );
        return response.data;
    } catch (error: any) {
        console.error('FT-NotaPedidoService::ERROR URL =>', url);
        if (error?.response) {
            console.error('FT-NotaPedidoService::ERROR STATUS =>', error.response.status);
            console.error('FT-NotaPedidoService::ERROR DATA =>', error.response.data);
        }
        throw error;
    }
};


//
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
            console.error('FT:.-getListasNotasPedido-Error fetching data:', error);
            throw error;
        }
    },
};


export { crearNotaPedido, getListasNotasPedido }
