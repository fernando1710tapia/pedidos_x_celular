import { ComercializadoraInterface } from "./comercializadoraInterface";

export interface NumeracionInterface {
    id: number; // Long en Java mapea a number en TypeScript
    tipodocumento: string;
    activo: boolean;
    ultimonumero: number; // int en Java mapea a number en TypeScript
    version?: number; // Integer en Java mapea a number en TypeScript, y es opcional si puede ser null o undefined
    codigocomercializadora: ComercializadoraInterface; // Aquí asumo que Comercializadora es otra interfaz, por lo que debes definirla según tu modelo
    usuarioactual: string;
}