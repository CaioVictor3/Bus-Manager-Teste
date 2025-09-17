// Bus Manager - Sistema de Gerenciamento de Rotas de Transporte
// Autor: Sistema de IA
// Data: 2024

class BusManager {
    constructor() {
        this.currentDriver = null;
        this.students = [];
        this.route = [];
        this.map = null;
        this.orsClient = null;
        this.startPoint = null;
        this.endPoint = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadDriverData();
        this.loadStudentsData();
        this.loadRoutePoints();
        this.showStorageInfo();
        
        if (isOpenRouteServiceConfigured()) {
            this.orsClient = new Openrouteservice.Directions({
                api_key: CONFIG.OPENROUTESERVICE_API_KEY
            });
            this.setupAddressAutocomplete('studentAddress');
            this.setupAddressAutocomplete('modalStartAddress');
            this.setupAddressAutocomplete('modalEndAddress');
        }

        // Verificar se há um driver logado e mostrar tela principal
        if (this.currentDriver) {
            this.showMainScreen();
        }
    }

    setupEventListeners() {
        // Login/Cadastro
        document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('registerForm').addEventListener('submit', (e) => this.handleRegister(e));
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());

        // Cadastro de alunos
        document.getElementById('saveStudentBtn').addEventListener('click', () => this.saveStudent());
        document.getElementById('searchCepBtn').addEventListener('click', () => this.searchCep());
        document.getElementById('studentCep').addEventListener('input', (e) => this.formatCep(e));

        // Busca de CEP para modais de rota
        document.getElementById('searchModalStartCepBtn').addEventListener('click', () => this.searchModalCep('start'));
        document.getElementById('searchModalEndCepBtn').addEventListener('click', () => this.searchModalCep('end'));
        document.getElementById('modalStartCep').addEventListener('input', (e) => this.formatCep(e));
        document.getElementById('modalEndCep').addEventListener('input', (e) => this.formatCep(e));

        // Salvamento dos pontos de rota
        document.getElementById('saveStartPointBtn').addEventListener('click', () => this.saveStartPoint());
        document.getElementById('saveEndPointBtn').addEventListener('click', () => this.saveEndPoint());

        // Controles de rota
        document.getElementById('startRouteBtn').addEventListener('click', () => this.startRoute());
        document.getElementById('viewRouteBtn').addEventListener('click', () => this.viewRoute());
        document.getElementById('startNavigationBtn').addEventListener('click', () => this.startNavigation());
    }

    // Sistema de Autenticação
    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const driver = await this.authenticateDriver(email, password);
            if (driver) {
                this.currentDriver = driver;
                this.saveDriverData(); // Salvar dados do driver logado
                this.showMainScreen();
                this.showToast('Login realizado com sucesso!', 'success');
            } else {
                this.showToast('Email ou senha incorretos!', 'error');
            }
        } catch (error) {
            this.showToast('Erro ao fazer login. Tente novamente.', 'error');
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const driverData = {
            name: document.getElementById('regName').value,
            phone: document.getElementById('regPhone').value,
            email: document.getElementById('regEmail').value,
            password: document.getElementById('regPassword').value,
            vehicle: document.getElementById('regVehicle').value
        };

        try {
            const success = await this.registerDriver(driverData);
            if (success) {
                this.showToast('Cadastro realizado com sucesso! Faça login.', 'success');
                document.getElementById('registerForm').reset();
                // Mudar para aba de login
                document.getElementById('login-tab').click();
            } else {
                this.showToast('Erro ao cadastrar. Email já existe!', 'error');
            }
        } catch (error) {
            this.showToast('Erro ao cadastrar. Tente novamente.', 'error');
        }
    }

    async authenticateDriver(email, password) {
        // Validação de autenticação usando localStorage
        const drivers = this.getStoredDrivers();
        const driver = drivers.find(driver => driver.email === email && driver.password === password);
        
        if (driver) {
            console.log('Driver autenticado:', driver.name);
            return driver;
        }
        
        console.log('Falha na autenticação para email:', email);
        return null;
    }

    async registerDriver(driverData) {
        // Cadastro usando localStorage
        const drivers = this.getStoredDrivers();
        const exists = drivers.find(driver => driver.email === driverData.email);
        
        if (exists) {
            console.log('Email já cadastrado:', driverData.email);
            return false;
        }

        const newDriver = {
            id: Date.now(),
            ...driverData,
            createdAt: new Date().toISOString()
        };

        drivers.push(newDriver);
        localStorage.setItem(CONFIG.STORAGE.driversKey, JSON.stringify(drivers));
        console.log('Driver cadastrado com sucesso:', newDriver.name);
        return true;
    }

    getStoredDrivers() {
        const stored = localStorage.getItem(CONFIG.STORAGE.driversKey);
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (error) {
                console.error('Erro ao carregar drivers do localStorage:', error);
                localStorage.removeItem(CONFIG.STORAGE.driversKey);
                return [];
            }
        }
        return [];
    }

    showMainScreen() {
        document.getElementById('authScreen').classList.add('d-none');
        document.getElementById('mainScreen').classList.remove('d-none');
        this.updateDriverInfo();
        this.renderStudents();
        this.updateRouteButtons();
    }

    logout() {
        this.currentDriver = null;
        localStorage.removeItem(CONFIG.STORAGE.currentDriverKey); // Limpar dados do driver logado
        document.getElementById('authScreen').classList.remove('d-none');
        document.getElementById('mainScreen').classList.add('d-none');
        document.getElementById('loginForm').reset();
        this.showToast('Logout realizado com sucesso!', 'info');
    }

    updateDriverInfo() {
        if (this.currentDriver) {
            document.getElementById('driverInfo').textContent = 
                `${this.currentDriver.name} - ${this.currentDriver.phone}`;
            document.getElementById('vehicleInfo').textContent = 
                `Veículo: ${this.currentDriver.vehicle}`;
        }
    }

    // Sistema de Cadastro de Alunos
    async searchCep() {
        const cep = document.getElementById('studentCep').value.replace(/\D/g, '');
        
        if (cep.length !== 8) {
            this.showToast('CEP deve ter 8 dígitos!', 'error');
            return;
        }

        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();

            if (data.erro) {
                this.showToast('CEP não encontrado!', 'error');
                return;
            }

            // Preencher campos automaticamente
            document.getElementById('studentAddress').value = data.logradouro;
            document.getElementById('studentNeighborhood').value = data.bairro;
            document.getElementById('studentCity').value = data.localidade;
            document.getElementById('studentState').value = data.uf;

            // Marcar CEP como válido
            document.getElementById('studentCep').classList.add('cep-valid');
            this.showToast('Endereço encontrado!', 'success');

        } catch (error) {
            this.showToast('Erro ao buscar CEP. Tente novamente.', 'error');
        }
    }

    async searchModalCep(type) {
        const cepField = type === 'start' ? 'modalStartCep' : 'modalEndCep';
        const cep = document.getElementById(cepField).value.replace(/\D/g, '');
        
        if (cep.length !== 8) {
            this.showToast('CEP deve ter 8 dígitos!', 'error');
            return;
        }

        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();

            if (data.erro) {
                this.showToast('CEP não encontrado!', 'error');
                return;
            }

            // Preencher campos automaticamente baseado no tipo
            const prefix = type === 'start' ? 'modalStart' : 'modalEnd';
            document.getElementById(`${prefix}Address`).value = data.logradouro;
            document.getElementById(`${prefix}Neighborhood`).value = data.bairro;
            document.getElementById(`${prefix}City`).value = data.localidade;
            document.getElementById(`${prefix}State`).value = data.uf;

            // Marcar CEP como válido
            document.getElementById(cepField).classList.add('cep-valid');
            this.showToast(`Endereço de ${type === 'start' ? 'partida' : 'chegada'} encontrado!`, 'success');

        } catch (error) {
            this.showToast('Erro ao buscar CEP. Tente novamente.', 'error');
        }
    }

    formatCep(e) {
        let value = e.target.value.replace(/\D/g, '');
        value = value.replace(/(\d{5})(\d)/, '$1-$2');
        e.target.value = value;
    }

    buildFullAddressFromPoint(point) {
        if (!point || !point.address || !point.number || !point.city) {
            return null;
        }

        // Construir endereço completo
        let fullAddress = `${point.address}, ${point.number}`;
        if (point.neighborhood) {
            fullAddress += `, ${point.neighborhood}`;
        }
        fullAddress += `, ${point.city}`;
        if (point.state) {
            fullAddress += ` - ${point.state}`;
        }

        return fullAddress;
    }

    buildFullAddress(type) {
        const prefix = type === 'start' ? 'start' : 'end';
        const address = document.getElementById(`${prefix}Address`).value.trim();
        const number = document.getElementById(`${prefix}Number`).value.trim();
        const neighborhood = document.getElementById(`${prefix}Neighborhood`).value.trim();
        const city = document.getElementById(`${prefix}City`).value.trim();
        const state = document.getElementById(`${prefix}State`).value.trim();

        // Verificar se todos os campos obrigatórios estão preenchidos
        if (!address || !number || !city) {
            return null;
        }

        // Construir endereço completo
        let fullAddress = `${address}, ${number}`;
        if (neighborhood) {
            fullAddress += `, ${neighborhood}`;
        }
        fullAddress += `, ${city}`;
        if (state) {
            fullAddress += ` - ${state}`;
        }

        return fullAddress;
    }

    saveStartPoint() {
        const pointData = {
            cep: document.getElementById('modalStartCep').value.trim(),
            address: document.getElementById('modalStartAddress').value.trim(),
            number: document.getElementById('modalStartNumber').value.trim(),
            neighborhood: document.getElementById('modalStartNeighborhood').value.trim(),
            city: document.getElementById('modalStartCity').value.trim(),
            state: document.getElementById('modalStartState').value.trim()
        };

        // Validação
        if (!pointData.address || !pointData.number || !pointData.city) {
            this.showToast('Preencha todos os campos obrigatórios!', 'error');
            return;
        }

        this.startPoint = pointData;
        this.updatePointDisplay('start');
        this.saveRoutePoints();
        this.hideModal('startPointModal');
        this.showToast('Ponto de partida salvo com sucesso!', 'success');
    }

    saveEndPoint() {
        const pointData = {
            cep: document.getElementById('modalEndCep').value.trim(),
            address: document.getElementById('modalEndAddress').value.trim(),
            number: document.getElementById('modalEndNumber').value.trim(),
            neighborhood: document.getElementById('modalEndNeighborhood').value.trim(),
            city: document.getElementById('modalEndCity').value.trim(),
            state: document.getElementById('modalEndState').value.trim()
        };

        // Validação
        if (!pointData.address || !pointData.number || !pointData.city) {
            this.showToast('Preencha todos os campos obrigatórios!', 'error');
            return;
        }

        this.endPoint = pointData;
        this.updatePointDisplay('end');
        this.saveRoutePoints();
        this.hideModal('endPointModal');
        this.showToast('Ponto de chegada salvo com sucesso!', 'success');
    }

    updatePointDisplay(type) {
        const point = type === 'start' ? this.startPoint : this.endPoint;
        const displayElement = document.getElementById(`${type}PointDisplay`);
        
        if (point) {
            let displayText = `${point.address}, ${point.number}`;
            if (point.neighborhood) {
                displayText += `, ${point.neighborhood}`;
            }
            displayText += ` - ${point.city}`;
            if (point.state) {
                displayText += `/${point.state}`;
            }
            displayElement.textContent = displayText;
            displayElement.className = 'text-success';
        } else {
            displayElement.textContent = 'Não configurado';
            displayElement.className = 'text-muted';
        }
    }

    hideModal(modalId) {
        const modal = bootstrap.Modal.getInstance(document.getElementById(modalId));
        modal.hide();
        
        // Limpar formulário
        const form = document.querySelector(`#${modalId} form`);
        if (form) {
            form.reset();
            // Limpar validação de CEP
            const cepField = form.querySelector('input[type="text"]');
            if (cepField) {
                cepField.classList.remove('cep-valid', 'cep-invalid');
            }
        }
    }

    saveStudent() {
        const studentData = {
            name: document.getElementById('studentName').value,
            phone: document.getElementById('studentPhone').value,
            cep: document.getElementById('studentCep').value,
            address: document.getElementById('studentAddress').value,
            number: document.getElementById('studentNumber').value,
            neighborhood: document.getElementById('studentNeighborhood').value,
            city: document.getElementById('studentCity').value,
            state: document.getElementById('studentState').value,
            returnAddress: document.getElementById('studentReturnAddress').value || null,
        };

        // Validação básica
        if (!studentData.name || !studentData.phone || !studentData.address) {
            this.showToast('Preencha todos os campos obrigatórios!', 'error');
            return;
        }

        if (this.editingStudentId) {
            // Editando aluno existente
            const studentIndex = this.students.findIndex(s => s.id === this.editingStudentId);
            if (studentIndex !== -1) {
                // Manter dados originais que não devem ser alterados
                const originalStudent = this.students[studentIndex];
                this.students[studentIndex] = {
                    ...originalStudent,
                    ...studentData,
                    updatedAt: new Date().toISOString()
                };
                this.showToast('Aluno atualizado com sucesso!', 'success');
            } else {
                this.showToast('Aluno não encontrado para edição!', 'error');
                return;
            }
        } else {
            // Criando novo aluno
            const newStudent = {
                id: Date.now(),
                ...studentData,
                going: true, // Por padrão, aluno vai à aula
                createdAt: new Date().toISOString()
            };
            this.students.push(newStudent);
            this.showToast('Aluno cadastrado com sucesso!', 'success');
        }

        this.saveStudentsData();
        this.renderStudents();
        this.hideStudentModal();
    }

    hideStudentModal() {
        const modal = bootstrap.Modal.getInstance(document.getElementById('studentModal'));
        modal.hide();
        document.getElementById('studentForm').reset();
        document.getElementById('studentCep').classList.remove('cep-valid', 'cep-invalid');
        
        // Limpar estado de edição
        this.editingStudentId = null;
        
        // Restaurar título e botão originais
        document.querySelector('#studentModal .modal-title').textContent = 'Cadastrar Aluno';
        document.getElementById('saveStudentBtn').textContent = 'Salvar Aluno';
    }

    renderStudents() {
        const container = document.getElementById('studentsList');
        
        if (this.students.length === 0) {
            container.innerHTML = `
                <div class="col-12">
                    <div class="empty-state">
                        <i class="fas fa-user-plus"></i>
                        <h5>Nenhum aluno cadastrado</h5>
                        <p>Clique em "Novo Aluno" para começar</p>
                    </div>
                </div>
            `;
            return;
        }

        // Ordenar alunos alfabeticamente por nome
        const sortedStudents = [...this.students].sort((a, b) => 
            a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
        );

        container.innerHTML = sortedStudents.map(student => `
            <div class="col-12 col-md-6 col-lg-4 mb-3">
                <div class="card student-card ${student.going ? 'selected' : 'not-going'}" data-student-id="${student.id}">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h6 class="card-title mb-0">${student.name}</h6>
                            <div class="d-flex align-items-center gap-2">
                                <span class="status-indicator ${student.going ? 'going' : 'not-going'}"></span>
                                <div class="dropdown">
                                    <button class="btn btn-outline-secondary btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                        <i class="fas fa-ellipsis-v"></i>
                                    </button>
                                    <ul class="dropdown-menu">
                                        <li><a class="dropdown-item" href="#" onclick="busManager.editStudent(${student.id})">
                                            <i class="fas fa-edit me-2"></i>Editar
                                        </a></li>
                                        <li><a class="dropdown-item text-danger" href="#" onclick="busManager.deleteStudent(${student.id})">
                                            <i class="fas fa-trash me-2"></i>Excluir
                                        </a></li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <p class="card-text small text-muted mb-2">
                            <i class="fas fa-phone me-1"></i>${student.phone}
                        </p>
                        <p class="card-text small mb-3">
                            <i class="fas fa-map-marker-alt me-1"></i>
                            ${student.address}, ${student.number}<br>
                            <small class="text-muted">${student.neighborhood} - ${student.city}/${student.state}</small>
                        </p>
                        <div class="d-flex gap-2">
                            <button class="btn btn-success btn-sm presence-btn ${student.going ? 'active' : ''}" 
                                    onclick="busManager.toggleStudentPresence(${student.id})">
                                <i class="fas fa-check me-1"></i>Vai
                            </button>
                            <button class="btn btn-danger btn-sm presence-btn ${!student.going ? 'active' : ''}" 
                                    onclick="busManager.toggleStudentPresence(${student.id}, false)">
                                <i class="fas fa-times me-1"></i>Não vai
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        this.updateRouteButtons();
    }

    toggleStudentPresence(studentId, going = null) {
        const student = this.students.find(s => s.id === studentId);
        if (student) {
            student.going = going !== null ? going : !student.going;
            this.saveStudentsData();
            this.renderStudents();
        }
    }

    editStudent(studentId) {
        const student = this.students.find(s => s.id === studentId);
        if (!student) {
            this.showToast('Aluno não encontrado!', 'error');
            return;
        }

        // Preencher formulário com dados do aluno
        document.getElementById('studentName').value = student.name;
        document.getElementById('studentPhone').value = student.phone;
        document.getElementById('studentCep').value = student.cep;
        document.getElementById('studentAddress').value = student.address;
        document.getElementById('studentNumber').value = student.number;
        document.getElementById('studentNeighborhood').value = student.neighborhood;
        document.getElementById('studentCity').value = student.city;
        document.getElementById('studentState').value = student.state;
        document.getElementById('studentReturnAddress').value = student.returnAddress || '';

        // Marcar CEP como válido se tiver dados
        if (student.cep) {
            document.getElementById('studentCep').classList.add('cep-valid');
        }

        // Armazenar ID do aluno sendo editado
        this.editingStudentId = studentId;

        // Alterar título do modal e botão
        document.querySelector('#studentModal .modal-title').textContent = 'Editar Aluno';
        document.getElementById('saveStudentBtn').textContent = 'Salvar Alterações';

        // Abrir modal
        const modal = new bootstrap.Modal(document.getElementById('studentModal'));
        modal.show();
    }

    deleteStudent(studentId) {
        const student = this.students.find(s => s.id === studentId);
        if (!student) {
            this.showToast('Aluno não encontrado!', 'error');
            return;
        }

        // Mostrar confirmação
        if (confirm(`Tem certeza que deseja excluir o aluno "${student.name}"?\n\nEsta ação não pode ser desfeita.`)) {
            // Remover aluno da lista
            this.students = this.students.filter(s => s.id !== studentId);
            this.saveStudentsData();
            this.renderStudents();
            this.showToast(`Aluno "${student.name}" excluído com sucesso!`, 'success');
        }
    }

    updateRouteButtons() {
        const hasStudents = this.students.length > 0;
        const hasGoingStudents = this.students.some(s => s.going);

        // Validar pontos de rota salvos
        const hasStartPoint = this.startPoint && this.startPoint.address && this.startPoint.number && this.startPoint.city;
        const hasEndPoint = this.endPoint && this.endPoint.address && this.endPoint.number && this.endPoint.city;

        document.getElementById('startRouteBtn').disabled = !(hasStudents && hasStartPoint && hasEndPoint && hasGoingStudents);
        document.getElementById('viewRouteBtn').disabled = !(hasStudents && hasStartPoint && hasEndPoint);
    }

    // Sistema de Rotas
    async startRoute() {
        const goingStudents = this.students.filter(s => s.going);
        if (goingStudents.length === 0) {
            this.showToast('Nenhum aluno marcado para ir à aula!', 'error');
            return;
        }

        // Verificar se os pontos estão configurados
        if (!this.startPoint) {
            this.showToast('Configure o ponto de partida primeiro!', 'error');
            return;
        }

        if (!this.endPoint) {
            this.showToast('Configure o ponto de chegada primeiro!', 'error');
            return;
        }

        // Construir endereços completos
        const startAddress = this.buildFullAddressFromPoint(this.startPoint);
        const endAddress = this.buildFullAddressFromPoint(this.endPoint);

        try {
            this.route = await this.calculateOptimalRoute(startAddress, endAddress, goingStudents);
            this.showToast('Rota calculada com sucesso!', 'success');
            this.viewRoute();
        } catch (error) {
            console.error('Erro ao calcular rota:', error);
            this.showToast(`Erro ao calcular rota: ${error.message}`, 'error');
        }
    }

    async calculateOptimalRoute(startAddress, endAddress, students) {
        if (!this.orsClient) {
            throw new Error('OpenRouteService client não está configurado. Verifique sua chave de API.');
        }

        const geocodeClient = new Openrouteservice.Geocode({ api_key: CONFIG.OPENROUTESERVICE_API_KEY });

        const startCoords = await geocodeClient.geocode({ text: startAddress });
        const endCoords = await geocodeClient.geocode({ text: endAddress });

        const studentWaypoints = await Promise.all(students.map(async (student) => {
            const address = `${student.address}, ${student.number}, ${student.neighborhood}, ${student.city}`;
            const coords = await geocodeClient.geocode({ text: address });
            return {
                coords: coords.features[0].geometry.coordinates,
                student: student
            };
        }));

        const request = {
            coordinates: [
                startCoords.features[0].geometry.coordinates,
                ...studentWaypoints.map(wp => wp.coords),
                endCoords.features[0].geometry.coordinates
            ],
            profile: 'driving-car',
            format: 'geojson'
        };

        const response = await this.orsClient.calculate(request);

        const route = response.routes[0];
        const waypoints = response.waypoints;

        const optimizedWaypoints = waypoints.slice(1, -1).map((wp, index) => {
            const originalIndex = wp.waypoint_index - 1;
            return {
                ...studentWaypoints[originalIndex],
                order: index + 1
            };
        });

        return {
            waypoints: optimizedWaypoints,
            route: route.geometry,
            totalDistance: `${(route.summary.distance / 1000).toFixed(2)} km`,
            estimatedTime: `${Math.round(route.summary.duration / 60)} min`
        };
    }

    displayRouteOnMap() {
        if (this.route && this.route.route) {
            const routeLayer = L.geoJSON(this.route.route).addTo(this.map);
            this.map.fitBounds(routeLayer.getBounds());

            this.route.waypoints.forEach(wp => {
                L.marker([...wp.coords].reverse()).addTo(this.map)
                    .bindPopup(`<b>${wp.order}. ${wp.student.name}</b><br>${wp.student.address}`)
                    .openPopup();
            });
        }
    }

    viewRoute() {
        const modal = new bootstrap.Modal(document.getElementById('routeModal'));
        modal.show();
        
        // Inicializar mapa
        this.initMap();
        
        // Mostrar ordem da rota
        this.displayRouteOrder();
    }

    initMap() {
        if (this.map) {
            this.map.remove();
        }

        const mapElement = document.getElementById('map');
        const center = [CONFIG.APP.defaultCenter.lat, CONFIG.APP.defaultCenter.lng];

        this.map = L.map(mapElement).setView(center, CONFIG.APP.defaultZoom);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.map);

        if (this.route && this.route.waypoints.length > 0) {
            this.displayRouteOnMap();
        }
    }

    displayRouteOrder() {
        const container = document.getElementById('routeOrder');
        if (this.route && this.route.waypoints.length > 0) {
            container.innerHTML = this.route.waypoints.map((wp, index) => `
                <li class="mb-2">
                    <strong>${index + 1}.</strong> ${wp.student.name}<br>
                    <small class="text-muted">${wp.address}</small>
                </li>
            `).join('');
        } else {
            container.innerHTML = '<li>Nenhuma rota calculada</li>';
        }
    }

    startNavigation() {
        if (this.route && this.route.waypoints.length > 0) {
            const startAddress = this.buildFullAddressFromPoint(this.startPoint);
            const firstWaypoint = this.route.waypoints[0].address;
            
            // Abrir Google Maps com navegação
            const mapsUrl = `https://www.google.com/maps/dir/${encodeURIComponent(startAddress)}/${encodeURIComponent(firstWaypoint)}`;
            window.open(mapsUrl, '_blank');
            
            this.showToast('Navegação iniciada no Google Maps!', 'success');
        }
    }


    setupAddressAutocomplete(inputId) {
        const input = document.getElementById(inputId);
        const suggestions = document.createElement('div');
        suggestions.classList.add('autocomplete-suggestions');
        input.parentNode.appendChild(suggestions);

        input.addEventListener('input', async () => {
            const text = input.value;
            if (text.length < 3) {
                suggestions.innerHTML = '';
                return;
            }

            const geocodeClient = new Openrouteservice.Geocode({ api_key: CONFIG.OPENROUTESERVICE_API_KEY });
            const result = await geocodeClient.autocomplete({ text: text });

            suggestions.innerHTML = '';
            result.features.forEach(feature => {
                const suggestion = document.createElement('div');
                suggestion.textContent = feature.properties.label;
                suggestion.addEventListener('click', () => {
                    input.value = feature.properties.label;
                    suggestions.innerHTML = '';
                });
                suggestions.appendChild(suggestion);
            });
        });
    }

    // Sistema de Notificações
    showToast(message, type = 'info') {
        const toastContainer = this.getOrCreateToastContainer();
        
        const toastId = 'toast-' + Date.now();
        const toastHtml = `
            <div id="${toastId}" class="toast align-items-center text-white bg-${type === 'error' ? 'danger' : type} border-0" role="alert">
                <div class="d-flex">
                    <div class="toast-body">
                        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'} me-2"></i>
                        ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>
        `;

        toastContainer.insertAdjacentHTML('beforeend', toastHtml);
        
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement, {
            autohide: true,
            delay: CONFIG.NOTIFICATION.defaultDuration
        });
        
        toast.show();
        
        // Remover elemento após esconder
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    }

    getOrCreateToastContainer() {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        return container;
    }

    // Persistência de Dados
    saveStudentsData() {
        localStorage.setItem(CONFIG.STORAGE.studentsKey, JSON.stringify(this.students));
    }

    loadStudentsData() {
        const stored = localStorage.getItem(CONFIG.STORAGE.studentsKey);
        if (stored) {
            try {
                this.students = JSON.parse(stored);
                console.log('Alunos carregados:', this.students.length);
            } catch (error) {
                console.error('Erro ao carregar dados dos alunos:', error);
                this.students = [];
                localStorage.removeItem(CONFIG.STORAGE.studentsKey);
            }
        } else {
            this.students = [];
        }
    }

    loadDriverData() {
        // Carregar dados do driver se estiver logado
        const stored = localStorage.getItem(CONFIG.STORAGE.currentDriverKey);
        if (stored) {
            try {
                this.currentDriver = JSON.parse(stored);
                console.log('Driver carregado:', this.currentDriver.name);
            } catch (error) {
                console.error('Erro ao carregar dados do driver:', error);
                localStorage.removeItem(CONFIG.STORAGE.currentDriverKey);
            }
        }
    }

    saveDriverData() {
        if (this.currentDriver) {
            localStorage.setItem(CONFIG.STORAGE.currentDriverKey, JSON.stringify(this.currentDriver));
        }
    }

    saveRoutePoints() {
        const routePoints = {
            startPoint: this.startPoint,
            endPoint: this.endPoint
        };
        localStorage.setItem(CONFIG.STORAGE.routePointsKey, JSON.stringify(routePoints));
    }

    loadRoutePoints() {
        const stored = localStorage.getItem(CONFIG.STORAGE.routePointsKey);
        if (stored) {
            try {
                const routePoints = JSON.parse(stored);
                this.startPoint = routePoints.startPoint;
                this.endPoint = routePoints.endPoint;
                
                // Atualizar displays
                this.updatePointDisplay('start');
                this.updatePointDisplay('end');
                
                console.log('Pontos de rota carregados:', routePoints);
            } catch (error) {
                console.error('Erro ao carregar pontos de rota:', error);
                localStorage.removeItem(CONFIG.STORAGE.routePointsKey);
            }
        }
    }

    showStorageInfo() {
        const drivers = this.getStoredDrivers();
        const students = this.students;
        
        console.log('=== DADOS SALVOS NO LOCALSTORAGE ===');
        console.log('Drivers cadastrados:', drivers.length);
        console.log('Alunos cadastrados:', students.length);
        console.log('Driver logado:', this.currentDriver ? this.currentDriver.name : 'Nenhum');
        console.log('=====================================');
        
        // Mostrar informações na tela de login se houver dados
        if (drivers.length > 0) {
            this.showToast(`Sistema carregado! ${drivers.length} topiqueiro(s) cadastrado(s) e ${students.length} aluno(s) cadastrado(s).`, 'info');
        }
    }

    // Método para limpar todos os dados (útil para testes)
    clearAllData() {
        localStorage.removeItem(CONFIG.STORAGE.driversKey);
        localStorage.removeItem(CONFIG.STORAGE.studentsKey);
        localStorage.removeItem(CONFIG.STORAGE.currentDriverKey);
        localStorage.removeItem(CONFIG.STORAGE.routePointsKey);
        this.currentDriver = null;
        this.students = [];
        this.startPoint = null;
        this.endPoint = null;
        this.updatePointDisplay('start');
        this.updatePointDisplay('end');
        this.showToast('Todos os dados foram limpos!', 'info');
        console.log('Todos os dados do localStorage foram limpos');
    }
}

// Inicializar aplicação quando DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.busManager = new BusManager();
});

// Funções globais para uso nos event listeners inline
window.toggleStudentPresence = (studentId, going) => {
    if (window.busManager) {
        window.busManager.toggleStudentPresence(studentId, going);
    }
};

window.editStudent = (studentId) => {
    if (window.busManager) {
        window.busManager.editStudent(studentId);
    }
};

window.deleteStudent = (studentId) => {
    if (window.busManager) {
        window.busManager.deleteStudent(studentId);
    }
};

// Função global para limpar dados (útil para testes)
window.clearAllData = () => {
    if (window.busManager) {
        window.busManager.clearAllData();
    }
};
