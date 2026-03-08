import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Platform,
} from 'react-native';
import { Layout, Text, Icon as KittenIcon, Calendar, Card, NativeDateService } from '@ui-kitten/components';
import Icon from 'react-native-vector-icons/Ionicons';
import { Svg, Circle, G, Path, Text as SvgText, TSpan } from 'react-native-svg';
import ScreenWrapper from '../../components/ScreenWrapper';
import { useUser } from '../../hooks';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { volumenTotalService } from '../../services';
import { ApiResponse } from '../../types';

interface VentaTotalData {
    nombreTerminal: string;
    nombreProducto: string;
    volumenTotal: number;
    facturas?: number;
    volumenTotalD?: number;
    guias?: number;
}

const { width } = Dimensions.get('window');

const COLORS = {
    primary: '#0056B3',
    secondary: '#8B93FF',
    extra: '#E53935', // Rojo
    super: '#7CB342', // Verde
    diesel: '#7E57C2', // Morado
    gray: '#9E9E9E',
    lightGray: '#F3F4F6',
    white: '#FFFFFF',
    background: '#F9FAFB',
    dark: '#111827',
};

const dateService = new NativeDateService('es', { format: 'DD/MM/YYYY' });

export default function VolumenTotalScreen() {
    const { user, logout } = useUser();
    const navigation = useNavigation<any>();
    const [activeTab, setActiveTab] = useState('Nacional');
    const [date, setDate] = useState(new Date());
    const [showPicker, setShowPicker] = useState(false);
    const [loading, setLoading] = useState(false);
    const [ventasData, setVentasData] = useState<VentaTotalData[]>([]);

    useEffect(() => {
        fetchData();
    }, [date, activeTab]);

    const fetchData = async () => {
        if (!user) return;

        setLoading(true);
        try {
            const isEightDigitUser = user?.codigo && user.codigo.length === 8;
            const codigocliente = isEightDigitUser ? user.codigo : "";
            const pfecha = format(date, "yyyy/MM/dd");
            const tipoconsulta = activeTab === 'Nacional' ? 'n' : 't';

            const response = await volumenTotalService.getResource<ApiResponse<VentaTotalData>>(
                'ec.com.infinity.modelo.factura/ventatotal1app',
                '',
                {
                    pfecha,
                    codigocomercializadora: user.codigocomercializadora || '0002',
                    codigocliente,
                    tipoconsulta
                }
            );

            if (response && response.retorno) {
                setVentasData(response.retorno);
            } else {
                setVentasData([]);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            // Alert.alert("Error", "No se pudo obtener la información de ventas.");
            setVentasData([]);
        } finally {
            setLoading(false);
        }
    };

    const getAggregatedData = () => {
        if (activeTab === 'Nacional') {
            const aggregated: Record<string, { nombre: string, total: number }> = {};
            ventasData.forEach(item => {
                const name = item.nombreProducto;
                const vol = typeof item.volumenTotal === 'number' ? item.volumenTotal : parseFloat(String(item.volumenTotal || "0"));
                if (!aggregated[name]) {
                    aggregated[name] = { nombre: name, total: 0 };
                }
                aggregated[name].total += vol;
            });
            return Object.values(aggregated).map((data, index) => ({
                id: `prod-${index}`,
                nombre: data.nombre,
                total: data.total
            }));
        }
        return [];
    };

    const getBarChartData = () => {
        if (activeTab === 'Terminal') {
            const terminals: Record<string, { nombre: string, productos: Record<string, number> }> = {};
            ventasData.forEach(item => {
                const termName = item.nombreTerminal;
                if (!terminals[termName]) {
                    terminals[termName] = { nombre: termName, productos: {} };
                }
                const vol = typeof item.volumenTotal === 'number' ? item.volumenTotal : parseFloat(String(item.volumenTotal || "0"));
                terminals[termName].productos[item.nombreProducto] = vol;
            });
            return Object.entries(terminals).map(([name, data]) => ({
                label: data.nombre.split('-').pop()?.trim().substring(0, 5).toUpperCase() || data.nombre.substring(0, 5).toUpperCase(),
                fullName: data.nombre,
                values: data.productos
            }));
        }
        return [];
    };

    const renderPieChart = () => {
        const size = 320;
        const radius = 120;
        const centerX = size / 2;
        const centerY = size / 2;

        const aggData = getAggregatedData();
        const totalVolume = aggData.reduce((sum, item) => sum + item.total, 0);

        if (totalVolume === 0) return <View style={{ height: 200, justifyContent: 'center', alignItems: 'center' }}><Text>No hay datos</Text></View>;

        let currentAngle = -90;

        return (
            <View style={styles.chartContainer}>
                <Svg width={size} height={size}>
                    <G>
                        {aggData.map((item, index) => {
                            const percent = item.total / totalVolume;
                            const angle = percent * 360;

                            let color = COLORS.gray;
                            const nameLower = item.nombre.toLowerCase();
                            if (nameLower.includes('extra')) color = COLORS.extra;
                            else if (nameLower.includes('super')) color = COLORS.super;
                            else if (nameLower.includes('diesel')) color = COLORS.diesel;

                            const startRad = (currentAngle * Math.PI) / 180;
                            const endRad = ((currentAngle + angle) * Math.PI) / 180;

                            const x1 = centerX + radius * Math.cos(startRad);
                            const y1 = centerY + radius * Math.sin(startRad);
                            const x2 = centerX + radius * Math.cos(endRad);
                            const y2 = centerY + radius * Math.sin(endRad);

                            const largeArcFlag = angle > 180 ? 1 : 0;
                            const d = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

                            // Punto central del segmento (2/3 del radio para que esté bien dentro)
                            const midAngle = currentAngle + angle / 2;
                            const midRad = (midAngle * Math.PI) / 180;
                            const labelDist = radius * 0.60;
                            const lx = centerX + labelDist * Math.cos(midRad);
                            const ly = centerY + labelDist * Math.sin(midRad);

                            // Dividir el nombre en palabras para multi-línea
                            const words = item.nombre.split(' ');
                            const pct = Math.round(percent * 100);

                            currentAngle += angle;

                            // Solo mostrar texto si el segmento es suficientemente grande
                            const showLabel = angle >= 30;

                            return (
                                <G key={item.id}>
                                    <Path d={d} fill={color} stroke="#FFF" strokeWidth={2} />
                                    {showLabel && (
                                        <SvgText
                                            x={lx}
                                            y={ly - (words.length * 7)}
                                            fill="#FFF"
                                            fontSize="10"
                                            fontWeight="bold"
                                            textAnchor="middle"
                                        >
                                            {words.map((word, wi) => (
                                                <TSpan
                                                    key={wi}
                                                    x={lx}
                                                    dy={wi === 0 ? 0 : 13}
                                                >
                                                    {word}
                                                </TSpan>
                                            ))}
                                            <TSpan x={lx} dy={13} fontSize="9" fontWeight="normal">
                                                {`${pct}%`}
                                            </TSpan>
                                        </SvgText>
                                    )}
                                </G>
                            );
                        })}
                    </G>
                </Svg>
            </View>
        );
    };

    const renderProgressBar = (color: string, label: string, value: string, key?: string) => (
        <View key={key} style={styles.legendItem}>
            <View style={styles.legendLeft}>
                <View style={[styles.colorDot, { backgroundColor: color }]} />
                <Text style={styles.legendLabel}>{label}</Text>
            </View>
            <Text style={styles.legendValue}>{value}</Text>
        </View>
    );

    const renderBarChart = () => {
        const barData = getBarChartData();

        if (barData.length === 0) {
            return <View style={{ height: 100, justifyContent: 'center', alignItems: 'center' }}><Text>No hay datos disponibles</Text></View>;
        }

        const maxTotal = Math.max(...barData.map(b => Object.values(b.values).reduce((a, b) => a + b, 0)), 1);

        return (
            <View style={styles.barChartContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.barsRow}>
                        {barData.map((bar, i) => {
                            const total = Object.values(bar.values).reduce((a, b) => a + b, 0);
                            const heightPercent = (total / maxTotal) * 100;
                            const sortedEntries = Object.entries(bar.values).sort((a, b) => {
                                const getOrder = (n: string) => {
                                    if (n.toLowerCase().includes('extra')) return 0;
                                    if (n.toLowerCase().includes('super')) return 1;
                                    if (n.toLowerCase().includes('diesel')) return 2;
                                    return 3;
                                };
                                return getOrder(b[0]) - getOrder(a[0]);
                            });

                            return (
                                <View key={i} style={styles.barColumn}>
                                    <View style={styles.barTrack}>
                                        <View style={[styles.stackedBar, { height: `${heightPercent}%` }]}>
                                            {sortedEntries.map(([prod, val], idx) => {
                                                let color = COLORS.gray;
                                                let labelShort = "";
                                                if (prod.toLowerCase().includes('extra')) {
                                                    color = COLORS.extra;
                                                    labelShort = "Extra";
                                                } else if (prod.toLowerCase().includes('super')) {
                                                    color = COLORS.super;
                                                    labelShort = "Super";
                                                } else if (prod.toLowerCase().includes('diesel')) {
                                                    color = COLORS.diesel;
                                                    labelShort = "Diesel P";
                                                }

                                                return (
                                                    <View
                                                        key={idx}
                                                        style={[
                                                            styles.barSegment,
                                                            {
                                                                flex: val / total,
                                                                backgroundColor: color,
                                                                justifyContent: 'center',
                                                                alignItems: 'center',
                                                                overflow: 'hidden',
                                                            }
                                                        ]}
                                                    >
                                                        {(val / total > 0.12) && (
                                                            <>
                                                                <Text style={styles.innerBarLabel}>{labelShort}</Text>
                                                                <Text style={styles.innerBarPct}>{`${Math.round((val / total) * 100)}%`}</Text>
                                                            </>
                                                        )}
                                                    </View>
                                                );
                                            })}
                                        </View>
                                    </View>
                                    <Text style={styles.barLabel}>{bar.fullName}</Text>
                                </View>
                            );
                        })}
                    </View>
                </ScrollView>
                <View style={styles.scrollIndicator}>
                    <Icon name="swap-horizontal-outline" size={16} color={COLORS.gray} />
                    <Text style={styles.scrollIndicatorText}>{barData.length} terminales</Text>
                </View>
            </View>
        );
    };

    return (
        <ScreenWrapper>
            <Layout style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Icon name="arrow-back" size={24} color="#1F2937" />
                    </TouchableOpacity>
                    <View style={{ flex: 1 }} />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {/* Welcome */}
                    <View style={styles.welcomeSection}>
                        <Text style={styles.welcomeTitle}>Hola, {user?.nombre || 'Juan'}</Text>
                        <Text style={styles.welcomeSub}>Miremos las ventas totales</Text>
                    </View>

                    {/* Date Selector */}
                    <TouchableOpacity
                        style={styles.dateCard}
                        onPress={() => setShowPicker(true)}
                    >
                        <View style={styles.dateLeft}>
                            <View style={styles.calendarIconBox}>
                                <Icon name="calendar-outline" size={20} color={COLORS.primary} />
                            </View>
                            <View>
                                <Text style={styles.dateInfoLabel}>INFORMACIÓN DE</Text>
                                <Text style={styles.dateText}>
                                    {(() => {
                                        const str = format(date, "EEEE, d 'de' MMMM", { locale: es });
                                        return str.charAt(0).toUpperCase() + str.slice(1);
                                    })()}
                                </Text>
                            </View>
                        </View>
                        <Icon name="chevron-forward" size={20} color={COLORS.gray} />
                    </TouchableOpacity>

                    {showPicker && (
                        <View style={styles.customOverlay}>
                            <TouchableOpacity
                                style={styles.customBackdrop}
                                onPress={() => setShowPicker(false)}
                                activeOpacity={1}
                            />
                            <Card disabled={true} style={styles.modalCard}>
                                <Text category='h6' style={styles.modalTitle}>Seleccione una fecha</Text>
                                <Calendar
                                    date={date}
                                    dateService={dateService}
                                    min={new Date(2025, 0, 1)}
                                    onSelect={(nextDate) => {
                                        setDate(nextDate);
                                        setActiveTab('Nacional');
                                        setShowPicker(false);
                                    }}
                                />
                                <TouchableOpacity
                                    style={styles.closeModalBtn}
                                    onPress={() => setShowPicker(false)}
                                >
                                    <Text style={styles.closeModalText}>Cerrar</Text>
                                </TouchableOpacity>
                            </Card>
                        </View>
                    )}


                    {/* Tabs */}
                    <View style={styles.tabContainer}>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'Nacional' && styles.activeTab]}
                            onPress={() => setActiveTab('Nacional')}
                        >
                            <Text style={[styles.tabText, activeTab === 'Nacional' && styles.activeTabText]}>Nacional</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'Terminal' && styles.activeTab]}
                            onPress={() => setActiveTab('Terminal')}
                        >
                            <Text style={[styles.tabText, activeTab === 'Terminal' && styles.activeTabText]}>Por Terminal</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Vista Nacional Card */}
                    {activeTab === 'Nacional' && (
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardTitle}>Vista Nacional</Text>
                                <Icon name="information-circle-outline" size={20} color="#D1D5DB" />
                            </View>

                            {loading ? (
                                <View style={{ height: 200, justifyContent: 'center', alignItems: 'center' }}><Text>Cargando datos...</Text></View>
                            ) : (
                                <>
                                    {renderPieChart()}

                                    <View style={styles.legendContainer}>
                                        {getAggregatedData().map(item => {
                                            let color = COLORS.gray;
                                            if (item.nombre.toLowerCase().includes('extra')) color = COLORS.extra;
                                            else if (item.nombre.toLowerCase().includes('super')) color = COLORS.super;
                                            else if (item.nombre.toLowerCase().includes('diesel')) color = COLORS.diesel;

                                            return renderProgressBar(color, item.nombre, `${item.total.toLocaleString()} gls`, item.id);
                                        })}
                                        {getAggregatedData().length === 0 && <Text style={{ textAlign: 'center', color: COLORS.gray }}>No hay ventas para esta fecha</Text>}
                                    </View>
                                </>
                            )}
                        </View>
                    )}

                    {/* Ventas por Terminal Card */}
                    {activeTab === 'Terminal' && (
                        <View style={[styles.card, { marginBottom: 30 }]}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardTitle}>Ventas por Terminal</Text>
                                <Text style={styles.terminalCount}>{getBarChartData().length} terminales</Text>
                            </View>

                            {loading ? (
                                <View style={{ height: 200, justifyContent: 'center', alignItems: 'center' }}><Text>Cargando datos...</Text></View>
                            ) : renderBarChart()}
                        </View>
                    )}

                    {/* Logout */}

                </ScrollView>


            </Layout>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 15,
        backgroundColor: COLORS.white,
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoBox: {
        width: 32,
        height: 32,
        backgroundColor: COLORS.primary,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    logoText: {
        fontSize: 18,
        fontWeight: '900',
        color: COLORS.primary,
        letterSpacing: 0.5,
    },
    notificationBtn: {
        padding: 5,
    },
    backBtn: {
        padding: 5,
        marginRight: 10,
    },
    scrollContent: {
        padding: 20,
    },
    welcomeSection: {
        marginBottom: 25,
    },
    welcomeTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.dark,
    },
    welcomeSub: {
        fontSize: 16,
        color: COLORS.gray,
        marginTop: 4,
    },
    dateCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        padding: 15,
        borderRadius: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    dateLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    calendarIconBox: {
        width: 40,
        height: 40,
        backgroundColor: '#EFF6FF',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    dateInfoLabel: {
        fontSize: 10,
        color: '#9CA3AF',
        fontWeight: 'bold',
    },
    dateText: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.dark,
    },
    customOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    customBackdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalCard: {
        borderRadius: 24,
        padding: 8,
        width: width * 0.9,
        maxWidth: 400,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    modalTitle: {
        marginBottom: 15,
        textAlign: 'center',
        color: COLORS.dark,
        fontWeight: 'bold',
        fontSize: 18,
    },
    closeModalBtn: {
        marginTop: 15,
        alignItems: 'center',
        padding: 10,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    closeModalText: {
        color: COLORS.primary,
        fontWeight: 'bold',
        fontSize: 16,
    },
    innerBarLabel: {
        fontSize: 9,
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    scrollIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 15,
        backgroundColor: COLORS.lightGray,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        alignSelf: 'center',
    },
    scrollIndicatorText: {
        fontSize: 12,
        color: COLORS.gray,
        marginLeft: 6,
        fontWeight: '600',
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#F1F5F9',
        padding: 4,
        borderRadius: 12,
        marginBottom: 25,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
    },
    activeTab: {
        backgroundColor: COLORS.white,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
    },
    activeTabText: {
        color: COLORS.primary,
    },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 24,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.dark,
    },
    chartContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 10,
    },
    chartCenterText: {
        position: 'absolute',
        alignItems: 'center',
    },
    chartValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.dark,
    },
    chartLabel: {
        fontSize: 10,
        color: '#9CA3AF',
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    legendContainer: {
        marginTop: 20,
    },
    legendItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        padding: 12,
        borderRadius: 12,
        marginBottom: 10,
    },
    legendLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    colorDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 10,
    },
    legendLabel: {
        fontSize: 14,
        color: '#1F2937',
        fontWeight: '500',
    },
    legendValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.dark,
    },
    terminalCount: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    barChartContainer: {
        marginTop: 10,
    },
    barsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 180,
        paddingHorizontal: 5,
        marginBottom: 10,
    },
    barColumn: {
        alignItems: 'center',
        width: 90,
    },
    barTrack: {
        width: 60,
        height: '100%',
        backgroundColor: '#F3F4F6',
        borderRadius: 6,
        justifyContent: 'flex-end',
        overflow: 'hidden',
    },
    stackedBar: {
        height: '100%',
        width: '100%',
    },
    barSegment: {
        width: '100%',
    },
    simpleBar: {
        width: '100%',
        backgroundColor: '#F3F4F6',
        borderRadius: 6,
    },
    barLabel: {
        marginTop: 8,
        fontSize: 10,
        color: '#9CA3AF',
        fontWeight: 'bold',
        textAlign: 'center',
        flexWrap: 'wrap',
        width: 90,
    },
    viewMoreButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
    },
    viewMoreText: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '600',
        marginRight: 5,
    },


});