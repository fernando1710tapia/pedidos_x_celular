import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Button, Input, Layout, Text, useTheme } from '@ui-kitten/components';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, TouchableOpacity, View, Image, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import ScreenWrapper from '../../components/ScreenWrapper';
import { useUser } from '../../hooks';
import obtenerComercializadoraCliente from '../../services/Comercializadora/comercializadoraServices';
import { crearNotaPedido } from '../../services/NotaPedido/notaPedidoServices';
import ProductoServices from '../../services/Producto/productoServices';
import obtenerTerminalCliente from '../../services/Terminal/teminalService';
import terminalService from '../../services/Terminal/terminalService';
import { notaPedidoStyles, loginStyles } from '../../styles';
import { ApiResponse, ClienteInterface, ComercializadoraInterface, DetalleNotaPedidoInterface, DetalleNotaPedidoPKInterface, EnvioNotaPedidoInterface, NotaPedidoInterface, NotaPedidoPKInterface, ProductoInterface, ProductoResponseInterface, TerminalClienteInterface, TerminalInterface } from '../../types';
import { RootStackParamList } from '../../types/navigation';
import { StyleSheet } from 'react-native';
//import { Icon } from '@ui-kitten/components';


type NavigationProps = StackNavigationProp<RootStackParamList, 'Login'>;

export default function NotaPedido() {
    const [cantidad, setCantidad] = useState<number>(0);
    const { user, logout } = useUser();
    const CheckIcon = (props: any) => (
        <Icon
            name="happy-outline"
            size={20}
            color="white"
            style={{ marginRight: 1 }}
        />
    );
    const theme = useTheme();
    const navigation = useNavigation<NavigationProps>();
    const [comercializadora, setComercializadora] = useState<ComercializadoraInterface>();
    const [terminalCli, setTerminalCli] = useState<TerminalClienteInterface>();
    const [terminal, setTerminal] = useState<TerminalInterface>();
    const [products, setProducts] = useState<ProductoResponseInterface[]>();
    const [comerName, setComerName] = useState<string>('');
    const [terminalName, setTerminalName] = useState<string>('');
    const [cliName, setCliName] = useState<string>('');
    const [codComer, setCodComer] = useState<string>('');
    const [codAbas, setCodAbas] = useState<string>('');
    const [codCli, setCodCli] = useState<string>('');
    const [codBank, setCodBank] = useState<string>('');
    const [prefijo, setPrefijo] = useState<string>('');
    const [codProducto, setCodProducto] = useState<string>('');
    const [selectedDateDate, setSelectedDateDate] = useState<Date | null>(null);
    const [selectedDate, setSelectedDate] = useState<'hoy' | 'manana' | null>(null);

    const [npNumber, setNpNumber] = useState<string>('');

    // Estados para administrador
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [allClientes, setAllClientes] = useState<TerminalClienteInterface[]>([]);
    const [selectedCliente, setSelectedCliente] = useState<TerminalClienteInterface | null>(null);
    const [showClienteDropdown, setShowClienteDropdown] = useState<boolean>(false);
    const [clienteSearchText, setClienteSearchText] = useState<string>('');
    // Terminal combo (admin): lista de terminales del cliente seleccionado
    const [terminalesList, setTerminalesList] = useState<{ codigo: string; nombre: string }[]>([]);
    const [selectedTerminal, setSelectedTerminal] = useState<{ codigo: string; nombre: string } | null>(null);
    const [showTerminalDropdown, setShowTerminalDropdown] = useState<boolean>(false);
    const [terminalSearchText, setTerminalSearchText] = useState<string>('');
    const [loadingTerminales, setLoadingTerminales] = useState<boolean>(false);

    // Sin comercializadora asignada: no se hacen llamadas al API
    const [missingComercializadora, setMissingComercializadora] = useState<boolean>(false);




    // Función para obtener la fecha en formato "YYYY-MM-DDTHH:mm:ssZ"
    const formatDate = (date: Date): string => {
        return date.toISOString(); // Devuelve el formato ISO con "Z"
    };

    // Función para establecer la fecha actual
    const setCurrentDate = () => {
        setSelectedDateDate(new Date()); // Guardamos el objeto Date sin formatear
        setSelectedDate('hoy');
    };

    const setTomorrowDate = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setSelectedDateDate(tomorrow);
        setSelectedDate('manana');
    };


    // codigocomercializadora lo asigna el backend en login (usuario/login). La app no lo asigna.
    const handleGetComer = async () => {
        const codigoComer = user?.codigocomercializadora;
        if (!codigoComer || codigoComer.trim() === '') {
            Alert.alert('Error', 'No hay código de comercializadora asociado a su usuario. Contacte al administrador.');
            return;
        }
        try {
            const response = await obtenerComercializadoraCliente.getResource<ApiResponse<ComercializadoraInterface>>(
                'porId',
                '',
                { codigo: codigoComer }
            );
            if (response.retorno !== null && response.retorno !== undefined) {
                setComercializadora(response.retorno[0]);
            } else {
                Alert.alert('Error', 'No hay Comercializadora para mostrar');
            }
        } catch (error: any) {
            const status = error?.response?.status;
            const serverMessage = error?.response?.data?.message || error?.response?.data?.developerMessage || '';
            const msg = status === 500
                ? 'El servidor no pudo procesar la solicitud. Verifique que el código de comercializadora sea válido o intente más tarde.'
                : `No se pudo obtener la comercializadora.${serverMessage ? ' ' + serverMessage : ''}`;
            console.error('FT::handleGetComer-Error:', status, serverMessage || error?.message);
            Alert.alert('Error', msg);
        }
    };

    // --- Regla de negocio (Generar pedido) ---
    // • Cliente = estación de servicio = gasolinera. Se obtiene vía obtenerTerminalCliente (ec.com.infinity.modelo.cliente).
    // • Usuario con 8 dígitos numéricos: es un cliente (una estación). Tiene comercializadora y un único cliente/terminal/productos.
    // • Usuario sin 8 dígitos: es administrador/operador. DEBE tener codigocomercializadora asignada (la asigna el backend en login;
    //   la app no la asigna). Con eso se lista todos los clientes (porComercializadora); al elegir cliente se autoselecciona su
    //   terminal por defecto y se muestran los productos de ese cliente. Se debe permitir cambiar la terminal (requiere API que
    //   devuelva varias terminales por cliente; por ahora se usa solo la terminal por defecto).

    const handleGetTerminal = async () => {
        try {
            const response = await obtenerTerminalCliente.getResource<ApiResponse<TerminalClienteInterface>>(
                'porComercializadoraCliente',
                '',
                {
                    codigocomercializadora: user?.codigocomercializadora,
                    codigo: user?.codigo
                }
            );
            if (response.retorno !== null && response.retorno !== undefined) {
                setTerminalCli(response.retorno[0]);
            } else {
                Alert.alert('Error', 'No hay Terminal para mostrar');
            }
        } catch (error) {
            Alert.alert('Error', 'Hubo un problema al obtener la Terminal:. ' + error);
        }
    };

    // Normaliza un ítem de cliente: el API puede devolver codigo en raíz o en clientePK
    const normalizeCliente = (c: TerminalClienteInterface & { clientePK?: { codigo?: string }; nombre?: string }): TerminalClienteInterface => ({
        ...c,
        codigo: c.codigo ?? c.clientePK?.codigo ?? '',
        nombrecomercial: c.nombrecomercial ?? c.nombre ?? '',
    });

    // Nuevo método para obtener todos los clientes (para administradores)
    const handleGetAllClientes = async () => {
        try {
            const response = await obtenerTerminalCliente.getResource<ApiResponse<TerminalClienteInterface>>(
                'porComercializadora',
                '',
                {
                    codigocomercializadora: user?.codigocomercializadora
                }
            );
            if (response.retorno !== null && response.retorno !== undefined) {
                const normalized = response.retorno.map((c: any) => normalizeCliente(c));
                setAllClientes(normalized);
            } else {
                Alert.alert('Error', 'No hay clientes disponibles');
            }
        } catch (error) {
            Alert.alert('Error', 'Hubo un problema al obtener los clientes:. ' + error);
        }
    };

    // Método para manejar la selección de cliente
    const handleSelectCliente = async (cliente: TerminalClienteInterface) => {
        setSelectedCliente(cliente);
        setShowClienteDropdown(false);
        setClienteSearchText('');
        setShowTerminalDropdown(false);

        // Actualizar estados con los datos del cliente seleccionado
        setTerminalCli(cliente);

        // Poblar combo de terminales con la terminal por defecto del cliente (cuando exista API de varias terminales, añadir aquí)
        const def = cliente.codigoterminaldefecto;
        if (def?.codigo && def?.nombre != null) {
            const defaultTerm = { codigo: def.codigo, nombre: def.nombre };
            setTerminalesList([defaultTerm]);
            setSelectedTerminal(defaultTerm);
        } else {
            setTerminalesList([]);
            setSelectedTerminal(null);
        }

        // Cargar productos del cliente seleccionado
        try {
            const response = await ProductoServices.getResource<ApiResponse<ProductoResponseInterface>>(
                'porCliente',
                '',
                {
                    codigocomercializadora: user?.codigocomercializadora,
                    codigocliente: cliente.codigo
                }
            );
            if (response.retorno !== null && response.retorno !== undefined) {
                setProducts(response.retorno);
            } else {
                Alert.alert('Aviso', 'Este cliente no tiene productos disponibles');
                setProducts([]);
            }
        } catch (error) {
            Alert.alert('Error', 'Hubo un problema al obtener los productos del cliente');
        }
    };

    // Al cambiar la terminal en el combo (admin)
    const handleSelectTerminal = (term: { codigo: string; nombre: string }) => {
        setSelectedTerminal(term);
        setShowTerminalDropdown(false);
        setTerminalSearchText('');
        setTerminalName(term.nombre);
        setTerminal((prev) => prev ? { ...prev, codigo: term.codigo, nombre: term.nombre } : {
            codigo: term.codigo,
            nombre: term.nombre,
            activo: true,
            usuarioactual: user?.nombrever ?? '',
            notapedidoList: [],
            clienteList: [],
        });
    };

    // Cargar todas las terminales al abrir el combo (admin). API: ec.com.infinity.modelo.terminal
    const fetchTerminalesPorCliente = async () => {
        if (!selectedCliente) return;
        const defaultTerm = selectedCliente.codigoterminaldefecto;
        const fallbackList = defaultTerm?.codigo != null && defaultTerm?.nombre != null
            ? [{ codigo: defaultTerm.codigo, nombre: defaultTerm.nombre }]
            : [];

        setLoadingTerminales(true);
        try {
            const response = await terminalService.getResource<ApiResponse<Array<{ codigo: string; nombre: string }>>>(
                '',
                '',
                {}
            );
            const list = response?.retorno && Array.isArray(response.retorno)
                ? response.retorno.map((t: any) => ({ codigo: String(t?.codigo ?? ''), nombre: String(t?.nombre ?? '') })).filter((t) => t.codigo)
                : fallbackList;
            const uniq = list.length ? list : fallbackList;
            const seen = new Set<string>();
            const merged = uniq.filter((t) => {
                if (seen.has(t.codigo)) return false;
                seen.add(t.codigo);
                return true;
            });
            setTerminalesList(merged);
        } catch (err) {
            console.error('FT::fetchTerminalesPorCliente', err);
            setTerminalesList(fallbackList);
        } finally {
            setLoadingTerminales(false);
        }
    };

    const handleGetProductos = async () => {
        try {

            //console.error('FT-handleGetProductos-INICIA EL METODO:. Comer:. '+user?.codigocomercializadora
            //    + ' - Clie:. '+ user?.codigo);

            const response = await ProductoServices.getResource<ApiResponse<ProductoResponseInterface>>(
                'porCliente',
                '',
                {
                    codigocomercializadora: user?.codigocomercializadora,
                    codigocliente: user?.codigo
                }
            );
            if (response.retorno !== null && response.retorno !== undefined) {
                setProducts(response.retorno);
            } else {
                Alert.alert('Error', 'No hay Productos para mostrar');
            }
        } catch (error) {
            Alert.alert('Error', 'Hubo un problema al obtener los Productos');
        }
    };

    const handleSelectProduct = (product: ProductoInterface) => {
        setCodProducto(product.codigo);
    }

    // Lista de clientes filtrada por búsqueda (código o nombre)
    const filteredClientes = useMemo(() => {
        const q = (clienteSearchText ?? '').trim().toLowerCase();
        if (!q) return allClientes;
        return allClientes.filter((c) => {
            const cod = (c.codigo ?? '').toLowerCase();
            const nom = (c.nombrecomercial ?? '').toLowerCase();
            return cod.includes(q) || nom.includes(q);
        });
    }, [allClientes, clienteSearchText]);

    const filteredTerminales = useMemo(() => {
        const q = (terminalSearchText ?? '').trim().toLowerCase();
        if (!q) return terminalesList;
        return terminalesList.filter((t) => {
            const cod = (t.codigo ?? '').toLowerCase();
            const nom = (t.nombre ?? '').toLowerCase();
            return cod.includes(q) || nom.includes(q);
        });
    }, [terminalesList, terminalSearchText]);

    //    useEffect(() => {
    //            if (user !== null && user !== undefined) {
    //            handleGetComer();
    //            handleGetTerminal();
    //            handleGetProductos();
    //        }
    //    }, [user]);

    // FT:: 20260202metodo modificado

    useEffect(() => {
        if (!user) return;

        const codigoComer = user?.codigocomercializadora;
        if (!codigoComer || String(codigoComer).trim() === '') {
            setMissingComercializadora(true);
            return;
        }
        setMissingComercializadora(false);

        const isEightDigitUser = user?.codigo ? /^\d{8}$/.test(user.codigo) : false;
        setIsAdmin(!isEightDigitUser);

        const loadInitialData = async () => {
            try {
                await handleGetComer();

                if (!isEightDigitUser) {
                    await handleGetAllClientes();
                } else {
                    await handleGetTerminal();
                    await handleGetProductos();
                }
            } catch (err) {
                console.error(
                    'FT-useEffect-PRINCIPAL::ERROR cargando datos iniciales:',
                    err
                );
                Alert.alert(
                    'Error',
                    'No se pudo cargar la información inicial'
                );
            }
        };

        loadInitialData();
    }, [user]);

    //
    useEffect(() => {
        if (comercializadora !== undefined && comercializadora !== null) {
            setComerName(comercializadora.nombre);
            setCodComer(comercializadora.codigo);
            setCodAbas(comercializadora.codigoabastecedora.codigo);
            setPrefijo(comercializadora.prefijonpe);
        }
    }, [comercializadora])

    // useEffect(() => {
    //     if (terminalCli !== undefined && terminalCli !== null) {
    //         const notaPedidoList: NotaPedidoInterface[] = [];
    //         const clienteList: ClienteInterface[] = [];
    //         const codigoBanco = terminalCli.codigobancodebito.codigo;
    //         const codTerminal = terminalCli.codigoterminaldefecto.codigo;
    //         const cliName = user?.codigo + " - " + terminalCli.nombrecomercial
    //         setTerminal({
    //             codigo: codTerminal,
    //             nombre: terminalCli.nombre,
    //             activo: terminalCli.estado,
    //             usuarioactual: user?.nombrever !== undefined ? user?.nombrever : "",
    //             notapedidoList: notaPedidoList, // Lista de `NotaPedido`
    //             clienteList: clienteList,
    //         });
    //         setCodBank(codigoBanco);
    //         setCliName(cliName);
    //         setTerminalName(terminalCli.codigoterminaldefecto.nombre)
    //     }
    // }, [terminalCli])

    // FT::-METODO MODIFICADO 20260202

    useEffect(() => {
        if (!terminalCli) return;

        try {
            const notaPedidoList: NotaPedidoInterface[] = [];
            const clienteList: ClienteInterface[] = [];

            const codigoBanco = terminalCli.codigobancodebito?.codigo ?? '';
            const terminalDefecto = terminalCli.codigoterminaldefecto;

            if (!terminalDefecto?.codigo) {
                throw new Error('Terminal por defecto no definida');
            }

            // Si es administrador, usar el cliente seleccionado
            const cliName = isAdmin && selectedCliente
                ? `${selectedCliente.codigo} - ${selectedCliente.nombrecomercial}`
                : `${user?.codigo ?? ''} - ${terminalCli.nombrecomercial ?? ''}`;

            setTerminal({
                codigo: terminalDefecto.codigo,
                nombre: terminalCli.nombre ?? '',
                activo: terminalCli.estado ?? false,
                usuarioactual: user?.nombrever ?? '',
                notapedidoList: notaPedidoList,
                clienteList: clienteList,
            });

            setCodBank(codigoBanco);
            setCliName(cliName);
            setTerminalName(terminalDefecto.nombre ?? '');

            //console.error('FT-useEffect-TERMINAL::OK',terminalDefecto.codigo);

        } catch (err) {
            console.error(
                'FT-useEffect-TERMINAL::ERROR procesando terminal',
                err
            );
        }
    }, [terminalCli, user, isAdmin, selectedCliente]);



    useEffect(() => {

        if (products !== undefined && products !== null && products.length > 0) {
            //    console.error('FT::USEEFFECT-products[0]:. '+products[0].clienteproductoPK.codigo+' -cliente:. '+products[0].cliente.clientePK.codigo);
            const codigoCliente = isAdmin && selectedCliente 
                ? selectedCliente.codigo 
                : products[0].cliente.clientePK.codigo || '';
            setCodCli(codigoCliente);
        }
    }, [products, isAdmin, selectedCliente])

    const onLogout = async () => {
        await logout();
        navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }], // 🚀 Lleva al usuario a la pantalla de inicio de sesión
        });
    }

    const handleSubmit = async () => {
        try {
            
            // Validar que se haya seleccionado un cliente si es administrador
            if (isAdmin && !selectedCliente) {
                Alert.alert("Error", "Debe seleccionar un cliente primero");
                return;
            }

            const nowDate = formatDate(new Date());
            const formattedDate = selectedDateDate ? formatDate(selectedDateDate) : '';
            // FTFT. solo es un ejercicio con dato fijo    const formattedDate = nowDate;
            const notaPedidoPk: NotaPedidoPKInterface = {
                codigoabastecedora: codAbas,
                codigocomercializadora: codComer,
                numero: ""
            };

            const notaPedido: NotaPedidoInterface = {
                notapedidoPK: notaPedidoPk,
                fechaventa: nowDate, // Fecha de hoy
                fechadespacho: formattedDate, // Hoy o mañana
                activa: true,
                codigoautotanque: "",
                cedulaconductor: "",
                numerofacturasri: "0",
                respuestageneracionoeepp: "",
                observacion: "",
                adelantar: false,
                procesar: false,
                respuestaanulacionoeepp: "",
                tramaenviadagoe: "",
                tramarenviadaaoe: "",
                tramarecibidagoe: "",
                tramarecibidaaoe: "",
                usuarioactual: user?.nombrever || "",
                prefijo: prefijo,
                //codigocliente: { codigo: codCli },
                codigoclienteId: codCli,
                codigoterminal: { codigo: terminal?.codigo || "" },
                codigobanco: { codigo: codBank },
                comercializadora: { codigo: codComer },
                abastecedora: { codigo: codAbas }
            };

            const detalleNotaPedidoPk: DetalleNotaPedidoPKInterface = {
                codigoabastecedora: codAbas,
                codigocomercializadora: codComer,
                numero: "",
                codigoproducto: codProducto,
                codigomedida: codProducto.startsWith("03") ? "03" : "01" // Validación medida
            };

            const detalleNotaPedido: DetalleNotaPedidoInterface = {
                detallenotapedidoPK: detalleNotaPedidoPk,
                volumennaturalrequerido: cantidad,
                volumennaturalautorizado: cantidad,
                usuarioactual: user?.nombrever || "",
                medida: { codigo: detalleNotaPedidoPk.codigomedida },
                producto: { codigo: codProducto },
                compartimento1: 0,
                compartimento2: 0,
                compartimento3: 0,
                compartimento4: 0,
                compartimento5: 0,
                compartimento6: 0,
                compartimento7: 0,
                compartimento8: 0,
                compartimento9: 0,
                compartimento10: 0,
                selloinicial: 0,
                sellofinal: 0
            };

            const envioNP: EnvioNotaPedidoInterface = {
                notapedido: notaPedido,
                detalle: detalleNotaPedido
            };
            if (selectedDate !== null) {
                if (codProducto !== '' && codProducto !== null) {
                    if (cantidad !== 0 && cantidad !== null) {
                        const response = await crearNotaPedido.postNotaPedido<ApiResponse<any>>(envioNP);
                        if (response !== undefined && response !== null) {
                            setNpNumber(response.developerMessage);
                            Alert.alert("Éxito", "Su Pedido se ha registrado");
                        }
                    } else {
                        Alert.alert("Error", "Ingrese una cantidad");
                    }
                } else {
                    Alert.alert("Error", "Seleccione un producto, por favor");
                }
            } else {
                Alert.alert("Error", "Seleccione el día de despacho, por favor");
            }
        } catch (error) {
            console.error("Error al enviar la solicitud:", error);
            Alert.alert("Error", "No se pudo conectar con el servidor:. " + error);
        }
    };


    return (
        <ScreenWrapper>
            <View style={styles.mainContainer}>
                {/* Header Navbar */}
                <View style={styles.headerNavbar}>
                    <TouchableOpacity onPress={() => navigation.navigate('MenuOperativo')} style={styles.navButton}>
                        <Icon name="arrow-back-outline" size={28} color="#6B7280" />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Image
                            source={require('../../../assets/logo.png')}
                            style={styles.headerLogo}
                            resizeMode="contain"
                        />
                        <Text style={styles.headerSubtitle}>GENERAR PEDIDO</Text>
                    </View>
                    <TouchableOpacity onPress={() => navigation.navigate('ListaNotaPedido')} style={styles.navButton}>
                        <Icon name="eye-outline" size={28} color="#6B7280" />
                    </TouchableOpacity>
                </View>

                {/* Content Scrollable Area */}
                <ScrollView>
                    <Layout style={styles.contentContainer}>

                        {missingComercializadora ? (
                            <View style={styles.missingComercializadoraContainer}>
                                <View style={[styles.iconCircle, styles.missingComercializadoraIcon]}>
                                    <Icon name="alert-circle-outline" size={48} color="#F59E0B" />
                                </View>
                                <Text style={styles.missingComercializadoraTitle}>
                                    Sin comercializadora asignada
                                </Text>
                                <Text style={styles.missingComercializadoraText}>
                                    Su usuario no tiene una comercializadora asignada. No podrá generar ni revisar pedidos hasta que un administrador le asigne una.
                                </Text>
                                <Text style={styles.missingComercializadoraSubtext}>
                                    Contacte al administrador del sistema.
                                </Text>
                                <TouchableOpacity
                                    style={styles.backToMenuButton}
                                    onPress={() => navigation.navigate('MenuOperativo')}
                                >
                                    <Text style={styles.backToMenuButtonText}>Volver al menú</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <>
                        {/* Selector de Cliente (Solo para administradores) */}
                        {isAdmin && (
                            <>
                                <Text style={styles.sectionTitle}>SELECCIONE UN CLIENTE</Text>
                                <TouchableOpacity
                                    style={styles.clienteSelectorButton}
                                    onPress={() => {
                                        setShowTerminalDropdown(false);
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
                                                    : 'Seleccione un cliente...'}
                                            </Text>
                                        </View>
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
                                                        onPress={() => handleSelectCliente(cliente)}
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

                                {/* Combo Terminal (admin): se puebla con la terminal del cliente; se puede cambiar */}
                                <Text style={styles.sectionTitle}>TERMINAL</Text>
                                <TouchableOpacity
                                    style={[styles.clienteSelectorButton, (!selectedCliente || loadingTerminales) && styles.clienteSelectorButtonDisabled]}
                                    onPress={async () => {
                                        if (!selectedCliente) return;
                                        setShowClienteDropdown(false);
                                        if (!showTerminalDropdown) {
                                            setTerminalSearchText('');
                                            setShowTerminalDropdown(true);
                                            setLoadingTerminales(true);
                                            await fetchTerminalesPorCliente();
                                        } else {
                                            setShowTerminalDropdown(false);
                                        }
                                    }}
                                    disabled={!selectedCliente || loadingTerminales}
                                >
                                    <View style={styles.clienteSelectorContent}>
                                        <View style={[styles.iconCircle, { backgroundColor: '#E0E7FF' }]}>
                                            <Icon name="business-outline" size={20} color="#3B82F6" />
                                        </View>
                                        <View style={styles.clienteSelectorText}>
                                            <Text style={styles.infoLabel}>TERMINAL</Text>
                                            <Text style={styles.infoValue}>
                                                {loadingTerminales
                                                    ? 'Cargando terminales...'
                                                    : selectedTerminal
                                                        ? `${selectedTerminal.codigo} - ${selectedTerminal.nombre}`
                                                        : selectedCliente
                                                            ? 'Seleccione terminal...'
                                                            : 'Seleccione un cliente primero'}
                                            </Text>
                                        </View>
                                        <Icon
                                            name={showTerminalDropdown ? 'chevron-up' : 'chevron-down'}
                                            size={24}
                                            color="#9CA3AF"
                                        />
                                    </View>
                                </TouchableOpacity>

                                {showTerminalDropdown && (
                                    <View style={styles.clienteDropdown}>
                                        {loadingTerminales ? (
                                            <View style={styles.clienteDropdownLoading}>
                                                <Text style={styles.clienteDropdownLoadingText}>Cargando terminales...</Text>
                                            </View>
                                        ) : (
                                            <>
                                                {terminalesList.length > 0 && (
                                                    <View style={styles.clienteSearchWrapper}>
                                                        <Icon name="search" size={20} color="#9CA3AF" style={styles.clienteSearchIcon} />
                                                        <Input
                                                            style={styles.clienteSearchInput}
                                                            placeholder="Buscar por código o nombre..."
                                                            value={terminalSearchText}
                                                            onChangeText={setTerminalSearchText}
                                                            autoCapitalize="none"
                                                            autoCorrect={false}
                                                        />
                                                    </View>
                                                )}
                                                {terminalesList.length === 0 ? (
                                                    <View style={styles.clienteDropdownLoading}>
                                                        <Text style={styles.clienteDropdownLoadingText}>No hay terminales disponibles</Text>
                                                    </View>
                                                ) : (
                                                    <ScrollView style={styles.clienteDropdownScroll} nestedScrollEnabled={true} keyboardShouldPersistTaps="handled">
                                                        {filteredTerminales.length === 0 ? (
                                                            <View style={styles.clienteDropdownLoading}>
                                                                <Text style={styles.clienteDropdownLoadingText}>
                                                                    {terminalSearchText.trim() ? 'No hay terminales que coincidan' : 'No hay terminales'}
                                                                </Text>
                                                            </View>
                                                        ) : (
                                                            filteredTerminales.map((term, index) => (
                                                                <TouchableOpacity
                                                                    key={term.codigo ?? index}
                                                                    style={[
                                                                        styles.clienteDropdownItem,
                                                                        selectedTerminal?.codigo === term.codigo && styles.clienteDropdownItemSelected
                                                                    ]}
                                                                    onPress={() => handleSelectTerminal(term)}
                                                                >
                                                                    <Text style={styles.clienteDropdownItemText}>
                                                                        {term.codigo} - {term.nombre}
                                                                    </Text>
                                                                </TouchableOpacity>
                                                            ))
                                                        )}
                                                    </ScrollView>
                                                )}
                                            </>
                                        )}
                                    </View>
                                )}
                            </>
                        )}

                        {/* Cliente y Terminal (solo usuario 8 dígitos): filas fijas de solo lectura */}
                        {!isAdmin && (
                            <>
                                <View style={[styles.infoRow, styles.infoRowClienteTerminalSpacing]}>
                                    <View style={[styles.iconCircle, { backgroundColor: '#E0E7FF' }]}>
                                        <Icon name="person" size={20} color="#3B82F6" />
                                    </View>
                                    <View style={styles.infoTextContainer}>
                                        <Text style={styles.infoLabel}>CLIENTE</Text>
                                        <Text style={styles.infoValue}>{cliName || 'CARGANDO...'}</Text>
                                    </View>
                                </View>
                                <View style={styles.infoRow}>
                                    <View style={[styles.iconCircle, { backgroundColor: '#E0E7FF' }]}>
                                        <Icon name="business" size={20} color="#3B82F6" />
                                    </View>
                                    <View style={styles.infoTextContainer}>
                                        <Text style={styles.infoLabel}>TERMINAL</Text>
                                        <Text style={styles.infoValue}>{terminalName || 'CARGANDO...'}</Text>
                                    </View>
                                </View>
                            </>
                        )}

                        {/* Date Selection */}
                        <Text style={styles.sectionTitle}>¿CUÁNDO RETIRARÁ SU PEDIDO?</Text>
                        <View style={styles.dateToggleContainer}>
                            <TouchableOpacity
                                style={[styles.dateOption, selectedDate === 'hoy' && styles.dateOptionActive]}
                                onPress={setCurrentDate}
                            >
                                <Text style={[styles.dateOptionText, selectedDate === 'hoy' && styles.dateOptionTextActive]}>Hoy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.dateOption, selectedDate === 'manana' && styles.dateOptionActive]}
                                onPress={setTomorrowDate}
                            >
                                <Text style={[styles.dateOptionText, selectedDate === 'manana' && styles.dateOptionTextActive]}>Mañana</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Dispatch Date Display */}
                        <Text style={styles.sectionTitle}>SE DESPACHARÁ:</Text>
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputText}>
                                {selectedDateDate ? new Date(selectedDateDate).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Seleccione una fecha'}
                            </Text>
                            <Icon name="bus-outline" size={20} color="#9CA3AF" />
                        </View>

                        {/* Product Selection */}
                        <Text style={styles.sectionTitle}>SELECCIONE UN PRODUCTO</Text>
                        <View style={styles.productsContainer}>
                            {products && products.length > 0 ? (
                                products.map((product, index) => {
                                    const isSelected = codProducto === product.producto.codigo;
                                    return (
                                        <TouchableOpacity
                                            key={index}
                                            style={[styles.productChip, isSelected && styles.productChipActive]}
                                            onPress={() => handleSelectProduct(product.producto)}
                                        >
                                            <Text style={[styles.productChipText, isSelected && styles.productChipTextActive]}>
                                                {product.producto.nombre}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })
                            ) : (
                                <Text style={styles.placeholderText}>Cargando productos...</Text>
                            )}
                        </View>

                        {/* Volume Input */}
                        <Text style={styles.sectionTitle}>VOLUMEN REQUERIDO (GALONES)</Text>
                        <View style={styles.volumeInputWrapper}>
                            <View style={styles.volumeIconContainer}>
                                <Icon name="remove-outline" size={24} color="#374151" />
                            </View>
                            <Input
                                style={styles.volumeInput}
                                textStyle={styles.volumeInputText}
                                placeholder="0"
                                placeholderTextColor="#9CA3AF"
                                keyboardType="numeric"
                                value={cantidad === 0 ? '' : cantidad.toString()}
                                onChangeText={(text) => setCantidad(Number(text.replace(/[^0-9]/g, "")))}
                                status='basic'
                            />
                        </View>

                        {/* Summary Section */}
                        <View style={styles.summaryContainer}>
                            <Text style={styles.summaryLabel}>RESUMEN DE PEDIDO</Text>
                            <Text style={styles.summaryVolume}>
                                {cantidad} <Text style={styles.summaryUnit}>Galones</Text>
                            </Text>
                            <Text style={styles.summaryProduct}>
                                {products?.find(p => p.producto.codigo === codProducto)?.producto.nombre || 'Seleccione producto'}
                            </Text>
                        </View>

                        {/* Action Buttons */}
                        <Button
                            style={styles.mainButton}
                            size='giant'
                            onPress={handleSubmit}
                        >
                            {(evaProps: any) => <Text {...evaProps} style={styles.mainButtonText}>Generar Pedido</Text>}
                        </Button>

                        <TouchableOpacity onPress={() => console.log("Cancelar Nota de Pedido")} style={styles.cancelButton}>
                            <Text style={styles.cancelButtonText}>Cancelar</Text>
                        </TouchableOpacity>

                        {/* Footer Logo */}
                        <View style={styles.footerContainer}>
                            <Text style={styles.footerText}>POWERED BY</Text>
                            <Image
                                source={require('../../../assets/logoinfinity.png')}
                                style={styles.footerLogoImage}
                                resizeMode="contain"
                            />
                        </View>

                            </>
                        )}
                    </Layout>
                </ScrollView >
            </View >
        </ScreenWrapper >
    );
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    headerNavbar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 20,
        backgroundColor: '#FFFFFF',
    },
    navButton: {
        padding: 5,
    },
    headerTitleContainer: {
        alignItems: 'center',
    },
    headerLogo: {
        width: 120,
        height: 35,
    },
    headerSubtitle: {
        fontSize: 10,
        fontWeight: '600',
        color: '#9CA3AF',
        marginTop: 2,
        letterSpacing: 1,
    },
    contentContainer: {
        paddingHorizontal: 20,
        backgroundColor: '#FFFFFF',
    },
    missingComercializadoraContainer: {
        paddingVertical: 40,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    missingComercializadoraIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FEF3C7',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    missingComercializadoraTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 12,
        textAlign: 'center',
    },
    missingComercializadoraText: {
        fontSize: 15,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 8,
    },
    missingComercializadoraSubtext: {
        fontSize: 14,
        color: '#9CA3AF',
        textAlign: 'center',
        marginBottom: 28,
    },
    backToMenuButton: {
        backgroundColor: '#E5E7EB',
        paddingVertical: 14,
        paddingHorizontal: 28,
        borderRadius: 12,
    },
    backToMenuButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
    },
    infoCard: {
        backgroundColor: '#F3F4F6', // Light gray background
        borderRadius: 20,
        padding: 20,
        marginBottom: 25,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoRowClienteTerminalSpacing: {
        marginBottom: 16,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#DBEAFE', // Light blue bg
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    infoTextContainer: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#9CA3AF',
        marginBottom: 2,
        letterSpacing: 0.5,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1F2937',
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 15,
        marginLeft: 55, // Align with text
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: '#9CA3AF',
        marginBottom: 10,
        marginTop: 7,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    dateToggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        borderRadius: 16,
        padding: 4,
        marginBottom: 25,
        height: 50,
    },
    dateOption: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 14,
    },
    dateOptionActive: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    dateOptionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    dateOptionTextActive: {
        color: '#111827',
        fontWeight: 'bold',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 16,
        paddingHorizontal: 20,
        height: 56,
        marginBottom: 25,
        backgroundColor: '#FFFFFF',
    },
    inputText: {
        fontSize: 14,
        color: '#374151',
    },
    productsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 25,
        gap: 10,
    },
    productChip: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#FFFFFF',
        marginRight: 8,
        marginBottom: 8,
    },
    productChipActive: {
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
    },
    productChipText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#6B7280',
    },
    productChipTextActive: {
        color: '#FFFFFF',
    },
    placeholderText: {
        color: '#9CA3AF',
        fontSize: 14,
    },
    volumeInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 16,
        height: 64,
        marginBottom: 30,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 15,
    },
    volumeIconContainer: {
        width: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    volumeInput: {
        flex: 1,
        backgroundColor: 'transparent',
        borderWidth: 0,
        borderColor: 'transparent',
    },
    volumeInputText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
        textAlign: 'right', // Align numbers to right as per typical financial/qty inputs or match image style
    },
    summaryContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    summaryLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#9CA3AF',
        marginBottom: 5,
        letterSpacing: 1,
    },
    summaryVolume: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 4,
    },
    summaryUnit: {
        fontSize: 18,
        fontWeight: '500',
        color: '#6B7280',
    },
    summaryProduct: {
        fontSize: 16,
        fontWeight: '600',
        color: '#3B82F6',
    },
    mainButton: {
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
        borderRadius: 16,
        paddingVertical: 15,
        marginBottom: 15,
        elevation: 3,
        shadowColor: '#3B82F6',
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 10,
    },
    mainButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
    },
    cancelButton: {
        alignItems: 'center',
        paddingVertical: 10,
        marginBottom: 20,
    },
    cancelButtonText: {
        fontSize: 16,
        color: '#9CA3AF',
        fontWeight: '500',
    },
    footerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    footerText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#D1D5DB',
        marginRight: 6,
    },
    footerLogoImage: {
        width: 80,
        height: 20,
        opacity: 0.6,
    },
    // Estilos para selector de cliente (administrador)
    clienteSelectorButton: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    clienteSelectorButtonDisabled: {
        backgroundColor: '#F9FAFB',
        opacity: 0.8,
    },
    clienteSelectorContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
    },
    clienteSelectorText: {
        flex: 1,
        marginLeft: 15,
    },
    clienteDropdown: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        marginBottom: 20,
        maxHeight: 300,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    clienteSearchWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    clienteSearchIcon: {
        marginRight: 8,
    },
    clienteSearchInput: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        borderWidth: 0,
        minHeight: 40,
    },
    clienteDropdownScroll: {
        maxHeight: 240,
    },
    clienteDropdownLoading: {
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    clienteDropdownLoadingText: {
        fontSize: 14,
        color: '#6B7280',
    },
    clienteDropdownItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    clienteDropdownItemSelected: {
        backgroundColor: '#E0F2FE',
    },
    clienteDropdownItemText: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '500',
    },
});
