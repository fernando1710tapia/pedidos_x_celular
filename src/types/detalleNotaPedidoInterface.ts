import { MedidaInterface, MedidaNpInterace } from "./medidaInterface";
import { CodigoProductoNP, ProductoInterface } from "./productoInterace";

export interface DetalleNotaPedidoInterface {
    detallenotapedidoPK: DetalleNotaPedidoPKInterface;
    volumennaturalrequerido: number; // Usamos number en lugar de BigDecimal
    volumennaturalautorizado: number;
    usuarioactual: string;
    medida?: MedidaNpInterace;
    producto?: CodigoProductoNP;
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
}


export interface DetalleNotaPedidoPKInterface {
    codigoabastecedora: string;
    codigocomercializadora: string;
    numero: string;
    codigoproducto: string;
    codigomedida: string;
}