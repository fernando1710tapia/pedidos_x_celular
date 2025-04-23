import { BancoComerInterface } from "./comercializadoraInterface"

export interface TerminalClienteInterface {
    codigo: string
    nombre: string
    nombrecomercial: string
    estado: boolean
    codigoarch: string
    codigostc: string
    clavestc: string
    codigocomercializadora: string
    ruc: string
    direccion: string
    identificacionrepresentantelega: string
    nombrearrendatario: string
    nombrerepresentantelegal: string
    escontribuyenteespacial: string
    telefono1: string
    telefono2: string
    correo1: string
    correo2: string
    tipoplazocredito: string
    diasplazocredito: number
    tasainteres: number
    cuentadebito: string
    tipocuentadebito: string
    controlagarantia: boolean
    controlaprorroga: boolean
    codigolistaprecio: number
    codigolistaflete: number
    aplicasubsidio2: boolean
    centrocosto: string
    fehainscripcion: number
    fehainiciooperacion: number
    feharegistroarch: number
    fehavencimientocontrato: number
    codigosupervisorzonal: number
    controldespacho: number
    usuarioactual: string
    codigobancodebito: BancoComerInterface
    codigodireccioninen: DireccionInenInterace
    codigoformapago: FormaPagoTermInterface
    codigoterminaldefecto: TerminalDefectoInterface
    codigotipocliente: TipoClienteInterface
}


export interface DireccionInenInterace {
    codigo: string
    nombre: string
    activo: boolean
    usuarioactual: string
}

export interface FormaPagoTermInterface {
    codigo: string
    codigosri: string
    nombre: string
    activo: boolean
    usuarioactual: string
}

export interface TerminalDefectoInterface {
    codigo: string
    nombre: string
    activo: boolean
    usuarioactual: string
}

export interface TipoClienteInterface {
    codigo: string
    nombre: string
    activo: boolean
    usuarioactual: string
}
