import { useNavigation } from '@react-navigation/native';
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
import { getListasNotasPedido } from '../../services';
import {
    ApiResponse,
    ListaNotaPedidoInterace,
    RootStackParamList,
} from '../../types';

type NavigationProps = StackNavigationProp<RootStackParamList, 'Login'>;

/** Parsea fechas: ISO, yyyy/MM/dd, dd/MM/yyyy, timestamp. */
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
            const date = parseISO(ymd[0]);
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
} => {
    const base = (typeof item === 'object' && item !== null ? { ...(item as Record<string, unknown>) } : {}) as ListaNotaPedidoInterace & Record<string, unknown>;
    const raw = base as Record<string, unknown>;
    const fechasExtraidas = extraerFechasDeObjeto(item);
    // Fechas con fallback a hoy/mañana
    const today = new Date();
    const tomorrow = addDays(today, 1);
    const todayStr = format(today, 'yyyy-MM-dd');
    const tomorrowStr = format(tomorrow, 'yyyy-MM-dd');
    const venta = fechasExtraidas[0] || aFechaString((base.fechaVenta ?? raw.fechaventa ?? raw.fechaVenta) as string | number | undefined) || todayStr;
    const despacho = (fechasExtraidas[1] ?? fechasExtraidas[0]) || aFechaString((base.fechaDespacho ?? raw.fechadespacho ?? raw.fechaDespacho) as string | number | undefined) || tomorrowStr;

    // Extraer cliente
    let nombreCliente = String((raw.nombreCliente ?? raw.nombrecliente ?? raw.nombreclientecomercial ?? '') || '');
    let codigoCliente = raw.codigoCliente ?? raw.codigocliente ?? '';
    if (codigoCliente && typeof codigoCliente === 'object') {
        const c = codigoCliente as Record<string, unknown>;
        if (!nombreCliente) nombreCliente = String(c.nombre ?? c.nombrecomercial ?? '');
        codigoCliente = String(c.codigo ?? '');
    } else {
        codigoCliente = String(codigoCliente || '');
    }

    // Extraer terminal
    let nombreTerminal = String((raw.nombreTerminal ?? raw.nombreterminal ?? '') || '');
    let codigoTerminal = raw.codigoTerminal ?? raw.codigoterminal ?? '';
    if (codigoTerminal && typeof codigoTerminal === 'object') {
        const t = codigoTerminal as Record<string, unknown>;
        if (!nombreTerminal) nombreTerminal = String(t.nombre ?? t.nombrecomercial ?? '');
        codigoTerminal = String(t.codigo ?? '');
    } else {
        codigoTerminal = String(codigoTerminal || '');
    }

    return {
        ...base,
        fechaVenta: venta,
        fechaDespacho: despacho,
        nombreCliente: nombreCliente || undefined,
        codigoCliente: (codigoCliente as string) || undefined,
        nombreTerminal: nombreTerminal || undefined,
        codigoTerminal: (codigoTerminal as string) || undefined,
    };
};

/** Para GENERADA: muestra "Ayer/Hoy" y la fecha */
const formatGeneradaDate = (fecha: string | undefined): string => {
    const date = parseDate(fecha ?? '') ?? new Date();
    try {
        const formattedDate = format(date, 'dd/MM/yyyy');
        if (isYesterday(date)) return `Ayer - ${formattedDate}`;
        if (isToday(date)) return `Hoy - ${formattedDate}`;
        return formattedDate;
    } catch {
        return format(new Date(), 'dd/MM/yyyy');
    }
};

/** Para PARA DESPACHAR: muestra "Hoy/Mañana" y la fecha */
const formatDespacharDate = (fecha: string | number | undefined): string => {
    const date = parseDate(fecha ?? '') ?? addDays(new Date(), 1);
    try {
        const formattedDate = format(date, 'dd/MM/yyyy');
        if (isToday(date)) return `Hoy - ${formattedDate}`;
        if (isSameDay(date, addDays(new Date(), 1))) return `Mañana - ${formattedDate}`;
        return formattedDate;
    } catch {
        return format(addDays(new Date(), 1), 'dd/MM/yyyy');
    }
};

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

    // Determina si es usuario regular (8 dígitos) o admin
    const isAdmin = user?.codigo ? !/^\d{8}$/.test(user.codigo) : false;

    const ayer = new Date();
    // ayer.setDate(ayer.getDate() - 1); // Remove yesterday logic
    const fechaActual = format(ayer, 'yyyy/MM/dd');

    const [listaNPs, setListaNPs] = useState<(ListaNotaPedidoInterace & {
        fechaVenta: string; fechaDespacho: string;
        nombreCliente?: string; codigoCliente?: string;
        nombreTerminal?: string; codigoTerminal?: string;
    })[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const getListaNP = async () => {
        if (!user?.codigocliente) return; // Validación extra: solo usuarios con cliente asignado consultan por defecto

        try {
            setLoading(true);
            const params: Record<string, any> = {
                pcodigocomercializadora: user?.codigocomercializadora,
                pcodigocliente: user?.codigocliente,
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
                setListaNPs(response.retorno.map((item: unknown) => normalizarItemLista(item)));
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
        if (user?.codigocomercializadora && user?.codigocliente) {
            getListaNP();
        }
    }, [user]);

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
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.headerButtonLeft}
                        onPress={() => navigation.navigate('MenuOperativo')}
                    >
                        <Icon name="chevron-back" size={28} color="#1565C0" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Tus pedidos</Text>
                    <TouchableOpacity style={styles.headerButtonRight} onPress={onLogout}>
                        <Icon name="log-out-outline" size={26} color="#DC2626" />
                    </TouchableOpacity>
                </View>

                {/* Pagination */}
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
                                    <Text style={styles.cardOrderNumber}>{np.numeroNotaPedido || '—'}</Text>
                                </View>

                                {/* Sección cliente y terminal (solo si tiene datos) */}
                                {(np.nombreCliente || np.codigoCliente || np.nombreTerminal || np.codigoTerminal) && (
                                    <>
                                        <View style={styles.divider} />
                                        <View style={styles.infoRow}>
                                            <View style={styles.infoItem}>
                                                <View style={styles.infoIconRow}>
                                                    <Icon name="person-outline" size={13} color="#1565C0" />
                                                    <Text style={styles.infoLabel}>CLIENTE</Text>
                                                </View>
                                                <Text style={styles.infoValue} numberOfLines={2}>
                                                    {np.nombreCliente || (np.codigoCliente ? `Cód: ${np.codigoCliente}` : '—')}
                                                </Text>
                                            </View>
                                            <View style={styles.infoItemRight}>
                                                <View style={styles.infoIconRow}>
                                                    <Icon name="location-outline" size={13} color="#1565C0" />
                                                    <Text style={styles.infoLabel}>TERMINAL</Text>
                                                </View>
                                                <Text style={[styles.infoValue, { textAlign: 'right' }]} numberOfLines={2}>
                                                    {np.nombreTerminal || (np.codigoTerminal ? `Cód: ${np.codigoTerminal}` : '—')}
                                                </Text>
                                            </View>
                                        </View>
                                    </>
                                )}

                                <View style={styles.divider} />

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
                                            <Text style={styles.despacharText}>{formatDespacharDate(np.fechaDespacho || np.fechaVenta)}</Text>
                                        </View>
                                    </View>
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
                <View style={styles.footer}>
                    <View style={styles.footerBrand}>
                        <Text style={styles.footerBrandText}>ESTA APP ES PARTE DE</Text>
                        <Text style={styles.footerBrandName}>infinityOne</Text>
                        <Image
                            source={require('../../../assets/logoinfinity.png')}
                            style={styles.footerLogo}
                            resizeMode="contain"
                        />
                    </View>
                </View>
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    headerButtonLeft: {
        padding: 6,
        minWidth: 44,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    headerButtonRight: {
        padding: 6,
        minWidth: 44,
        alignItems: 'flex-end',
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
        color: '#374151',
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
        fontSize: 10,
        fontWeight: '700' as const,
        color: '#1565C0',
        letterSpacing: 0.5,
    },
    infoValue: {
        fontSize: 13,
        fontWeight: '600' as const,
        color: '#111827',
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
});
