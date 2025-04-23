import { ClienteInterface } from "./clienteInterface"

export interface ProductoResponseInterface {
    clienteproductoPK: ClienteproductoPkInterface
    activo: boolean
    usuarioactual: string
    cliente: ClienteInterface
    producto: ProductoInterface
}

export interface ClienteproductoPkInterface {
    codigocliente: string
    codigo: string
}

export interface ProductoInterface {
    codigo: string
    nombre: string
    codigostc: string
    codigoarch: string
    usuarioactual: string
    porcentajeivapresuntivo: number
    codigoareamercadeo: AreaMercadeoInterface
}

export interface AreaMercadeoInterface {
    codigo: string
    nombre: string
    activo: boolean
    usuarioactual: string
}

export interface CodigoProductoNP {
    codigo: string
}
