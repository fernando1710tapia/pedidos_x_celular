import { AbastecedortaInterface } from "./abastecedoraInterface"
import { NotaPedidoInterface } from "./notaPedidoInterface"
import { NumeracionInterface } from "./numeracionInterface"

export interface ComercializadoraInterface {
  nombre: string
  activo: boolean
  codigoarch: string
  codigostc: string
  clavestc: string
  ruc: string
  nombrecorto: string
  direccion: string
  identificacionrepresentantelega: string
  nombrerepresentantelegal: string
  telefono1: string
  telefono2: string
  correo1: string
  correo2: string
  tipoplazocredito: string
  cuentadebito: string
  tipocuentadebito: string
  establecimientofac: string
  puntoventafac: string
  usuarioactual: string
  establecimientondb: string
  puntoventandb: string
  establecimientoncr: string
  puntoventancr: string
  prefijonpe: string
  clavewsepp: string
  esagenteretencion: boolean
  obligadocontabilidad: string
  leyendaagenteretencion: string
  ambientesri: string
  tipoemision: string
  codigo: string
  escontribuyenteespacial: string
  diasplazocredito: number
  tasainteres: number
  fechavencimientocontr: number
  fehainiciocontrato: number
  codigoabastecedora: AbastecedortaInterface
  codigobancodebito: BancoComerInterface
  numeracionList: NumeracionInterface[]
  notapedidoList: NotaPedidoInterface[] 
}

export interface BancoComerInterface {
  codigo: string
  nombre: string
  activo: boolean
  usuarioactual: string
}

export interface CodigoComercializadoraNp {
  codigo: string
}