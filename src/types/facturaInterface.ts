export interface FacturaInterface {
    fechaventa: string;
    fechavencimiento: string;
    fechaacreditacion: string;
    fechadespacho: string;
    activa: boolean;
    valortotal: number;
    valorconrubro: number;
    ivatotal: number;
    observacion: string;
    pagada: boolean;
    oeenpetro: boolean;
    codigocliente: string;
    codigoterminal: string;
    codigobanco: string;
    usuarioactual: string;
    nombrecomercializadora: string;
    ruccomercializadora: string;
    direccionmatrizcomercializadora: string;
    nombrecliente: string;
    ruccliente: string;
    valorsinimpuestos: number;
    correocliente: string;
    direccioncliente: string;
    telefonocliente: string;
    numeroautorizacion: string;
    fechaautorizacion: string;
    clienteformapago: string;
    plazocliente: number;
    claveacceso: string;
    campoadicionalCampo1: string;
    campoadicionalCampo2: string;
    campoadicionalCampo3: string;
    campoadicionalCampo4: string;
    campoadicionalCampo5: string;
    campoadicionalCampo6: string;
    estado: string;
    errordocumento: number;
    hospedado: number;
    ambientesri: string;
    tipoemision: string;
    codigodocumento: string;
    esagenteretencion: boolean;
    escontribuyenteespacial: string;
    obligadocontabilidad: string;
    tipocomprador: string;
    moneda: string;
    seriesri: string;
    facturaPK: FacturaPKInterface;
    adelantar: boolean;
    tipoplazocredito: string;
    oeanuladaenpetro: boolean;
    refacturada: boolean;
    reliquidada: boolean;
    seleccionar: boolean;
    fechaacreditacionprorrogada: string;
    clienteformapagonosri: string;
    despachada: boolean;
    enviadaxcobrar: boolean;
}

export interface FacturaPKInterface {
    codigoabastecedora: string;
    codigocomercializadora: string;
    numeronotapedido: string;
    numero: string;
}

