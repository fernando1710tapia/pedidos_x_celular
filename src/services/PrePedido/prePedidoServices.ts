import axios, { AxiosResponse } from "axios";
import { API_CONFIG } from "../../constants/Config";
import { EnvioPrePedidoInterface, GlobalServiceInterface } from "../../types";

const PREPEDIDO_BASE_URL = "http://www.supertech.ec:8080/infinityone1/resources";

const crearPrePedido = {
    postPrePedido: async <T>(
        body: EnvioPrePedidoInterface
    ): Promise<T> => {
        const url = `${PREPEDIDO_BASE_URL}/ec.com.infinity.modelo.prepedido`;
        return sendPostRequest<T>(url, body);
    },

    crearSolicitud: async <T>(
        body: EnvioPrePedidoInterface
    ): Promise<T> => {
        const url = `${PREPEDIDO_BASE_URL}/ec.com.infinity.modelo.prepedido/crearSolicitud`;
        return sendPostRequest<T>(url, body);
    },

    crearyenviar: async <T>(
        body: EnvioPrePedidoInterface
    ): Promise<T> => {
        const url = `${PREPEDIDO_BASE_URL}/ec.com.infinity.modelo.prepedido/crearyenviar`;
        return sendPostRequest<T>(url, body);
    },

    enviarPetroecuador: async <T>(
        payload: {
            codigoabastecedora: string;
            codigocomercializadora: string;
            numero: string;
            cadena: string;
        }
    ): Promise<T> => {
        const url = `${PREPEDIDO_BASE_URL}/ec.com.infinity.modelo.prepedido/envio`;
        return sendPostRequest<T>(url, payload);
    },
};

const sendPostRequest = async <T>(url: string, body: any): Promise<T> => {
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
        throw error;
    }
};

const getListasPrePedido: GlobalServiceInterface = {
    getResource: async <T>(resource: string, id: string = '', queryParams: Record<string, any> = {}): Promise<T> => {
        try {
            const url = `${PREPEDIDO_BASE_URL}/${resource}`;
            const response: AxiosResponse<T> = await axios.get(url, {
                params: queryParams,
                timeout: API_CONFIG.TIMEOUT,
                headers: API_CONFIG.HEADERS,
            });
            return response.data;
        } catch (error) {
            console.error('FT:.-getListasPrePedido-Error fetching data:', error);
            throw error;
        }
    },
};

export { crearPrePedido, getListasPrePedido };
