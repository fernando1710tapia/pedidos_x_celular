import { FormapagoInterface } from "./formaPagoInterface";
import { TerminalInterface } from "./terminalInterface";

export interface ClienteInterface {
    clientePK: ClientePKInterface;
    //codigo: string;
    nombre: string;
    estado: boolean;
    codigoarch: string;
    codigostc: string;
    clavestc: string;
    //codigocomercializadora: string;
    ruc: string;
    codigotipocliente: string;
    codigodireccioninen: string;
    direccion: string;
    identificacionrepresentantelega: string;
    nombrearrendatario: string;
    nombrerepresentantelegal: string;
    escontribuyenteespacial: string;
    telefono1: string;
    telefono2: string;
    correo1: string;
    correo2: string;
    tipoplazocredito: string;
    diasplazocredito: number; // `Short` en Java se convierte en `number` en TS
    codigobancodebito: string;
    tasainteres: number; // `BigDecimal` en Java se maneja como `number` en TS
    cuentadebito: string;
    tipocuentadebito: string;
    controlagarantia: boolean;
    codigolistaprecio: number; // `long` en Java se convierte en `number` en TS
    codigolistaflete: string;
    aplicasubsidio2: boolean;
    centrocosto: string;
    fehainscripcion: Date;
    fehainiciooperacion: Date;
    feharegistroarch: Date;
    fehavencimientocontrato: Date;
    codigosupervisorzonal: string;
    usuarioactual: string;
    nombrecomercial: string;
    codigoformapago: FormapagoInterface; // Dependencia a otra interfaz
    codigoterminaldefecto: TerminalInterface; // Dependencia a otra interfaz
    controldespacho: number; // `int` en Java se convierte en `number` en TS
    controlaprorroga: boolean;
}

export interface CodigoClienteNP {
    codigo: string
}
export interface ClientePKInterface {
    codigocomercializadora: string;
    codigo: string;
}