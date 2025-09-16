// Exemplo de configuração do Bus Manager
// Copie este arquivo para config.js e configure suas APIs

const CONFIG = {
    // Google Maps API Key
    // 1. Acesse: https://console.cloud.google.com/
    // 2. Crie um projeto ou selecione um existente
    // 3. Ative a API "Maps JavaScript API"
    // 4. Crie uma chave de API
    // 5. Substitua 'YOUR_API_KEY_HERE' pela sua chave
    GOOGLE_MAPS_API_KEY: 'AIzaSyBvOkBwv90wD4qP0qXwR1sT2uV3wX4yZ5a',
    
    // Configurações da aplicação
    APP: {
        name: 'Bus Manager',
        version: '1.0.0',
        // Centro padrão do mapa (coordenadas de São Paulo)
        defaultCenter: {
            lat: -23.5505,
            lng: -46.6333
        },
        defaultZoom: 12
    },
    
    // Configurações de validação
    VALIDATION: {
        cepLength: 8,           // Tamanho do CEP brasileiro
        phoneMinLength: 10,     // Tamanho mínimo do telefone
        nameMinLength: 2        // Tamanho mínimo do nome
    },
    
    // Configurações de rota
    ROUTE: {
        defaultTravelMode: 'DRIVING',  // Modo de transporte
        optimizeWaypoints: true,       // Otimizar ordem dos pontos
        avoidHighways: false,         // Evitar rodovias
        avoidTolls: false             // Evitar pedágios
    },
    
    // Configurações de notificação
    NOTIFICATION: {
        defaultDuration: 3000,  // Duração em milissegundos
        position: 'top-right'   // Posição na tela
    },
    
    // Configurações de armazenamento
    STORAGE: {
        driversKey: 'busManager_drivers',
        studentsKey: 'busManager_students',
        currentDriverKey: 'busManager_currentDriver'
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
