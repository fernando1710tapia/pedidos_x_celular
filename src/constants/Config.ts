export const API_CONFIG = {
    BASE_URL: 'https://www.supertech.ec:8443/infinityone1/resources',
    //BASE_URL: 'https://200.93.248.121:8443/infinityone1/resources',
    //BASE_URL: 'https://infinity.petroleosyservicios.com:8443/infinityone1/resources',
    //BASE_URL: 'https://infinity.petrolrios.ec:8443/infinityone1/resources',
    // BASE_URL: 'http://www.supertech.ec:8080/infinityone1/resources',
    //BASE_URL: 'https://infinity.fenapet.com.ec:8443/infinityone1/resources',

    GLOBAL_URLS: [
        'https://infinity.petroleosyservicios.com:8443/infinityone1/resources',
        'https://infinity.petrolrios.ec:8443/infinityone1/resources',
        'https://infinity.combustibles.com.ec:8443/infinityone1/resources',
        'https://infinity.secsacombustibles.ec:8443/infinityone1/resources',
        'http://www.supertech.ec:8080/infinityone1/resources',
        'https://www.supertech.ec:8443/infinityone1/resources'
    ],
    TIMEOUT: 4000,
    HEADERS: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    FIRST_ACCES: "xxxx"
};

export const getBaseUrlByComercializadora = (codigo?: string | null): string => {
    switch (String(codigo).trim()) {
        case '0008': return 'https://infinity.petrolrios.ec:8443/infinityone1/resources';
        case '0002': return 'https://infinity.petroleosyservicios.com:8443/infinityone1/resources';
        case '0095': return 'https://infinity.combustibles.com.ec:8443/infinityone1/resources';
        case '0061': return 'https://infinity.secsacombustibles.ec:8443/infinityone1/resources';
        case '7011': return 'https://infinity.fenapet.com.ec:8443/infinityone1/resources';
        default: return 'https://www.supertech.ec:8443/infinityone1/resources'; // Desarrollo / Fallback
    }
};



// https://infinity.petroleosyservicios.com:8443/infinityone1/resources
// 200.93.248.121:8080
// 200.93.248.119:844
// https://www.supertech.ec:8443/infinityone1
// https://200.93.248.121:8443/infinityone1 