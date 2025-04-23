import { DetalleFacturaInterface } from "./detalleFacturaInterface";
import { DetalleNotaPedidoInterface } from "./detalleNotaPedidoInterface";

export interface MedidaInterface {
    codigo: string;
    nombre: string;
    abreviacion: string;
    activo: boolean;
    usuarioactual: string;
    detallenotapedidoList: DetalleNotaPedidoInterface[];
    detallefacturaList: DetalleFacturaInterface[];
}

export interface MedidaNpInterace {
    codigo: string
}
