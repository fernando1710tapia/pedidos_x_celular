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
        alignItems: 'center',
        marginVertical: 20,
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
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    stepContainer: {
        flex: 1,  // Ocupar el espacio disponible
        padding: 15,
        backgroundColor: '#dadde3', // fff 
        borderRadius: 8,
        marginHorizontal: 10,
        marginBottom: 20,
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
        marginTop: 10,
        //marginHorizontal: 15,
    },
    calendar: {
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#ccc',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 10,
        backgroundColor: '#dadde3', // fff 
    },
    buttonWrapper: {
        flex: 1,
        marginHorizontal: 5,
    },
    selectedButton: {
        backgroundColor: "green",
    },
    input: {
        marginVertical: 10,
        width: '100%',
        backgroundColor: '#c4c7cc', // fff  
    },
    textArea: {
        height: 100,
        marginVertical: 10,
    },
    footer: {
        alignItems: 'center',
        marginVertical: 10,
    },
    spacing: {
        marginVertical: 10,
    },
    dateBox: {
        marginTop: 20,
        padding: 10,
        borderWidth: 1,
        borderRadius: 5,
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
headerButtonft: {
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 10,
  marginHorizontal: 5,
},
});
