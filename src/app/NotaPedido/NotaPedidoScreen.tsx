import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Button, Input, Layout, Text, useTheme } from '@ui-kitten/components';
import React, { useEffect, useState } from 'react';
import { Alert, TouchableOpacity, View, Image, } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import ScreenWrapper from '../../components/ScreenWrapper';
import { useUser } from '../../hooks';
import obtenerComercializadoraCliente from '../../services/Comercializadora/comercializadoraServices';
import { crearNotaPedido } from '../../services/NotaPedido/notaPedidoServices';
import ProductoServices from '../../services/Producto/productoServices';
import obtenerTerminalCliente from '../../services/Terminal/teminalService';
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


    // funcion de estilos
    const styles = StyleSheet.create({
        button: {
            borderRadius: 12,
            borderWidth: 1,
            paddingVertical: 12,
            paddingHorizontal: 24,
            marginVertical: 6,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
            backgroundColor: '#f8f9fa', // un gris muy claro
        },
    });

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


    const handleGetComer = async () => {
        try {
            // Alert.alert('aviso', 'metodo de buscqueda de comercializadora:. '+user?.codigocomercializadora);
            //console.error('FT::handleGetComer-metodo de buscqueda de comercializadora:.:'+user?.codigocomercializadora );
            const response = await obtenerComercializadoraCliente.getResource<ApiResponse<ComercializadoraInterface>>(
                'porId',
                '',
                { codigo: user?.codigocomercializadora }
            );
            if (response.retorno !== null && response.retorno !== undefined) {
                setComercializadora(response.retorno[0]);
            } else {
                //console.error('FT::handleGetComer-metodo de buscqueda de comercializadora-No hay Comercializadora para mostrar:. '+user?.codigocomercializadora );
                Alert.alert('Error', 'No hay Comercializadora para mostrar');
            }
        } catch (error) {
            console.error('FT::handleGetComer-metodo de buscqueda de comercializadora-Hubo un problema al obtener la comercializadora:. ' + user?.codigocomercializadora + ' error-capturado::. ' + error);
            Alert.alert('Error', 'Hubo un problema al obtener la comercializadora:. ' + error);
        }
    };

    const handleGetTerminal = async () => {
        try {
            //    Alert.alert('VER', ' buscando  la Terminal:. ');
            //console.error('FT::handleGetTerminal-metodo de buscqueda de terminal:.:'+user?.codigocomercializadora+' -usuario- .'+user?.codigo );
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

        const loadInitialData = async () => {
            try {
                // console.error('FT-useEffect-PRINCIPAL::INICIO carga de datos');

                await handleGetComer();
                await handleGetTerminal();
                await handleGetProductos();

                //console.error('FT-useEffect-PRINCIPAL::FIN carga de datos');

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

            const cliName =
                `${user?.codigo ?? ''} - ${terminalCli.nombrecomercial ?? ''}`;

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
    }, [terminalCli, user]);



    useEffect(() => {

        if (products !== undefined && products !== null) {
            //    console.error('FT::USEEFFECT-products[0]:. '+products[0].clienteproductoPK.codigo+' -cliente:. '+products[0].cliente.clientePK.codigo);
            const codigoCliente = products[0].cliente.clientePK.codigo || '';
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
            <Layout style={notaPedidoStyles.container}>
                <Layout style={notaPedidoStyles.stepContainer}>
                    {/* Header con botones */}
                    <View style={notaPedidoStyles.header}>
                        <TouchableOpacity style={notaPedidoStyles.headerButtonLeft} onPress={() => navigation.navigate('ListaNotaPedido')}>
                            <Icon name="eye-sharp" size={30} color={theme['#000']} />
                        </TouchableOpacity>
                        <Text category="p2" style={{ fontWeight: '300', fontSize: 14, letterSpacing: 0.5 }}>
                            Generaremos sus pedidos
                        </Text>
                        <TouchableOpacity style={notaPedidoStyles.headerButtonRight} onPress={onLogout}>
                            <Icon name="log-out-sharp" size={30} color="red" />
                        </TouchableOpacity>
                    </View>
                    {/*
                    <View style={notaPedidoStyles.header}>
                        <Text style={notaPedidoStyles.title}>Pedido: {npNumber}</Text>
                    </View>
                    */}
                    <View style={notaPedidoStyles.cuerpo}>
                        {/*<Text category="h6">{`${comerName}`}</Text>*/}

                        <Text style={{ fontSize: 20, fontWeight: 'bold', textAlign: 'center' }}>
                            {comerName.toUpperCase()}
                        </Text>
                    </View>
                    {/*<Text category="h6">{`${terminalName}`}</Text>*/}
                    <Text style={{ fontSize: 12, fontWeight: 'heavy' }}>
                        {terminalName.toLocaleUpperCase()}
                    </Text>
                    <View style={notaPedidoStyles.divider} />
                    <Text>
                        {/*<Text category="h6" >{cliName}</Text>*/}
                        <Text style={{ fontSize: 12, fontWeight: 'black' }}>
                            {cliName.toLocaleUpperCase()}
                        </Text>
                    </Text>
                    <View style={notaPedidoStyles.divider} />
                    <View style={notaPedidoStyles.headerFecha}>
                        <Text style={{ fontSize: 12, fontWeight: 'black', textAlign: 'left', }}>
                            Cuando retirará su pedido?
                        </Text>
                    </View>

                    {/* ftft desde aquiii
                    <View style={notaPedidoStyles.calendarContainer}>
                        <Button onPress={setCurrentDate} style={notaPedidoStyles.headerButtonOk} status="warning" >
                            <Text >Hoy</Text>
                        </Button>
                        <Button
                            onPress={setTomorrowDate}
                            style={notaPedidoStyles.headerButtonOk}
                            status="warning"
                        //accessoryRight={setSelectedDate === (new Date()) ? CheckIcon : null}
                        >
                            <Text >Mañana</Text>
                        </Button>
                    </View> 
                    */}


                    <View style={notaPedidoStyles.calendarContainer}>
                        <Button
                            onPress={setCurrentDate}
                            //style={notaPedidoStyles.headerButtonOk}
                            status="warning"
                            style={[
                                notaPedidoStyles.headerButtonOk,
                                selectedDate === 'hoy' && notaPedidoStyles.selectedButton, // Aplicar el estilo si está seleccionado
                            ]}
                            accessoryLeft={selectedDate === 'hoy' ? CheckIcon : undefined}
                        >
                            Hoy
                        </Button>

                        <Button
                            onPress={setTomorrowDate}
                            //style={notaPedidoStyles.headerButtonOk}
                            status="warning"
                            style={[
                                notaPedidoStyles.headerButtonOk,
                                selectedDate === 'manana' && notaPedidoStyles.selectedButton, // Aplicar el estilo si está seleccionado
                            ]}

                            accessoryLeft={selectedDate === 'manana' ? CheckIcon : undefined}
                        >
                            Mañana
                        </Button>
                    </View>



                    <View style={notaPedidoStyles.dateBox}>
                        <Text style={{ fontWeight: 'bold' }}>
                            Se despachará: {selectedDateDate ? new Date(selectedDateDate).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''}
                        </Text>
                    </View>
                    <View style={notaPedidoStyles.headerProducto}>
                        <Text style={{ fontSize: 12, fontWeight: 'black', textAlign: 'left', }}>
                            Seleccione un producto  y el volumen requerido, por favor
                        </Text>
                    </View>
                    {products && products.length > 0 && (
                        <Layout style={notaPedidoStyles.buttonContainer}>
                            {products.map((product, index) => {
                                const isSelected = codProducto === product.producto.codigo; // Verifica si es el producto seleccionado
                                return (

                                    <Button
                                        key={index}
                                        status="warning"
                                        style={[
                                            notaPedidoStyles.headerButtonOk,
                                            isSelected && notaPedidoStyles.selectedButton, // Aplicar el estilo si está seleccionado
                                        ]}
                                        accessoryLeft={isSelected ? CheckIcon : undefined}
                                        onPress={() => handleSelectProduct(product.producto)}

                                    >
                                        {product.producto.nombre.toLowerCase()}
                                    </Button>
                                );
                            })}
                        </Layout>
                    )}
                    <View style={notaPedidoStyles.textArea}>
                        {/*<Text style={{ fontSize: 12, fontWeight: 'black', textAlign: 'left',  }}>
                         Volumen?
                        </Text>
                        */}
                        <Input
                            style={notaPedidoStyles.input}
                            placeholder="Ingrese cantidad"
                            keyboardType="numeric"
                            value={cantidad.toString()}
                            onChangeText={(text) => setCantidad(Number(text.replace(/[^0-9]/g, "")))}
                        />
                    </View>
                    <View style={notaPedidoStyles.footer}>
                        <Text style={notaPedidoStyles.title}>Su pedido es: {npNumber}</Text>
                    </View>

                    <View style={notaPedidoStyles.footerButtonsft}>
                        <Button style={notaPedidoStyles.headerButtonOk} status="warning" onPress={handleSubmit}>
                            Generar
                        </Button>
                        <Button style={notaPedidoStyles.headerButtonCancel} status="basic" onPress={() => console.log("Cancelar Nota de Pedido")}>
                            Cancelar
                        </Button>
                    </View>
                </Layout>
                <View style={loginStyles.footerlogin}>
                    <Text style={loginStyles.footerText}>Esta App es parte de infinityOne</Text>
                    {/*<Text style={loginStyles.footerTextinfinity}>InfinityOne</Text>*/}
                    <Image
                        source={require('../../../assets/logoinfinity.png')}
                        style={loginStyles.footerLogo}
                        resizeMode="contain"
                    />
                </View>
            </Layout >
        </ScreenWrapper>
    );
}

