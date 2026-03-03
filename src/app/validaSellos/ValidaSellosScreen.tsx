import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    TouchableOpacity,
    ScrollView,
    Image,
    TextInput,
    Alert,
    Platform,
} from 'react-native';
import { Layout, Text, Button, Datepicker, Icon as KittenIcon, NativeDateService } from '@ui-kitten/components';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import ScreenWrapper from '../../components/ScreenWrapper';
import { RootStackParamList } from '../../types/navigation';
import { useUser } from '../../hooks';
import { usoSelloService } from '../../services';
import { ApiResponse, UsoSelloInterface } from '../../types';

type NavigationProps = StackNavigationProp<RootStackParamList, 'ValidaSellos'>;

export default function ValidaSellosScreen() {
    const navigation = useNavigation<NavigationProps>();
    const { user } = useUser();

    // Estados
    const [date, setDate] = React.useState<Date>(new Date());
    const [selectedProblems, setSelectedProblems] = useState<string[]>([]);
    const [comment, setComment] = useState('');
    const [selectedSellos, setSelectedSellos] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    // Lista de registros del API
    const [usosellos, setUsosellos] = useState<UsoSelloInterface[]>([]);
    const [selectedUsoSello, setSelectedUsoSello] = useState<UsoSelloInterface | null>(null);
    const [showUsoSelloDropdown, setShowUsoSelloDropdown] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Efecto cuando cambia la fecha: buscar nuevos registros
    React.useEffect(() => {
        handleSearchRecords();
    }, [date]);

    const handleSearchRecords = async () => {
        if (!user?.codigocliente && !user?.codigo) return;

        const codCliente = user?.codigocliente || user?.codigo;

        // Guardar seguridad: asegurar que la fecha es válida antes de formatear
        let fechaStr = '';
        try {
            const dateObj = date instanceof Date ? date : new Date(date);
            if (isNaN(dateObj.getTime())) {
                console.warn('FT-handleSearchRecords::Fecha inválida detectada:', date);
                return;
            }
            fechaStr = format(dateObj, 'yyyy/MM/dd');
        } catch (error) {
            console.error('FT-handleSearchRecords::Error al formatear fecha:', error);
            return;
        }

        try {
            setLoading(true);
            const response = await usoSelloService.getResource<ApiResponse<UsoSelloInterface>>(
                'ec.com.infinity.modelo.usosello/buscarusoselloscliente',
                '',
                {
                    codigocomercializadora: user?.codigocomercializadora,
                    codigocliente: codCliente,
                    fecha: fechaStr
                }
            );

            console.log('FT-handleSearchRecords::Respuesta Servidor:', JSON.stringify(response));

            if (response && response.retorno && Array.isArray(response.retorno) && response.retorno.length > 0) {
                console.log('FT-handleSearchRecords::Registros encontrados:', response.retorno.length);
                setUsosellos(response.retorno);
                setSelectedUsoSello(null);
            } else {
                console.log('FT-handleSearchRecords::No se encontraron registros en retorno o no es un arreglo');
                setUsosellos([]);
                setSelectedUsoSello(null);
            }
        } catch (error: any) {
            console.error('Error buscando sellos:', error);
            console.error('FT-handleSearchRecords::Detalle Error:', error?.response?.data || error?.message);
        } finally {
            setLoading(false);
            setSelectedSellos([]);
            setSelectedProblems([]);
            setComment('');
        }
    };

    const formatUsoSello = (item: UsoSelloInterface) => {
        // NP1 viene dentro de usoselloPK
        const np1 = item.usoselloPK?.np1;
        const nps = [np1, item.np2, item.np3, item.np4, item.np5, item.np6]
            .filter(val => val && String(val).trim() !== '' && String(val).trim() !== 'null')
            .join(', ');

        const estado = item.informado ? 'Informado' : 'No informado';

        return nps ? `${nps} - ${estado}` : `S/N - ${estado}`;
    };

    // Obtener los sellos del registro seleccionado
    const getSellosFromSelected = (): { id: string, numero: string, recibido: boolean }[] => {
        if (!selectedUsoSello) return [];

        const lista: { id: string, numero: string, recibido: boolean }[] = [];
        // Revisamos del 1 al 16
        for (let i = 1; i <= 16; i++) {
            const numeroSello = (selectedUsoSello as any)[`sello${i}`];
            if (numeroSello && String(numeroSello).trim() !== '' && String(numeroSello) !== '0') {
                lista.push({
                    id: `sello${i}`,
                    numero: String(numeroSello),
                    recibido: !!(selectedUsoSello as any)[`sello${i}recibido`]
                });
            }
        }
        return lista;
    };

    const toggleSello = (id: string) => {
        if (selectedUsoSello?.informado) return;

        if (selectedSellos.includes(id)) {
            setSelectedSellos(selectedSellos.filter(s => s !== id));
        } else {
            setSelectedSellos([...selectedSellos, id]);
        }
    };

    const getResumenValidacion = (data: any) => {
        const recibidos = Object.keys(data).filter(k => k.endsWith('recibido') && data[k] === true);
        return {
            totalSellos: recibidos.length,
            novedades: data.observacionrecibido || 'Ninguna',
            usuario: data.usuarioactual
        };
    };

    const toggleProblem = (value: string) => {
        if (selectedUsoSello?.informado) return;

        if (selectedProblems.includes(value)) {
            setSelectedProblems(selectedProblems.filter(p => p !== value));
        } else {
            setSelectedProblems([...selectedProblems, value]);
        }
    };

    const renderRadioButton = (label: string, value: string) => {
        const isSelected = selectedProblems.includes(value);
        const isDisabled = !!selectedUsoSello?.informado;

        return (
            <TouchableOpacity
                style={[styles.radioOption, isDisabled && styles.disabledOpacity]}
                onPress={() => toggleProblem(value)}
                disabled={isDisabled}
            >
                <View style={[
                    styles.radioCircle,
                    isSelected && styles.radioCircleSelected,
                    isDisabled && isSelected && styles.radioCircleDisabled
                ]}>
                    {isSelected && <View style={[styles.radioInnerCircle, isDisabled && styles.radioInnerCircleDisabled]} />}
                </View>
                <Text style={styles.radioLabel}>{label}</Text>
            </TouchableOpacity>
        );
    };

    const handleSave = async () => {
        if (!selectedUsoSello) return;

        try {
            setLoading(true);

            // 1. Clonamos el objeto original
            const updatedUsoSello: UsoSelloInterface = { ...selectedUsoSello };

            // 2. Mapeamos los sellos recibidos (sello1recibido, etc)
            // Primero ponemos todos en false para resetear si es necesario
            for (let i = 1; i <= 16; i++) {
                (updatedUsoSello as any)[`sello${i}recibido`] = false;
            }

            // Marcamos true los seleccionados por el usuario
            selectedSellos.forEach(selloId => {
                (updatedUsoSello as any)[`${selloId}recibido`] = true;
            });

            // 3. Concatenamos los inconvenientes
            // Formato pedido: "Novedad-1: ítem ; Novedad-2: ítem ; Otra novedad: texto"
            let observacion = '';
            if (selectedProblems.length > 0) {
                observacion = selectedProblems.map((p, idx) => `Novedad-${idx + 1}: ${p}`).join(' ; ');
            }

            if (comment.trim() !== '') {
                const prefix = observacion ? ' ; ' : '';
                observacion += `${prefix}Otra novedad: ${comment.trim()}`;
            }

            updatedUsoSello.observacionrecibido = observacion.substring(0, 500); // Límite de seguridad
            updatedUsoSello.usuarioactual = user?.nombre || 'AppMovil';

            // Eliminar campo 'informado' para evitar error 400 del servidor
            delete (updatedUsoSello as any).informado;

            console.log('--- DATOS A GUARDAR ---');
            console.log('📅 Fecha:', format(date, 'dd/MM/yyyy'));
            console.log('📦 Pedido:', `${selectedUsoSello.usoselloPK.codigocliente} - ${selectedUsoSello.nombreconductor}`);

            const sellosRecibidosNum = getSellosFromSelected()
                .filter(s => selectedSellos.includes(s.id))
                .map(s => s.numero);
            console.log('🔑 Sellos Recibidos:', sellosRecibidosNum.length > 0 ? sellosRecibidosNum.join(', ') : 'Ninguno');

            console.log('⚠️ Inconvenientes:', selectedProblems.length > 0 ? selectedProblems.join(' ; ') : 'Ninguno');
            console.log('💬 Novedad/Comentario:', comment.trim() || 'Sin comentario');
            console.log('👤 Usuario:', user?.nombre || 'AppMovil');
            console.log('-----------------------');

            if (usoSelloService.putResource) {
                const result = await usoSelloService.putResource<ApiResponse<any>>(
                    'ec.com.infinity.modelo.usosello/porId',
                    updatedUsoSello
                );

                console.log('Respuesta servidor:', result);

                if (result.statusCode === 200) {
                    setShowSuccessModal(true);
                    // Esperar un momento para que el usuario vea el mensaje y luego regresar
                    setTimeout(() => {
                        setShowSuccessModal(false);
                        navigation.goBack();
                    }, 2500);
                }
            }
        } catch (error: any) {
            console.error('Error guardando validación:', error);
            if (Platform.OS === 'web') {
                window.alert('Error: Ocurrió un problema al conectar con el servidor.');
            } else {
                Alert.alert('Error', 'Ocurrió un problema al conectar con el servidor.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScreenWrapper>
            <Layout style={styles.container}>
                {/* Header Custom */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Icon name="arrow-back" size={24} color="#1F2937" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Validación de Sellos</Text>
                    <Text style={styles.logoText}>PETROLRIOS</Text>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {/* Saludo */}
                    <View style={styles.greetingSection}>
                        <Text style={styles.greetingTitle}>Hola, <Text style={styles.userName}>{user?.nombre || 'Usuario'}</Text></Text>
                        <Text style={styles.greetingSubtitle}>Es importante que verifique los sellos recibidos en los autotanques.</Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Estamos viendo pedidos de:</Text>
                        {Platform.OS === 'web' ? (
                            <input
                                type="date"
                                value={format(date, 'yyyy-MM-dd')}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val) {
                                        // Usamos T12:00:00 para evitar que la zona horaria reste un día
                                        const newDate = new Date(val + 'T12:00:00');
                                        if (!isNaN(newDate.getTime())) {
                                            setDate(newDate);
                                        }
                                    }
                                }}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '12px',
                                    border: '1px solid #E5E7EB',
                                    backgroundColor: '#F9FAFB',
                                    color: '#111827',
                                    fontSize: '15px',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                            />
                        ) : (
                            <Datepicker
                                date={date}
                                onSelect={setDate}
                                accessoryRight={(props) => (
                                    <View style={[props?.style as any, { justifyContent: 'center', alignItems: 'center' }]}>
                                        <Icon
                                            name="calendar-outline"
                                            size={20}
                                            color="#9CA3AF"
                                        />
                                    </View>
                                )}
                                controlStyle={styles.datepickerControl}
                            />
                        )}
                    </View>

                    {/* Selector de Pedido */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Seleccione un pedido despachado:</Text>
                        <TouchableOpacity
                            style={styles.selectorField}
                            onPress={() => setShowUsoSelloDropdown(!showUsoSelloDropdown)}
                        >
                            <Text style={styles.selectorText} numberOfLines={1}>
                                {selectedUsoSello ? formatUsoSello(selectedUsoSello) : 'Seleccione un registro...'}
                            </Text>
                            <Icon name={showUsoSelloDropdown ? "chevron-up" : "chevron-down"} size={20} color="#9CA3AF" />
                        </TouchableOpacity>

                        {showUsoSelloDropdown && (
                            <View style={styles.dropdownList}>
                                {loading ? (
                                    <Text style={styles.loadingText}>Cargando...</Text>
                                ) : usosellos.length > 0 ? (
                                    usosellos.map((item, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={styles.dropdownItem}
                                            onPress={() => {
                                                setSelectedUsoSello(item);
                                                setShowUsoSelloDropdown(false);
                                            }}
                                        >
                                            <Text style={styles.dropdownItemText}>{formatUsoSello(item)}</Text>
                                        </TouchableOpacity>
                                    ))
                                ) : (
                                    <View style={styles.dropdownItem}>
                                        <Text style={styles.dropdownItemText}>No hay pedidos para esta fecha</Text>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>

                    {/* Grid de Sellos */}
                    {selectedUsoSello && (
                        <>
                            <View style={styles.sellosHeader}>
                                <Text style={styles.label}>Marque los sellos recibidos:</Text>
                                <Text style={styles.sellosCount}>
                                    {selectedSellos.length} de {getSellosFromSelected().length} seleccionados
                                </Text>
                            </View>

                            <View style={[styles.sellosGrid, selectedUsoSello?.informado && styles.disabledOpacity]}>
                                {getSellosFromSelected().map((sello) => {
                                    const isSelected = selectedSellos.includes(sello.id);
                                    return (
                                        <TouchableOpacity
                                            key={sello.id}
                                            style={[styles.selloCard, isSelected && styles.selloCardSelected]}
                                            onPress={() => toggleSello(sello.id)}
                                            disabled={!!selectedUsoSello?.informado}
                                        >
                                            <Text style={[styles.selloNumber, isSelected && styles.selloNumberSelected]}>{sello.numero}</Text>
                                            {isSelected && <Icon name="checkmark-circle" size={12} color="#FFFFFF" style={styles.selloCheck} />}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </>
                    )}

                    {/* Problemas */}
                    <View style={styles.problemsSection}>
                        <Text style={styles.label}>¿Algún inconveniente con los sellos?</Text>
                        {renderRadioButton('Llegaron rotos', 'rotos')}
                        {renderRadioButton('Llegaron otros números', 'otros')}
                        {renderRadioButton('Otra novedad', 'otra')}
                    </View>

                    {/* Comentarios */}
                    <View style={styles.commentSection}>
                        <TextInput
                            style={[styles.textArea, selectedUsoSello?.informado && styles.disabledOpacity]}
                            multiline
                            numberOfLines={4}
                            placeholder="Descríbenos la novedad por favor, uno de nuestros colaboradores se comunicará contigo"
                            value={comment}
                            onChangeText={setComment}
                            placeholderTextColor="#9CA3AF"
                            editable={!selectedUsoSello?.informado}
                            maxLength={200}
                        />
                        {!selectedUsoSello?.informado && (
                            <Text style={styles.charCount}>
                                {comment.length}/200 caracteres
                            </Text>
                        )}
                    </View>

                    {/* Botón Guardar */}
                    {!selectedUsoSello?.informado && (
                        <Button
                            style={styles.saveButton}
                            accessoryLeft={(props) => <Icon name="save-outline" size={20} color="#FFF" />}
                            disabled={!selectedUsoSello || loading}
                            onPress={handleSave}
                        >
                            {loading ? 'Guardando...' : 'Guardar Validación'}
                        </Button>
                    )}

                </ScrollView>

                {/* Modal de Éxito Custom (más profesional) */}
                {showSuccessModal && (
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.successIconCircle}>
                                <Icon name="checkmark" size={40} color="#FFFFFF" />
                            </View>
                            <Text style={styles.modalTitle}>¡Guardado Exitoso!</Text>
                            <Text style={styles.modalMessage}>La validación de sellos se ha registrado correctamente en el sistema.</Text>
                            <View style={styles.loadingBarContainer}>
                                <View style={styles.loadingBarFill} />
                            </View>
                        </View>
                    </View>
                )}
            </Layout>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 15,
        color: '#111827',
    },
    logoText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#3B82F6',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    greetingSection: {
        marginBottom: 25,
    },
    greetingTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
    },
    userName: {
        color: '#1F2937',
    },
    greetingSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 5,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    selectorField: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    datepickerControl: {
        backgroundColor: '#F9FAFB',
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingVertical: 4,
    },
    dropdownList: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        marginTop: 5,
        maxHeight: 200,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    dropdownItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    dropdownItemText: {
        fontSize: 14,
        color: '#1F2937',
    },
    loadingText: {
        padding: 15,
        textAlign: 'center',
        color: '#6B7280',
    },
    selectorText: {
        fontSize: 15,
        color: '#111827',
    },
    sellosHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    sellosCount: {
        fontSize: 12,
        color: '#3B82F6',
        fontWeight: '600',
    },
    sellosGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        marginBottom: 25,
    },
    selloCard: {
        width: '18%',
        maxWidth: 100,
        marginRight: '2%',
        aspectRatio: 1,
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        padding: 3,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    selloCardSelected: {
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
    },
    selloLabel: {
        fontSize: 8,
        color: '#6B7280',
        fontWeight: 'bold',
    },
    selloLabelSelected: {
        color: '#E0F2FE',
    },
    selloNumber: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#111827',
    },
    selloNumberSelected: {
        color: '#FFFFFF',
    },
    selloCheck: {
        marginTop: 5,
    },
    problemsSection: {
        marginBottom: 20,
    },
    radioOption: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        padding: 16,
        borderRadius: 12,
        marginBottom: 10,
    },
    radioCircle: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    radioCircleSelected: {
        borderColor: '#3B82F6',
    },
    radioInnerCircle: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#3B82F6',
    },
    radioLabel: {
        fontSize: 15,
        color: '#1F2937',
    },
    commentSection: {
        marginBottom: 30,
    },
    textArea: {
        backgroundColor: '#F3F4F6',
        borderRadius: 16,
        padding: 16,
        fontSize: 14,
        color: '#111827',
        textAlignVertical: 'top',
        minHeight: 100,
    },
    saveButton: {
        borderRadius: 12,
        paddingVertical: 12,
        backgroundColor: '#3B82F6',
        borderWidth: 0,
    },
    disabledOpacity: {
        opacity: 0.5,
    },
    radioCircleDisabled: {
        borderColor: '#9CA3AF',
        backgroundColor: '#F3F4F6',
    },
    radioInnerCircleDisabled: {
        backgroundColor: '#9CA3AF',
    },
    charCount: {
        fontSize: 12,
        color: '#6B7280',
        textAlign: 'right',
        marginTop: 5,
        marginRight: 5,
    },
    // Estilos para el Modal de Éxito
    modalOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999,
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        width: '85%',
        maxWidth: 400,
        borderRadius: 24,
        padding: 30,
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    successIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#10B981',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 10,
    },
    modalMessage: {
        fontSize: 16,
        color: '#4B5563',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 25,
    },
    loadingBarContainer: {
        width: '100%',
        height: 4,
        backgroundColor: '#E5E7EB',
        borderRadius: 2,
        overflow: 'hidden',
    },
    loadingBarFill: {
        width: '100%',
        height: '100%',
        backgroundColor: '#10B981',
    },
});