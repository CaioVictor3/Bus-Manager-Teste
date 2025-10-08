/**
 * Módulo de Integração com OpenStreetMap
 * Sistema de geocodificação, roteamento e renderização de mapas
 * Autor: Sistema de IA
 * Data: 2024
 */

class OSMIntegration {
    constructor() {
        this.nominatimBaseUrl = CONFIG.OSM.nominatimUrl;
        this.osrmBaseUrl = CONFIG.OSM.osrmUrl;
        this.userAgent = CONFIG.OSM.userAgent;
        this.geocodeDelay = CONFIG.OSM.geocodeDelay;
        this.maxRetries = CONFIG.OSM.maxRetries;
        this.countryCode = CONFIG.OSM.countryCode;
        this.map = null;
        this.routeLayer = null;
        this.markers = [];
        
        // Cache para otimização de performance
        this.geocodeCache = new Map();
        this.routeCache = new Map();
        this.batchSize = 3; // Processar em lotes menores
        this.maxCacheSize = 100; // Limite do cache
    }

    /**
     * Adiciona item ao cache com controle de tamanho
     * @param {Map} cache - Cache a ser usado
     * @param {string} key - Chave do cache
     * @param {*} value - Valor a ser armazenado
     */
    addToCache(cache, key, value) {
        // Limpar cache se exceder o limite
        if (cache.size >= this.maxCacheSize) {
            const firstKey = cache.keys().next().value;
            cache.delete(firstKey);
        }
        
        cache.set(key, value);
    }

    /**
     * Converte endereço em coordenadas usando Nominatim API com cache
     * @param {string} address - Endereço completo
     * @returns {Promise<Object>} Coordenadas {lat, lng}
     */
    async geocodeAddress(address) {
        try {
            // Verificar cache primeiro
            const cacheKey = address.toLowerCase().trim();
            if (this.geocodeCache.has(cacheKey)) {
                console.log(`Cache hit para: ${address}`);
                return this.geocodeCache.get(cacheKey);
            }
            
            console.log(`Geocodificando endereço: ${address}`);
            
            const encodedAddress = encodeURIComponent(address);
            const url = `${this.nominatimBaseUrl}/search?format=json&q=${encodedAddress}&limit=1&countrycodes=${this.countryCode}`;
            
            const response = await fetch(url, {
                headers: {
                    'User-Agent': this.userAgent
                }
            });
            
            if (!response.ok) {
                throw new Error(`Erro na API Nominatim: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data || data.length === 0) {
                throw new Error('Endereço não encontrado');
            }
            
            const result = data[0];
            const coordinates = {
                lat: parseFloat(result.lat),
                lng: parseFloat(result.lon),
                address: result.display_name,
                confidence: parseFloat(result.importance) || 0
            };
            
            // Armazenar no cache
            this.addToCache(this.geocodeCache, cacheKey, coordinates);
            
            console.log('Coordenadas encontradas:', coordinates);
            return coordinates;
            
        } catch (error) {
            console.error('Erro na geocodificação:', error);
            throw new Error(`Falha ao geocodificar endereço: ${error.message}`);
        }
    }

    /**
     * Converte múltiplos endereços em coordenadas com otimização
     * @param {Array} addresses - Array de endereços
     * @returns {Promise<Array>} Array de coordenadas
     */
    async geocodeMultipleAddresses(addresses) {
        console.log(`Geocodificando ${addresses.length} endereços...`);
        
        const results = [];
        const errors = [];
        
        // Filtrar endereços já em cache
        const uncachedAddresses = [];
        const cachedResults = [];
        
        addresses.forEach((address, index) => {
            const cacheKey = address.toLowerCase().trim();
            if (this.geocodeCache.has(cacheKey)) {
                cachedResults.push({
                    index: index,
                    address: address,
                    coordinates: this.geocodeCache.get(cacheKey),
                    success: true,
                    fromCache: true
                });
            } else {
                uncachedAddresses.push({ address, index });
            }
        });
        
        console.log(`${cachedResults.length} endereços encontrados no cache, ${uncachedAddresses.length} precisam ser geocodificados`);
        
        // Processar endereços não em cache em lotes otimizados
        for (let i = 0; i < uncachedAddresses.length; i += this.batchSize) {
            const batch = uncachedAddresses.slice(i, i + this.batchSize);
            
            const batchPromises = batch.map(async (item) => {
                try {
                    const coords = await this.geocodeAddress(item.address);
                    return {
                        index: item.index,
                        address: item.address,
                        coordinates: coords,
                        success: true,
                        fromCache: false
                    };
                } catch (error) {
                    console.error(`Erro ao geocodificar ${item.address}:`, error);
                    return {
                        index: item.index,
                        address: item.address,
                        error: error.message,
                        success: false,
                        fromCache: false
                    };
                }
            });
            
            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
            
            // Delay otimizado entre lotes
            if (i + this.batchSize < uncachedAddresses.length) {
                await new Promise(resolve => setTimeout(resolve, this.geocodeDelay));
            }
        }
        
        // Combinar resultados do cache e novos
        const allResults = [...cachedResults, ...results].sort((a, b) => a.index - b.index);
        const successful = allResults.filter(r => r.success);
        const failed = allResults.filter(r => !r.success);
        
        console.log(`Geocodificação concluída: ${successful.length} sucessos (${cachedResults.length} do cache), ${failed.length} falhas`);
        
        if (failed.length > 0) {
            console.warn('Endereços que falharam:', failed.map(f => f.address));
        }
        
        return {
            successful: successful,
            failed: failed,
            all: allResults
        };
    }

    /**
     * Calcula rota otimizada usando OSRM API
     * @param {Array} coordinates - Array de coordenadas [lat, lng]
     * @param {Object} options - Opções de roteamento
     * @returns {Promise<Object>} Dados da rota
     */
    async calculateRoute(coordinates, options = {}) {
        try {
            console.log('Calculando rota com OSRM...');
            
            if (coordinates.length < 2) {
                throw new Error('É necessário pelo menos 2 pontos para calcular uma rota');
            }
            
            // Converter coordenadas para formato OSRM (lng, lat)
            const osrmCoordinates = coordinates.map(coord => 
                `${coord.lng},${coord.lat}`
            ).join(';');
            
            const profile = options.profile || 'driving';
            const url = `${this.osrmBaseUrl}/route/v1/${profile}/${osrmCoordinates}?overview=full&geometries=geojson`;
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Erro na API OSRM: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.code !== 'Ok') {
                throw new Error(`Erro no roteamento: ${data.message}`);
            }
            
            const route = data.routes[0];
            const waypoints = data.waypoints;
            
            const routeData = {
                geometry: route.geometry,
                distance: route.distance,
                duration: route.duration,
                waypoints: waypoints.map((wp, index) => ({
                    index: index,
                    coordinates: [wp.location[1], wp.location[0]], // Converter para [lat, lng]
                    distance: wp.distance,
                    duration: wp.duration
                })),
                summary: {
                    totalDistance: `${(route.distance / 1000).toFixed(2)} km`,
                    totalDuration: `${Math.round(route.duration / 60)} min`
                }
            };
            
            console.log('Rota calculada:', routeData.summary);
            return routeData;
            
        } catch (error) {
            console.error('Erro no cálculo da rota:', error);
            throw new Error(`Falha ao calcular rota: ${error.message}`);
        }
    }

    /**
     * Inicializa o mapa Leaflet centralizado no ponto inicial
     * @param {string} containerId - ID do elemento HTML
     * @param {Object} options - Opções do mapa
     * @param {Object} startPoint - Ponto inicial para centralização
     * @returns {L.Map} Instância do mapa
     */
    initMap(containerId, options = {}, startPoint = null) {
        try {
            console.log('Inicializando mapa Leaflet...');
            
            // Determinar centro do mapa
            let center = options.center || [-23.5505, -46.6333]; // Default São Paulo
            
            if (startPoint && startPoint.coordinates) {
                center = [startPoint.coordinates.lat, startPoint.coordinates.lng];
                console.log(`Mapa centralizado no ponto inicial: ${center}`);
            }
            
            const defaultOptions = {
                center: center,
                zoom: 12,
                zoomControl: true,
                attributionControl: true
            };
            
            const mapOptions = { ...defaultOptions, ...options };
            
            // Remover mapa existente se houver
            if (this.map) {
                this.map.remove();
            }
            
            // Criar novo mapa
            this.map = L.map(containerId, mapOptions);
            
            // Adicionar camada de tiles do OpenStreetMap
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 19
            }).addTo(this.map);
            
            console.log('Mapa inicializado com sucesso');
            return this.map;
            
        } catch (error) {
            console.error('Erro ao inicializar mapa:', error);
            throw new Error(`Falha ao inicializar mapa: ${error.message}`);
        }
    }

    /**
     * Adiciona marcadores ao mapa com otimização de performance
     * @param {Array} points - Array de pontos com coordenadas e dados
     * @param {Object} options - Opções dos marcadores
     */
    addMarkers(points, options = {}) {
        try {
            console.log(`Adicionando ${points.length} marcadores ao mapa...`);
            
            // Limpar marcadores existentes
            this.clearMarkers();
            
            const defaultOptions = {
                icon: L.divIcon({
                    className: 'custom-marker',
                    html: '<div class="marker-content"><i class="fas fa-map-marker-alt"></i></div>',
                    iconSize: [30, 30],
                    iconAnchor: [15, 30]
                }),
                popup: true,
                cluster: false // Desabilitar clustering por padrão para melhor performance
            };
            
            const markerOptions = { ...defaultOptions, ...options };
            
            // Criar ícones otimizados por tipo
            const iconCache = new Map();
            const getIcon = (type) => {
                if (!iconCache.has(type)) {
                    const iconConfig = this.getIconConfig(type);
                    iconCache.set(type, L.divIcon(iconConfig));
                }
                return iconCache.get(type);
            };
            
            // Adicionar marcadores em lote para melhor performance
            const markersToAdd = [];
            
            points.forEach((point, index) => {
                if (!point.coordinates || !point.coordinates.lat || !point.coordinates.lng) {
                    console.warn(`Coordenadas inválidas para ponto ${index}:`, point);
                    return;
                }
                
                const icon = getIcon(point.type || 'default');
                const marker = L.marker([point.coordinates.lat, point.coordinates.lng], { icon });
                
                // Adicionar popup se especificado
                if (markerOptions.popup && point.name) {
                    const popupContent = this.createPopupContent(point, index + 1);
                    marker.bindPopup(popupContent);
                }
                
                markersToAdd.push(marker);
            });
            
            // Adicionar todos os marcadores de uma vez
            markersToAdd.forEach(marker => {
                marker.addTo(this.map);
                this.markers.push(marker);
            });
            
            console.log(`${this.markers.length} marcadores adicionados`);
            
        } catch (error) {
            console.error('Erro ao adicionar marcadores:', error);
            throw new Error(`Falha ao adicionar marcadores: ${error.message}`);
        }
    }

    /**
     * Obtém configuração de ícone por tipo
     * @param {string} type - Tipo do marcador
     * @returns {Object} Configuração do ícone
     */
    getIconConfig(type) {
        const configs = {
            start: {
                className: 'custom-marker marker-start',
                html: '<div class="marker-content"><i class="fas fa-play"></i></div>',
                iconSize: [30, 30],
                iconAnchor: [15, 30]
            },
            end: {
                className: 'custom-marker marker-end',
                html: '<div class="marker-content"><i class="fas fa-flag-checkered"></i></div>',
                iconSize: [30, 30],
                iconAnchor: [15, 30]
            },
            student: {
                className: 'custom-marker marker-student',
                html: '<div class="marker-content"><i class="fas fa-user"></i></div>',
                iconSize: [30, 30],
                iconAnchor: [15, 30]
            },
            default: {
                className: 'custom-marker',
                html: '<div class="marker-content"><i class="fas fa-map-marker-alt"></i></div>',
                iconSize: [30, 30],
                iconAnchor: [15, 30]
            }
        };
        
        return configs[type] || configs.default;
    }

    /**
     * Cria conteúdo do popup para marcadores
     * @param {Object} point - Dados do ponto
     * @param {number} order - Ordem na rota
     * @returns {string} HTML do popup
     */
    createPopupContent(point, order) {
        const content = `
            <div class="marker-popup">
                <div class="marker-header">
                    <strong>${order}. ${point.name || 'Ponto'}</strong>
                </div>
                <div class="marker-body">
                    <p class="mb-1"><i class="fas fa-map-marker-alt me-1"></i>${point.address || 'Endereço não disponível'}</p>
                    ${point.phone ? `<p class="mb-1"><i class="fas fa-phone me-1"></i>${point.phone}</p>` : ''}
                    ${point.coordinates ? `
                        <p class="mb-0 text-muted small">
                            <i class="fas fa-crosshairs me-1"></i>
                            ${point.coordinates.lat.toFixed(6)}, ${point.coordinates.lng.toFixed(6)}
                        </p>
                    ` : ''}
                </div>
            </div>
        `;
        return content;
    }

    /**
     * Desenha rota no mapa
     * @param {Object} routeData - Dados da rota
     * @param {Object} options - Opções de estilo
     */
    drawRoute(routeData, options = {}) {
        try {
            console.log('Desenhando rota no mapa...');
            
            // Remover rota existente
            this.clearRoute();
            
            const defaultOptions = {
                color: '#3388ff',
                weight: 4,
                opacity: 0.8,
                dashArray: null
            };
            
            const routeOptions = { ...defaultOptions, ...options };
            
            if (!routeData.geometry || !routeData.geometry.coordinates) {
                throw new Error('Dados de geometria da rota inválidos');
            }
            
            // Converter coordenadas para formato Leaflet [lat, lng]
            const coordinates = routeData.geometry.coordinates.map(coord => [coord[1], coord[0]]);
            
            // Criar linha da rota
            this.routeLayer = L.polyline(coordinates, routeOptions);
            this.routeLayer.addTo(this.map);
            
            // Ajustar visualização para mostrar toda a rota
            if (this.markers.length > 0) {
                const group = new L.featureGroup([this.routeLayer, ...this.markers]);
                this.map.fitBounds(group.getBounds().pad(0.1));
            } else {
                this.map.fitBounds(this.routeLayer.getBounds().pad(0.1));
            }
            
            console.log('Rota desenhada com sucesso');
            
        } catch (error) {
            console.error('Erro ao desenhar rota:', error);
            throw new Error(`Falha ao desenhar rota: ${error.message}`);
        }
    }

    /**
     * Limpa marcadores do mapa
     */
    clearMarkers() {
        this.markers.forEach(marker => {
            this.map.removeLayer(marker);
        });
        this.markers = [];
    }

    /**
     * Limpa rota do mapa
     */
    clearRoute() {
        if (this.routeLayer) {
            this.map.removeLayer(this.routeLayer);
            this.routeLayer = null;
        }
    }

    /**
     * Limpa todos os elementos do mapa
     */
    clearMap() {
        this.clearMarkers();
        this.clearRoute();
    }

    /**
     * Calcula e exibe rota completa para alunos com otimização
     * @param {Array} students - Array de alunos
     * @param {Object} startPoint - Ponto de partida
     * @param {Object} endPoint - Ponto de chegada
     * @param {string} mapContainerId - ID do container do mapa
     * @returns {Promise<Object>} Dados da rota calculada
     */
    async calculateAndDisplayRoute(students, startPoint, endPoint, mapContainerId) {
        try {
            console.log('Calculando rota completa para alunos...');
            
            // Construir endereços dos alunos de forma otimizada
            const studentAddresses = students.map(student => {
                const address = `${student.address}, ${student.number}`;
                if (student.neighborhood) {
                    return `${address}, ${student.neighborhood}`;
                }
                return `${address}, ${student.city}`;
            });
            
            // Adicionar pontos de partida e chegada
            const allAddresses = [
                this.buildFullAddress(startPoint),
                ...studentAddresses,
                this.buildFullAddress(endPoint)
            ];
            
            console.log('Endereços para geocodificação:', allAddresses);
            
            // Geocodificar todos os endereços com cache
            const geocodeResults = await this.geocodeMultipleAddresses(allAddresses);
            
            if (geocodeResults.failed.length > 0) {
                console.warn('Alguns endereços falharam na geocodificação:', geocodeResults.failed);
            }
            
            // Preparar coordenadas para roteamento
            const coordinates = geocodeResults.successful.map(result => result.coordinates);
            
            if (coordinates.length < 2) {
                throw new Error('Não foi possível obter coordenadas suficientes para calcular a rota');
            }
            
            // Calcular rota
            const routeData = await this.calculateRoute(coordinates);
            
            // Preparar pontos para exibição
            const displayPoints = geocodeResults.successful.map((result, index) => {
                const isStart = index === 0;
                const isEnd = index === geocodeResults.successful.length - 1;
                const studentIndex = index - 1;
                
                return {
                    coordinates: result.coordinates,
                    name: isStart ? 'Ponto de Partida' : 
                          isEnd ? 'Ponto de Chegada' : 
                          students[studentIndex]?.name || `Ponto ${index}`,
                    address: result.address,
                    phone: students[studentIndex]?.phone || '',
                    order: index,
                    type: isStart ? 'start' : isEnd ? 'end' : 'student'
                };
            });
            
            // Inicializar mapa centralizado no ponto inicial
            const startPointData = displayPoints.find(p => p.type === 'start');
            if (!this.map) {
                this.initMap(mapContainerId, {}, startPointData);
            }
            
            // Adicionar marcadores otimizados
            this.addMarkers(displayPoints);
            
            // Desenhar rota
            this.drawRoute(routeData);
            
            // Ajustar visualização para mostrar toda a rota
            this.fitMapToRoute(displayPoints, routeData);
            
            // Retornar dados completos
            const completeRouteData = {
                ...routeData,
                points: displayPoints,
                geocodeResults: geocodeResults,
                summary: {
                    ...routeData.summary,
                    totalPoints: displayPoints.length,
                    studentsCount: students.length,
                    successfulGeocodes: geocodeResults.successful.length,
                    failedGeocodes: geocodeResults.failed.length
                }
            };
            
            console.log('Rota completa calculada:', completeRouteData.summary);
            return completeRouteData;
            
        } catch (error) {
            console.error('Erro ao calcular rota completa:', error);
            throw new Error(`Falha ao calcular rota: ${error.message}`);
        }
    }

    /**
     * Ajusta o mapa para mostrar toda a rota
     * @param {Array} points - Pontos da rota
     * @param {Object} routeData - Dados da rota
     */
    fitMapToRoute(points, routeData) {
        try {
            if (!this.map || !points || points.length === 0) {
                return;
            }

            // Criar grupo com todos os elementos
            const group = new L.featureGroup();
            
            // Adicionar marcadores ao grupo
            this.markers.forEach(marker => group.addLayer(marker));
            
            // Adicionar rota ao grupo se existir
            if (this.routeLayer) {
                group.addLayer(this.routeLayer);
            }
            
            // Ajustar visualização para mostrar todo o grupo
            if (group.getLayers().length > 0) {
                this.map.fitBounds(group.getBounds().pad(0.1));
            }
            
            console.log('Mapa ajustado para mostrar toda a rota');
            
        } catch (error) {
            console.error('Erro ao ajustar mapa:', error);
        }
    }

    /**
     * Constrói endereço completo a partir de dados do ponto
     * @param {Object} point - Dados do ponto
     * @returns {string} Endereço completo
     */
    buildFullAddress(point) {
        if (!point || !point.address || !point.number || !point.city) {
            throw new Error('Dados do ponto incompletos');
        }
        
        let address = `${point.address}, ${point.number}`;
        if (point.neighborhood) {
            address += `, ${point.neighborhood}`;
        }
        address += `, ${point.city}`;
        if (point.state) {
            address += ` - ${point.state}`;
        }
        
        return address;
    }

    /**
     * Obtém informações do mapa atual
     * @returns {Object} Informações do mapa
     */
    getMapInfo() {
        if (!this.map) {
            return { initialized: false };
        }
        
        return {
            initialized: true,
            center: this.map.getCenter(),
            zoom: this.map.getZoom(),
            markersCount: this.markers.length,
            hasRoute: !!this.routeLayer
        };
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.OSMIntegration = OSMIntegration;
}
