import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    StyleSheet,
    TouchableOpacity,
    View,
    Image,
    ScrollView,
    Text,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { format, parseISO, isToday, isYesterday, addDays, isSameDay } from 'date-fns';
import ScreenWrapper from '../../components/ScreenWrapper';
import { useUser } from '../../hooks';
import { getListasNotasPedido, terminalService, obtenerTerminalCliente } from '../../services';
import {
    ApiResponse,
    ListaNotaPedidoInterace,
    RootStackParamList,
} from '../../types';
import BrandLogo from '../../components/BrandLogo';


type NavigationProps = StackNavigationProp<RootStackParamList, 'Login'>;
type RouteProps = RouteProp<RootStackParamList, 'ListaNotaPedido'>;

/** Parsea fechas: ISO, yyyy/MM/dd, dd/MM/yyyy, timestamp.
 *  IMPORTANTE: Siempre crea la fecha en hora LOCAL para que
 *  isSameDay / isToday / isYesterday funcionen correctamente. */
const parseDate = (fecha: string | number | undefined | null): Date | null => {
    if (fecha == null) return null;
    if (typeof fecha === 'number') {
        const d = new Date(fecha);
        return Number.isNaN(d.getTime()) ? null : d;
    }
    if (typeof fecha !== 'string' || !fecha.trim()) return null;
    const raw = String(fecha).trim();
    try {
        const norm = raw.replace(/\//g, '-');
        // YYYY-MM-DD o YYYY-MM-DDTHH...
        const ymd = norm.match(/(\d{4})-(\d{2})-(\d{2})/);
        if (ymd) {
            // Crear fecha LOCAL (no UTC) para evitar desfase de zona horaria
            const date = new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]));
            return Number.isNaN(date.getTime()) ? null : date;
        }
        // DD-MM-YYYY o DD/MM/YYYY
        const dmy = norm.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
        if (dmy) {
            const [, d, m, y] = dmy;
            const date = new Date(Number(y), Number(m) - 1, Number(d));
            return Number.isNaN(date.getTime()) ? null : date;
        }
        const date = new Date(raw);
        return Number.isNaN(date.getTime()) ? null : date;
    } catch {
        return null;
    }
};

/** Convierte un valor a string de fecha YYYY-MM-DD. */
const aFechaString = (v: string | number | undefined | null): string => {
    if (v == null) return '';
    if (typeof v === 'number') {
        const d = new Date(v);
        return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
    }
    const s = String(v).trim();
    return s || '';
};

/** Extrae de un objeto cualquier valor que parezca una fecha (key contiene "fecha"). */
const extraerFechasDeObjeto = (obj: unknown): string[] => {
    const valores: string[] = [];
    if (obj == null || typeof obj !== 'object') return valores;
    const record = obj as Record<string, unknown>;
    for (const key of Object.keys(record)) {
        if (!key.toLowerCase().includes('fecha')) continue;
        const v = record[key];
        if (v == null) continue;
        if (typeof v === 'number') {
            const d = new Date(v);
            if (!Number.isNaN(d.getTime())) valores.push(d.toISOString().slice(0, 10));
        } else if (typeof v === 'string' && v.trim()) {
            valores.push(String(v).trim());
        } else if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
            valores.push(...extraerFechasDeObjeto(v));
        }
    }
    return valores;
};

/** Normaliza un ítem del API: asegura fechaVenta, fechaDespacho, cliente y terminal. */
const normalizarItemLista = (item: unknown): ListaNotaPedidoInterace & {
    fechaVenta: string;
    fechaDespacho: string;
    nombreCliente?: string;
    codigoCliente?: string;
    nombreTerminal?: string;
    codigoTerminal?: string;
    usuarioactual?: string;
    nombreProducto?: string;
    volumenAutorizado?: string | number;
    medida?: string;
} => {
    const raw = (item || {}) as any;

    // 1. Buscar campos de venta/generación
    let venta = String(raw.fechaventa ?? raw.fechaVenta ?? raw.fechaGeneracion ?? raw.fechageneracion ?? raw.fecha ?? '').trim();

    // 2. Buscar campos de despacho/entrega
    let despacho = String(raw.fechadespacho ?? raw.fechaDespacho ?? raw.fechaentrega ?? raw.fechaEntrega ?? raw.entrega ?? '').trim();

    // 3. Fallback: buscar cualquier cosa que parezca fecha si los campos principales fallan
    if (!venta || !despacho) {
        const fechas = extraerFechasDeObjeto(item);
        if (!venta) venta = fechas[0] || '';
        if (!despacho) despacho = fechas[1] || fechas[0] || '';
    }

    // Si aún así no hay nada, asumimos 'hoy' para no dejarlo vacío
    if (!venta) venta = 'hoy';
    if (!despacho) despacho = venta;

    // Helper para buscar nombre en un objeto o valor
    const extractName = (val: any): string => {
        if (!val) return '';
        if (typeof val === 'string' && val.trim().length > 0) {
            if (/^\d{8,}$/.test(val)) return '';
            return val;
        }
        if (typeof val === 'object') {
            return String(val.nombrecomercial ?? val.nombreComercial ?? val.nombre ?? val.razonsocial ?? val.razonSocial ?? '');
        }
        return '';
    };

    return {
        ...raw,
        fechaVenta: venta,
        fechaDespacho: despacho,
        nombreCliente: extractName(raw.nombreCliente ?? raw.nombrecliente ?? raw.cliente),
        codigoCliente: String(raw.codigoCliente ?? raw.codigocliente ?? (raw.cliente?.codigo ?? '')),
        nombreTerminal: extractName(raw.nombreTerminal ?? raw.nombreterminal ?? raw.terminal ?? raw.estacion),
        codigoTerminal: String(raw.codigoTerminal ?? raw.codigoterminal ?? (raw.terminal?.codigo ?? '')),
        usuarioactual: String(raw.usuarioactual ?? raw.usuarioActual ?? ''),
        nombreProducto: String(raw.NombreProducto ?? raw.nombreproducto ?? raw.nombreProducto ?? ''),
        volumenAutorizado: raw.volumenautorizado ?? raw.volumenAutorizado ?? raw.volumennaturalautorizado ?? '',
        medida: String(raw.medida ?? ''),
    };
};

/** Convierte fecha a etiqueta legible.
 *  Maneja strings literales ("hoy","ayer","mañana") Y fechas reales. */
const resolverEtiquetaFecha = (fecha: string | number | undefined, etiquetasPermitidas: string[]): string => {
    if (!fecha) return 'Hoy';
    const val = String(fecha).trim().toLowerCase();

    // 1. Si el API devolvió un string literal o lo forzamos arriba, lo usamos directamente
    if (val.includes('hoy') && etiquetasPermitidas.includes('Hoy')) return 'Hoy';
    if (val.includes('ayer') && etiquetasPermitidas.includes('Ayer')) return 'Ayer';
    if ((val.includes('mañana') || val.includes('manana')) && etiquetasPermitidas.includes('Mañana')) return 'Mañana';

    // 2. Si es una fecha real o ISO, intentamos parsearla
    const date = parseDate(fecha);
    if (!date) {
        // Fallback: si no es parseable pero es un string corto, mostrarlo (capitalizado)
        if (val.length > 0 && val.length < 15) return val.charAt(0).toUpperCase() + val.slice(1);
        return 'Hoy';
    }

    const today = new Date();
    if (isSameDay(date, today)) return etiquetasPermitidas.includes('Hoy') ? 'Hoy' : 'Hoy';
    if (isSameDay(date, addDays(today, -1))) return etiquetasPermitidas.includes('Ayer') ? 'Ayer' : '';
    if (isSameDay(date, addDays(today, 1))) return etiquetasPermitidas.includes('Mañana') ? 'Mañana' : '';

    return 'Hoy';
};

/** Para GENERADA: muestra siempre Hoy por defecto */
const formatGeneradaDate = (fecha: string | undefined): string => 'Hoy';

/** Para PARA DESPACHAR: muestra "Hoy" o "Mañana" */
const formatDespacharDate = (fecha: string | number | undefined): string =>
    resolverEtiquetaFecha(fecha, ['Hoy', 'Mañana']);

const renderStatusPill = (value: string | undefined, isFilled: boolean) => {
    const text = value && String(value).trim() ? value : 'AUN NO';
    const isFilledState = isFilled && text !== 'AUN NO';
    return (
        <View style={[styles.pill, isFilledState ? styles.pillGreen : styles.pillGray]}>
            <View style={[styles.pillDot, isFilledState ? styles.pillDotGreen : styles.pillDotGray]} />
            <Text style={[styles.pillText, isFilledState ? styles.pillTextGreen : styles.pillTextGray]} numberOfLines={1}>
                {text}
            </Text>
        </View>
    );
};

export const ListaNotaPedidoScreen = () => {
    const { user, logout } = useUser();
    const navigation = useNavigation<NavigationProps>();
    const route = useRoute<RouteProps>();
    const { codigocliente: paramCodigoCliente, nombreCliente: paramNombreCliente } = route.params || {};

    // Determina si es usuario regular (8 dígitos) o admin
    const isAdmin = user?.codigo ? !/^\d{8}$/.test(user.codigo) : false;

    const ayer = new Date();
    // ayer.setDate(ayer.getDate() - 1); // Remove yesterday logic
    const fechaActual = format(ayer, 'yyyy/MM/dd');

    const [listaNPs, setListaNPs] = useState<(ListaNotaPedidoInterace & {
        fechaVenta: string; fechaDespacho: string;
        nombreCliente?: string; codigoCliente?: string;
        nombreTerminal?: string; codigoTerminal?: string;
        nombreProducto?: string; volumenAutorizado?: string | number; medida?: string;
    })[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [resolvedClientName, setResolvedClientName] = useState<string>('');
    const itemsPerPage = 10;

    const fetchClientNameOnce = async (codigo: string) => {
        if (!codigo || resolvedClientName) return;
        try {
            const response = await obtenerTerminalCliente.getResource<ApiResponse<any>>(
                'porComercializadoraCliente',
                '',
                {
                    codigocomercializadora: user?.codigocomercializadora,
                    codigo: codigo
                }
            );
            if (response.retorno && response.retorno[0]) {
                const nombre = String(response.retorno[0].nombrecomercial || response.retorno[0].nombre || '');
                if (nombre) setResolvedClientName(nombre);
            }
        } catch (e) {
            console.error('Error precargando nombre cliente:', e);
        }
    };

    const getListaNP = async (fallbackData?: { clientName: string; stationName: string; stationCode: string }) => {
        const codClienteToUse = paramCodigoCliente || user?.codigocliente || user?.codigo;
        if (!codClienteToUse) return;

        // Intentar precargar el nombre si no lo tenemos
        if (!resolvedClientName) {
            if (paramNombreCliente) {
                setResolvedClientName(paramNombreCliente);
            } else {
                fetchClientNameOnce(codClienteToUse);
            }
        }

        try {
            setLoading(true);
            const params: Record<string, any> = {
                pcodigocomercializadora: user?.codigocomercializadora,
                pcodigocliente: codClienteToUse,
                pfechaventa: fechaActual,
            };

            const response = await getListasNotasPedido.getResource<
                ApiResponse<ListaNotaPedidoInterace>
            >(
                'ec.com.infinity.modelo.notapedido/buscarpedidosfacturadosdespachados',
                '',
                params
            );

            if (response.retorno && response.retorno.length > 0) {
                let normalized = response.retorno.map((item: unknown) => {
                    const norm = normalizarItemLista(item);
                    // Si el item no trae nombre pero tenemos el nombre resuelto para este cliente, lo aplicamos
                    if (!norm.nombreCliente && (norm.codigoCliente === codClienteToUse || !norm.codigoCliente)) {
                        norm.nombreCliente = resolvedClientName;
                    }
                    return norm;
                });

                setListaNPs(normalized);

                // 1. Resolver nombres de CLIENTES faltantes (para casos donde hay múltiples clientes en la lista)
                const clientesFaltantes = [...new Set(normalized
                    .filter(item => !item.nombreCliente && item.codigoCliente)
                    .map(item => item.codigoCliente))] as string[];

                clientesFaltantes.forEach(async (codigo) => {
                    if (codigo === codClienteToUse && resolvedClientName) {
                        setListaNPs(prev => prev.map(item =>
                            item.codigoCliente === codigo ? { ...item, nombreCliente: resolvedClientName } : item
                        ));
                        return;
                    }

                    try {
                        const response = await obtenerTerminalCliente.getResource<ApiResponse<any>>(
                            'porComercializadoraCliente',
                            '',
                            {
                                codigocomercializadora: user?.codigocomercializadora,
                                codigo: codigo
                            }
                        );

                        if (response.retorno && response.retorno[0]) {
                            const clientData = response.retorno[0];
                            const nombre = String(clientData.nombrecomercial || clientData.nombre || '');
                            if (nombre) {
                                setListaNPs(prev => prev.map(item =>
                                    item.codigoCliente === codigo
                                        ? { ...item, nombreCliente: nombre }
                                        : item
                                ));
                            }
                        }
                    } catch (e) {
                        console.error(`Error resolviendo cliente ${codigo}:`, e);
                    }
                });
            } else {
                setListaNPs([]);
                Alert.alert('Aviso', 'No se encontraron notas de pedido.');
            }
        } catch (error: any) {
            console.error('Error de red:', error);
            Alert.alert('Error', `No se pudo conectar al servidor: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const codClienteToUse = paramCodigoCliente || user?.codigocliente || user?.codigo;
        if (user?.codigocomercializadora && codClienteToUse) {
            getListaNP();
        }
    }, [user, isAdmin, paramCodigoCliente, resolvedClientName]);

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = listaNPs.slice(startIndex, endIndex);
    const totalPages = Math.max(1, Math.ceil(listaNPs.length / itemsPerPage));

    const handleNextPage = () => {
        if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
    };

    const handlePrevPage = () => {
        if (currentPage > 1) setCurrentPage((prev) => prev - 1);
    };

    const onLogout = async () => {
        await logout();
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    };

    return (
        <ScreenWrapper>
            <View style={styles.screen}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.headerButtonLeft}
                        onPress={() => navigation.goBack()}
                    >
                        <Icon name="chevron-back" size={32} color="#9CA3AF" />
                    </TouchableOpacity>

                    <View style={styles.headerCenter}>
                        <BrandLogo codigoComercializadora={user?.codigocomercializadora || ''} />
                        <Text style={styles.headerTitle} numberOfLines={1}>
                            {isAdmin && paramNombreCliente ? `PEDIDOS: ${paramNombreCliente}` : 'TUS PEDIDOS'}
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={styles.headerButtonRight}
                        onPress={onLogout}
                    >
                        <Icon name="log-out-outline" size={26} color="#DC2626" />
                    </TouchableOpacity>
                </View>


                <View style={styles.pagination}>
                    <TouchableOpacity
                        onPress={handlePrevPage}
                        disabled={currentPage <= 1}
                        style={styles.paginationSide}
                    >
                        <Text style={[styles.paginationText, currentPage <= 1 && styles.paginationTextDisabled]}>
                            &lt; Anterior
                        </Text>
                    </TouchableOpacity>
                    <Text style={styles.pageInfo}>Página {currentPage} de {totalPages}</Text>

                    <TouchableOpacity
                        onPress={handleNextPage}
                        disabled={currentPage >= totalPages}
                        style={styles.paginationSide}
                    >
                        <Text style={[styles.paginationText, currentPage >= totalPages && styles.paginationTextDisabled]}>
                            Siguiente &gt;
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Lista de pedidos - Cards con scroll */}
                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={true}
                    bounces={true}
                >
                    {loading ? (
                        <Text style={styles.loadingText}>Cargando pedidos...</Text>
                    ) : (
                        currentItems.map((np, index) => (
                            <View key={`${np.numeroNotaPedido}-${index}`} style={styles.card}>

                                {/* Número de pedido */}
                                <View style={styles.cardOrderRow}>
                                    <Text style={styles.cardOrderLabel}>Pedido Nro:</Text>
                                    <Text style={styles.cardOrderNumber}>{np.numeroNotaPedido || ''}</Text>
                                </View>

                                {/* Sección cliente y estación (solo si tiene datos) */}
                                <View style={styles.divider} />
                                <View style={styles.infoRow}>
                                    <View style={styles.infoItem}>
                                        <View style={styles.infoIconRow}>
                                            <Icon name="person-outline" size={18} color="#000000" />
                                            <Text style={styles.infoLabel}>CLIENTE</Text>
                                        </View>
                                        <Text style={styles.infoValue} numberOfLines={2}>
                                            {np.nombreCliente || np.codigoCliente || ''}
                                        </Text>
                                    </View>
                                </View>



                                {/* Fechas */}
                                <View style={styles.cardTopRow}>
                                    <View>
                                        <Text style={styles.cardLabelGenerada}>GENERADA</Text>
                                        <View style={styles.despacharRow}>
                                            <Icon name="calendar-outline" size={18} color="#1565C0" />
                                            <Text style={styles.despacharText}>{formatGeneradaDate(np.fechaVenta)}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.cardDespachar}>
                                        <Text style={styles.cardLabelGenerada}>PARA DESPACHAR</Text>
                                        <View style={styles.despacharRow}>
                                            <Icon name="calendar-outline" size={18} color="#1565C0" />
                                            <Text style={styles.despacharText}>{formatDespacharDate(np.fechaDespacho)}</Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.productInfoRow}>
                                    <View style={styles.infoIconRow}>
                                        <Icon name="cube-outline" size={18} color="#000000" />
                                        <Text style={styles.infoLabel}>PRODUCTO</Text>
                                    </View>
                                    <Text style={styles.productDetailText}>
                                        {np.nombreProducto} - {Math.round(Number(np.volumenAutorizado || 0))} {np.medida}
                                    </Text>
                                </View>




                                {/* Estado: Facturada / Despachada */}
                                <View style={styles.cardStatusRow}>
                                    <View>
                                        <Text style={styles.cardLabel}>FACTURADA</Text>
                                        {renderStatusPill(np.numeroFactura, !!(np.numeroFactura && np.numeroFactura.trim()))}
                                    </View>
                                    <View>
                                        <Text style={[styles.cardLabel, styles.cardLabelRight]}>DESPACHADA</Text>
                                        {renderStatusPill(np.numeroGuia, !!(np.numeroGuia && np.numeroGuia.trim()))}
                                    </View>
                                </View>
                            </View>
                        ))
                    )}
                </ScrollView>

                {/* Botón generar pedido - arriba del footer */}
                <View style={styles.aboveFooter}>
                    <TouchableOpacity
                        style={styles.fab}
                        onPress={() => navigation.navigate('NotaPedido')}
                        activeOpacity={0.8}
                    >
                        <Icon name="add" size={32} color="#FFF" />
                    </TouchableOpacity>
                </View>

                {/* Footer */}
            </View>
        </ScreenWrapper>
    );
};


const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#EFF6FF',
    },
    header: {
        paddingHorizontal: 15,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 80,
    },
    headerCenter: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerButtonLeft: {
        position: 'absolute',
        left: 15,
        zIndex: 10,
        padding: 6,
    },
    headerButtonRight: {
        position: 'absolute',
        right: 15,
        zIndex: 10,
        padding: 6,
    },
    headerTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#9CA3AF',
        textAlign: 'center',
        marginTop: 4,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },



    pagination: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
        backgroundColor: 'transparent',
    },
    paginationSide: {
        minWidth: 90,
    },
    paginationText: {
        fontSize: 14,
        color: '#6B7280',
    },
    paginationTextDisabled: {
        color: '#9CA3AF',
    },
    pageInfo: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
        flexGrow: 1,
    },
    loadingText: {
        textAlign: 'center',
        marginTop: 24,
        fontSize: 15,
        color: '#6B7280',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 18,
        marginBottom: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    cardTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    cardLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: '#9CA3AF',
        letterSpacing: 0.3,
        marginBottom: 4,
    },
    cardLabelGenerada: {
        fontSize: 13,
        fontWeight: '700',
        color: '#000000',
        letterSpacing: 0.4,
        marginBottom: 6,
    },
    cardLabelRight: {
        textAlign: 'right',
    },
    cardOrderRow: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: 6,
        marginBottom: 12,
    },
    cardOrderLabel: {
        fontSize: 12,
        fontWeight: '600' as const,
        color: '#6B7280',
        letterSpacing: 0.3,
    },
    cardOrderNumber: {
        fontSize: 18,
        fontWeight: 'bold' as const,
        color: '#111827',
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginBottom: 12,
        marginTop: 4,
    },
    infoRow: {
        flexDirection: 'row' as const,
        justifyContent: 'space-between' as const,
        marginBottom: 12,
        gap: 8,
    },
    infoItem: {
        flex: 1,
    },
    infoItemRight: {
        flex: 1,
        alignItems: 'flex-end' as const,
    },
    infoIconRow: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: 4,
        marginBottom: 3,
    },
    infoLabel: {
        fontSize: 13,
        fontWeight: '700' as const,
        color: '#000000',
        letterSpacing: 0.4,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '600' as const,
        color: '#1565C0',
    },
    cardDespachar: {
        alignItems: 'flex-end',
    },
    despacharRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    despacharText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1565C0',
    },
    productInfoRow: {
        marginBottom: 16,
    },
    productDetailText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1565C0',
    },
    cardStatusRow: {

        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        gap: 6,
    },
    pillGreen: {
        backgroundColor: '#D1FAE5',
    },
    pillGray: {
        backgroundColor: '#F3F4F6',
    },
    pillDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    pillDotGreen: {
        backgroundColor: '#059669',
    },
    pillDotGray: {
        backgroundColor: '#9CA3AF',
    },
    pillText: {
        fontSize: 13,
        fontWeight: '600',
        maxWidth: 120,
    },
    pillTextGreen: {
        color: '#047857',
    },
    pillTextGray: {
        color: '#6B7280',
    },
    aboveFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#EFF6FF',
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#EFF6FF',
        borderTopWidth: 0,
    },
    footerBrand: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    footerBrandText: {
        fontSize: 10,
        color: '#9CA3AF',
        fontWeight: '600',
    },
    footerBrandName: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#374151',
    },
    footerLogo: {
        width: 70,
        height: 18,
    },
    fab: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#3B82F6',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 6,
    },
    productSection: {
        marginBottom: 16,
    },
    productInfoWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 4,
        backgroundColor: '#F8FAFC',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 12,
        borderLeftWidth: 3,
        borderLeftColor: '#3B82F6',
    },
    productNameValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1F2937',
        flex: 1,
        marginRight: 8,
    },
    productVolumePill: {
        backgroundColor: '#E0F2FE',
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 8,
    },
    productVolumeValue: {
        fontSize: 14,
        fontWeight: '800',
        color: '#1565C0',
    },
    productUnitText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#6B7280',
    },
});
