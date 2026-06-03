// src/types/navigation.ts
export type RootStackParamList = {
    Login: undefined;
    NotaPedido: undefined;
    PrePedido: undefined;
    RecuperarClave: undefined;
    BorrarUsuario: undefined;
    ListaNotaPedido: {
        codigocliente?: string;
        nombreCliente?: string;
    };
    ListaPrePedido: {
        codigocliente?: string;
        nombreCliente?: string;
    };
    MenuOperativo: undefined;
    ValidaSellos: undefined;
    VolumenTotal: undefined;
};
