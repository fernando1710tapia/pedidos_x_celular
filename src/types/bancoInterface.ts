import { ClienteInterface } from "./clienteInterface";
import { NotaPedidoInterface } from "./notaPedidoInterface";

export interface BancoInterface {
    codigo: string;
    nombre: string;
    activo: boolean;
    usuarioactual: string;
    notapedidoList: NotaPedidoInterface[]; // Lista de `NotaPedido`
    clienteList: ClienteInterface[]; // Lista de `Cliente`
}

export interface CodigobancoNP {
    codigo: string
}
