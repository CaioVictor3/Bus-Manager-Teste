// Configurações do Bus Manager
// Configure suas APIs e preferências aqui

const CONFIG = {
    // Google Maps API Key
    // Obtenha sua chave em: https://console.cloud.google.com/
    GOOGLE_MAPS_API_KEY: 'YOUR_API_KEY_HERE',
    
    // Configurações da aplicação
    APP: {
        name: 'Bus Manager',
        version: '1.0.0',
        defaultCenter: {
            lat: -23.5505, // São Paulo
            lng: -46.6333
        },
        defaultZoom: 12
    },
    
    // Configurações de validação
    VALIDATION: {
        cepLength: 8,
        phoneMinLength: 10,
        nameMinLength: 2
    },
    
    // Configurações de rota
    ROUTE: {
        defaultTravelMode: 'DRIVING',
        optimizeWaypoints: true,
        avoidHighways: false,
        avoidTolls: false
    },
    
    // Configurações de notificação
    NOTIFICATION: {
        defaultDuration: 3000, // 3 segundos
        position: 'top-right'
    },
    
    // Configurações de armazenamento
    STORAGE: {
        driversKey: 'busManager_drivers',
        studentsKey: 'busManager_students',
        currentDriverKey: 'busManager_currentDriver',
        routePointsKey: 'busManager_routePoints'
    }
};

// Função para obter a chave da API do Google Maps
function getGoogleMapsApiKey() {
    return CONFIG.GOOGLE_MAPS_API_KEY;
}

// Função para verificar se a API está configurada
function isGoogleMapsConfigured() {
    return CONFIG.GOOGLE_MAPS_API_KEY !== 'YOUR_API_KEY_HERE' && 
           CONFIG.GOOGLE_MAPS_API_KEY.length > 0;
}

// Exportar configurações para uso global
if (typeof window !== 'undefined') {
    window.CONFIG = CONFIG;
    window.getGoogleMapsApiKey = getGoogleMapsApiKey;
    window.isGoogleMapsConfigured = isGoogleMapsConfigured;
}
