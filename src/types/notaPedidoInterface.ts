import { CodigoAbastecedoraNP } from "./abastecedoraInterface";
import { CodigobancoNP } from "./bancoInterface";
import { CodigoClienteNP } from "./clienteInterface";
import { ClientePKInterface } from "./clienteInterface";
import { CodigoComercializadoraNp } from "./comercializadoraInterface";
import { CodigoterminalNP } from "./terminalInterface";

export interface NotaPedidoInterface {
    notapedidoPK: NotaPedidoPKInterface;
    fechaventa: string;
    fechadespacho: string;
    activa: boolean;
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
    //codigocliente?: CodigoClienteNP;
    codigocliente?: ClientePKInterface;
    codigoclienteId: string;
    codigoterminal?: CodigoterminalNP;
    codigobanco?: CodigobancoNP;
    comercializadora?: CodigoComercializadoraNp;
    abastecedora?: CodigoAbastecedoraNP;
}

export interface NotaPedidoPKInterface {
    codigoabastecedora: string;
    codigocomercializadora: string;
    numero: string;
}

