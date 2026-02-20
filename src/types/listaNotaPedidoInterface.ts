export interface ListaNotaPedidoInterace {
    codigoComercializadora: string
    numeroNotaPedido: string
    numeroFactura: string
    numeroGuia: string
    /** Fecha de venta/generación (cuando se creó el pedido) → GENERADA: "Ayer"/"Hoy" */
    fechaVenta: string
    /** Fecha de generación (opcional). Si no viene, se usa fechaVenta para GENERADA. */
    fechaGeneracion?: string
    /** Fecha de despacho elegida al crear el pedido (Hoy/Mañana) → PARA DESPACHAR. Si no viene, se usa fechaVenta. */
    fechaDespacho?: string
    estadoFactura: boolean
}
