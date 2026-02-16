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
import { format, parseISO, isToday } from 'date-fns';
import ScreenWrapper from '../../components/ScreenWrapper';
import { useUser } from '../../hooks';
import { getListasNotasPedido } from '../../services';
import {
    ApiResponse,
    ListaNotaPedidoInterace,
    RootStackParamList,
} from '../../types';

type NavigationProps = StackNavigationProp<RootStackParamList, 'Login'>;

const formatDespacharDate = (fechaVenta: string): string => {
    if (!fechaVenta || !fechaVenta.trim()) return '—';
    try {
        const normalized = fechaVenta.replace(/\//g, '-');
        const date = normalized.length >= 10 ? parseISO(normalized.substring(0, 10)) : new Date(fechaVenta);
        if (isToday(date)) return 'Hoy';
        return format(date, 'dd/MM/yyyy');
    } catch {
        return fechaVenta;
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
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    const fechaActual = format(ayer, 'yyyy/MM/dd');

    const [listaNPs, setListaNPs] = useState<ListaNotaPedidoInterace[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const getListaNP = async () => {
        try {
            setLoading(true);
            const response = await getListasNotasPedido.getResource<
                ApiResponse<ListaNotaPedidoInterace>
            >(
                'ec.com.infinity.modelo.notapedido/buscarpedidosfacturadosdespachados',
                '',
                {
                    pcodigocomercializadora: user?.codigocomercializadora,
                    pcodigocliente: user?.codigocliente,
                    pfechaventa: fechaActual,
                }
            );
            if (response.retorno && response.retorno.length > 0) {
                setListaNPs(response.retorno);
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
        if (user?.codigocliente && user?.codigocomercializadora) {
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
                                <View style={styles.cardTopRow}>
                                    <View>
                                        <Text style={styles.cardLabel}>NÚMERO DE PEDIDO</Text>
                                        <Text style={styles.cardOrderNumber}>{np.numeroNotaPedido || '—'}</Text>
                                    </View>
                                    <View style={styles.cardDespachar}>
                                        <Text style={styles.cardLabel}>DESPACHAR</Text>
                                        <View style={styles.despacharRow}>
                                            <Icon name="calendar-outline" size={18} color="#1565C0" />
                                            <Text style={styles.despacharText}>{formatDespacharDate(np.fechaVenta)}</Text>
                                        </View>
                                    </View>
                                </View>
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
    cardLabelRight: {
        textAlign: 'right',
    },
    cardOrderNumber: {
        fontSize: 20,
        fontWeight: 'bold',
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
