import { StyleSheet } from 'react-native';
export const notaPedidoStyles = StyleSheet.create({
    container: {
        flex: 1,  // Ocupar toda la pantalla
        padding: 10,
        backgroundColor: '#cad7eb', //f7f9fc 
    },
    scrollContainer: {
        flexGrow: 1,  // Permitir que el contenido se expanda
        backgroundColor: '#000',
    },
    header: {
        //flexDirection: 'row',
        alignItems: 'center', // <- Esto alinea verticalmente al centro
        justifyContent: 'space-between', // Opcional, si quieres separación entre íconos y texto
        paddingHorizontal: 8, // u otro valor según tu diseño
        //height: 50, // Asegúrate de tener una altura definida
        marginVertical: 5,
        marginBottom: 28,

        //alignItems: 'center',
        //marginVertical: 20,
        //position: 'relative',
    },
    cuerpo: {
        //flexDirection: 'row',
        //flex: 0,
        //alignItems: 'center', // <- Esto alinea verticalmente al centro
        //justifyContent: 'space-between', // Opcional, si quieres separación entre íconos y texto
        //paddingHorizontal: 8, // u otro valor según tu diseño
        //height: 50, // Asegúrate de tener una altura definida
        //marginVertical: 5,
        //marginBottom: 28,

        alignItems: 'center',
        marginVertical: 20,
        position: 'relative',
        marginBottom: 28,
    },
    headerFecha: {
        alignItems: 'flex-start',
        marginVertical: 5,
        position: 'relative',
        marginTop: 15,
        marginBottom: 2,
    },
    headerProducto: {
        alignItems: 'flex-start',
        marginTop: 25,
        position: 'relative',
    },
    headerButtonLeft: {
        position: 'absolute',
        left: 0,
        top: 0,
        padding: 10,
    },
    headerButtonRight: {
        position: 'absolute',
        right: 0,
        top: 0,
        padding: 10,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    stepContainer: {
        flex: 1,  // Ocupar el espacio disponible
        padding: 15,
        backgroundColor: '#dadde3', // dadde3 fcffff 
        borderRadius: 8,
        marginHorizontal: 10,
        marginBottom: 20,
        marginTop: 20,
    },
    divider: {
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        marginVertical: 8,
    },
    bold: {
        fontWeight: 'bold',
    },
    calendarContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 2,
        //marginHorizontal: 15,
    },
    calendar: {
        borderRadius: 10,
        //borderWidth: 1,
        borderColor: '#ccc',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 2,
        backgroundColor: '#dadde3', // fff 
    },
    buttonWrapper: {
        flex: 1,
        marginHorizontal: 5,
    },
    selectedButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 5,
        borderRadius: 18,
        borderWidth: 1,
        paddingVertical: 12,
        paddingHorizontal: 10,
        marginVertical: 5,
        shadowColor: '#000',
        shadowOffset: { width: 10, height: 10 },
        shadowOpacity: 1.5,
        shadowRadius: 7,
        elevation: 9,
        backgroundColor: '#495444', // f8f9fa un gris muy claro

    },
    input: {
        //marginVertical: 10,
        width: '95%',
        backgroundColor: '#c4c7cc', // fff  
        marginHorizontal: 8,
        borderRadius: 12,
    },
    textArea: {
        height: 50,
        marginTop: 5,
        flexDirection: 'row',
        alignItems: 'center'
    },
    footer: {
        alignItems: 'center',
        marginVertical: 15,
         marginTop: 8,
         marginBottom: 8,
    },
    spacing: {
        marginVertical: 10,
    },
    dateBox: {
        marginTop: 10,
        padding: 10,
        borderWidth: 1,
        borderRadius: 15,
        marginHorizontal: 5,
    },
    footerButtons: {
        flexDirection: "row",
        justifyContent: "center",
        marginTop: 20,
        paddingHorizontal: 20,
    },
    footerButtonsft: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: 10,
        height: 60,
        //marginHorizontal: 5,
        //backgroundColor: '#f0f0f0', // Opcional: color de fondo del header
    },
    headerButtonOk: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 5,
        borderRadius: 12,
        borderWidth: 1,
        paddingVertical: 12,
        paddingHorizontal: 10,
        marginVertical: 5,
        shadowColor: '#000',
        shadowOffset: { width: 10, height: 10 },
        shadowOpacity: 1.5,
        shadowRadius: 7,
        elevation: 9,
        backgroundColor: '#000', // f8f9fa un gris muy claro
    },
    headerButtonCancel: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 5,
        borderRadius: 18,
        borderWidth: 1,
        paddingVertical: 12,
        paddingHorizontal: 10,
        marginVertical: 5,
        shadowColor: '#000',
        shadowOffset: { width: 10, height: 10 },
        shadowOpacity: 1.5,
        shadowRadius: 7,
        elevation: 9,
        backgroundColor: '#f8f9fa', // f8f9fa un gris muy claro
    },
    botonRedondo: {
        borderRadius: 18,
        borderWidth: 1,
        paddingVertical: 12,
        paddingHorizontal: 10,
        marginVertical: 5,
        shadowColor: '#fff',
        shadowOffset: { width: 2, height: 1 },
        shadowOpacity: 0.7,
        shadowRadius: 7,
        elevation: 9,
        backgroundColor: '#e6e8eb', // f8f9fa un gris muy claro
    },
    textoBoton: {
        color: '#030203', // Negro
        fontSize: 16,
        fontWeight: 'thin',
    },
});
