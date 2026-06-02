import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    StyleSheet,
    View,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Platform,
} from 'react-native';
import { Layout, Text, Icon as KittenIcon, Calendar, Card, NativeDateService, Input } from '@ui-kitten/components';
import Icon from 'react-native-vector-icons/Ionicons';
import { Svg, Circle, G, Path, Text as SvgText, TSpan } from 'react-native-svg';
import ScreenWrapper from '../../components/ScreenWrapper';
import { useUser } from '../../hooks';
import { useNavigation } from '@react-navigation/native';
import BrandLogo from '../../components/BrandLogo';
import AppHeader from '../../components/AppHeader';
import { format, subMonths, subYears } from 'date-fns';
import { es } from 'date-fns/locale';
import { volumenTotalService } from '../../services';
import obtenerTerminalCliente from '../../services/Terminal/teminalService';
import { ApiResponse, TerminalClienteInterface } from '../../types';

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
    if (!name) return 'Desconocido';
    return String(name)
        .replace(/^DES\s+/i, '')
        .replace(/^[\s\d\-]+-\s*/, '')
        .replace(/\./g, ' ')
        .trim();
};

const formatFullProductName = (name: string) => {
    if (!name) return 'Desconocido VOL';
    // DES  - 0101-GAS.EXTRA -> 0101-GAS EXTRA VOL
    // Si no hay código, solo devuelve el nombre limpio + VOL
    const codeMatch = String(name).match(/(\d+)-/);
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
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [pickerType, setPickerType] = useState<'start' | 'end' | 'single' | 'compare_start' | 'compare_end' | null>(null);
    const [isComparing, setIsComparing] = useState(false);
    const [compareViewType, setCompareViewType] = useState<'bars' | 'radial'>('bars');
    const [compareMode, setCompareMode] = useState<'custom'>('custom');
    const [compareStartDate, setCompareStartDate] = useState(() => subMonths(new Date(), 1));
    const [compareEndDate, setCompareEndDate] = useState(() => subMonths(new Date(), 1));
    const [compareData, setCompareData] = useState<VentaTotalData[]>([]);
    const [loading, setLoading] = useState(false);
    const [ventasData, setVentasData] = useState<VentaTotalData[]>([]);
    const [selectedTerminal, setSelectedTerminal] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);


    const isAdmin = user?.codigo ? !/^\d{8}$/.test(user.codigo) : true;
    const [allClientes, setAllClientes] = useState<TerminalClienteInterface[]>([]);
    const [selectedCliente, setSelectedCliente] = useState<TerminalClienteInterface | null>(null);
    const [showClienteDropdown, setShowClienteDropdown] = useState<boolean>(false);
    const [clienteSearchText, setClienteSearchText] = useState<string>('');
    const fetchIdRef = useRef(0);
    const lastFetchParams = useRef<{ pfechai: string, pfechaf: string, tipoconsulta: string, codigocliente: string } | null>(null);

    const normalizeCliente = (c: TerminalClienteInterface & { clientePK?: { codigo?: string }; nombre?: string }): TerminalClienteInterface => ({
        ...c,
        codigo: c.codigo ?? c.clientePK?.codigo ?? '',
        nombrecomercial: c.nombrecomercial ?? c.nombre ?? '',
    });

    const handleGetAllClientes = async () => {
        try {
            const response = await obtenerTerminalCliente.getResource<ApiResponse<TerminalClienteInterface>>(
                'porComercializadora',
                '',
                { codigocomercializadora: user?.codigocomercializadora }
            );
            if (response.retorno !== null && response.retorno !== undefined) {
                const normalized = response.retorno.map((c: any) => normalizeCliente(c));
                setAllClientes(normalized);
            }
        } catch (error) {
            console.error('Error obteniendo clientes:', error);
        }
    };

    const filteredClientes = useMemo(() => {
        const q = (clienteSearchText ?? '').trim().toLowerCase();
        if (!q) return allClientes;
        return allClientes.filter((c) => {
            const cod = (c.codigo ?? '').toLowerCase();
            const nom = (c.nombrecomercial ?? '').toLowerCase();
            return cod.includes(q) || nom.includes(q);
        });
    }, [allClientes, clienteSearchText]);

    useEffect(() => {
        if (user && isAdmin) {
            handleGetAllClientes();
        }
    }, [user, isAdmin]);

    useEffect(() => {
        // Resetear selección al cambiar de fecha o de pestaña
        setSelectedTerminal(null);
    }, [startDate, endDate, activeTab, selectedCliente, isComparing, compareMode, compareStartDate, compareEndDate]);

    useEffect(() => {
        fetchData();
    }, [startDate, endDate, activeTab, selectedCliente, isComparing, compareMode, compareStartDate, compareEndDate]);

    const fetchData = async () => {
        if (!user) return;

        fetchIdRef.current += 1;
        const currentFetchId = fetchIdRef.current;

        setLoading(true);
        setError(null);
        try {
            const codigocliente = isAdmin ? (selectedCliente?.codigo || "") : (user.codigo ?? "");
            const pfechai = format(startDate, "yyyy/MM/dd");
            const pfechaf = format(endDate, "yyyy/MM/dd");
            const tipoconsulta = activeTab === 'Nacional' ? 'n' : 't';

            // Comprobar si debemos comparar periodos
            const checkCompare = isAdmin && activeTab === 'Nacional' && isComparing;

            if (checkCompare) {
                // Calcular Rango B
                let apiCompareStartDate: Date;
                let apiCompareEndDate: Date;

                if (compareMode === 'prev_month') {
                    apiCompareStartDate = subMonths(startDate, 1);
                    apiCompareEndDate = subMonths(endDate, 1);
                } else if (compareMode === 'prev_year') {
                    apiCompareStartDate = subYears(startDate, 1);
                    apiCompareEndDate = subYears(endDate, 1);
                } else { // 'custom'
                    apiCompareStartDate = compareStartDate;
                    apiCompareEndDate = compareEndDate;
                }

                const pfechaiB = format(apiCompareStartDate, "yyyy/MM/dd");
                const pfechafB = format(apiCompareEndDate, "yyyy/MM/dd");

                console.log('FT-volumenTotalService::COMPARTIVA RANGO A:', pfechai, '-', pfechaf);
                console.log('FT-volumenTotalService::COMPARTIVA RANGO B:', pfechaiB, '-', pfechafB);

                // Revisar si ya tenemos los datos de resA cacheados en memoria
                let skipResA = false;
                if (
                    lastFetchParams.current &&
                    lastFetchParams.current.pfechai === pfechai &&
                    lastFetchParams.current.pfechaf === pfechaf &&
                    lastFetchParams.current.tipoconsulta === tipoconsulta &&
                    lastFetchParams.current.codigocliente === codigocliente &&
                    ventasData.length > 0
                ) {
                    skipResA = true;
                }

                if (!skipResA) {
                    const resA = await volumenTotalService.getResource<ApiResponse<VentaTotalData>>(
                        'ec.com.infinity.modelo.factura/ventatotal2app',
                        '',
                        {
                            pfechai,
                            pfechaf,
                            codigocomercializadora: user.codigocomercializadora,
                            codigocliente,
                            tipoconsulta
                        }
                    );
                    if (currentFetchId !== fetchIdRef.current) return;

                    if (resA && resA.retorno) {
                        setVentasData(resA.retorno);
                        lastFetchParams.current = { pfechai, pfechaf, tipoconsulta, codigocliente };
                    } else {
                        setVentasData([]);
                        lastFetchParams.current = null;
                    }
                }

                // Si las fechas son exactamente iguales, reusamos ventasData para evitar problemas 
                // con backends que bloquean o retornan vacío en consultas duplicadas.
                if (pfechai === pfechaiB && pfechaf === pfechafB) {
                    // Usar la función de setCompareData pasándole el estado más reciente de ventasData
                    setCompareData(ventasData);
                } else {
                    const resB = await volumenTotalService.getResource<ApiResponse<VentaTotalData>>(
                        'ec.com.infinity.modelo.factura/ventatotal2app',
                        '',
                        {
                            pfechai: pfechaiB,
                            pfechaf: pfechafB,
                            codigocomercializadora: user.codigocomercializadora,
                            codigocliente,
                            tipoconsulta
                        }
                    );

                    if (currentFetchId !== fetchIdRef.current) return;

                    if (resB && resB.retorno) {
                        setCompareData(resB.retorno);
                    } else {
                        setCompareData([]);
                    }
                }

            } else {
                // Consulta normal sin comparativa
                // Revisar si ya tenemos los datos cacheados
                let skipRes = false;
                if (
                    lastFetchParams.current &&
                    lastFetchParams.current.pfechai === pfechai &&
                    lastFetchParams.current.pfechaf === pfechaf &&
                    lastFetchParams.current.tipoconsulta === tipoconsulta &&
                    lastFetchParams.current.codigocliente === codigocliente &&
                    ventasData.length > 0
                ) {
                    skipRes = true;
                }

                if (!skipRes) {
                    const response = await volumenTotalService.getResource<ApiResponse<VentaTotalData>>(
                        'ec.com.infinity.modelo.factura/ventatotal2app',
                        '',
                        {
                            pfechai,
                            pfechaf,
                            codigocomercializadora: user.codigocomercializadora,
                            codigocliente,
                            tipoconsulta
                        }
                    );
                    if (currentFetchId !== fetchIdRef.current) return;

                    if (response && response.retorno) {
                        setVentasData(response.retorno);
                        lastFetchParams.current = { pfechai, pfechaf, tipoconsulta, codigocliente };
                    } else {
                        setVentasData([]);
                        lastFetchParams.current = null;
                    }
                }
                setCompareData([]);
            }
        } catch (error: any) {
            setError(error?.message || "Error de conexión");
            setVentasData([]);
            setCompareData([]);
        } finally {
            setLoading(false);
        }
    };

    const getSafeVol = (item: any) => {
        const raw = item.volumenTotal !== undefined ? item.volumenTotal : item.volumentotal !== undefined ? item.volumentotal : item.volumenTotalD !== undefined ? item.volumenTotalD : item.volumen !== undefined ? item.volumen : 0;
        if (typeof raw === 'number') return raw;
        return parseFloat(String(raw || "0").replace(/,/g, '')) || 0;
    };

    const getSafeProdName = (item: any) => {
        return item.nombreProducto || item.producto || item.nombreproducto || 'Desconocido';
    };

    const getSafeTermName = (item: any) => {
        return item.nombreTerminal || item.terminal || item.nombreterminal || 'Desconocido';
    };

    const getAggregatedData = () => {
        if (activeTab === 'Nacional') {
            const aggregated: Record<string, { nombre: string, total: number }> = {};
            ventasData.forEach(item => {
                const name = getSafeProdName(item);
                const vol = getSafeVol(item);
                if (!aggregated[name]) {
                    aggregated[name] = { nombre: name, total: 0 };
                }
                aggregated[name].total += vol;
            });
            const sorted = Object.values(aggregated).sort((a, b) => b.total - a.total);
            const interleaved: any[] = [];
            let i = 0;
            let j = sorted.length - 1;
            while (i <= j) {
                interleaved.push(sorted[i++]);
                if (i <= j) interleaved.push(sorted[j--]);
            }

            return interleaved.map((data, index) => ({
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
                const termName = getSafeTermName(item);
                if (!terminals[termName]) {
                    terminals[termName] = { nombre: termName, productos: {} };
                }
                const vol = getSafeVol(item);
                terminals[termName].productos[getSafeProdName(item)] = vol;
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
        const { width: currentWidth } = Dimensions.get('window');
        // Tamaño máximo del SVG de 340 para que en tablets no se vea diminuto en un cuadro gigante
        const size = Math.min(currentWidth - 40, 340);
        // Radio estrictamente proporcional al tamaño
        const radius = size / 3.6;
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

                            // Caso especial para 360 grados (un solo producto):
                            const d = angle >= 360
                                ? `M ${centerX} ${centerY - radius} A ${radius} ${radius} 0 1 1 ${centerX - 0.01} ${centerY - radius} Z`
                                : `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

                            const midAngle = currentAngle + angle / 2;
                            const midRad = (midAngle * Math.PI) / 180;

                            // Coordenadas para la línea y el texto afuera (Escalonado Inteligente)
                            const cosAngle = Math.abs(Math.cos(midRad));
                            const isSide = cosAngle > 0.75; // Detectar etiquetas en los laterales

                            const lineStartDist = radius * 0.8;
                            const lineEndDist = radius * 1.25;

                            // Si es lateral, usar una distancia menor para no chocar con el borde
                            const baseDist = isSide ? 1.3 : 1.45;
                            const staggerDist = isSide ? 1.5 : 1.75;
                            const textDist = index % 2 === 0 ? radius * baseDist : radius * staggerDist;

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
                    {/* Elemento TOTAL */}
                    <View style={[styles.legendItem, { borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingBottom: 15, marginBottom: 15 }]}>
                        <View style={styles.legendLeft}>
                            <View style={[styles.colorDot, { backgroundColor: COLORS.dark }]} />
                            <Text style={[styles.legendLabel, { fontWeight: 'bold', fontSize: 14 }]}>DESPACHO TOTAL</Text>
                        </View>
                        <Text style={[styles.legendValue, { fontSize: 14, color: COLORS.primary }]}>
                            {`${totalVolume.toLocaleString()} gls`}
                        </Text>
                    </View>

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
                <Text style={styles.legendLabel} numberOfLines={2}>{label}</Text>
            </View>
            <Text style={styles.legendValue}>{value}</Text>
        </View>
    );


    const renderComparisonView = () => {
        const aggDataCurrent = getAggregatedData(); // Current Period A (sorted)

        // Calculate aggregated data for Period B (Compare Period)
        const compareAgg: Record<string, number> = {};
        compareData.forEach(item => {
            const name = getSafeProdName(item);
            const vol = getSafeVol(item);
            compareAgg[name] = (compareAgg[name] || 0) + vol;
        });

        const totalCurrent = aggDataCurrent.reduce((sum, item) => sum + item.total, 0);
        const totalCompare = Object.values(compareAgg).reduce((sum, val) => sum + val, 0);

        if (totalCurrent === 0 && totalCompare === 0) {
            return <View style={{ height: 200, justifyContent: 'center', alignItems: 'center' }}><Text>No hay datos disponibles para comparar</Text></View>;
        }

        // Compute unified list of products
        const unifiedProductsMap: Record<string, { id: string, nombre: string, current: number, compare: number }> = {};

        aggDataCurrent.forEach((prod) => {
            unifiedProductsMap[prod.nombre] = { id: prod.id, nombre: prod.nombre, current: prod.total, compare: 0 };
        });

        Object.entries(compareAgg).forEach(([nombre, vol], i) => {
            if (unifiedProductsMap[nombre]) {
                unifiedProductsMap[nombre].compare = vol;
            } else {
                unifiedProductsMap[nombre] = { id: `comp-only-${i}`, nombre, current: 0, compare: vol };
            }
        });

        const unifiedData = Object.values(unifiedProductsMap).sort((a, b) => (b.current + b.compare) - (a.current + a.compare));

        // Calculate general change percent
        const diffTotal = totalCurrent - totalCompare;
        const pctTotal = totalCompare > 0 ? (diffTotal / totalCompare) * 100 : 0;
        const trendColor = diffTotal >= 0 ? '#10B981' : '#EF4444'; // Emerald Green vs Crimson Red
        const trendIcon = diffTotal >= 0 ? 'arrow-up-circle' : 'arrow-down-circle';
        const trendSymbol = diffTotal >= 0 ? '+' : '';

        return (
            <View style={styles.comparisonContainer}>
                {/* KPI Resumen Card */}
                <View style={styles.kpiContainer}>
                    <View style={styles.kpiCard}>
                        <Text style={styles.kpiTitle}>PERIODO ACTUAL</Text>
                        <Text style={[styles.kpiValue, { color: COLORS.primary }]}>
                            {totalCurrent.toLocaleString()} <Text style={styles.kpiUnit}>gls</Text>
                        </Text>
                    </View>

                    <View style={styles.kpiCard}>
                        <Text style={styles.kpiTitle}>PERIODO COMPARADO</Text>
                        <Text style={[styles.kpiValue, { color: COLORS.gray }]}>
                            {totalCompare.toLocaleString()} <Text style={styles.kpiUnit}>gls</Text>
                        </Text>
                    </View>
                </View>

                {/* Gran Variación General */}
                <View style={[styles.trendBanner, { backgroundColor: diffTotal >= 0 ? '#ECFDF5' : '#FEF2F2', borderColor: diffTotal >= 0 ? '#A7F3D0' : '#FCA5A5' }]}>
                    <Icon name={trendIcon} size={22} color={trendColor} style={{ marginRight: 8 }} />
                    <Text style={[styles.trendBannerText, { color: trendColor }]}>
                        {`Ventas totales variaron un `}
                        <Text style={{ fontWeight: 'bold' }}>
                            {`${trendSymbol}${pctTotal.toFixed(1)}%`}
                        </Text>
                        {` respecto al periodo anterior.`}
                    </Text>
                </View>

                {/* Variación por Producto (Bars or Radial) */}
                <Text style={styles.compListTitle}>VARIACIÓN POR PRODUCTO</Text>

                {compareViewType === 'bars' ? (
                    <View style={styles.compList}>
                        {unifiedData.map((prod, idx) => {
                            const color = CHART_COLORS[idx % CHART_COLORS.length];
                            const label = formatFullProductName(prod.nombre);

                            const volCurrent = prod.current;
                            const volCompare = prod.compare;

                            // Calculate change percent per product
                            const diffProd = volCurrent - volCompare;
                            const pctProd = volCompare > 0 ? (diffProd / volCompare) * 100 : 0;
                            const prodTrendColor = diffProd >= 0 ? '#10B981' : '#EF4444';
                            const prodTrendSymbol = diffProd >= 0 ? '+' : '';

                            // Max volume to calculate width percentages
                            const maxVal = Math.max(volCurrent, volCompare, 1);
                            const widthCurrentPct = `${(volCurrent / maxVal) * 100}%` as any;
                            const widthComparePct = `${(volCompare / maxVal) * 100}%` as any;

                            return (
                                <View key={prod.id} style={styles.compProdItem}>
                                    <View style={styles.compProdHeader}>
                                        <Text style={styles.compProdName}>{label}</Text>
                                        <Text style={[styles.compProdBadge, { color: prodTrendColor, backgroundColor: diffProd >= 0 ? '#E6F9F0' : '#FEECEE' }]}>
                                            {`${prodTrendSymbol}${pctProd.toFixed(1)}%`}
                                        </Text>
                                    </View>

                                    {/* Current Bar */}
                                    <View style={styles.progressBarWrapper}>
                                        <View style={[styles.progressBarFilled, { width: widthCurrentPct, backgroundColor: COLORS.primary }]} />
                                        <Text style={styles.progressBarValue}>{`${volCurrent.toLocaleString()} gls`}</Text>
                                    </View>

                                    {/* Compare Bar */}
                                    <View style={styles.progressBarWrapper}>
                                        <View style={[styles.progressBarFilled, { width: widthComparePct, backgroundColor: '#D1D5DB' }]} />
                                        <Text style={[styles.progressBarValue, { color: COLORS.gray }]}>{`${volCompare.toLocaleString()} gls (Comp)`}</Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                ) : (
                    <View style={styles.radialList}>
                        {unifiedData.map((prod, idx) => {
                            const color = CHART_COLORS[idx % CHART_COLORS.length];
                            const label = formatFullProductName(prod.nombre);
                            const volCurrent = prod.current;
                            const volCompare = prod.compare;
                            const diffProd = volCurrent - volCompare;
                            const pctProd = volCompare > 0 ? (diffProd / volCompare) * 100 : 0;
                            const prodTrendColor = diffProd >= 0 ? '#10B981' : '#EF4444';
                            const prodTrendSymbol = diffProd >= 0 ? '+' : '';
                            const maxVal = Math.max(volCurrent, volCompare, 1);

                            // Radial SVG math
                            const size = 120;
                            const center = size / 2;
                            const strokeWidth = 10;
                            const rCurrent = (size - strokeWidth) / 2;
                            const rCompare = rCurrent - strokeWidth - 4; // inner ring

                            const circCurrent = 2 * Math.PI * rCurrent;
                            const circCompare = 2 * Math.PI * rCompare;

                            const fillCurrent = (volCurrent / maxVal) * circCurrent;
                            const fillCompare = (volCompare / maxVal) * circCompare;

                            return (
                                <View key={prod.id} style={styles.radialCard}>
                                    <Text style={styles.radialProdName}>{label}</Text>
                                    <View style={styles.radialSvgContainer}>
                                        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                                            <G rotation="-90" origin={`${center}, ${center}`}>
                                                {/* Progress tracks */}
                                                <Circle
                                                    cx={center} cy={center} r={rCompare}
                                                    stroke="#9CA3AF" strokeWidth={strokeWidth} fill="none"
                                                    strokeDasharray={`${fillCompare} ${circCompare}`}
                                                    strokeLinecap="round"
                                                />
                                                <Circle
                                                    cx={center} cy={center} r={rCurrent}
                                                    stroke={color} strokeWidth={strokeWidth} fill="none"
                                                    strokeDasharray={`${fillCurrent} ${circCurrent}`}
                                                    strokeLinecap="round"
                                                />
                                            </G>
                                        </Svg>
                                        <View style={styles.radialCenterTextContainer}>
                                            <Text style={[styles.radialCenterText, { color: prodTrendColor }]}>
                                                {`${prodTrendSymbol}${Math.abs(pctProd).toFixed(0)}%`}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.radialLegend}>
                                        <View style={styles.radialLegendRow}>
                                            <View style={[styles.colorDot, { backgroundColor: color, width: 10, height: 10, borderRadius: 5 }]} />
                                            <Text style={styles.radialLegendText}>{volCurrent.toLocaleString()} gls</Text>
                                        </View>
                                        <View style={styles.radialLegendRow}>
                                            <View style={[styles.colorDot, { backgroundColor: '#9CA3AF', width: 10, height: 10, borderRadius: 5 }]} />
                                            <Text style={styles.radialLegendText}>{volCompare.toLocaleString()} gls</Text>
                                        </View>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                )}

                {/* Botón de alternancia */}
                <TouchableOpacity
                    style={styles.toggleViewBtn}
                    onPress={() => setCompareViewType(prev => prev === 'bars' ? 'radial' : 'bars')}
                >
                    <Icon name={compareViewType === 'bars' ? 'pie-chart-outline' : 'bar-chart-outline'} size={18} color={COLORS.primary} />
                    <Text style={styles.toggleViewBtnText}>
                        {compareViewType === 'bars' ? 'Cambiar a Gráfico Radial' : 'Cambiar a Barras'}
                    </Text>
                </TouchableOpacity>
            </View>
        );
    };

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
                                                                <Text
                                                                    numberOfLines={2}
                                                                    adjustsFontSizeToFit
                                                                    style={[
                                                                        styles.innerBarLabel,
                                                                        {
                                                                            fontSize: 8,
                                                                            color: COLORS.white,
                                                                            textShadowColor: 'rgba(0,0,0,0.6)',
                                                                            textShadowOffset: { width: 0.5, height: 0.5 },
                                                                            textShadowRadius: 1,
                                                                            paddingHorizontal: 2
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
                                    <Text
                                        numberOfLines={2}
                                        adjustsFontSizeToFit
                                        style={[styles.barLabel, isSelected && { color: COLORS.primary }]}
                                    >
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
                    {(() => {
                        let totalDisplay = 0;
                        if (selectedTerminal) {
                            const termData = barData.find(b => b.fullName === selectedTerminal);
                            totalDisplay = uniqueProducts.reduce((sum, prod) => sum + (termData?.values[prod] || 0), 0);
                        } else {
                            totalDisplay = uniqueProducts.reduce((sum, prod) => sum + barData.reduce((s, bar) => s + (bar.values[prod] || 0), 0), 0);
                        }

                        // Solo mostrar el Total si hay productos (aunque siempre debería haber si hay data)
                        if (totalDisplay <= 0 && selectedTerminal) return null;

                        return (
                            <View style={[styles.legendItem, { borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingBottom: 15, marginBottom: 15 }]}>
                                <View style={styles.legendLeft}>
                                    <View style={[styles.colorDot, { backgroundColor: COLORS.dark }]} />
                                    <Text style={[styles.legendLabel, { fontWeight: 'bold', fontSize: 14 }]}>DESPACHO TOTAL</Text>
                                </View>
                                <Text style={[styles.legendValue, { fontSize: 14, color: COLORS.primary }]}>
                                    {`${totalDisplay.toLocaleString()} gls`}
                                </Text>
                            </View>
                        );
                    })()}
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
                <AppHeader
                    codigoComercializadora={user?.codigocomercializadora || ''}
                    title="VOLUMEN TOTAL"
                    onBackPress={() => navigation.goBack()}
                />


                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {/* Welcome */}
                    <View style={styles.welcomeSection}>
                        <Text style={styles.welcomeTitle}>
                            Hola, {user?.nombre || 'Usuario'}
                        </Text>
                        <Text style={styles.welcomeSub}>Miremos las ventas totales</Text>
                    </View>


                    {/* Selector de Cliente (Solo para administradores) */}
                    {isAdmin && (
                        <>
                            <Text style={styles.sectionTitle}>FILTRAR POR CLIENTE</Text>
                            <TouchableOpacity
                                style={styles.clienteSelectorButton}
                                onPress={() => {
                                    if (!showClienteDropdown) setClienteSearchText('');
                                    setShowClienteDropdown(!showClienteDropdown);
                                }}
                            >
                                <View style={styles.clienteSelectorContent}>
                                    <View style={[styles.iconCircle, { backgroundColor: '#E0E7FF' }]}>
                                        <Icon name="person" size={20} color="#3B82F6" />
                                    </View>
                                    <View style={styles.clienteSelectorText}>
                                        <Text style={styles.infoLabel}>CLIENTE</Text>
                                        <Text style={styles.infoValue}>
                                            {selectedCliente
                                                ? `${selectedCliente.codigo ?? ''} - ${selectedCliente.nombrecomercial ?? ''}`
                                                : 'Todos los clientes (Consolidado)'}
                                        </Text>
                                    </View>
                                    {selectedCliente && (
                                        <TouchableOpacity
                                            onPress={() => setSelectedCliente(null)}
                                            style={{ marginRight: 10, padding: 5 }}
                                        >
                                            <Icon name="close-circle" size={24} color={COLORS.gray} />
                                        </TouchableOpacity>
                                    )}
                                    <Icon
                                        name={showClienteDropdown ? "chevron-up" : "chevron-down"}
                                        size={24}
                                        color="#9CA3AF"
                                    />
                                </View>
                            </TouchableOpacity>

                            {showClienteDropdown && (
                                <View style={styles.clienteDropdown}>
                                    <View style={styles.clienteSearchWrapper}>
                                        <Icon name="search" size={20} color="#9CA3AF" style={styles.clienteSearchIcon} />
                                        <Input
                                            style={styles.clienteSearchInput}
                                            placeholder="Buscar por código o nombre..."
                                            value={clienteSearchText}
                                            onChangeText={setClienteSearchText}
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                        />
                                    </View>
                                    <ScrollView style={styles.clienteDropdownScroll} nestedScrollEnabled={true} keyboardShouldPersistTaps="handled">
                                        <TouchableOpacity
                                            style={[
                                                styles.clienteDropdownItem,
                                                !selectedCliente && styles.clienteDropdownItemSelected
                                            ]}
                                            onPress={() => {
                                                setSelectedCliente(null);
                                                setShowClienteDropdown(false);
                                            }}
                                        >
                                            <Text style={styles.clienteDropdownItemText}>
                                                Todos los clientes (Consolidado)
                                            </Text>
                                        </TouchableOpacity>
                                        {filteredClientes.length === 0 ? (
                                            <View style={styles.clienteDropdownLoading}>
                                                <Text style={styles.clienteDropdownLoadingText}>
                                                    {clienteSearchText.trim() ? 'No hay clientes que coincidan' : 'No hay clientes'}
                                                </Text>
                                            </View>
                                        ) : (
                                            filteredClientes.map((cliente, index) => (
                                                <TouchableOpacity
                                                    key={cliente.codigo ?? index}
                                                    style={[
                                                        styles.clienteDropdownItem,
                                                        selectedCliente?.codigo === cliente.codigo && styles.clienteDropdownItemSelected
                                                    ]}
                                                    onPress={() => {
                                                        setSelectedCliente(cliente);
                                                        setShowClienteDropdown(false);
                                                    }}
                                                >
                                                    <Text style={styles.clienteDropdownItemText}>
                                                        {cliente.codigo ?? ''} - {cliente.nombrecomercial ?? ''}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))
                                        )}
                                    </ScrollView>
                                </View>
                            )}
                        </>
                    )}

                    {/* Date Selector */}
                    {/* Date Selector */}
                    {isAdmin ? (
                        <View style={styles.dateRangeContainer}>
                            <TouchableOpacity
                                style={[styles.dateCardHalf, { marginRight: 6 }]}
                                onPress={() => setPickerType('start')}
                            >
                                <View style={styles.dateLeft}>
                                    <View style={styles.calendarIconBoxSmall}>
                                        <Icon name="calendar-outline" size={16} color={COLORS.primary} />
                                    </View>
                                    <View style={styles.dateTextContainer}>
                                        <Text style={styles.dateInfoLabel} numberOfLines={1} adjustsFontSizeToFit>FECHA DESDE</Text>
                                        <Text style={styles.dateTextSmall} numberOfLines={1} adjustsFontSizeToFit>
                                            {format(startDate, "dd/MM/yyyy")}
                                        </Text>
                                    </View>
                                </View>
                                <Icon name="chevron-forward" size={14} color={COLORS.gray} />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.dateCardHalf, { marginLeft: 6 }]}
                                onPress={() => setPickerType('end')}
                            >
                                <View style={styles.dateLeft}>
                                    <View style={styles.calendarIconBoxSmall}>
                                        <Icon name="calendar-outline" size={16} color={COLORS.primary} />
                                    </View>
                                    <View style={styles.dateTextContainer}>
                                        <Text style={styles.dateInfoLabel} numberOfLines={1} adjustsFontSizeToFit>FECHA HASTA</Text>
                                        <Text style={styles.dateTextSmall} numberOfLines={1} adjustsFontSizeToFit>
                                            {format(endDate, "dd/MM/yyyy")}
                                        </Text>
                                    </View>
                                </View>
                                <Icon name="chevron-forward" size={14} color={COLORS.gray} />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={styles.dateCard}
                            onPress={() => setPickerType('single')}
                        >
                            <View style={styles.dateLeft}>
                                <View style={styles.calendarIconBox}>
                                    <Icon name="calendar-outline" size={20} color={COLORS.primary} />
                                </View>
                                <View style={styles.dateTextContainer}>
                                    <Text style={styles.dateInfoLabel} numberOfLines={1} adjustsFontSizeToFit>INFORMACIÓN DE</Text>
                                    <Text style={styles.dateText} numberOfLines={1} adjustsFontSizeToFit>
                                        {(() => {
                                            const str = format(startDate, "EEEE, d 'de' MMMM", { locale: es });
                                            return str.charAt(0).toUpperCase() + str.slice(1);
                                        })()}
                                    </Text>
                                </View>
                            </View>
                            <Icon name="chevron-forward" size={20} color={COLORS.gray} />
                        </TouchableOpacity>
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

                            {/* Compare controls (Only for admins) */}
                            {isAdmin && (
                                <View style={styles.compareContainer}>
                                    <View style={styles.compareHeader}>
                                        <Icon name="git-compare-outline" size={18} color={isComparing ? COLORS.primary : COLORS.gray} />
                                        <Text style={styles.compareLabel}>Comparar períodos de ventas</Text>
                                        <TouchableOpacity
                                            activeOpacity={0.7}
                                            onPress={() => setIsComparing(!isComparing)}
                                            style={[styles.compareSwitch, isComparing && styles.compareSwitchActive]}
                                        >
                                            <View style={[styles.compareSwitchCircle, isComparing && styles.compareSwitchCircleActive]} />
                                        </TouchableOpacity>
                                    </View>

                                    {isComparing && (
                                        <>
                                            <View style={[styles.dateRangeContainer, { marginTop: 12, marginBottom: 0 }]}>
                                                <TouchableOpacity
                                                    style={[styles.dateCardHalf, { marginRight: 6 }]}
                                                    onPress={() => setPickerType('compare_start')}
                                                >
                                                    <View style={styles.dateLeft}>
                                                        <View style={styles.calendarIconBoxSmall}>
                                                            <Icon name="calendar-outline" size={16} color={COLORS.primary} />
                                                        </View>
                                                        <View style={styles.dateTextContainer}>
                                                            <Text style={styles.dateInfoLabel} numberOfLines={1} adjustsFontSizeToFit>COMP. DESDE</Text>
                                                            <Text style={styles.dateTextSmall} numberOfLines={1} adjustsFontSizeToFit>
                                                                {format(compareStartDate, "dd/MM/yyyy")}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                    <Icon name="chevron-forward" size={14} color={COLORS.gray} />
                                                </TouchableOpacity>

                                                <TouchableOpacity
                                                    style={[styles.dateCardHalf, { marginLeft: 6 }]}
                                                    onPress={() => setPickerType('compare_end')}
                                                >
                                                    <View style={styles.dateLeft}>
                                                        <View style={styles.calendarIconBoxSmall}>
                                                            <Icon name="calendar-outline" size={16} color={COLORS.primary} />
                                                        </View>
                                                        <View style={styles.dateTextContainer}>
                                                            <Text style={styles.dateInfoLabel} numberOfLines={1} adjustsFontSizeToFit>COMP. HASTA</Text>
                                                            <Text style={styles.dateTextSmall} numberOfLines={1} adjustsFontSizeToFit>
                                                                {format(compareEndDate, "dd/MM/yyyy")}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                    <Icon name="chevron-forward" size={14} color={COLORS.gray} />
                                                </TouchableOpacity>
                                            </View>
                                        </>
                                    )}
                                </View>
                            )}

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
                                    {isComparing ? renderComparisonView() : renderPieChart()}
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

                {pickerType && (
                    <View style={styles.customOverlay}>
                        <TouchableOpacity
                            style={styles.customBackdrop}
                            onPress={() => setPickerType(null)}
                            activeOpacity={1}
                        />
                        <Card disabled={true} style={styles.modalCard}>
                            <Text category='h6' style={styles.modalTitle}>
                                {pickerType === 'start'
                                    ? 'Seleccione Fecha Desde'
                                    : pickerType === 'end'
                                        ? 'Seleccione Fecha Hasta'
                                        : pickerType === 'compare_start'
                                            ? 'Seleccione Comp. Desde'
                                            : pickerType === 'compare_end'
                                                ? 'Seleccione Comp. Hasta'
                                                : 'Seleccione una fecha'}
                            </Text>
                            <Calendar
                                date={
                                    pickerType === 'start'
                                        ? startDate
                                        : pickerType === 'end'
                                            ? endDate
                                            : pickerType === 'compare_start'
                                                ? compareStartDate
                                                : pickerType === 'compare_end'
                                                    ? compareEndDate
                                                    : startDate
                                }
                                dateService={dateService}
                                min={new Date(2025, 0, 1)}
                                onSelect={(nextDate) => {
                                    if (pickerType === 'start') {
                                        setStartDate(nextDate);
                                        if (nextDate > endDate) {
                                            setEndDate(nextDate);
                                        }
                                    } else if (pickerType === 'end') {
                                        setEndDate(nextDate);
                                        if (nextDate < startDate) {
                                            setStartDate(nextDate);
                                        }
                                    } else if (pickerType === 'single') {
                                        setStartDate(nextDate);
                                        setEndDate(nextDate);
                                    } else if (pickerType === 'compare_start') {
                                        setCompareStartDate(nextDate);
                                        if (nextDate > compareEndDate) {
                                            setCompareEndDate(nextDate);
                                        }
                                    } else if (pickerType === 'compare_end') {
                                        setCompareEndDate(nextDate);
                                        if (nextDate < compareStartDate) {
                                            setCompareStartDate(nextDate);
                                        }
                                    }
                                    setActiveTab('Nacional');
                                    setPickerType(null);
                                }}
                                style={styles.calendarComponent}
                            />
                            <TouchableOpacity
                                style={styles.closeModalBtn}
                                onPress={() => setPickerType(null)}
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
        paddingHorizontal: 15,
        paddingVertical: 0,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 80,
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
        marginTop: -15,
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
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1565C0',
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
    calendarIconBox: {
        width: 40,
        height: 40,
        backgroundColor: '#EFF6FF',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    dateText: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.dark,
    },
    compareContainer: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    compareHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    compareLabel: {
        flex: 1,
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.dark,
        marginLeft: 8,
    },
    compareSwitch: {
        width: 44,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#E5E7EB',
        padding: 2,
        justifyContent: 'center',
    },
    compareSwitchActive: {
        backgroundColor: COLORS.primary,
    },
    compareSwitchCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.5,
        elevation: 2,
    },
    compareSwitchCircleActive: {
        alignSelf: 'flex-end',
    },
    compareModesRow: {
        flexDirection: 'row',
        marginTop: 10,
        backgroundColor: '#E5E7EB',
        borderRadius: 8,
        padding: 2,
    },
    compareModeBtn: {
        flex: 1,
        paddingVertical: 6,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 6,
    },
    compareModeBtnActive: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1.5,
        elevation: 1,
    },
    compareModeBtnText: {
        fontSize: 11,
        fontWeight: '500',
        color: '#6B7280',
    },
    compareModeBtnTextActive: {
        color: COLORS.primary,
        fontWeight: 'bold',
    },
    comparisonContainer: {
        marginTop: 10,
    },
    kpiContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    kpiCard: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginHorizontal: 4,
    },
    kpiTitle: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#9CA3AF',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    kpiValue: {
        fontSize: 15,
        fontWeight: 'bold',
    },
    kpiUnit: {
        fontSize: 10,
        fontWeight: 'normal',
    },
    trendBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 20,
    },
    trendBannerText: {
        flex: 1,
        fontSize: 12,
        lineHeight: 16,
    },
    compListTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 12,
        letterSpacing: 0.5,
    },
    compList: {
        backgroundColor: '#FFFFFF',
    },
    compProdItem: {
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    compProdHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    compProdName: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.dark,
    },
    compProdBadge: {
        fontSize: 11,
        fontWeight: 'bold',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        overflow: 'hidden',
    },
    progressBarWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 16,
        marginBottom: 6,
        backgroundColor: '#F3F4F6',
        borderRadius: 4,
        overflow: 'hidden',
        position: 'relative',
    },
    progressBarFilled: {
        height: '100%',
        borderRadius: 4,
    },
    progressBarValue: {
        position: 'absolute',
        left: 8,
        fontSize: 9,
        fontWeight: '600',
        color: COLORS.white,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0.5, height: 0.5 },
        textShadowRadius: 1,
    },
    radialList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    radialCard: {
        width: '48%',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 12,
        marginBottom: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F3F4F6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    radialProdName: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.dark,
        marginBottom: 8,
        textAlign: 'center',
    },
    radialSvgContainer: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    radialCenterTextContainer: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    radialCenterText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    radialLegend: {
        marginTop: 12,
        width: '100%',
        paddingHorizontal: 5,
    },
    radialLegendRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    radialLegendText: {
        fontSize: 10,
        color: '#6B7280',
        fontWeight: '500',
    },
    toggleViewBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#EFF6FF',
        paddingVertical: 12,
        borderRadius: 12,
        marginTop: 10,
        borderWidth: 1,
        borderColor: '#BFDBFE',
    },
    toggleViewBtnText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginLeft: 8,
    },
    radialList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    radialCard: {
        width: '48%',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 12,
        marginBottom: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F3F4F6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    radialProdName: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.dark,
        marginBottom: 8,
        textAlign: 'center',
    },
    radialSvgContainer: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    radialCenterTextContainer: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    radialCenterText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    radialLegend: {
        marginTop: 12,
        width: '100%',
        paddingHorizontal: 5,
    },
    radialLegendRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    radialLegendText: {
        fontSize: 10,
        color: '#6B7280',
        fontWeight: '500',
    },
    dateRangeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    dateCardHalf: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    dateLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    dateTextContainer: {
        flex: 1,
        justifyContent: 'center',
        paddingRight: 4,
    },
    calendarIconBoxSmall: {
        width: 32,
        height: 32,
        backgroundColor: '#EFF6FF',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    dateInfoLabel: {
        fontSize: 10,
        color: '#9CA3AF',
        fontWeight: 'bold',
    },
    dateTextSmall: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.dark,
        marginTop: 2,
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
        width: '100%',
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
        width: '100%',
    },
    legendItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        padding: 12,
        borderRadius: 12,
        marginBottom: 10,
        width: '100%',
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
        flex: 1,
        paddingRight: 10,
    },
    colorDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 10,
        flexShrink: 0,
    },
    legendLabel: {
        fontSize: 12,
        color: '#1F2937',
        fontWeight: '500',
        flexShrink: 1,
    },
    legendValue: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.dark,
        flexShrink: 0,
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
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#6B7280',
        marginBottom: 10,
        letterSpacing: 0.5,
    },
    clienteSelectorButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        padding: 15,
        borderRadius: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    clienteSelectorContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    clienteSelectorText: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 10,
        color: '#9CA3AF',
        fontWeight: 'bold',
    },
    infoValue: {
        fontSize: 14,
        color: COLORS.dark,
        fontWeight: '600',
    },
    clienteDropdown: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 10,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        maxHeight: 300,
    },
    clienteSearchWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 10,
        paddingHorizontal: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    clienteSearchIcon: {
        marginRight: 8,
    },
    clienteSearchInput: {
        flex: 1,
        backgroundColor: 'transparent',
        borderWidth: 0,
    },
    clienteDropdownScroll: {
        maxHeight: 220,
    },
    clienteDropdownItem: {
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    clienteDropdownItemSelected: {
        backgroundColor: '#EFF6FF',
        borderRadius: 8,
    },
    clienteDropdownItemText: {
        fontSize: 14,
        color: COLORS.dark,
    },
    clienteDropdownLoading: {
        padding: 20,
        alignItems: 'center',
    },
    clienteDropdownLoadingText: {
        color: '#6B7280',
        fontSize: 14,
    }
});