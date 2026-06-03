import { ClienteInterface } from "./clienteInterface";
import { ComercializadoraInterface } from "./comercializadoraInterface";

export interface EnvioPrePedidoInterface {
    prepedido: {
        prepedidoPK: {
            codigoabastecedora: string;
            codigocomercializadora: string;
            numero: string;
        };
        fechaventa: string;
        fechadespacho: string;
        activa: boolean;
        facturada: string;
        codigoautotanque: string;
        cedulaconductor: string;
        numerofacturasri: string;
        respuestageneracionoeepp: string;
        observacion: string;
        adelantar: boolean;
        procesar: boolean;
        respuestaanulacionoeepp: string;
        tramaenviadagoe: string;
        tramarenviadaaoe: string;
        tramarecibidagoe: string;
        tramarecibidaaoe: string;
        usuarioactual: string;
        prefijo: string;
        codigocliente: ClienteInterface | any;
        codigoclienteId: string;
        codigoterminal: {
            codigo: string;
            nombre?: string;
        };
        codigobanco: {
            codigo: string;
        };
        comercializadora: ComercializadoraInterface | any;
        abastecedora: {
            codigo: string;
        };
    };
    detalle: {
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
        medida: {
            codigo: string;
        };
        producto: {
            codigo: string;
            nombre?: string;
        };
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
        selloinicial: number;
        sellofinal: number;
    };
}
