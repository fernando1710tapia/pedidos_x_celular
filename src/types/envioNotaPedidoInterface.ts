import { DetalleNotaPedidoInterface } from "./detalleNotaPedidoInterface";
import { NotaPedidoInterface } from "./notaPedidoInterface";

export interface EnvioNotaPedidoInterface {
    notapedido: NotaPedidoInterface;
    detalle: DetalleNotaPedidoInterface;
}
