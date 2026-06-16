import axios, { AxiosResponse } from "axios";
import { API_CONFIG } from "../../constants/Config";

const PREPEDIDO_BASE_URL = "http://www.supertech.ec:8080/infinityone1/resources";

export interface AutorizarPrePedidoPayload {
    detalleprepedidoPK: {
        codigoabastecedora: string;
        codigocomercializadora: string;
        numero: string;
        codigoproducto: string;
        codigomedida: string;
    };
    volumennaturalrequerido: number;
    volumennaturalautorizado: number;
    usuarioactual: string;
    activo: boolean;
    autorizado: string;
    numeronp: string;
    selloinicial: number;
    sellofinal: number;
    compartimento1: number;
    compartimento2: number;
    compartimento3: number;
    compartimento4: number;
    compartimento5: number;
    compartimento6: number;
    compartimento7: number;
    compartimento8: number;
    compartimento9: number;
    compartimento10: number;
    medida: {
        codigo: string;
    };
    producto: {
        codigo: string;
        codigoareamercadeo: {
            codigo: string;
        };
    };
}

const sendPutRequest = async <T>(url: string, body: any): Promise<T> => {
    try {
        const response: AxiosResponse<T> = await axios.put(
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

const detallePrePedidoService = {
    autorizar: async <T>(body: AutorizarPrePedidoPayload): Promise<T> => {
        const url = `${PREPEDIDO_BASE_URL}/ec.com.infinity.modelo.detalleprepedido/porId`;
        return sendPutRequest<T>(url, body);
    }
};

export { detallePrePedidoService };
