// src/styles/loginStyles.ts

import { StyleSheet } from 'react-native';

export const loginStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f7fad8', // Very light background
        paddingHorizontal: 30,
        justifyContent: 'center',
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 30,
        marginTop: 40,
    },
    image: {
        width: 280,
        height: 80,
        resizeMode: 'contain',
        marginBottom: 10,
    },
    slogan: {
        fontSize: 9,
        color: '#A0A0A0',
        fontWeight: '400',
        letterSpacing: 0.5,
        textAlign: 'center',
        marginTop: 8,
        textTransform: 'none',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1A1A1A',
        textAlign: 'center',
        marginBottom: 8,
    },
    SubtituloPequeno: {
        fontSize: 15,
        color: '#9CA3AF',
        textAlign: 'center',
        marginBottom: 35,
    },
    formContainer: {
        width: '100%',
        backgroundColor: '#f5f7fad8',      // ← Fondo blanco
        borderRadius: 16,                // ← Bordes redondeados
        padding: 20,                     // ← Espacio interno
        // shadowColor: '#000',             // ← Sombra negra
        // shadowOffset: { width: 0, height: 2 },
        // shadowOpacity: 0.1,              // ← Sombra suave
        // shadowRadius: 8,
        // elevation: 3,                    // ← Elevación para Android
    },
    label: {
        fontSize: 13,
        fontWeight: '500',
        color: '#4B5563',
        marginBottom: 6,
        marginLeft: 0,
    },
    input: {
        backgroundColor: '#FFFFFF',
        borderColor: 'transparent',
        borderRadius: 25,
        marginBottom: 18,
        // Shadows for iOS
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },
    inputText: {
        color: '#1A2138',
    },
    button: {
        marginTop: 20,
        backgroundColor: '#3366FF',
        borderColor: '#3366FF',
        borderRadius: 25,
        paddingVertical: 14,
        shadowColor: '#3366FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    error: {
        color: '#FF3D71',
        fontSize: 12,
        marginBottom: 10,
        marginLeft: 4,
    },
    forgotPassword: {
        textAlign: 'center',
        color: '#3366FF',
        marginTop: 25,
        fontSize: 15,
        fontWeight: '500',
    },
    footerlogin: {
        position: 'absolute',
        bottom: 30,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        color: '#8F9BB3',
        marginRight: 8,
    },
    footerLogo: {
        width: 100,
        height: 40,
        // tintColor: '#33C5F6', // Eliminado para ver los colores originales
    },
});
