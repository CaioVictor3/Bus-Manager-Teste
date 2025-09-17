# 🧪 Guia de Testes - Bus Manager

Este guia mostra como testar todas as funcionalidades do sistema de gerenciamento de rotas.

## 🚀 Teste Básico de Funcionamento

### 1. Teste de Cadastro e Login
1. **Abra o sistema** no navegador
2. **Cadastre um topiqueiro**:
   - Nome: João Silva
   - Telefone: (11) 99999-9999
   - Email: joao@teste.com
   - Senha: 123456
   - Veículo: Van Sprinter 2020
3. **Faça login** com as credenciais criadas
4. **Verifique** se a tela principal aparece automaticamente

### 2. Teste de Persistência
1. **Feche o navegador** completamente
2. **Reabra o sistema**
3. **Verifique** se você ainda está logado
4. **Confirme** que os dados foram mantidos

### 3. Teste de Cadastro de Alunos
1. **Cadastre alguns alunos**:
   - Aluno 1: Maria Santos, (11) 88888-8888, CEP: 01310-100
   - Aluno 2: Pedro Costa, (11) 77777-7777, CEP: 04038-001
   - Aluno 3: Ana Lima, (11) 66666-6666, CEP: 22071-900
2. **Use a busca de CEP** para preencher endereços automaticamente
3. **Verifique** se os alunos aparecem na lista

### 4. Teste de Controle de Presença
1. **Marque alguns alunos** como "não vai"
2. **Verifique** se a cor dos cards muda
3. **Teste** alternar entre "vai" e "não vai"

### 5. Teste de Edição de Alunos
1. **Clique no menu** (três pontos) de um aluno
2. **Selecione "Editar"**
3. **Modifique** alguns dados do aluno
4. **Salve** as alterações
5. **Verifique** se as mudanças foram aplicadas

### 6. Teste de Exclusão de Alunos
1. **Clique no menu** (três pontos) de um aluno
2. **Selecione "Excluir"**
3. **Confirme** a exclusão na mensagem
4. **Verifique** se o aluno foi removido da lista

### 7. Teste de Rotas com Modais
1. **Configure ponto de partida**:
   - Clique no botão "Ponto de Partida"
   - Digite um CEP válido (ex: 01310-100)
   - Clique na lupa para buscar endereço
   - Preencha número e ajuste se necessário
   - Clique em "Salvar Ponto de Partida"
2. **Configure ponto de chegada**:
   - Clique no botão "Ponto de Chegada"
   - Digite um CEP válido (ex: 04038-001)
   - Clique na lupa para buscar endereço
   - Preencha número e ajuste se necessário
   - Clique em "Salvar Ponto de Chegada"
3. **Verifique** se os endereços aparecem na tela principal
4. **Clique** em "Ver Rota" (requer API do Google Maps)
5. **Teste** o cálculo de rota otimizada

## 🔧 Testes Técnicos

### Verificar Dados no LocalStorage
1. **Abra o console** do navegador (F12)
2. **Digite** no console:
   ```javascript
   // Ver todos os dados salvos
   console.log('Drivers:', JSON.parse(localStorage.getItem('busManager_drivers')));
   console.log('Alunos:', JSON.parse(localStorage.getItem('busManager_students')));
   console.log('Driver Atual:', JSON.parse(localStorage.getItem('busManager_currentDriver')));
   ```

### Limpar Dados de Teste
1. **No console** do navegador:
   ```javascript
   // Limpar todos os dados
   clearAllData();
   ```

### Verificar Logs do Sistema
1. **Abra o console** do navegador (F12)
2. **Recarregue** a página
3. **Verifique** os logs de carregamento:
   ```
   === DADOS SALVOS NO LOCALSTORAGE ===
   Drivers cadastrados: X
   Alunos cadastrados: Y
   Driver logado: Nome do Driver
   =====================================
   ```

## 🐛 Testes de Erro

### Teste de Validação de Email
1. **Tente cadastrar** com email já existente
2. **Verifique** se aparece mensagem de erro

### Teste de Validação de CEP
1. **Digite CEP inválido** (ex: 12345)
2. **Clique** na lupa de busca
3. **Verifique** se aparece mensagem de erro

### Teste de Validação de Endereços de Rota
1. **Deixe** campos obrigatórios vazios (endereço, número, cidade) nos modais
2. **Tente** salvar ponto de rota
3. **Verifique** se aparece mensagem de erro específica
4. **Teste** com CEP inválido nos modais de rota
5. **Verifique** se a busca de CEP funciona corretamente nos modais

### Teste de Modais de Rota
1. **Abra** modal de ponto de partida
2. **Preencha** dados e salve
3. **Verifique** se o endereço aparece na tela principal
4. **Teste** o mesmo para ponto de chegada
5. **Verifique** se os dados persistem após recarregar a página

### Teste de Campos Obrigatórios
1. **Tente salvar aluno** sem preencher campos obrigatórios
2. **Verifique** se aparece mensagem de erro

## 📱 Testes Mobile

### Teste de Responsividade
1. **Abra** o sistema no celular
2. **Teste** todas as funcionalidades
3. **Verifique** se a interface está adequada

### Teste de Touch
1. **Teste** os botões de presença
2. **Verifique** se são fáceis de tocar
3. **Teste** a navegação entre telas

## 🔄 Testes de Fluxo Completo

### Fluxo 1: Primeiro Uso
1. Cadastrar topiqueiro
2. Fazer login
3. Cadastrar alunos
4. Configurar rotas
5. Marcar presenças
6. Calcular rota

### Fluxo 2: Uso Diário
1. Abrir sistema (já logado)
2. Verificar alunos cadastrados
3. Marcar presenças do dia
4. Calcular rota otimizada
5. Iniciar navegação

### Fluxo 3: Gerenciamento
1. Adicionar novos alunos
2. Editar dados existentes
3. Gerenciar presenças
4. Recalcular rotas

## ✅ Checklist de Validação

- [ ] Cadastro de topiqueiro funciona
- [ ] Login valida credenciais corretamente
- [ ] Dados persistem entre sessões
- [ ] Cadastro de alunos funciona
- [ ] Busca de CEP funciona
- [ ] Controle de presença funciona
- [ ] **Edição de alunos funciona**
- [ ] **Exclusão de alunos funciona com confirmação**
- [ ] **Lista de alunos ordenada alfabeticamente**
- [ ] **Modais de configuração de rota funcionam**
- [ ] **Validação de endereços de rota funciona**
- [ ] **Busca de CEP para rotas funciona**
- [ ] **Persistência dos pontos de rota funciona**
- [ ] **Interface principal limpa e organizada**
- [ ] Cálculo de rota funciona (com API)
- [ ] Interface é responsiva
- [ ] Notificações aparecem
- [ ] Logout limpa sessão

## 🚨 Problemas Conhecidos

1. **Google Maps**: Requer chave de API válida
2. **ViaCEP**: Pode ter limitações de rate limit
3. **LocalStorage**: Dados ficam no navegador específico
4. **Mobile**: Alguns recursos podem variar entre navegadores

## 📞 Suporte

Se encontrar problemas:
1. Verifique o console do navegador
2. Confirme se as APIs estão configuradas
3. Teste em diferentes navegadores
4. Verifique se o JavaScript está habilitado
