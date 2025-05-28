// src/styles/loginStyles.ts

import { StyleSheet } from 'react-native';

export const loginStyles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#cad7eb',//f7f9fc 
        width: '100%',
    },
    reactLogo: {
        width: 120,
        height: 120,
        marginBottom: 24,
        resizeMode: 'contain',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#000',
    },
    subtitle: {
        fontSize: 18,
        marginBottom: 20,
        textAlign: 'center',
        color: '#777',
    },
    formContainer: {
        width: '100%',
        maxWidth: 400,
        paddingHorizontal: 20,
        backgroundColor: '#cad7eb', //f7f9fc
    },
    input: {
        marginBottom: 15,
        backgroundColor: '#dadde3', //f7f9fc
    },
    button: {
        marginTop: 15,
    },
    error: {
        color: 'red',
        marginTop: -10,
        marginBottom: 10,
        fontSize: 12,
    },
    forgotPassword: {
        textAlign: 'center',
        color: '#8e44ad',
        marginTop: 15,
        fontSize: 14,
    },
    image: {
        width: '100%',
        height: 180,
        marginBottom: 20,
        top: 0,
        left: 0,
        right: 0,
    },
});
