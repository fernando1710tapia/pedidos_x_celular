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
import BrandLogo from '../../components/BrandLogo';
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

const CHART_COLORS = [
    '#3B82F6', // Blue
    '#EF4444', // Red
    '#10B981', // Green
    '#F59E0B', // Amber
    '#8B5CF6', // Violet
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#F97316', // Orange
];

const cleanProductName = (name: string) => {
    return name
        .replace(/^DES\s+/i, '')
        .replace(/^[\s\d\-]+-\s*/, '')
        .replace(/\./g, ' ')
        .trim();
};

const formatFullProductName = (name: string) => {
    // DES  - 0101-GAS.EXTRA -> 0101-GAS EXTRA VOL
    // Si no hay código, solo devuelve el nombre limpio + VOL
    const codeMatch = name.match(/(\d+)-/);
    const code = codeMatch ? codeMatch[1] : '';
    const cleanName = cleanProductName(name);
    const label = code ? `${code}-${cleanName}` : cleanName;
    return `${label} VOL`.trim();
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
    const [selectedTerminal, setSelectedTerminal] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);


    useEffect(() => {
        // Resetear selección al cambiar de fecha o de pestaña
        setSelectedTerminal(null);
    }, [date, activeTab]);

    useEffect(() => {
        fetchData();
    }, [date, activeTab]);

    const fetchData = async () => {
        if (!user) return;

        setLoading(true);
        setError(null);
        try {
            const isAdmin = user?.codigo ? !/^\d{8}$/.test(user.codigo) : true;

            const codigocliente = isAdmin ? "" : (user.codigo ?? "");
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
        } catch (error: any) {
            setError(error?.message || "Error de conexión");
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
        const size = 380; // Aumentado para dar más margen a los nombres
        const radius = 85;
        const centerX = size / 2;
        const centerY = size / 2;

        const aggData = getAggregatedData();
        const totalVolume = aggData.reduce((sum, item) => sum + item.total, 0);

        if (totalVolume === 0) return <View style={{ height: 200, justifyContent: 'center', alignItems: 'center' }}><Text>No hay datos</Text></View>;

        // Lógica de ángulo mínimo (15 grados)
        const MIN_ANGLE = 15;
        let flexibleAnglesTotal = 360;
        let flexibleVolumeTotal = 0;
        const angles: number[] = [];

        // Primero asignamos ángulos mínimos
        aggData.forEach(item => {
            const rawPercent = item.total / totalVolume;
            const rawAngle = rawPercent * 360;

            if (rawAngle < MIN_ANGLE) {
                angles.push(MIN_ANGLE);
                flexibleAnglesTotal -= MIN_ANGLE;
            } else {
                angles.push(0); // Pendiente
                flexibleVolumeTotal += item.total;
            }
        });

        // Distribuimos el resto proporcionalmente
        const finalAngles = angles.map((angle, i) => {
            if (angle > 0) return angle;
            const volPercent = aggData[i].total / flexibleVolumeTotal;
            return volPercent * flexibleAnglesTotal;
        });

        let currentAngle = -90;

        return (
            <View style={styles.chartContainer}>
                <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    <G>
                        {aggData.map((item, index) => {
                            const angle = finalAngles[index];
                            const color = CHART_COLORS[index % CHART_COLORS.length];
                            const formattedLabel = cleanProductName(item.nombre);

                            const startRad = (currentAngle * Math.PI) / 180;
                            const endRad = ((currentAngle + angle) * Math.PI) / 180;

                            const x1 = centerX + radius * Math.cos(startRad);
                            const y1 = centerY + radius * Math.sin(startRad);
                            const x2 = centerX + radius * Math.cos(endRad);
                            const y2 = centerY + radius * Math.sin(endRad);

                            const largeArcFlag = angle > 180 ? 1 : 0;
                            const d = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

                            const midAngle = currentAngle + angle / 2;
                            const midRad = (midAngle * Math.PI) / 180;

                            // Coordenadas para la línea y el texto afuera
                            const lineStartDist = radius * 0.8;
                            const lineEndDist = radius * 1.25;
                            const textDist = radius * 1.35;

                            const lx1 = centerX + lineStartDist * Math.cos(midRad);
                            const ly1 = centerY + lineStartDist * Math.sin(midRad);
                            const lx2 = centerX + lineEndDist * Math.cos(midRad);
                            const ly2 = centerY + lineEndDist * Math.sin(midRad);
                            const tx = centerX + textDist * Math.cos(midRad);
                            const ty = centerY + textDist * Math.sin(midRad);

                            const words = formattedLabel.split(' ');
                            currentAngle += angle;

                            return (
                                <G key={item.id}>
                                    <Path d={d} fill={color} stroke="#FFF" strokeWidth={2} />

                                    {/* Línea de llamada (Callout) */}
                                    <Path
                                        d={`M ${lx1} ${ly1} L ${lx2} ${ly2}`}
                                        stroke={color}
                                        strokeWidth={1.5}
                                    />

                                    <SvgText
                                        x={tx}
                                        y={ty - ((words.length - 1) * 6)} // Ajuste vertical para multi-línea
                                        fill={COLORS.dark}
                                        fontSize="8"
                                        fontWeight="600"
                                        textAnchor={tx > centerX ? 'start' : 'end'}
                                    >
                                        {words.map((word, wi) => (
                                            <TSpan
                                                key={wi}
                                                x={tx}
                                                dy={wi === 0 ? 0 : 12}
                                            >
                                                {word}
                                            </TSpan>
                                        ))}
                                    </SvgText>
                                </G>
                            );
                        })}
                    </G>
                </Svg>

                {/* Leyenda Nacional Unificada */}
                <View style={[styles.legendContainer, { marginTop: 10 }]}>
                    {aggData.map((prod, idx) => {
                        const color = CHART_COLORS[idx % CHART_COLORS.length];
                        const label = formatFullProductName(prod.nombre);
                        return renderProgressBar(color, label, `${prod.total.toLocaleString()} gls`, prod.id);
                    })}
                </View>
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

        // Obtener productos únicos para asignar colores y crear la leyenda
        const uniqueProducts = Array.from(new Set(barData.flatMap(b => Object.keys(b.values))));
        const productColors: Record<string, string> = {};
        uniqueProducts.forEach((prod, idx) => {
            productColors[prod] = CHART_COLORS[idx % CHART_COLORS.length];
        });

        return (
            <View style={styles.barChartContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.barsRow} key={`chart-container-${selectedTerminal || 'all'}`}>
                        {barData.map((bar, i) => {
                            // Cálculo robusto del total para esta barra específica
                            const barValues = Object.values(bar.values);
                            const currentTotal = barValues.reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0);
                            const safeTotal = Math.max(currentTotal, 0.001);

                            // Altura proporcional respecto al valor máximo de todas las terminales
                            const heightPercent = Math.max((safeTotal / maxTotal) * 95, 4);

                            const isSelected = selectedTerminal === bar.fullName;
                            const isDimmed = selectedTerminal !== null && !isSelected;

                            return (
                                <TouchableOpacity
                                    key={`terminal-${i}-${bar.fullName}`}
                                    activeOpacity={0.7}
                                    onPress={() => setSelectedTerminal(isSelected ? null : bar.fullName)}
                                    style={[styles.barColumn, isDimmed && { opacity: 0.4 }]}
                                >
                                    <View style={[styles.barTrack, isSelected && { borderColor: COLORS.primary, borderWidth: 2 }]}>
                                        <View style={[styles.stackedBar, { height: `${heightPercent}%` }]}>
                                            {uniqueProducts.map((prod, idx) => {
                                                const val = bar.values[prod] || 0;
                                                if (val <= 0) return null;

                                                const color = productColors[prod];
                                                const cleanName = cleanProductName(prod);
                                                // Flex proporcional asegurando al menos un espacio mínimo visible
                                                const flexValue = Math.max(val / safeTotal, 0.01);

                                                return (
                                                    <View
                                                        key={`segment-${idx}-${prod}`}
                                                        style={[styles.segmentContainer, { flex: flexValue }]}
                                                    >
                                                        <View
                                                            style={[
                                                                styles.barSegment,
                                                                {
                                                                    backgroundColor: color,
                                                                    justifyContent: 'center',
                                                                    alignItems: 'center',
                                                                    overflow: 'hidden',
                                                                    height: '100%',
                                                                    width: '100%'
                                                                }
                                                            ]}
                                                        >
                                                            {flexValue > 0.12 && (
                                                                <Text style={[
                                                                    styles.innerBarLabel,
                                                                    {
                                                                        fontSize: 8,
                                                                        color: COLORS.white,
                                                                        textShadowColor: 'rgba(0,0,0,0.6)',
                                                                        textShadowOffset: { width: 0.5, height: 0.5 },
                                                                        textShadowRadius: 1
                                                                    }
                                                                ]}>
                                                                    {cleanName}
                                                                </Text>
                                                            )}
                                                        </View>
                                                    </View>
                                                );
                                            })}
                                        </View>
                                    </View>
                                    <Text style={[styles.barLabel, isSelected && { color: COLORS.primary }]}>
                                        {bar.fullName}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </ScrollView>

                {/* Encabezado de la Leyenda Dinámica */}
                <View style={[styles.legendHeader, { marginTop: 20 }]}>
                    <Text style={styles.legendHeaderTitle}>
                        {selectedTerminal ? `Detalle: ${selectedTerminal.split('-').pop()?.trim()}` : 'Resumen Consolidado'}
                    </Text>
                    {selectedTerminal && (
                        <TouchableOpacity
                            onPress={() => setSelectedTerminal(null)}
                            style={styles.closeButtonContainer}
                        >
                            <Icon name="close-circle" size={24} color={COLORS.primary} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Leyenda de Terminal Dinámica */}
                <View style={styles.legendContainer}>
                    {uniqueProducts.map((prod) => {
                        const color = productColors[prod];
                        const label = formatFullProductName(prod);

                        // Si hay terminal seleccionado, mostrar solo sus valores. Si no, el total.
                        let displayValue = 0;
                        if (selectedTerminal) {
                            const termData = barData.find(b => b.fullName === selectedTerminal);
                            displayValue = termData?.values[prod] || 0;
                        } else {
                            displayValue = barData.reduce((sum, bar) => sum + (bar.values[prod] || 0), 0);
                        }

                        // Solo mostrar productos que tengan volumen en el contexto actual
                        if (displayValue <= 0 && selectedTerminal) return null;

                        return renderProgressBar(color, label, `${displayValue.toLocaleString()} gls`, prod);
                    })}
                </View>
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
                            <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Icon name="chevron-back" size={32} color="#9CA3AF" />
                    </TouchableOpacity>

                    <View style={styles.headerCenter}>
                        <BrandLogo codigoComercializadora={user?.codigocomercializadora || ''} />
                        <Text style={styles.headerTitle}>VOLUMEN TOTAL</Text>
                    </View>
                </View>


                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {/* Welcome */}
                    <View style={styles.welcomeSection}>
                        <Text style={styles.welcomeTitle}>
                            Hola, <Text style={styles.userName}>{user?.nombre || 'Usuario'}</Text>
                        </Text>
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
                                <View style={styles.loadingContainer}><Text>Cargando datos...</Text></View>
                            ) : error ? (
                                <View style={styles.errorContainer}>
                                    <Icon name="alert-circle-outline" size={40} color={COLORS.extra} />
                                    <Text style={styles.errorText}>No se pudo cargar la información</Text>
                                    <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
                                        <Text style={styles.retryButtonText}>Reintentar</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <>
                                    {renderPieChart()}
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
                                <View style={styles.loadingContainer}><Text>Cargando datos...</Text></View>
                            ) : error ? (
                                <View style={styles.errorContainer}>
                                    <Icon name="alert-circle-outline" size={40} color={COLORS.extra} />
                                    <Text style={styles.errorText}>No se pudo cargar la información</Text>
                                    <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
                                        <Text style={styles.retryButtonText}>Reintentar</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : renderBarChart()}

                        </View>
                    )}

                    {/* Logout */}

                </ScrollView>

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
                                style={styles.calendarComponent}
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
        paddingHorizontal: 20,
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
    backButton: {
        position: 'absolute',
        left: 15,
        zIndex: 10,
        padding: 5,
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



    scrollContent: {
        padding: 20,
    },
    welcomeSection: {
        marginBottom: 30,
    },
    welcomeTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#111827',
    },
    userName: {
        color: '#1565C0',
        fontWeight: 'bold',
    },
    welcomeSub: {
        fontSize: 16,
        color: '#6B7280',
        marginTop: 8,
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
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    customBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalCard: {
        borderRadius: 24,
        padding: 4,
        width: width * 0.95,
        maxWidth: 380,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },
    modalTitle: {
        marginBottom: 10,
        textAlign: 'center',
        color: COLORS.dark,
        fontWeight: 'bold',
        fontSize: 18,
    },
    calendarComponent: {
        width: '100%',
        backgroundColor: 'transparent',
    },
    closeModalBtn: {
        marginTop: 10,
        alignItems: 'center',
        padding: 12,
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
    innerBarPct: {
        fontSize: 8,
        color: 'white',
        fontWeight: '600',
        textAlign: 'center',
        opacity: 0.9,
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
    loadingContainer: {
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        color: COLORS.extra,
        fontSize: 14,
        fontWeight: '600',
        marginTop: 10,
        textAlign: 'center',
    },
    retryButton: {
        marginTop: 15,
        backgroundColor: COLORS.primary,
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 10,
    },
    retryButtonText: {
        color: COLORS.white,
        fontWeight: '700',
        fontSize: 14,
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
        fontSize: 12,
        color: '#1F2937',
        fontWeight: '500',
    },
    legendValue: {
        fontSize: 12,
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
        height: 240, // Aumentado de 180 para mejor visibilidad
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
    segmentContainer: {
        width: '100%',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.3)',
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
    legendHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    legendHeaderTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.dark,
    },
    clearFilterText: {
        fontSize: 12,
        color: COLORS.primary,
        fontWeight: '600',
    },
    closeButtonContainer: {
        padding: 4,
    },
});