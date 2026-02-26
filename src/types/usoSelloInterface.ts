export interface UsoSelloPK {
    codigocomercializadora: string;
    codigoterminal: string;
    codigocliente: string;
    placa: string;
    np1: string;
}

export interface UsoSelloInterface {
    usoselloPK: UsoSelloPK;
    fecha: number;
    nombreconductor: string;
    nombrecliente: string;
    np2?: string;
    np3?: string;
    np4?: string;
    np5?: string;
    np6?: string;
    sello1?: number | null;
    sello2?: number | null;
    sello3?: number | null;
    sello4?: number | null;
    sello5?: number | null;
    sello6?: number | null;
    sello7?: number | null;
    sello8?: number | null;
    sello9?: number | null;
    sello10?: number | null;
    sello11?: number | null;
    sello12?: number | null;
    sello13?: number | null;
    sello14?: number | null;
    sello15?: number | null;
    sello16?: number | null;
    sello1recibido?: boolean;
    sello2recibido?: boolean;
    sello3recibido?: boolean;
    sello4recibido?: boolean;
    sello5recibido?: boolean;
    sello6recibido?: boolean;
    sello7recibido?: boolean;
    sello8recibido?: boolean;
    sello9recibido?: boolean;
    sello10recibido?: boolean;
    sello11recibido?: boolean;
    sello12recibido?: boolean;
    sello13recibido?: boolean;
    sello14recibido?: boolean;
    sello15recibido?: boolean;
    sello16recibido?: boolean;
    informado?: boolean;
    observacionrecibido?: string | null;
    usuarioactual: string;
    fechahoraregistro: number;
}
