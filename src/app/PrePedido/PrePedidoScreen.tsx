import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Button, Input, Layout, Text, useTheme } from '@ui-kitten/components';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, TouchableOpacity, View, Image, ScrollView, TextInput } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import ScreenWrapper from '../../components/ScreenWrapper';
import { useUser } from '../../hooks';
import obtenerComercializadoraCliente from '../../services/Comercializadora/comercializadoraServices';
import { crearNotaPedido } from '../../services/NotaPedido/notaPedidoServices';
import { crearPrePedido } from '../../services/PrePedido/prePedidoServices';
import ProductoServices from '../../services/Producto/productoServices';
import obtenerTerminalCliente from '../../services/Terminal/teminalService';
import terminalService from '../../services/Terminal/terminalService';
import { factorCorreccionService } from '../../services';

import { ApiResponse, ClienteInterface, ComercializadoraInterface, DetalleNotaPedidoInterface, DetalleNotaPedidoPKInterface, EnvioNotaPedidoInterface, EnvioPrePedidoInterface, FactorCorreccionInterface, NotaPedidoInterface, NotaPedidoPKInterface, ProductoInterface, ProductoResponseInterface, TerminalClienteInterface, TerminalInterface } from '../../types';

import { RootStackParamList } from '../../types/navigation';
import { StyleSheet } from 'react-native';
import BrandLogo from '../../components/BrandLogo';
import AppHeader from '../../components/AppHeader';
//import { Icon } from '@ui-kitten/components';
import { PRE_PEDIDO_MODULE_NAME } from '../../config/constants';
type NavigationProps = StackNavigationProp<RootStackParamList, 'Login'>;

export default function PrePedidoScreen() {
    const [cantidadExtra, setCantidadExtra] = useState<number>(0);
    const [cantidadSuper, setCantidadSuper] = useState<number>(0);
    const [cantidadDiesel, setCantidadDiesel] = useState<number>(0);
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
    const [claveWsepp, setClaveWsepp] = useState<string>('');
    const [establecimientoFac, setEstablecimientoFac] = useState<string>('');
    const [puntoVentaFac, setPuntoVentaFac] = useState<string>('');
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

    // Factor de corrección
    const [factores, setFactores] = useState<FactorCorreccionInterface[]>([]);

    const productExtra = { codigo: "9901", nombre: "EXTRA" };
    const productSuper = { codigo: "9903", nombre: "SUPER" };
    const productDiesel = { codigo: "9904", nombre: "DIESEL" };

    const extraLabel = productExtra.nombre;
    const superLabel = productSuper.nombre;
    const dieselLabel = productDiesel.nombre;

    // Sin comercializadora asignada: no se hacen llamadas al API
    const [missingComercializadora, setMissingComercializadora] = useState<boolean>(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Estado para modal de Petroecuador
    const [petroModal, setPetroModal] = useState({
        visible: false,
        type: 'success' as 'success' | 'error' | 'warning',
        title: '',
        message: ''
    });





    // Función para obtener la fecha en formato "YYYY-MM-DDTHH:mm:ssZ"
    const formatDate = (date: Date): string => {
        return date.toISOString().split('.')[0] + 'Z'; // Devuelve el formato ISO con "Z" sin milisegundos
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
        // FT:: 20260511 CONTROL PARA COMER=0002 CLIENTE.FORMAPAGO=03(GD) FECHAAUTORIZACION >= FECHAACTUAL(NP.FECHAVENTA) 
        // VALIDACIÓN
        const pysGDValido = true;
        /*
            cliente != null &&
            codComer?.toUpperCase() === '0002' &&
            cliente.codigoformapago != null &&
            cliente.codigoformapago.codigo?.toUpperCase() === '03' &&
            cliente.fehavencimientocontrato != null &&
            new Date() < new Date(cliente.fehavencimientocontrato);
        */

        // SI NO CUMPLE -> ERROR Y SALIR
        if (!pysGDValido) {
            Alert.alert(
                'Error',
                'Este cliente NO puede realizar pedidos!'
            );
            return;
        }

        // SOLO CONTINUA SI PYSGDVALIDO==TRUE
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

    // handleSelectProduct removed since selection is input-based

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

    // Cargar factores de corrección
    useEffect(() => {
        const fetchFactores = async () => {
            if (!user?.codigocomercializadora) return;
            try {
                const response = await factorCorreccionService.getResource<ApiResponse<FactorCorreccionInterface>>(
                    'ec.com.infinity.modelo.factorcorreccion/factoractual',
                    '',
                    { codigocomercializadora: user.codigocomercializadora }
                );
                if (response?.retorno) {
                    setFactores(response.retorno);
                }
            } catch (error) {
                console.error('Error al cargar factores:', error);
            }
        };
        fetchFactores();
    }, [user?.codigocomercializadora]);

    const getVolumen60F = (productCode: string, qty: number) => {
        if (isAdmin) {
            return qty;
        }
        if (!productCode || !terminal?.codigo || qty === 0) {
            return qty;
        }
        const factorObj = factores.find(f =>
            f.factorcorreccionPK.codigoproducto === productCode &&
            f.factorcorreccionPK.codigoterminal === terminal.codigo
        );
        if (factorObj) {
            return Number((qty * factorObj.factor).toFixed(2));
        }
        return 0;
    };

    const volumen60FExtra = useMemo(() => getVolumen60F(productExtra?.codigo || '', cantidadExtra), [cantidadExtra, productExtra, terminal, factores, isAdmin]);
    const volumen60FSuper = useMemo(() => getVolumen60F(productSuper?.codigo || '', cantidadSuper), [cantidadSuper, productSuper, terminal, factores, isAdmin]);
    const volumen60FDiesel = useMemo(() => getVolumen60F(productDiesel?.codigo || '', cantidadDiesel), [cantidadDiesel, productDiesel, terminal, factores, isAdmin]);

    const totalVolumen60F = useMemo(() => Number((volumen60FExtra + volumen60FSuper + volumen60FDiesel).toFixed(2)), [volumen60FExtra, volumen60FSuper, volumen60FDiesel]);


    //
    useEffect(() => {
        if (comercializadora !== undefined && comercializadora !== null) {
            setComerName(comercializadora.nombre);
            setCodComer(comercializadora.codigo);
            setCodAbas(comercializadora.codigoabastecedora.codigo);
            setPrefijo(comercializadora.prefijonpe);
            setClaveWsepp(comercializadora.clavewsepp);
            setEstablecimientoFac(comercializadora.establecimientofac);
            setPuntoVentaFac(comercializadora.puntoventafac);
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
        setCantidadExtra(0);
        setCantidadSuper(0);
        setCantidadDiesel(0);

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

            if (selectedDate === null) {
                Alert.alert("Error", "Seleccione el día de despacho, por favor");
                return;
            }

            const activeItems = [];
            if (cantidadExtra > 0) {
                activeItems.push({ product: productExtra, qty: cantidadExtra });
            }
            if (cantidadSuper > 0) {
                activeItems.push({ product: productSuper, qty: cantidadSuper });
            }
            if (cantidadDiesel > 0) {
                activeItems.push({ product: productDiesel, qty: cantidadDiesel });
            }

            if (activeItems.length === 0) {
                Alert.alert("Error", "Ingrese una cantidad para al menos un producto.");
                return;
            }

            if (!isAdmin) {
                for (const item of activeItems) {
                    const factorObj = factores.find(f =>
                        f.factorcorreccionPK.codigoproducto === item.product.codigo &&
                        f.factorcorreccionPK.codigoterminal === terminal?.codigo
                    );
                    if (!factorObj) {
                        Alert.alert("Error", `No existe un factor de corrección vigente para el producto ${item.product.nombre} y terminal seleccionados.`);
                        return;
                    }
                }
            }

            const generatedNumbers: string[] = [];
            let petroModalData: {
                type: 'success' | 'error' | 'warning';
                title: string;
                message: string;
            } | null = null;

            const nowDate = formatDate(new Date());
            const formattedDate = selectedDateDate ? formatDate(selectedDateDate) : '';
            const prepedidoPK = {
                codigoabastecedora: codAbas,
                codigocomercializadora: codComer,
                numero: ""
            };

            const prepedido = {
                prepedidoPK: prepedidoPK,
                fechaventa: nowDate,
                fechadespacho: formattedDate,
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
                facturada: "NO",
                codigoclienteId: codCli,
                codigocliente: (() => {
                    if (terminalCli) {
                        const { codigo, codigocomercializadora, ...rest } = terminalCli as any;
                        return {
                            ...rest,
                            clientePK: { codigo: codCli, codigocomercializadora: codComer }
                        };
                    }
                    return { clientePK: { codigo: codCli, codigocomercializadora: codComer } };
                })(),
                codigoterminal: { codigo: terminal?.codigo || "", nombre: terminal?.nombre || "" },
                codigobanco: { codigo: codBank },
                comercializadora: comercializadora ? {
                    ...comercializadora,
                    codigo: codComer,
                    clavewsepp: claveWsepp,
                    establecimientofac: establecimientoFac,
                    puntoventafac: puntoVentaFac,
                    codigoabastecedora: { codigo: codAbas }
                } : {
                    codigo: codComer,
                    clavewsepp: claveWsepp,
                    establecimientofac: establecimientoFac,
                    puntoventafac: puntoVentaFac,
                    codigoabastecedora: { codigo: codAbas }
                },
                abastecedora: { codigo: codAbas }
            };

            const detalleList = activeItems.map(item => {
                const currentCodProducto = item.product.codigo;
                const currentVolumen60F = getVolumen60F(currentCodProducto, item.qty);

                return {
                    detalleprepedidoPK: {
                        codigoabastecedora: codAbas,
                        codigocomercializadora: codComer,
                        numero: "",
                        codigoproducto: currentCodProducto,
                        codigomedida: currentCodProducto === "9904" ? "03" : "01"
                    },
                    volumennaturalrequerido: currentVolumen60F,
                    volumennaturalautorizado: currentVolumen60F,
                    usuarioactual: user?.nombrever || "",
                    activo: true,
                    autorizado: "NO",
                    numeronp: "0",
                    medida: { codigo: currentCodProducto === "9904" ? "03" : "01" },
                    producto: { codigo: currentCodProducto },
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
            });

            const envioPrePedido: EnvioPrePedidoInterface = {
                prepedido: prepedido,
                detalle: detalleList
            };

            console.log("PAYLOAD ENVIADO AL BACKEND:", JSON.stringify(envioPrePedido, null, 2));

            let response: ApiResponse<any>;
            // Siempre utilizamos postPrePedido ya que el JSON proporcionado por el usuario
            // especifica la URL base /ec.com.infinity.modelo.prepedido y no crearyenviar.
            response = await crearPrePedido.postPrePedido<ApiResponse<any>>(envioPrePedido);

            if (response !== undefined && response !== null) {
                let resultNumber = response.retorno && response.retorno.length > 0
                    ? response.retorno[0].prepedidoPK.numero
                    : response.developerMessage || "";

                if (resultNumber.includes(';')) {
                    resultNumber = resultNumber.split(';')[0];
                }

                generatedNumbers.push(resultNumber);

                if (comercializadora?.generapedidodirecto && (user?.niveloperacion === 'ADMIN' || isAdmin)) {
                    try {
                        const devMsg = response.developerMessage || "";

                        if (devMsg && devMsg.includes(';')) {
                            const [numero, trama] = devMsg.split(';');

                            const petroRes = await crearPrePedido.enviarPetroecuador<any>({
                                codigoabastecedora: codAbas,
                                codigocomercializadora: codComer,
                                numero: numero,
                                cadena: trama
                            });

                            const successCodes = ["00", "20"];
                            const rawMsg = Array.isArray(petroRes?.retorno) && petroRes.retorno.length > 0
                                ? petroRes.retorno[0]
                                : (typeof petroRes?.retorno === 'string' ? petroRes.retorno : '');

                            const msgCode = (typeof rawMsg === 'string') ? rawMsg.substring(0, 2) : "";
                            const isSuccessful = successCodes.includes(String(petroRes?.statusCode)) ||
                                ((petroRes?.statusCode === "200" || petroRes?.statusCode === 200) && successCodes.includes(msgCode));

                            if (isSuccessful) {
                                petroModalData = {
                                    type: 'success',
                                    title: '¡Éxito Petroecuador!',
                                    message: msgCode + ' La orden fue transmitida correctamente.'
                                };
                            } else {
                                petroModalData = {
                                    type: 'warning',
                                    title: 'Aviso Petroecuador',
                                    message: msgCode || `Status: ${petroRes?.statusCode}. ${petroRes?.developerMessage || 'Sin mensaje'}`
                                };
                            }
                        } else {
                            petroModalData = {
                                type: 'error',
                                title: 'Error de Envío',
                                message: 'El pedido se creó localmente, pero no se pudo enviar a Petroecuador porque faltan datos de despacho.'
                            };
                        }
                    } catch (petroErr: any) {
                        petroModalData = {
                            type: 'error',
                            title: 'Error Petroecuador',
                            message: `Fallo de red o servicio externo: ${petroErr.message}`
                        };
                    }
                }
            }

            if (generatedNumbers.length > 0) {
                const numbersStr = generatedNumbers.join(', ');
                setNpNumber(numbersStr);

                // Clear inputs
                setCantidadExtra(0);
                setCantidadSuper(0);
                setCantidadDiesel(0);

                if (petroModalData) {
                    setPetroModal({
                        visible: true,
                        type: petroModalData.type,
                        title: petroModalData.title,
                        message: `prepedido creado exitosamente y el numero de prepedido: ${numbersStr}.\n${petroModalData.message}`
                    });
                } else {
                    setShowSuccessModal(true);
                }
            }
        } catch (error: any) {
            console.error("Error al enviar la solicitud:", error);
            const errBody = error.response?.data ? JSON.stringify(error.response.data) : error.message;
            Alert.alert("Error del Backend (400/500)", errBody);
        }
    };


    return (
        <ScreenWrapper>
            <View style={styles.mainContainer}>
                <AppHeader
                    codigoComercializadora={user?.codigocomercializadora || ''}
                    title={PRE_PEDIDO_MODULE_NAME.toUpperCase()}
                    onBackPress={() => navigation.goBack()}
                    rightElement={
                        <TouchableOpacity
                            onPress={() => {
                                if (isAdmin && selectedCliente) {
                                    navigation.navigate('ListaPrePedido', {
                                        codigocliente: selectedCliente.codigo,
                                        nombreCliente: selectedCliente.nombrecomercial || selectedCliente.nombre
                                    });
                                } else {
                                    navigation.navigate('ListaPrePedido', {});
                                }
                            }}
                        >
                            <Icon name="eye-outline" size={28} color="#9CA3AF" />
                        </TouchableOpacity>
                    }
                />





                {/* Content Scrollable Area */}
                <ScrollView>
                    <Layout style={styles.contentContainer}>
                        {/* Sección de Saludo */}
                        <View style={styles.greetingSection}>
                            <Text style={styles.greetingTitle}>
                                Hola, {user?.nombre || 'Usuario'}
                            </Text>
                            <Text style={styles.greetingSubtitle}>Completa la información para generar tu {PRE_PEDIDO_MODULE_NAME.toLowerCase()}.</Text>
                        </View>
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

                                {/* Ingresar Cantidad de Producto (3 inputs) */}
                                <Text style={styles.sectionTitle}>INGRESAR CANTIDAD DE PRODUCTO</Text>

                                <View style={styles.productInputCard}>
                                    <Text style={styles.productInputLabel}>{extraLabel}</Text>
                                    <View style={styles.productTextInputWrapper}>
                                        <TextInput
                                            style={styles.productTextInput}
                                            keyboardType="numeric"
                                            value={cantidadExtra.toString()}
                                            onChangeText={(text) => {
                                                const cleaned = text.replace(/[^0-9]/g, "");
                                                setCantidadExtra(cleaned === '' ? 0 : Number(cleaned));
                                            }}
                                            selectTextOnFocus={true}
                                        />
                                    </View>
                                </View>

                                <View style={styles.productInputCard}>
                                    <Text style={styles.productInputLabel}>{superLabel}</Text>
                                    <View style={styles.productTextInputWrapper}>
                                        <TextInput
                                            style={styles.productTextInput}
                                            keyboardType="numeric"
                                            value={cantidadSuper.toString()}
                                            onChangeText={(text) => {
                                                const cleaned = text.replace(/[^0-9]/g, "");
                                                setCantidadSuper(cleaned === '' ? 0 : Number(cleaned));
                                            }}
                                            selectTextOnFocus={true}
                                        />
                                    </View>
                                </View>

                                <View style={styles.productInputCard}>
                                    <Text style={styles.productInputLabel}>{dieselLabel}</Text>
                                    <View style={styles.productTextInputWrapper}>
                                        <TextInput
                                            style={styles.productTextInput}
                                            keyboardType="numeric"
                                            value={cantidadDiesel.toString()}
                                            onChangeText={(text) => {
                                                const cleaned = text.replace(/[^0-9]/g, "");
                                                setCantidadDiesel(cleaned === '' ? 0 : Number(cleaned));
                                            }}
                                            selectTextOnFocus={true}
                                        />
                                    </View>
                                </View>

                                {/* Summary Section */}
                                <View style={styles.summaryContainer}>
                                    <Text style={styles.summaryLabel}>RESUMEN DE PEDIDO</Text>
                                    <Text style={styles.summaryVolume}>
                                        {totalVolumen60F} <Text style={styles.summaryUnit}>Galones a 60°F</Text>
                                    </Text>
                                    {cantidadExtra > 0 && (
                                        <Text style={styles.summaryProduct}>
                                            {extraLabel}: {volumen60FExtra} Gal.
                                        </Text>
                                    )}
                                    {cantidadSuper > 0 && (
                                        <Text style={styles.summaryProduct}>
                                            {superLabel}: {volumen60FSuper} Gal.
                                        </Text>
                                    )}
                                    {cantidadDiesel > 0 && (
                                        <Text style={styles.summaryProduct}>
                                            {dieselLabel}: {volumen60FDiesel} Gal.
                                        </Text>
                                    )}
                                </View>

                                {/* Action Buttons */}
                                <Button
                                    style={styles.mainButton}
                                    size='giant'
                                    onPress={handleSubmit}
                                >
                                    {(evaProps: any) => <Text {...evaProps} style={styles.mainButtonText}>{PRE_PEDIDO_MODULE_NAME}</Text>}
                                </Button>

                                <TouchableOpacity onPress={() => console.log("Cancelar Nota de Pedido")} style={styles.cancelButton}>
                                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                                </TouchableOpacity>



                            </>
                        )}
                    </Layout>
                </ScrollView>
            </View>

            {/* Modal de Éxito Custom (más profesional) */}
            {showSuccessModal && (
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.successIconCircle}>
                            <Icon name="checkmark" size={40} color="#FFFFFF" />
                        </View>
                        <Text style={styles.modalTitle}>Pedido registrado</Text>
                        <Text style={styles.modalMessage}>prepedido creado exitosamente y el numero de prepedido: {npNumber}</Text>
                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={() => setShowSuccessModal(false)}
                        >
                            <Text style={styles.modalButtonText}>Entendido</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Modal de Estado de Petroecuador Custom */}
            {petroModal.visible && (
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={[
                            styles.successIconCircle,
                            petroModal.type === 'error' && { backgroundColor: '#EF4444' },
                            petroModal.type === 'warning' && { backgroundColor: '#F59E0B' }
                        ]}>
                            <Icon
                                name={petroModal.type === 'success' ? "checkmark" : petroModal.type === 'error' ? "close" : "alert-triangle"}
                                size={40}
                                color="#FFFFFF"
                            />
                        </View>
                        <Text style={styles.modalTitle}>{petroModal.title}</Text>
                        <Text style={styles.modalMessage}>{petroModal.message}</Text>
                        <TouchableOpacity
                            style={[
                                styles.modalButton,
                                petroModal.type === 'error' && { backgroundColor: '#EF4444' },
                                petroModal.type === 'warning' && { backgroundColor: '#F59E0B' }
                            ]}
                            onPress={() => setPetroModal({ ...petroModal, visible: false })}
                        >
                            <Text style={styles.modalButtonText}>Entendido</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </ScreenWrapper>
    );
}


const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: '#FFFFFF',
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
    headerButtonRight: {
        position: 'absolute',
        right: 15,
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
    greetingSection: {
        paddingTop: 25,
        marginBottom: 25,
    },
    greetingTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1565C0',
    },
    greetingSubtitle: {
        fontSize: 16,
        color: '#6B7280',
        marginTop: 8,
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
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        zIndex: 10,
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
    productInputCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 15,
        marginBottom: 12,
        height: 80,
    },
    productInputLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#374151',
        flex: 1,
        marginRight: 10,
        textTransform: 'uppercase',
    },
    productTextInputWrapper: {
        width: 100,
        height: 48,
        backgroundColor: '#F3F4F6',
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    productTextInput: {
        width: '100%',
        height: '100%',
        textAlign: 'center',
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1565C0',
        padding: 0,
    },
    // Estilos para el Modal de Éxito Custom
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1001,
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
        textAlign: 'center',
    },
    modalMessage: {
        fontSize: 16,
        color: '#4B5563',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 25,
    },
    modalButton: {
        backgroundColor: '#10B981',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 12,
        marginBottom: 20,
        minWidth: 150,
        alignItems: 'center'
    },
    modalButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
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
