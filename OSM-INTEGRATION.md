# Integração com OpenStreetMap - Bus Manager

## Visão Geral

Este documento descreve a integração com OpenStreetMap implementada no Bus Manager, que permite:

1. **Geocodificação**: Converter endereços em coordenadas usando a API Nominatim
2. **Roteamento**: Calcular rotas otimizadas usando a API OSRM
3. **Visualização**: Exibir mapas interativos com Leaflet.js
4. **Marcadores**: Mostrar pontos de coleta com informações dos alunos

## Arquivos Modificados

### Novos Arquivos
- `osm-integration.js` - Módulo principal de integração com OpenStreetMap
- `OSM-INTEGRATION.md` - Esta documentação

### Arquivos Atualizados
- `index.html` - Incluído o novo módulo OSM
- `script.js` - Integrado com o novo sistema OSM
- `style.css` - Adicionados estilos para marcadores personalizados
- `config.js` - Adicionadas configurações específicas do OSM

## Funcionalidades Implementadas

### 1. Geocodificação (Nominatim API)
```javascript
// Converter endereço em coordenadas
const coordinates = await osmIntegration.geocodeAddress('Rua das Flores, 123, São Paulo');

// Geocodificar múltiplos endereços
const results = await osmIntegration.geocodeMultipleAddresses([
    'Endereço 1',
    'Endereço 2',
    'Endereço 3'
]);
```

### 2. Roteamento (OSRM API)
```javascript
// Calcular rota entre pontos
const route = await osmIntegration.calculateRoute([
    { lat: -23.5505, lng: -46.6333 },
    { lat: -23.5506, lng: -46.6334 }
]);
```

### 3. Visualização de Mapa (Leaflet.js)
```javascript
// Inicializar mapa
const map = osmIntegration.initMap('map-container', {
    center: [-23.5505, -46.6333],
    zoom: 12
});

// Adicionar marcadores
osmIntegration.addMarkers([
    {
        coordinates: { lat: -23.5505, lng: -46.6333 },
        name: 'Aluno 1',
        address: 'Rua das Flores, 123'
    }
]);

// Desenhar rota
osmIntegration.drawRoute(routeData);
```

### 4. Rota Completa para Alunos
```javascript
// Calcular e exibir rota completa
const routeData = await osmIntegration.calculateAndDisplayRoute(
    students,        // Array de alunos
    startPoint,      // Ponto de partida
    endPoint,        // Ponto de chegada
    'map-container'  // ID do container do mapa
);
```

## Configurações

### Configurações OSM (config.js)
```javascript
OSM: {
    nominatimUrl: 'https://nominatim.openstreetmap.org',
    osrmUrl: 'https://router.project-osrm.org',
    userAgent: 'BusManager/1.0 (Transporte Escolar)',
    geocodeDelay: 1000, // Delay entre requisições (ms)
    maxRetries: 3,
    countryCode: 'br' // Código do país para geocodificação
}
```

## Como Usar

### 1. Cadastrar Alunos
- Use o formulário existente para cadastrar alunos com endereços completos
- O sistema automaticamente geocodificará os endereços

### 2. Configurar Pontos de Rota
- Configure o ponto de partida (geralmente a escola)
- Configure o ponto de chegada (destino final)

### 3. Calcular Rota
- Clique em "Iniciar Rota" para calcular a rota otimizada
- O sistema usará OpenStreetMap para geocodificação e roteamento

### 4. Visualizar Rota
- Clique em "Ver Rota" para visualizar no mapa interativo
- Marcadores coloridos mostram cada ponto da rota
- Linha azul conecta todos os pontos na ordem otimizada

## Estrutura de Dados

### Dados de Rota Retornados
```javascript
{
    geometry: {
        coordinates: [[lng, lat], [lng, lat], ...]
    },
    distance: 15000, // metros
    duration: 1800,   // segundos
    points: [
        {
            coordinates: { lat: -23.5505, lng: -46.6333 },
            name: 'Ponto de Partida',
            address: 'Rua das Flores, 123',
            type: 'start',
            order: 0
        },
        {
            coordinates: { lat: -23.5506, lng: -46.6334 },
            name: 'João Silva',
            address: 'Rua das Palmeiras, 456',
            phone: '(11) 99999-9999',
            type: 'student',
            order: 1
        }
    ],
    summary: {
        totalDistance: '15.0 km',
        totalDuration: '30 min',
        totalPoints: 5,
        studentsCount: 3
    }
}
```

## Tratamento de Erros

### Geocodificação
- Endereços não encontrados são reportados mas não interrompem o processo
- Sistema tenta geocodificar todos os endereços disponíveis
- Relatório de sucessos e falhas é exibido

### Roteamento
- Se não conseguir calcular rota, exibe mensagem de erro
- Fallback para sistema anterior se disponível

### Mapa
- Se falhar ao carregar mapa OSM, usa sistema padrão
- Marcadores são adicionados apenas se coordenadas forem válidas

## Limitações e Considerações

### Rate Limits
- Nominatim tem limite de 1 requisição por segundo
- Sistema implementa delay automático entre requisições
- Processamento em lotes para otimizar performance

### Precisão
- Geocodificação depende da qualidade dos dados do OpenStreetMap
- Endereços incompletos podem resultar em localizações imprecisas
- Sistema prioriza resultados com maior "importance" score

### Conectividade
- Requer conexão com internet para funcionar
- APIs externas podem estar temporariamente indisponíveis
- Sistema implementa retry automático em caso de falhas

## Melhorias Futuras

1. **Cache de Geocodificação**: Armazenar resultados para evitar requisições repetidas
2. **Otimização de Rotas**: Implementar algoritmos mais sofisticados
3. **Múltiplos Perfis**: Suporte a diferentes tipos de veículo
4. **Histórico de Rotas**: Salvar rotas calculadas anteriormente
5. **Exportação**: Permitir exportar rotas para outros formatos

## Suporte

Para dúvidas ou problemas com a integração OpenStreetMap:

1. Verifique o console do navegador para mensagens de erro
2. Confirme se os endereços estão completos e válidos
3. Teste a conectividade com as APIs externas
4. Consulte a documentação oficial do OpenStreetMap

## Referências

- [Nominatim API](https://nominatim.org/release-docs/develop/api/Overview/)
- [OSRM API](http://project-osrm.org/docs/v5.24.0/api/)
- [Leaflet.js](https://leafletjs.com/)
- [OpenStreetMap](https://www.openstreetmap.org/)
