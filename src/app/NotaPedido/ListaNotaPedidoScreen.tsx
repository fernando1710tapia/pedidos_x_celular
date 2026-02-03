import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import {
    Divider,
    Layout,
    Text,
    useTheme,
    Button,
    Select,
    SelectItem,
    IndexPath,
} from '@ui-kitten/components';
import { format } from 'date-fns';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import ScreenWrapper from '../../components/ScreenWrapper';
import { useUser } from '../../hooks';
import { getListasNotasPedido } from '../../services';
import { notaPedidoStyles, loginStyles } from '../../styles';
import {
    ApiResponse,
    ListaNotaPedidoInterace,
    RootStackParamList,
} from '../../types';

type NavigationProps = StackNavigationProp<RootStackParamList, 'Login'>;

export const ListaNotaPedidoScreen = () => {
    const { user, logout } = useUser();
    const theme = useTheme();
    const navigation = useNavigation<NavigationProps>();
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    const fechaActual = format(ayer, 'yyyy/MM/dd');

    const options = [5, 10, 20];
    const defaultIndex = 1;

    const [listaNPs, setListaNPs] = useState<ListaNotaPedidoInterace[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(options[defaultIndex]);
    const [selectedIndex, setSelectedIndex] = useState<IndexPath>(new IndexPath(defaultIndex));

    const getListaNP = async () => {
        try {
            // Alert.alert('Aviso', 'fecha de consluta:. '+fechaActual);
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
            console.error("Error de red:", error);
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
    const totalPages = Math.ceil(listaNPs.length / itemsPerPage);

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage((prev) => prev + 1);
        }
    };

    const handlePrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage((prev) => prev - 1);
        }
    };

    const handleItemsPerPageChange = (index: IndexPath | IndexPath[]) => {
        const selected = Array.isArray(index) ? index[0].row : index.row;
        setSelectedIndex(new IndexPath(selected));

        // Evita la advertencia actualizando luego del render
        setTimeout(() => {
            setItemsPerPage(options[selected]);
            setCurrentPage(1);
        }, 0);
    };

    const onLogout = async () => {
        await logout();
        navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
        });
    };

    return (
        <ScreenWrapper>
            <Layout style={notaPedidoStyles.container}>
                <Layout style={styles.containerListaPedido}>
                    {/* Header */}
                    <View style={notaPedidoStyles.header}>
                        <TouchableOpacity
                            style={notaPedidoStyles.headerButtonLeft}
                            onPress={() => navigation.navigate('NotaPedido')}
                        >
                            <Icon
                                name="add-circle-sharp"
                                size={30}
                                color={theme['#000']}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={notaPedidoStyles.headerButtonRight}
                            onPress={onLogout}
                        >
                            <Icon name="log-out-sharp" size={30} color="red" />
                        </TouchableOpacity>
                    </View>

                    <Text category="h5" style={styles.title}>
                        Tus pedidos
                    </Text>

                    <Divider style={styles.divider} />

                    {/* Pagination Controls */}
                    <View style={styles.pagination}>
                        <Button onPress={handlePrevPage} disabled={currentPage === 1}>
                            Anterior
                        </Button>
                        <Text style={styles.pageInfo}>
                            Página {currentPage} de {totalPages}
                        </Text>
                        <Button onPress={handleNextPage} disabled={currentPage === totalPages}>
                            Siguiente
                        </Button>
                    </View>

                    {/* Select de filas por página 
                    <View style={styles.pagination}>
                        <Text style={styles.paginationTexto}>Cantidad de filas por página:</Text>
                        <Select
                            selectedIndex={selectedIndex}
                            onSelect={handleItemsPerPageChange}
                            style={{ width: 100 }}
                        >
                            {options.map((value, idx) => (
                                <SelectItem key={idx} title={`${value}`} />
                            ))}
                        </Select>
                    </View>

                    */}

                    {/* Tabla encabezado */}
                    <View style={styles.row}>
                        <Text style={[styles.cell, styles.header]}>Despachar</Text>
                        <Text style={[styles.cell, styles.header]}>Pedido</Text>
                        <Text style={[styles.cell, styles.header]}>Facturada</Text>
                        <Text style={[styles.cell, styles.header]}>Despachada</Text>
                    </View>
                    <Divider />

                    {/* Tabla contenido */}
                    {loading ? (
                        <Text style={{ textAlign: 'center', marginTop: 20 }}>
                            Cargando pedidos...
                        </Text>
                    ) : (
                        currentItems.map((np, index) => (
                            <View key={index} style={styles.row}>
                                <Text style={styles.cell}>{np.fechaVenta}</Text>
                                <Text style={styles.cell}>{np.numeroNotaPedido}</Text>
                                <Text style={styles.cell}>{np.numeroFactura}</Text>
                                <Text style={styles.cell}>{np.numeroGuia}</Text>
                            </View>
                        ))
                    )}
                </Layout>
                <View style={loginStyles.footer}>
                    <Text style={loginStyles.footerText}>esta App es parte de infinityOne</Text>
                    {/*<Text style={loginStyles.footerTextinfinity}>InfinityOne</Text>*/}
                    <Image
                        source={require('../../../assets/logoinfinity.png')}
                        style={loginStyles.footerLogo}
                        resizeMode="contain"
                    />
                </View>
            </Layout>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#cad7eb', // fff 
    },
    containerListaPedido: {
        //padding: 20,
        //backgroundColor: '#dadde3', // fff 

        flex: 1,  // Ocupar el espacio disponible
        padding: 15,
        backgroundColor: '#dadde3', // dadde3 fff 
        borderRadius: 8,
        marginHorizontal: 10,
        marginBottom: 20,
        marginTop: 20,

    },
    title: {
        marginBottom: 30,
        textAlign: 'center',
    },
    divider: {
        marginBottom: 10,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
    },
    cell: {
        flex: 1,
        textAlign: 'center',
    },
    header: {
        fontWeight: 'bold',
        color: '#000',
        fontSize: 13,
        fontFamily: ''

    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    paginationTexto: {
        fontSize: 13,
        textAlign: 'center',
    },
    pageInfo: {
        textAlign: 'center',
    },
});
