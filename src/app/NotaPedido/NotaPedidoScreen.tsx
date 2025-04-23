import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Button, Input, Layout, Text, useTheme } from '@ui-kitten/components';
import React, { useEffect, useState } from 'react';
import { Alert, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import ScreenWrapper from '../../components/ScreenWrapper';
import { useUser } from '../../hooks';
import obtenerComercializadoraCliente from '../../services/Comercializadora/comercializadoraServices';
import { crearNotaPedido } from '../../services/NotaPedido/notaPedidoServices';
import ProductoServices from '../../services/Producto/productoServices';
import obtenerTerminalCliente from '../../services/Terminal/teminalService';
import { notaPedidoStyles } from '../../styles';
import { ApiResponse, ClienteInterface, ComercializadoraInterface, DetalleNotaPedidoInterface, DetalleNotaPedidoPKInterface, EnvioNotaPedidoInterface, NotaPedidoInterface, NotaPedidoPKInterface, ProductoInterface, ProductoResponseInterface, TerminalClienteInterface, TerminalInterface } from '../../types';
import { RootStackParamList } from '../../types/navigation';

type NavigationProps = StackNavigationProp<RootStackParamList, 'Login'>;

export default function NotaPedido() {
    const [cantidad, setCantidad] = useState<number>(0);
    const { user, logout } = useUser();
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
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [npNumber, setNpNumber] = useState<string>('');

    // Función para obtener la fecha en formato "YYYY-MM-DDTHH:mm:ssZ"
    const formatDate = (date: Date): string => {
        return date.toISOString(); // Devuelve el formato ISO con "Z"
    };

    // Función para establecer la fecha actual
    const setCurrentDate = () => {
        setSelectedDate(new Date()); // Guardamos el objeto Date sin formatear
    };

    const setTomorrowDate = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setSelectedDate(tomorrow);
    };


    const handleGetComer = async () => {
        try {
            const response = await obtenerComercializadoraCliente.getResource<ApiResponse<ComercializadoraInterface>>(
                'buscarcomerxcli',
                '',
                { codigocli: user?.codigo }
            );
            if (response.retorno !== null && response.retorno !== undefined) {
                setComercializadora(response.retorno[0]);
            } else {
                Alert.alert('Error', 'No hay Comercializadora para mostrar');
            }
        } catch (error) {
            Alert.alert('Error', 'Hubo un problema al obtener la comercializadora');
        }
    };

    const handleGetTerminal = async () => {
        try {
            const response = await obtenerTerminalCliente.getResource<ApiResponse<TerminalClienteInterface>>(
                'porId',
                '',
                { codigo: user?.codigo }
            );
            if (response.retorno !== null && response.retorno !== undefined) {
                setTerminalCli(response.retorno[0]);
            } else {
                Alert.alert('Error', 'No hay Terminal para mostrar');
            }
        } catch (error) {
            Alert.alert('Error', 'Hubo un problema al obtener la Terminal');
        }
    };

    const handleGetProductos = async () => {
        try {
            const response = await ProductoServices.getResource<ApiResponse<ProductoResponseInterface>>(
                'porCliente',
                '',
                { codigocliente: user?.codigo }
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

    useEffect(() => {
        if (user !== null && user !== undefined) {
            handleGetComer();
            handleGetTerminal();
            handleGetProductos();
        }
    }, [user]);

    useEffect(() => {
        if (comercializadora !== undefined && comercializadora !== null) {
            setComerName(comercializadora.nombre);
            setCodComer(comercializadora.codigo);
            setCodAbas(comercializadora.codigoabastecedora.codigo);
            setPrefijo(comercializadora.prefijonpe);
        }
    }, [comercializadora])

    useEffect(() => {
        if (terminalCli !== undefined && terminalCli !== null) {
            const notaPedidoList: NotaPedidoInterface[] = [];
            const clienteList: ClienteInterface[] = [];
            const codigoBanco = terminalCli.codigobancodebito.codigo;
            const codTerminal = terminalCli.codigoterminaldefecto.codigo;
            const cliName = user?.codigo + " - " + terminalCli.nombrecomercial
            setTerminal({
                codigo: codTerminal,
                nombre: terminalCli.nombre,
                activo: terminalCli.estado,
                usuarioactual: user?.nombrever !== undefined ? user?.nombrever : "",
                notapedidoList: notaPedidoList, // Lista de `NotaPedido`
                clienteList: clienteList,
            });
            setCodBank(codigoBanco);
            setCliName(cliName);
            setTerminalName(terminalCli.codigoterminaldefecto.nombre)
        }
    }, [terminalCli])

    useEffect(() => {
        if (products !== undefined && products !== null) {
            const codigoCliente = products[0].cliente.codigo || '';
            setCodCli(codigoCliente);
        }
    }, [products])

    const onLogout = async () => {
        await logout();
        navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }], // 🚀 Lleva al usuario a la pantalla de inicio de sesión
        });
    }

    const handleSubmit = async () => {
        try {

            const nowDate = formatDate(new Date());
            const formattedDate = selectedDate ? formatDate(selectedDate) : '';

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
                codigocliente: { codigo: codCli },
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
                        const response = await crearNotaPedido.postNotaPedido(envioNP);
                        if (response !== undefined) {
                            setNpNumber(response.developerMessage);
                            Alert.alert("Éxito", "Nota de Pedido enviada correctamente");
                        }
                    } else {
                        Alert.alert("Error", "Ingrese una cantidad");
                    }
                } else {
                    Alert.alert("Error", "Seleccionar un producto");
                }
            } else {
                Alert.alert("Error", "Seleccionar la fecha");
            }
        } catch (error) {
            console.error("Error al enviar la solicitud:", error);
            Alert.alert("Error", "No se pudo conectar con el servidor");
        }
    };


    return (
        <ScreenWrapper>
            <Layout style={notaPedidoStyles.container}>
                <Layout style={notaPedidoStyles.stepContainer}>
                    {/* Header con botones */}
                    <View style={notaPedidoStyles.header}>
                        <TouchableOpacity style={notaPedidoStyles.headerButtonLeft} onPress={() => navigation.navigate('ListaNotaPedido')}>
                            <Icon name="eye-outline" size={30} color={theme['color-primary-default']} />
                        </TouchableOpacity>
                        <TouchableOpacity style={notaPedidoStyles.headerButtonRight} onPress={onLogout}>
                            <Icon name="log-out-outline" size={30} color="red" />
                        </TouchableOpacity>
                    </View>
                    <View style={notaPedidoStyles.header}>
                        <Text style={notaPedidoStyles.title}>NP: {npNumber}</Text>
                    </View>

                    <Text category="h6">{`${comerName} - ${terminalName}`}</Text>
                    <View style={notaPedidoStyles.divider} />
                    <Text>
                        <Text category="s1" style={notaPedidoStyles.bold}>{cliName}</Text>
                    </Text>

                    <View style={notaPedidoStyles.calendarContainer}>
                        <Button onPress={setCurrentDate} > Despachar Hoy </Button>
                        <Button onPress={setTomorrowDate} > Despachar Mañana </Button>
                        {/* {showPicker && (
                            <DateTimePicker
                                value={new Date()}
                                mode="date"
                                display="default"
                                onChange={handleDateChange}
                            />
                        )} */}

                    </View>
                    <View style={notaPedidoStyles.dateBox}>
                        <Text style={{ fontWeight: 'bold' }}>
                            Fecha: {selectedDate ? new Date(selectedDate).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Ninguna'}
                        </Text>
                    </View>

                    {products && products.length > 0 && (
                        <Layout style={notaPedidoStyles.buttonContainer}>
                            {products.map((product, index) => {
                                const isSelected = codProducto === product.producto.codigo; // Verifica si es el producto seleccionado
                                return (
                                    <Button
                                        key={index}
                                        style={[
                                            notaPedidoStyles.buttonWrapper,
                                            isSelected && notaPedidoStyles.selectedButton, // Aplicar el estilo si está seleccionado
                                        ]}
                                        onPress={() => handleSelectProduct(product.producto)}
                                    >
                                        {product.producto.nombre}
                                    </Button>
                                );
                            })}
                        </Layout>
                    )}

                    <Input
                        style={notaPedidoStyles.input}
                        placeholder="Ingrese cantidad"
                        keyboardType="numeric"
                        value={cantidad.toString()}
                        onChangeText={(text) => setCantidad(Number(text.replace(/[^0-9]/g, "")))}
                    />
                    <View style={notaPedidoStyles.footer}>
                        <Text style={notaPedidoStyles.title}>NP: {npNumber}</Text>
                    </View>

                    <View style={notaPedidoStyles.footerButtons}>
                        <Button style={notaPedidoStyles.headerButtonLeft} onPress={handleSubmit}>
                            Generar
                        </Button>
                        <Button style={notaPedidoStyles.headerButtonRight} status="danger" onPress={() => console.log("Cancelar Nota de Pedido")}>
                            Cancelar
                        </Button>
                    </View>
                </Layout>
            </Layout >
        </ScreenWrapper>
    );
}

