import { API_CONFIG } from '../constants/Config';

// Definición de las empresas identificadas por su URL
export enum Company {
    PYS = 'pys',
    PETROLRIOS = 'petrolrios',
    COMBUSTIBLES = 'combustibles',
    SECSA = 'secsa',
    SUPERTECH = 'supertech',
    FENAPET = 'fenapet',
    GRUPOMARZAM = 'grupomarzam',
    UNKNOWN = 'unknown'
}

// Definición de las características (features) a controlar
export interface AppFeatures {
    mostrarOjitoListadoPedidos: boolean;
    mostrarOjitoListadoPrePedidos: boolean;
    validarTerminalCerrada: boolean;
    habilitarPush: boolean;
}

// Configuración por defecto para empresas no mapeadas o desconocidas
const defaultFeatures: AppFeatures = {
    mostrarOjitoListadoPedidos: true,
    mostrarOjitoListadoPrePedidos: true,
    validarTerminalCerrada: true,
    habilitarPush: false,
};

// Diccionario de configuración por empresa
// Aqui se configura si se ve o no una opcion en este caso el OJO de pedidos y prepedidos
export const FEATURE_FLAGS: Record<Company, AppFeatures> = {
    [Company.PYS]: {
        mostrarOjitoListadoPedidos: false,
        mostrarOjitoListadoPrePedidos: false,
        validarTerminalCerrada: true,
        habilitarPush: true,
    },
    [Company.PETROLRIOS]: {
        mostrarOjitoListadoPedidos: true,
        mostrarOjitoListadoPrePedidos: true,
        validarTerminalCerrada: false,
        habilitarPush: false,
    },
    [Company.COMBUSTIBLES]: {
        ...defaultFeatures
    },
    [Company.SECSA]: {
        ...defaultFeatures
    },
    [Company.SUPERTECH]: {
        ...defaultFeatures,
        // TEMPORAL: ambiente de pruebas de push. Quitar (false) antes de producción.
        habilitarPush: true,
    },
    [Company.FENAPET]: {
        ...defaultFeatures
    },
    [Company.GRUPOMARZAM]: {
        ...defaultFeatures
    },
    [Company.UNKNOWN]: {
        ...defaultFeatures
    }
};

// Utilidad para determinar la empresa actual basada en la URL base
export const getCurrentCompany = (baseUrl: string): Company => {
    if (!baseUrl) return Company.UNKNOWN;

    const url = baseUrl.toLowerCase();

    if (url.includes('petroleosyservicios')) return Company.PYS;
    if (url.includes('petrolrios')) return Company.PETROLRIOS;
    if (url.includes('combustibles.com.ec')) return Company.COMBUSTIBLES;
    if (url.includes('secsa')) return Company.SECSA;
    if (url.includes('fenapet')) return Company.FENAPET;
    if (url.includes('grupomarzam')) return Company.GRUPOMARZAM;
    if (url.includes('supertech')) return Company.SUPERTECH;

    return Company.UNKNOWN;
};

// Función para obtener las características activas actuales
export const getActiveFeatures = (): AppFeatures => {
    const currentCompany = getCurrentCompany(API_CONFIG.BASE_URL);
    return FEATURE_FLAGS[currentCompany] || defaultFeatures;
};
