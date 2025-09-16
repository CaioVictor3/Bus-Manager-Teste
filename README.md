# Bus Manager - Gerenciador de Rotas de Transporte

Sistema web mobile-first para gerenciamento de rotas de transporte de alunos por topiqueiros.

## 🚌 Funcionalidades

### 1. Sistema de Autenticação
- **Cadastro de Topiqueiro**: Nome, telefone, email, senha e modelo do veículo
- **Login**: Acesso seguro ao sistema
- **Persistência**: Dados salvos localmente no navegador

### 2. Gerenciamento de Alunos
- **Cadastro Completo**: Nome, telefone e endereço completo
- **Validação de CEP**: Busca automática via API ViaCEP
- **Endereço de Volta**: Opcional (usa endereço de ida se não informado)
- **Controle de Presença**: Marcar se aluno vai ou não à aula

### 3. Sistema de Rotas
- **Configuração**: Ponto de partida e chegada
- **Cálculo Otimizado**: Rota mais eficiente considerando presença dos alunos
- **Integração Google Maps**: Visualização e navegação
- **Ordem de Coleta**: Lista otimizada de paradas

### 4. Interface Mobile
- **Design Responsivo**: Otimizado para dispositivos móveis
- **Bootstrap 5**: Framework moderno e responsivo
- **Font Awesome**: Ícones intuitivos
- **UX Intuitiva**: Interface limpa e fácil de usar

## 🛠️ Tecnologias Utilizadas

- **HTML5**: Estrutura semântica
- **CSS3**: Estilização responsiva e animações
- **JavaScript ES6+**: Lógica da aplicação
- **Bootstrap 5**: Framework CSS responsivo
- **Font Awesome**: Biblioteca de ícones
- **Google Maps API**: Mapas e navegação
- **ViaCEP API**: Validação de endereços

## 🚀 Instalação Rápida

1. **Baixe os arquivos** para uma pasta local
2. **Configure a API do Google Maps**:
   - Copie `config.example.js` para `config.js`
   - Edite `config.js` e adicione sua chave da API do Google Maps
3. **Abra o arquivo** `index.html` no seu navegador
4. **Pronto!** O sistema está funcionando

## 📱 Como Usar

### 1. Primeiro Acesso
1. Abra o arquivo `index.html` no navegador
2. Clique na aba "Cadastro"
3. Preencha seus dados como topiqueiro
4. Clique em "Cadastrar"
5. **Importante**: Seus dados serão salvos automaticamente no navegador

### 2. Login
1. Na aba "Login", digite email e senha
2. Clique em "Entrar"
3. **Sessão Persistente**: Se você fechar e reabrir o navegador, continuará logado

### 3. Configurar Rotas
1. Defina o ponto de partida (sua localização)
2. Defina o ponto de chegada (ex: faculdade)

### 4. Cadastrar Alunos
1. Clique em "Novo Aluno"
2. Preencha os dados do aluno
3. Digite o CEP e clique na lupa para buscar endereço
4. Ajuste bairro e número se necessário
5. Clique em "Salvar Aluno"

### 5. Gerenciar Presença
1. Na lista de alunos, marque quem vai à aula
2. Use os botões "Vai" ou "Não vai"

### 6. Calcular e Iniciar Rota
1. Clique em "Ver Rota" para visualizar no mapa
2. Clique em "Iniciar Rota" para calcular a rota otimizada
3. Use "Iniciar Navegação" para abrir no Google Maps

## ⚙️ Configuração

### Google Maps API
Para usar a funcionalidade de mapas, você precisa de uma chave da API do Google Maps:

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um projeto ou selecione um existente
3. Ative a API "Maps JavaScript API"
4. Crie uma chave de API
5. Copie o arquivo `config.example.js` para `config.js`
6. Substitua `YOUR_API_KEY_HERE` no arquivo `config.js` pela sua chave

```javascript
// No arquivo config.js
GOOGLE_MAPS_API_KEY: 'SUA_CHAVE_AQUI',
```

**Importante**: Mantenha sua chave de API segura e não a compartilhe publicamente!

### ViaCEP API
A validação de CEP usa a API gratuita ViaCEP. Não requer configuração adicional.

## 📁 Estrutura de Arquivos

```
Bus Manager/
├── index.html          # Página principal
├── style.css           # Estilos personalizados
├── script.js           # Lógica da aplicação
├── config.js           # Configurações (criar a partir do exemplo)
├── config.example.js   # Exemplo de configuração
└── README.md           # Este arquivo
```

## 🔧 Funcionalidades Técnicas

### Armazenamento Local
- **Cadastro de Topiqueiros**: Salvo no `localStorage` com validação de email único
- **Cadastro de Alunos**: Persistência automática com dados completos
- **Sessão Ativa**: Driver logado mantém sessão entre recarregamentos
- **Validação de Login**: Verificação automática de credenciais salvas
- **Recuperação de Dados**: Carregamento automático ao iniciar aplicação

### Validação de Dados
- CEP validado via API ViaCEP
- Campos obrigatórios verificados
- Formatação automática de telefone e CEP

### Responsividade
- Design mobile-first
- Breakpoints para tablet e desktop
- Interface adaptável a diferentes tamanhos de tela

### Performance
- Carregamento otimizado
- Lazy loading de componentes
- Cache de dados local

## 💾 Gerenciamento de Dados

### Dados Salvos Automaticamente
- **Topiqueiros**: Nome, telefone, email, senha e veículo
- **Alunos**: Dados completos incluindo endereços e presença
- **Sessão Ativa**: Driver logado mantém acesso automático
- **Configurações**: Preferências e configurações da aplicação

### Limpeza de Dados
Para limpar todos os dados salvos (útil para testes):
1. Abra o console do navegador (F12)
2. Digite: `clearAllData()`
3. Pressione Enter

### Backup de Dados
Os dados ficam salvos no navegador local. Para fazer backup:
1. Acesse as Ferramentas do Desenvolvedor (F12)
2. Vá em "Application" > "Local Storage"
3. Copie os dados das chaves do Bus Manager

## 🚀 Melhorias Futuras

- [ ] Sincronização em nuvem
- [ ] Notificações push
- [ ] Relatórios de rotas
- [ ] Integração com GPS
- [ ] Chat com alunos
- [ ] Histórico de rotas
- [ ] Múltiplos veículos por topiqueiro

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique se todas as APIs estão configuradas
2. Teste em diferentes navegadores
3. Verifique o console do navegador para erros

## 📄 Licença

Este projeto é de uso livre para fins educacionais e comerciais.

