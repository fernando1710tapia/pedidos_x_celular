export interface UserInterface {
    codigo: string;
    cedula: string;
    nombre: string;
    nombrever: string;
    codigocomercializadora: string | null;
    codigocliente: string | null;
    codigoterminal: string | null;
    activo: boolean;
    niveloperacion: string;
    hash: string;
    vigenciahash: string | null;
    clave: string;
    usuarioactual: string;
    correo: string;
    pregunta1: string;
    pregunta2: string;
    pregunta3: string;
    respuesta1: string;
    respuesta2: string;
    respuesta3: string;
}