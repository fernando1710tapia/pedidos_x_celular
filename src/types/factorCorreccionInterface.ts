export interface FactorCorreccionInterface {
    factorcorreccionPK: FactorCorreccionPK;
    factor: number;
    usuarioactual: string | null;
}

export interface FactorCorreccionPK {
    codigocomercializadora: string;
    codigoterminal: string;
    codigoproducto: string;
    fecha: number;
}
