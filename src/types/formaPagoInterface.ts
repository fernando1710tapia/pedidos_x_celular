import { ClienteInterface } from "./clienteInterface";

export interface FormapagoInterface {
    codigo: string;
    nombre: string;
    activo: boolean;
    usuarioactual: string;
    codigosri: string;
    clienteList: ClienteInterface[]; // Lista de clientes como un array de `Cliente`
}
