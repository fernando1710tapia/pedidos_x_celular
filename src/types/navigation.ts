// src/types/navigation.ts
export type RootStackParamList = {
    Login: undefined;
    NotaPedido: undefined;
    RecuperarClave: undefined;
    ListaNotaPedido: {
        codigocliente?: string;
        nombreCliente?: string;
    };
    MenuOperativo: undefined;
    ValidaSellos: undefined;
    VolumenTotal: undefined;
};
