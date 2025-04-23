import { FacturaInterface } from "./facturaInterface";

export interface DetalleFacturaInterface {
    volumennaturalrequerido: number;
    volumennaturalautorizado: number;
    precioproducto: number;
    subtotal: number;
    usuarioactual: string;
    ruccomercializadora: string;
    nombreproducto: string;
    codigoimpuesto: string;
    nombreimpuesto: string;
    codigoprecio: string;
    seimprime: boolean;
    valordefecto: number;
    detallefacturaPK: DetalleFacturaPKInterface;
    factura: FacturaInterface;
    codigomedida: string;
}

export interface DetalleFacturaPKInterface {
    codigoabastecedora: string;
    codigocomercializadora: string;
    numeronotapedido: string;
    numero: string;
    codigoproducto: string;
}
