// ==========================================================================
// ESTADO GLOBAL DA APLICAÇÃO
// ==========================================================================
let allStudents = [];
let filteredStudents = [];
let currentPage = 1;
let rowsPerPage = 25;
let activeView = 'view-dashboard';
let activeStudent = null;

// Censo Comparison State
let comparisonData = [];
let filteredComparisonData = [];
let compCurrentPage = 1;
let compRowsPerPage = 25;
let activeCompRecord = null;

// Armazena as instâncias dos gráficos Chart.js para evitar vazamentos de memória e sobreposição
const chartInstances = {};

// Paleta de Cores HSL combinadas para o Chart.js (Tema Escuro/Claro integrado)
const chartColors = {
    violet: { border: '#7c3aed', fill: 'rgba(124, 58, 237, 0.25)', borderHover: '#6d28d9', bg: '#7c3aed' },
    blue: { border: '#0ea5e9', fill: 'rgba(14, 165, 233, 0.25)', borderHover: '#0284c7', bg: '#0ea5e9' },
    green: { border: '#10b981', fill: 'rgba(16, 185, 129, 0.25)', borderHover: '#059669', bg: '#10b981' },
    amber: { border: '#f59e0b', fill: 'rgba(245, 158, 11, 0.25)', borderHover: '#d97706', bg: '#f59e0b' },
    red: { border: '#ef4444', fill: 'rgba(239, 68, 68, 0.25)', borderHover: '#dc2626', bg: '#ef4444' },
    indigo: { border: '#6366f1', fill: 'rgba(99, 102, 241, 0.25)', borderHover: '#4f46e5', bg: '#6366f1' },
    pink: { border: '#ec4899', fill: 'rgba(236, 72, 153, 0.25)', borderHover: '#db2777', bg: '#ec4899' },
    teal: { border: '#14b8a6', fill: 'rgba(20, 184, 166, 0.25)', borderHover: '#0d9488', bg: '#14b8a6' },
    grey: { border: '#9ca3af', fill: 'rgba(156, 163, 175, 0.25)', borderHover: '#4b5563', bg: '#9ca3af' },
    palette: [
        '#7c3aed', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', 
        '#6366f1', '#ec4899', '#14b8a6', '#f43f5e', '#8b5cf6'
    ]
};

// ==========================================================================
// INICIALIZAÇÃO DA PÁGINA
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    // Configurar Data Atual no Topbar
    setupDateDisplay();

    // Carregar Banco de Dados JSON
    loadStudentData();

    // Configurar Navegação da Sidebar
    setupNavigation();

    // Configurar Tema (Escuro/Claro)
    setupTheme();

    // Configurar Controles de Filtros e Pesquisa
    setupFilterEvents();

    // Configurar Eventos do Modal
    setupModalEvents();

    // Configurar Eventos da Tela de Comparação
    setupComparisonEvents();

    // Configurar Botão de Recarregar Dados
    document.getElementById('dashboard-refresh-btn').addEventListener('click', () => {
        loadStudentData();
    });

    // Configurar Exportação
    document.getElementById('btn-export-excel').addEventListener('click', exportToCSV);
});

// Exibe a data atual por extenso em português
function setupDateDisplay() {
    const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const now = new Date();
    const dateStr = `${days[now.getDay()]}, ${now.getDate()} de ${months[now.getMonth()]} de ${now.getFullYear()}`;
    document.getElementById('date-display').textContent = dateStr;
}

// Carrega os dados dos alunos a partir do arquivo JSON
function loadStudentData() {
    const tableBody = document.getElementById('students-table-body');
    if (tableBody) {
        tableBody.innerHTML = `<tr><td colspan="8" class="text-center py-8">Carregando dados dos alunos...</td></tr>`;
    }
    
    const compTableBody = document.getElementById('comparison-table-body');
    if (compTableBody) {
        compTableBody.innerHTML = `<tr><td colspan="6" class="text-center py-8">Carregando dados de comparação...</td></tr>`;
    }

    // Carregar alunos.json
    const fetchStudents = fetch('data/students.json').then(r => {
        if (!r.ok) throw new Error('Não foi possível carregar alunos.json.');
        return r.json();
    });

    // Carregar comparison.json
    const fetchComparison = fetch('data/comparison.json').then(r => {
        if (!r.ok) throw new Error('Não foi possível carregar comparison.json.');
        return r.json();
    });

    Promise.all([fetchStudents, fetchComparison])
        .then(([studentsData, compData]) => {
            allStudents = studentsData;
            filteredStudents = [...allStudents];

            comparisonData = compData;
            filteredComparisonData = [...comparisonData];
            
            // Popula os seletores de filtros
            populateFilterOptions();
            
            // Renderiza todas as visões
            refreshAllViews();
            
            // Recriar ícones lucide
            lucide.createIcons();
        })
        .catch(error => {
            console.error('Erro de carregamento:', error);
            const errMsg = `
                <tr>
                    <td colspan="8" class="text-center py-8 text-red" style="color:var(--danger-color); font-weight:600;">
                        <i data-lucide="alert-triangle" style="display:inline-block; vertical-align:middle; margin-right:8px;"></i>
                        Erro ao carregar banco de dados: ${error.message}
                    </td>
                </tr>
            `;
            if (tableBody) tableBody.innerHTML = errMsg;
            if (compTableBody) compTableBody.innerHTML = errMsg;
            lucide.createIcons();
        });
}

// Popula dinamicamente os filtros de Série/Etapa e Turma baseados nos dados existentes
function populateFilterOptions() {
    const etapaSelect = document.getElementById('filter-etapa');
    const turmaSelect = document.getElementById('filter-turma');

    // Salva seleções atuais
    const currentEtapa = etapaSelect.value;
    const currentTurma = turmaSelect.value;

    // Obter valores únicos
    const etapas = [...new Set(allStudents.map(s => s['Período']).filter(Boolean))].sort();
    const turmas = [...new Set(allStudents.map(s => s['Turma']).filter(Boolean))].sort();

    // Popular Série/Etapa
    etapaSelect.innerHTML = '<option value="">Todas</option>';
    etapas.forEach(etapa => {
        etapaSelect.innerHTML += `<option value="${etapa}">${etapa}</option>`;
    });

    // Popular Turma
    turmaSelect.innerHTML = '<option value="">Todas</option>';
    turmas.forEach(turma => {
        turmaSelect.innerHTML += `<option value="${turma}">${turma}</option>`;
    });

    // Restaurar seleções
    etapaSelect.value = currentEtapa;
    turmaSelect.value = currentTurma;
}

// Configura a navegação entre as diferentes telas da aplicação
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remover classe ativa anterior
            navItems.forEach(i => i.classList.remove('active'));
            
            // Adicionar classe ativa no item clicado
            item.classList.add('active');
            
            // Alternar visibilidade das visões
            const targetViewId = item.getAttribute('data-target');
            activeView = targetViewId;
            
            document.querySelectorAll('.content-view').forEach(view => {
                view.classList.remove('active');
            });
            
            const targetView = document.getElementById(targetViewId);
            if (targetView) {
                targetView.classList.add('active');
                targetView.classList.add('animate-fade-in');
            }

            // Ações específicas ao carregar certas telas
            if (targetViewId === 'view-dashboard') {
                renderDashboardCharts();
            } else if (targetViewId === 'view-classes') {
                renderClassesView();
            } else if (targetViewId === 'view-analytics') {
                renderAnalyticsCharts();
            } else if (targetViewId === 'view-comparison') {
                updateComparisonKPIs();
                renderComparisonTable();
            }
        });
    });
}

// Gerencia a troca de tema claro/escuro
function setupTheme() {
    const btn = document.getElementById('theme-toggle-btn');
    const body = document.body;

    // Verificar se o usuário já tem uma preferência salva
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
        body.classList.remove('dark-theme');
        body.classList.add('light-theme');
    } else {
        body.classList.add('dark-theme');
        body.classList.remove('light-theme');
    }

    btn.addEventListener('click', () => {
        if (body.classList.contains('dark-theme')) {
            body.classList.remove('dark-theme');
            body.classList.add('light-theme');
            localStorage.setItem('theme', 'light');
        } else {
            body.classList.remove('light-theme');
            body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
        }
        
        // Recriar gráficos para ajustar cores de grid caso mudem
        if (activeView === 'view-dashboard') {
            renderDashboardCharts();
        } else if (activeView === 'view-analytics') {
            renderAnalyticsCharts();
        }
    });
}

// ==========================================================================
// EVENTOS DE FILTROS & BUSCA
// ==========================================================================
function setupFilterEvents() {
    const globalSearch = document.getElementById('global-search-input');
    const filterSearch = document.getElementById('filter-search');
    const filterEtapa = document.getElementById('filter-etapa');
    const filterTurno = document.getElementById('filter-turno');
    const filterTurma = document.getElementById('filter-turma');
    const filterBolsa = document.getElementById('filter-bolsa');
    const filterPcd = document.getElementById('filter-pcd');
    const filterSituacao = document.getElementById('filter-situacao');
    const btnClear = document.getElementById('btn-clear-filters');

    // Eventos de digitação (com debounce simulado)
    const handleSearchInput = (e) => {
        const query = e.target.value;
        globalSearch.value = query;
        filterSearch.value = query;
        applyFilters();
    };

    globalSearch.addEventListener('input', handleSearchInput);
    filterSearch.addEventListener('input', handleSearchInput);

    // Eventos de alteração de dropdown
    [filterEtapa, filterTurno, filterTurma, filterBolsa, filterPcd, filterSituacao].forEach(select => {
        select.addEventListener('change', applyFilters);
    });

    // Limpar todos os filtros
    btnClear.addEventListener('click', () => {
        globalSearch.value = '';
        filterSearch.value = '';
        filterEtapa.value = '';
        filterTurno.value = '';
        filterTurma.value = '';
        filterBolsa.value = '';
        filterPcd.value = '';
        filterSituacao.value = '';
        applyFilters();
    });

    // Paginação
    document.getElementById('rows-per-page-select').addEventListener('change', (e) => {
        rowsPerPage = parseInt(e.target.value);
        currentPage = 1;
        renderStudentsTable();
    });

    document.getElementById('btn-page-prev').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderStudentsTable();
        }
    });

    document.getElementById('btn-page-next').addEventListener('click', () => {
        const totalPages = Math.ceil(filteredStudents.length / rowsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderStudentsTable();
        }
    });
}

// Executa a lógica de filtragem combinatória em tempo real
function applyFilters() {
    const query = document.getElementById('filter-search').value.toLowerCase().trim();
    const etapa = document.getElementById('filter-etapa').value;
    const turno = document.getElementById('filter-turno').value;
    const turma = document.getElementById('filter-turma').value;
    const bolsa = document.getElementById('filter-bolsa').value;
    const pcd = document.getElementById('filter-pcd').value;
    const situacao = document.getElementById('filter-situacao').value;

    filteredStudents = allStudents.filter(s => {
        // Busca de texto (Nome, CPF, Código ou RA)
        const nameMatch = !query || (s['Nome'] && s['Nome'].toLowerCase().includes(query)) || (s['Nome social'] && s['Nome social'].toLowerCase().includes(query));
        const cpfMatch = !query || (s['CPF'] && s['CPF'].replace(/\D/g, '').includes(query.replace(/\D/g, '')));
        const codMatch = !query || (s['Código'] && String(s['Código']).includes(query));
        const raMatch = !query || (s['Registro do estudante (RA)'] && String(s['Registro do estudante (RA)']).includes(query));
        const textMatch = nameMatch || cpfMatch || codMatch || raMatch;

        // Filtro de Série / Período
        const etapaMatch = !etapa || s['Período'] === etapa;

        // Filtro de Turno
        const turnoMatch = !turno || s['Turno'] === turno;

        // Filtro de Turma
        const turmaMatch = !turma || s['Turma'] === turma;

        // Filtro Bolsa Família
        const bolsaMatch = !bolsa || s['Bolsa Família'] === bolsa;

        // Filtro PCD / Deficiências (Verifica se campo Estudante com Deficiência é Sim ou possui CID)
        let isPcd = s['Estudante com deficiência'] === 'Sim' || s['Pessoa física com transtorno(s) que impacta(m) o desenvolvimento da aprendizagem'] === 'Sim' || (s['CID'] && s['CID'].trim() !== '');
        const pcdMatch = !pcd || (pcd === 'Sim' ? isPcd : !isPcd);

        // Filtro de Situação escolar
        const situacaoMatch = !situacao || s['Situação'] === situacao;

        return textMatch && etapaMatch && turnoMatch && turmaMatch && bolsaMatch && pcdMatch && situacaoMatch;
    });

    currentPage = 1;
    renderStudentsTable();
    
    // Se o usuário estiver na tela de turmas ou estatísticas, atualiza-as também
    if (activeView === 'view-classes') {
        renderClassesView();
    } else if (activeView === 'view-analytics') {
        renderAnalyticsCharts();
    } else if (activeView === 'view-dashboard') {
        updateKPIs();
        renderDashboardCharts();
    }
}

// ==========================================================================
// RENDERIZADORES DE TELAS
// ==========================================================================
function refreshAllViews() {
    updateKPIs();
    renderDashboardCharts();
    renderStudentsTable();
    renderClassesView();
    renderAnalyticsCharts();
    updateComparisonKPIs();
    renderComparisonTable();
}

// Calcula e exibe os KPIs gerais no painel principal
function updateKPIs() {
    // 1. Total de Alunos
    document.getElementById('kpi-total-students').textContent = allStudents.length;

    // 2. Educação Infantil (Pré-escola / Creche)
    const infantilStudents = allStudents.filter(s => {
        const etapa = s['Etapa de ensino'] || '';
        return etapa.toLowerCase().includes('infantil') || etapa.toLowerCase().includes('pré-escola') || (s['Período'] && s['Período'].toLowerCase().includes('período'));
    });
    document.getElementById('kpi-infantil').textContent = infantilStudents.length;
    const infantilPct = allStudents.length ? ((infantilStudents.length / allStudents.length) * 100).toFixed(1) : 0;
    document.getElementById('kpi-infantil-pct').textContent = `${infantilPct}% do total`;

    // 3. Ensino Fundamental (1º ao 9º Ano)
    const fundamentalStudents = allStudents.filter(s => {
        const etapa = s['Etapa de ensino'] || '';
        return etapa.toLowerCase().includes('fundamental') || (s['Período'] && s['Período'].toLowerCase().includes('ano'));
    });
    document.getElementById('kpi-fundamental').textContent = fundamentalStudents.length;
    const fundamentalPct = allStudents.length ? ((fundamentalStudents.length / allStudents.length) * 100).toFixed(1) : 0;
    document.getElementById('kpi-fundamental-pct').textContent = `${fundamentalPct}% do total`;

    // 4. Bolsa Família
    const bolsaStudents = allStudents.filter(s => s['Bolsa Família'] === 'Sim');
    document.getElementById('kpi-bolsa-familia').textContent = bolsaStudents.length;
    const bolsaPct = allStudents.length ? ((bolsaStudents.length / allStudents.length) * 100).toFixed(1) : 0;
    document.getElementById('kpi-bolsa-pct').textContent = `${bolsaPct}% dos alunos`;

    // 5. Atendimento AEE / PCD (Estudante com deficiência ou dificuldades de aprendizagem)
    const aeeStudents = allStudents.filter(s => {
        return s['Estudante com deficiência'] === 'Sim' || 
               s['Pessoa física com transtorno(s) que impacta(m) o desenvolvimento da aprendizagem'] === 'Sim' ||
               s['Tipo de Atendimento Educacional Especializado'] !== '';
    });
    document.getElementById('kpi-aee').textContent = aeeStudents.length;
    const aeePct = allStudents.length ? ((aeeStudents.length / allStudents.length) * 100).toFixed(1) : 0;
    document.getElementById('kpi-aee-pct').textContent = `${aeePct}% necessitam`;
}

// Gera e atualiza os gráficos do Dashboard principal
function renderDashboardCharts() {
    const isDark = document.body.classList.contains('dark-theme');
    const textFamily = 'Outfit, sans-serif';
    const textColor = isDark ? '#9ca3af' : '#4b5563';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';

    // Opções comuns dos gráficos
    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            }
        },
        scales: {
            x: {
                grid: { color: gridColor },
                ticks: { color: textColor, font: { family: textFamily } }
            },
            y: {
                grid: { color: gridColor },
                ticks: { color: textColor, font: { family: textFamily } },
                beginAtZero: true
            }
        }
    };

    // 1. Gráfico de Série / Etapa (Período)
    const etapaCounts = {};
    allStudents.forEach(s => {
        const val = s['Período'] || 'Não Definido';
        etapaCounts[val] = (etapaCounts[val] || 0) + 1;
    });

    // Ordenar logicamente as séries escolares brasileiras
    const order = [
        '1º PERÍODO', '2º PERÍODO', '1º ANO', '2º ANO', '3º ANO', 
        '4º ANO', '5º ANO', '6º ANO', '7º ANO', '8º ANO', '9º ANO'
    ];
    const sortedEtapas = Object.keys(etapaCounts).sort((a, b) => {
        const idxA = order.indexOf(a.toUpperCase());
        const idxB = order.indexOf(b.toUpperCase());
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.localeCompare(b);
    });
    const sortedEtapaValues = sortedEtapas.map(key => etapaCounts[key]);

    createChart('chart-etapas', 'bar', {
        labels: sortedEtapas,
        datasets: [{
            label: 'Alunos',
            data: sortedEtapaValues,
            backgroundColor: chartColors.violet.fill,
            borderColor: chartColors.violet.border,
            borderWidth: 2,
            borderRadius: 6,
            hoverBackgroundColor: chartColors.violet.bg
        }]
    }, commonOptions);

    // 2. Gráfico de Turnos
    const turnoCounts = { 'MATUTINO': 0, 'VESPERTINO': 0 };
    allStudents.forEach(s => {
        if (s['Turno'] === 'MATUTINO') turnoCounts['MATUTINO']++;
        else if (s['Turno'] === 'VESPERTINO') turnoCounts['VESPERTINO']++;
    });

    createChart('chart-turnos', 'doughnut', {
        labels: ['Matutino', 'Vespertino'],
        datasets: [{
            data: [turnoCounts['MATUTINO'], turnoCounts['VESPERTINO']],
            backgroundColor: [chartColors.blue.bg, chartColors.amber.bg],
            borderColor: isDark ? '#161a23' : '#ffffff',
            borderWidth: 2
        }]
    }, {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'bottom',
                labels: { color: textColor, font: { family: textFamily } }
            }
        }
    });

    // 3. Gráfico de Gênero (Sexo)
    const sexoCounts = { 'Feminino': 0, 'Masculino': 0 };
    allStudents.forEach(s => {
        const val = s['Sexo'] || 'Não Informado';
        if (sexoCounts[val] !== undefined) {
            sexoCounts[val]++;
        } else {
            sexoCounts[val] = (sexoCounts[val] || 0) + 1;
        }
    });

    createChart('chart-sexo', 'pie', {
        labels: Object.keys(sexoCounts),
        datasets: [{
            data: Object.values(sexoCounts),
            backgroundColor: [chartColors.pink.bg, chartColors.indigo.bg, chartColors.grey.bg],
            borderColor: isDark ? '#161a23' : '#ffffff',
            borderWidth: 2
        }]
    }, {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'bottom',
                labels: { color: textColor, font: { family: textFamily } }
            }
        }
    });

    // 4. Gráfico de Cor / Raça
    const corCounts = {};
    allStudents.forEach(s => {
        const val = s['Cor'] || 'Não Declarada';
        corCounts[val] = (corCounts[val] || 0) + 1;
    });

    createChart('chart-cor', 'bar', {
        labels: Object.keys(corCounts),
        datasets: [{
            label: 'Alunos',
            data: Object.values(corCounts),
            backgroundColor: chartColors.palette.slice(0, Object.keys(corCounts).length).map(c => c + '44'),
            borderColor: chartColors.palette.slice(0, Object.keys(corCounts).length),
            borderWidth: 2,
            borderRadius: 6
        }]
    }, {
        ...commonOptions,
        indexAxis: 'y', // Gráfico de barra horizontal
    });
}

// Renderiza a tabela de alunos na tela Diretório com paginação e busca
function renderStudentsTable() {
    const tableBody = document.getElementById('students-table-body');
    const startSpan = document.getElementById('pagination-start');
    const endSpan = document.getElementById('pagination-end');
    const totalSpan = document.getElementById('pagination-total');
    const pageIndicator = document.getElementById('page-indicator');
    
    const prevBtn = document.getElementById('btn-page-prev');
    const nextBtn = document.getElementById('btn-page-next');

    const totalStudents = filteredStudents.length;

    if (totalStudents === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-12 text-muted">
                    <i data-lucide="info" style="display:inline-block; vertical-align:middle; margin-right:8px; width:20px; height:20px;"></i>
                    Nenhum aluno encontrado com os filtros aplicados.
                </td>
            </tr>
        `;
        startSpan.textContent = '0';
        endSpan.textContent = '0';
        totalSpan.textContent = '0';
        pageIndicator.textContent = 'Pág. 1 de 1';
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        lucide.createIcons();
        return;
    }

    const totalPages = Math.ceil(totalStudents / rowsPerPage);
    if (currentPage > totalPages) currentPage = totalPages;

    const startIdx = (currentPage - 1) * rowsPerPage;
    const endIdx = Math.min(startIdx + rowsPerPage, totalStudents);

    // Fatiar a lista filtrada
    const pageStudents = filteredStudents.slice(startIdx, endIdx);

    // Construir HTML
    let tableHtml = '';
    pageStudents.forEach(s => {
        const statusClass = getStatusClass(s['Situação']);
        const age = s['Idade na data atual'] || s['Idade na matrícula'] || '-';
        
        tableHtml += `
            <tr class="student-row" data-id="${s['Código']}">
                <td class="font-mono">${s['Código'] || '-'}</td>
                <td>
                    <div style="font-weight: 600; color: var(--text-primary);">${s['Nome']}</div>
                    ${s['Nome social'] ? `<div style="font-size: 11px; color: var(--text-muted); font-style: italic;">Nome Social: ${s['Nome social']}</div>` : ''}
                </td>
                <td>${s['Período'] || '-'}</td>
                <td><span class="badge-turma">${s['Turma'] || '-'}</span></td>
                <td>${s['Turno'] || '-'}</td>
                <td>${age} anos</td>
                <td><span class="badge-status ${statusClass}">${s['Situação'] || 'NORMAL'}</span></td>
                <td class="text-right">
                    <button class="btn btn-secondary btn-icon py-1 px-3 btn-view-details" data-id="${s['Código']}" title="Ver Ficha">
                        <i data-lucide="eye" style="width: 14px; height: 14px;"></i>
                        <span>Ficha</span>
                    </button>
                </td>
            </tr>
        `;
    });

    tableBody.innerHTML = tableHtml;

    // Atualizar indicadores de paginação
    startSpan.textContent = startIdx + 1;
    endSpan.textContent = endIdx;
    totalSpan.textContent = totalStudents;
    pageIndicator.textContent = `Pág. ${currentPage} de ${totalPages}`;

    // Desabilitar botões se necessário
    prevBtn.disabled = (currentPage === 1);
    nextBtn.disabled = (currentPage === totalPages);

    // Registrar evento de clique para visualizar ficha
    const rows = tableBody.querySelectorAll('.student-row');
    rows.forEach(row => {
        row.style.cursor = 'pointer';
        row.addEventListener('click', (e) => {
            // Se clicar no botão ações, já gerencia lá. Caso contrário, abre a ficha
            if (!e.target.closest('.btn-view-details')) {
                const id = row.getAttribute('data-id');
                const student = allStudents.find(s => String(s['Código']) === String(id));
                if (student) openStudentModal(student);
            }
        });
    });

    const detailBtns = tableBody.querySelectorAll('.btn-view-details');
    detailBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // Evitar clique duplo na tr
            const id = btn.getAttribute('data-id');
            const student = allStudents.find(s => String(s['Código']) === String(id));
            if (student) openStudentModal(student);
        });
    });

    lucide.createIcons();
}

// Agrupa alunos por turma e exibe cartões com lotação e lista rápida
function renderClassesView() {
    const container = document.getElementById('classes-cards-container');
    if (!container) return;

    // Agrupar alunos por descrição da turma (ex: "9º ANO C")
    const classGroups = {};
    filteredStudents.forEach(s => {
        const val = s['Descrição'] || s['Período'] + ' ' + s['Turma'];
        if (!classGroups[val]) {
            classGroups[val] = {
                name: val,
                etapa: s['Período'],
                turno: s['Turno'],
                students: []
            };
        }
        classGroups[val].students.push(s);
    });

    const sortedClasses = Object.keys(classGroups).sort();
    
    if (sortedClasses.length === 0) {
        container.innerHTML = `
            <div class="col-span-3 text-center py-12 text-muted glass">
                <i data-lucide="door-closed" style="display:inline-block; margin-bottom:12px; width:48px; height:48px; color:var(--text-muted);"></i>
                <p>Nenhuma turma correspondente encontrada para os filtros atuais.</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    let cardsHtml = '';
    sortedClasses.forEach(className => {
        const cls = classGroups[className];
        const count = cls.students.length;
        const activeCount = cls.students.filter(s => s['Situação'] === 'NORMAL').length;
        
        cardsHtml += `
            <div class="class-card glass">
                <div class="class-card-header">
                    <div class="class-card-title">
                        <h4>${cls.name}</h4>
                        <span>${cls.etapa || 'Série Não Definida'}</span>
                    </div>
                    <div class="class-student-count">
                        <i data-lucide="users"></i>
                        <span>${count}</span>
                    </div>
                </div>
                <div class="class-card-meta">
                    <div class="meta-item">
                        <i data-lucide="clock"></i>
                        <span>Turno: <strong>${cls.turno || 'Não Definido'}</strong></span>
                    </div>
                    <div class="meta-item">
                        <i data-lucide="user-check"></i>
                        <span>Estudantes Ativos: <strong>${activeCount}</strong></span>
                    </div>
                </div>
                <div class="class-card-footer">
                    <button class="btn btn-secondary btn-icon py-1.5 btn-view-class-list" data-class="${cls.name}">
                        <i data-lucide="list"></i>
                        <span>Ver Alunos</span>
                    </button>
                </div>
            </div>
        `;
    });

    container.innerHTML = cardsHtml;

    // Ação do botão "Ver Alunos": filtra no Diretório e abre a tela
    const viewListBtns = container.querySelectorAll('.btn-view-class-list');
    viewListBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const className = btn.getAttribute('data-class');
            const cls = classGroups[className];
            
            // Configurar filtros
            document.getElementById('filter-etapa').value = cls.etapa || '';
            document.getElementById('filter-turma').value = cls.students[0]['Turma'] || '';
            document.getElementById('filter-turno').value = cls.turno || '';
            
            applyFilters();

            // Navegar para Alunos
            const navAlunos = document.querySelector('.nav-item[data-target="view-students"]');
            if (navAlunos) navAlunos.click();
        });
    });

    lucide.createIcons();
}

// Desenha gráficos estatísticos mais detalhados na aba de Análise
function renderAnalyticsCharts() {
    const isDark = document.body.classList.contains('dark-theme');
    const textFamily = 'Outfit, sans-serif';
    const textColor = isDark ? '#9ca3af' : '#4b5563';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';

    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            x: {
                grid: { color: gridColor },
                ticks: { color: textColor, font: { family: textFamily } }
            },
            y: {
                grid: { color: gridColor },
                ticks: { color: textColor, font: { family: textFamily } },
                beginAtZero: true
            }
        }
    };

    // 1. Concentração de Alunos por Bairro (Top 10)
    const bairroCounts = {};
    filteredStudents.forEach(s => {
        const val = s['Bairro'] || 'Não Informado';
        bairroCounts[val] = (bairroCounts[val] || 0) + 1;
    });

    // Ordenar e pegar top 10
    const sortedBairros = Object.keys(bairroCounts)
        .sort((a, b) => bairroCounts[b] - bairroCounts[a])
        .slice(0, 10);
    const sortedBairroValues = sortedBairros.map(k => bairroCounts[k]);

    createChart('chart-bairros', 'bar', {
        labels: sortedBairros.map(b => b.substring(0, 15)), // Limita o tamanho do nome
        datasets: [{
            label: 'Alunos',
            data: sortedBairroValues,
            backgroundColor: chartColors.indigo.fill,
            borderColor: chartColors.indigo.border,
            borderWidth: 2,
            borderRadius: 6
        }]
    }, commonOptions);

    // 2. Gráfico de Distribuição por Idade Atual
    const idadeCounts = {};
    filteredStudents.forEach(s => {
        const val = s['Idade na data atual'] || s['Idade na matrícula'];
        if (val) {
            const age = parseInt(val);
            idadeCounts[age] = (idadeCounts[age] || 0) + 1;
        }
    });

    const sortedAges = Object.keys(idadeCounts).map(Number).sort((a,b) => a-b);
    const sortedAgeValues = sortedAges.map(age => idadeCounts[age]);

    createChart('chart-idades', 'line', {
        labels: sortedAges.map(age => `${age} anos`),
        datasets: [{
            label: 'Alunos',
            data: sortedAgeValues,
            backgroundColor: chartColors.teal.fill,
            borderColor: chartColors.teal.border,
            borderWidth: 3,
            fill: true,
            tension: 0.3,
            pointRadius: 4,
            pointBackgroundColor: chartColors.teal.border
        }]
    }, {
        ...commonOptions,
        plugins: { legend: { display: false } }
    });

    // 3. Gráfico Detalhado de Necessidades Especiais (AEE/PCD)
    const defCounts = {
        'Autismo (TEA)': 0,
        'TDAH / Aprendizagem': 0,
        'Outras Deficiências': 0,
        'Sem Necessidades': 0
    };

    filteredStudents.forEach(s => {
        const defTipo = s['Tipo de deficiência, transtorno do espectro autista e altas habilidades/superdotação'] || '';
        const transtorno = s['Tipo(s) de transtorno(s) que impacta(m) o desenvolvimento da aprendizagem'] || '';
        const cid = s['CID'] || '';
        
        if (defTipo.toUpperCase().includes('AUTISMO') || defTipo.toUpperCase().includes('ESPECTRO') || defTipo.toUpperCase().includes('TEA')) {
            defCounts['Autismo (TEA)']++;
        } else if (transtorno.toUpperCase().includes('TDAH') || transtorno.toUpperCase().includes('ATENÇÃO') || transtorno.toUpperCase().includes('APRENDIZAGEM')) {
            defCounts['TDAH / Aprendizagem']++;
        } else if (s['Estudante com deficiência'] === 'Sim' || defTipo !== '' || cid !== '') {
            defCounts['Outras Deficiências']++;
        } else {
            defCounts['Sem Necessidades']++;
        }
    });

    createChart('chart-deficiencias-detalhado', 'doughnut', {
        labels: Object.keys(defCounts),
        datasets: [{
            data: Object.values(defCounts),
            backgroundColor: [chartColors.violet.bg, chartColors.amber.bg, chartColors.red.bg, chartColors.grey.fill],
            borderColor: isDark ? '#161a23' : '#ffffff',
            borderWidth: 2
        }]
    }, {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'bottom',
                labels: { color: textColor, font: { family: textFamily } }
            }
        }
    });

    // 4. Autorização do Uso de Imagem
    const imgCounts = { 'Sim': 0, 'Não': 0, 'Não Respondido': 0 };
    filteredStudents.forEach(s => {
        const val = s['Autorização do Uso de Imagem'] || 'Não Respondido';
        if (val === 'Sim') imgCounts['Sim']++;
        else if (val === 'Não') imgCounts['Não']++;
        else imgCounts['Não Respondido']++;
    });

    createChart('chart-imagem-autorizacao', 'pie', {
        labels: ['Autorizado', 'Não Autorizado', 'Pendente/Sem info'],
        datasets: [{
            data: [imgCounts['Sim'], imgCounts['Não'], imgCounts['Não Respondido']],
            backgroundColor: [chartColors.green.bg, chartColors.red.bg, chartColors.grey.bg],
            borderColor: isDark ? '#161a23' : '#ffffff',
            borderWidth: 2
        }]
    }, {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'right',
                labels: { color: textColor, font: { family: textFamily } }
            }
        }
    });
}

// ==========================================================================
// MODAL DE DETALHES DO ALUNO (Visualização 360)
// ==========================================================================
function setupModalEvents() {
    const modal = document.getElementById('student-detail-modal');
    const closeBtn = document.getElementById('btn-close-modal');
    const closeBtnFooter = document.getElementById('btn-close-modal-footer');
    const printBtn = document.getElementById('btn-print-student');
    const tabs = document.querySelectorAll('.tab-btn');

    // Fechar modal
    const closeModal = () => {
        modal.classList.remove('active');
        activeStudent = null;
    };

    closeBtn.addEventListener('click', closeModal);
    closeBtnFooter.addEventListener('click', closeModal);

    // Fechar ao clicar fora do container do modal
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Navegação por abas
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const targetTabId = tab.getAttribute('data-tab');
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(targetTabId).classList.add('active');
        });
    });

    // Impressão da ficha individual em PDF
    printBtn.addEventListener('click', () => {
        window.print();
    });
}

// Abre o modal e preenche todos os campos com os dados do estudante
function openStudentModal(student) {
    activeStudent = student;
    
    // Set Avatar iniciais
    const avatar = document.getElementById('modal-student-avatar');
    const initials = student['Nome'] ? student['Nome'].split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'AL';
    avatar.textContent = initials;

    // Header info
    document.getElementById('modal-student-name').textContent = student['Nome'] || 'Sem Nome';
    
    const statusEl = document.getElementById('modal-student-status');
    statusEl.textContent = student['Situação'] || 'NORMAL';
    statusEl.className = `badge-status ${getStatusClass(student['Situação'])}`;

    document.getElementById('modal-student-class-badge').textContent = student['Descrição'] || student['Período'] || '-';
    document.getElementById('modal-student-shift-badge').textContent = student['Turno'] || 'Turno Indefinido';

    // RENDERIZAR ABAS

    // ABA 1: Dados Pessoais
    setDetailValue('d-nome', student['Nome']);
    setDetailValue('d-nome-social', student['Nome social']);
    setDetailValue('d-nascimento', student['Data de Nascimento']);
    setDetailValue('d-idade', student['Idade na data atual'] || student['Idade na matrícula'], ' anos');
    setDetailValue('d-cpf', formatCPF(student['CPF']));
    setDetailValue('d-sexo', student['Sexo']);
    setDetailValue('d-cor', student['Cor']);
    setDetailValue('d-nacionalidade', student['Nacionalidade']);
    setDetailValue('d-naturalidade', student['Naturalidade']);
    setDetailValue('d-indigena', student['Povo indígena']);

    // ABA 2: Vida Escolar
    setDetailValue('d-cod-matricula', student['Código']);
    setDetailValue('d-cod-estudante', student['Código do estudante']);
    setDetailValue('d-ra', student['Registro do estudante (RA)']);
    setDetailValue('d-censo', student['Identificação CENSO']);
    setDetailValue('d-etapa', student['Etapa de ensino']);
    setDetailValue('d-turma', student['Turma']);
    setDetailValue('d-turno', student['Turno']);
    setDetailValue('d-situacao', student['Situação']);
    setDetailValue('d-data-matricula', student['Data da matrícula']);
    setDetailValue('d-data-movimentacao', student['Data da movimentação']);
    setDetailValue('d-rematricula', student['Confirmou rematrícula']);
    setDetailValue('d-escola-anterior', student['Escola Anterior']);

    // ABA 3: Contatos e Endereço
    const tipoLog = student['Tipo Logradouro'] || '';
    const logradouro = student['Logradouro'] || '';
    const num = student['Número'] ? `, Nº ${student['Número']}` : '';
    setDetailValue('d-endereco-completo', (tipoLog + ' ' + logradouro + num).trim());
    setDetailValue('d-bairro', student['Bairro']);
    setDetailValue('d-cep', student['Cep']);
    setDetailValue('d-cidade-uf', (student['Município'] || 'Colatina') + ' - ' + (student['Estado'] || 'ES'));
    setDetailValue('d-contato1', student['Contato 1']);
    setDetailValue('d-contato2', student['Contato 2']);
    setDetailValue('d-contato3', student['Contato 3']);
    setDetailValue('d-email', student['E-mail']);
    setDetailValue('d-ponto-referencia', student['Ponto de referência']);

    // ABA 4: Família e Responsáveis
    setDetailValue('d-filiacao1-nome', student['Filiação 1']);
    setDetailValue('d-filiacao1-cpf', formatCPF(student['CPF Filiação 1']));
    setDetailValue('d-filiacao1-telefone', student['Contato Filiação 1']);
    setDetailValue('d-filiacao1-falecido', student['Falecido Filiação 1']);

    setDetailValue('d-filiacao2-nome', student['Filiação 2']);
    setDetailValue('d-filiacao2-cpf', formatCPF(student['CPF Filiação 2']));
    setDetailValue('d-filiacao2-telefone', student['Contato Filiação 2']);
    setDetailValue('d-filiacao2-falecido', student['Falecido Filiação 2']);

    setDetailValue('d-responsavel-nome', student['Responsável']);
    setDetailValue('d-responsavel-cpf', formatCPF(student['CPF do responsável']));

    // ABA 5: Saúde e Acessibilidade
    setDetailValue('d-sus', student['Nº do Cartão Nacional do SUS']);
    setDetailValue('d-deficiencia-flag', student['Estudante com deficiência']);
    setDetailValue('d-deficiencia-tipo', student['Tipo de deficiência, transtorno do espectro autista e altas habilidades/superdotação']);
    setDetailValue('d-aprendizagem-flag', student['Pessoa física com transtorno(s) que impacta(m) o desenvolvimento da aprendizagem']);
    setDetailValue('d-aprendizagem-tipo', student['Tipo(s) de transtorno(s) que impacta(m) o desenvolvimento da aprendizagem']);
    setDetailValue('d-recursos-sala', student['Recursos necessários para uso do estudante e para a participação em avaliações do Inep (Saeb)']);
    setDetailValue('d-aee-tipo', student['Tipo de Atendimento Educacional Especializado']);
    setDetailValue('d-cid', student['CID']);
    setDetailValue('d-apae', student['Frequenta a APAE']);
    setDetailValue('d-restricao-alimentar-flag', student['Possui restrição alimentar?']);
    setDetailValue('d-restricao-alimentar-desc', student['Restrição alimentar']);

    // ABA 6: Outros Serviços
    setDetailValue('d-transporte-flag', student['Utiliza transporte']);
    setDetailValue('d-transporte-responsavel', student['Poder Público Responsável']);
    setDetailValue('d-transporte-veiculo', student['Transporte escolar']);
    setDetailValue('d-passe-escolar', student['Utiliza passe']);
    setDetailValue('d-autorizacao-imagem', student['Autorização do Uso de Imagem']);
    setDetailValue('d-pdi-pei', student['Avaliado por PDI/PEI/PDP']);
    setDetailValue('d-consumidor-energia', student['Código de consumidor de energia']);
    setDetailValue('d-area-residencia', student['Localização da Residência (CENSO)']);
    setDetailValue('d-observacoes', student['Observação']);

    // Ativar a primeira aba por padrão ao abrir o modal
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(t => t.classList.remove('active'));
    tabs[0].classList.add('active');
    
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById('tab-pessoais').classList.add('active');

    // Abre o modal adicionando a classe
    document.getElementById('student-detail-modal').classList.add('active');
    lucide.createIcons();
}

// Preenche um ID com texto e fallback para traço caso vazio
function setDetailValue(elementId, value, suffix = '') {
    const el = document.getElementById(elementId);
    if (!el) return;
    
    if (value === undefined || value === null || value === '' || value === '-') {
        el.textContent = '-';
        el.style.opacity = '0.5';
    } else {
        el.textContent = value + suffix;
        el.style.opacity = '1';
    }
}

// ==========================================================================
// UTILITÁRIOS DA APLICAÇÃO
// ==========================================================================

// Auxiliar para criar gráficos de Chart.js sem sobreposição
function createChart(canvasId, type, data, options) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    // Destruir instância anterior se existir
    if (chartInstances[canvasId]) {
        chartInstances[canvasId].destroy();
    }

    // Ajustar opções de tema
    const isDark = document.body.classList.contains('dark-theme');
    const textFamily = 'Outfit, sans-serif';
    const textColor = isDark ? '#9ca3af' : '#4b5563';
    
    if (options && options.plugins && options.plugins.legend) {
        if (!options.plugins.legend.labels) options.plugins.legend.labels = {};
        options.plugins.legend.labels.color = textColor;
        options.plugins.legend.labels.font = { family: textFamily };
    }

    const ctx = canvas.getContext('2d');
    chartInstances[canvasId] = new Chart(ctx, {
        type: type,
        data: data,
        options: options
    });
}

// Retorna a classe CSS correspondente para o badge de Situação
function getStatusClass(situacao) {
    if (!situacao) return 'normal';
    const s = situacao.toUpperCase();
    if (s === 'NORMAL') return 'normal';
    if (s === 'TRANSFERIDO' || s.includes('TRANSF')) return 'transferido';
    if (s === 'DESISTENTE' || s.includes('DESIS') || s === 'ABANDONO') return 'desistente';
    return 'normal';
}

// Formata strings de CPF colocando máscara
function formatCPF(cpf) {
    if (!cpf) return '';
    const cleaned = String(cpf).replace(/\D/g, '');
    if (cleaned.length !== 11) return String(cpf); // Retorna original se não tiver 11 digitos
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

// Exporta a listagem filtrada de alunos em formato CSV
function exportToCSV() {
    if (filteredStudents.length === 0) {
        alert('Não há dados filtrados para exportar.');
        return;
    }

    // Selecionamos as colunas principais para a exportação
    const columns = [
        'Código', 'Nome', 'Período', 'Turma', 'Turno', 'Situação', 'Data de Nascimento', 'CPF', 
        'Bairro', 'Município', 'Contato 1', 'Filiação 1', 'Filiação 2', 'Estudante com deficiência'
    ];

    // Cabeçalho do CSV
    let csvContent = '\uFEFF'; // Adiciona BOM para abrir corretamente no Excel em UTF-8
    csvContent += columns.join(';') + '\n';

    // Linhas de dados
    filteredStudents.forEach(s => {
        const row = columns.map(colName => {
            let val = s[colName] || '';
            // Limpa caracteres especiais, quebras de linha e aspas duplas
            val = String(val).replace(/"/g, '""').replace(/\r?\n/g, ' ');
            // Se contiver ponto e vírgula, encapsula em aspas
            if (val.includes(';')) {
                val = `"${val}"`;
            }
            return val;
        });
        csvContent += row.join(';') + '\n';
    });

    // Criação do link e download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    
    // Nome do arquivo com timestamp
    const date = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `alunos_filtrados_matilde_guerra_${date}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ==========================================================================
// FUNCIONALIDADES DE COMPARAÇÃO CENSO X ESCOLA
// ==========================================================================

// Configura os eventos de filtros, paginação e modais na tela de Comparação
function setupComparisonEvents() {
    const compSearch = document.getElementById('comp-filter-search');
    const compStatus = document.getElementById('comp-filter-status');
    const compDivergence = document.getElementById('comp-filter-divergence');
    const btnClearComp = document.getElementById('btn-clear-comp-filters');
    const btnExportComp = document.getElementById('btn-export-comparison-csv');

    // Fechar Modal de Comparação
    const compModal = document.getElementById('comparison-detail-modal');
    const closeBtn = document.getElementById('btn-close-comp-modal');
    const closeBtnFooter = document.getElementById('btn-close-comp-modal-footer');
    const printBtn = document.getElementById('btn-print-comparison');

    const closeCompModal = () => {
        compModal.classList.remove('active');
        activeCompRecord = null;
    };

    closeBtn.addEventListener('click', closeCompModal);
    closeBtnFooter.addEventListener('click', closeCompModal);
    
    compModal.addEventListener('click', (e) => {
        if (e.target === compModal) {
            closeCompModal();
        }
    });

    printBtn.addEventListener('click', () => {
        window.print();
    });

    // Filtros
    compSearch.addEventListener('input', applyComparisonFilters);
    compStatus.addEventListener('change', applyComparisonFilters);
    compDivergence.addEventListener('change', applyComparisonFilters);

    btnClearComp.addEventListener('click', () => {
        compSearch.value = '';
        compStatus.value = '';
        compDivergence.value = '';
        applyComparisonFilters();
    });

    // Paginação
    document.getElementById('comp-rows-per-page-select').addEventListener('change', (e) => {
        compRowsPerPage = parseInt(e.target.value);
        compCurrentPage = 1;
        renderComparisonTable();
    });

    document.getElementById('btn-comp-page-prev').addEventListener('click', () => {
        if (compCurrentPage > 1) {
            compCurrentPage--;
            renderComparisonTable();
        }
    });

    document.getElementById('btn-comp-page-next').addEventListener('click', () => {
        const totalPages = Math.ceil(filteredComparisonData.length / compRowsPerPage);
        if (compCurrentPage < totalPages) {
            compCurrentPage++;
            renderComparisonTable();
        }
    });

    // Exportação
    btnExportComp.addEventListener('click', exportComparisonToCSV);
}

// Aplica filtros de pesquisa, status e divergência na comparação do Censo
function applyComparisonFilters() {
    const query = document.getElementById('comp-filter-search').value.toLowerCase().trim();
    const status = document.getElementById('comp-filter-status').value;
    const divergence = document.getElementById('comp-filter-divergence').value;

    filteredComparisonData = comparisonData.filter(r => {
        // Busca de texto
        const nameMatch = !query || (r.nome && r.nome.toLowerCase().includes(query));
        const cpfMatch = !query || (r.cpf && r.cpf.replace(/\D/g, '').includes(query.replace(/\D/g, '')));
        const idMatch = !query || (r.id && String(r.id).includes(query));
        const textMatch = nameMatch || cpfMatch || idMatch;

        // Filtro de Status no Censo
        const statusMatch = !status || r.status === status;

        // Filtro de Divergências
        let divMatch = true;
        if (divergence === 'divergent') {
            divMatch = r.status === 'CONCILIADO' && r.has_divergences;
        } else if (divergence === 'clean') {
            divMatch = r.status === 'CONCILIADO' && !r.has_divergences;
        }

        return textMatch && statusMatch && divMatch;
    });

    compCurrentPage = 1;
    renderComparisonTable();
}

// Calcula e exibe as estatísticas de conciliação do Censo
function updateComparisonKPIs() {
    const totalConciliados = comparisonData.filter(r => r.status === 'CONCILIADO').length;
    const totalMissing = comparisonData.filter(r => r.status === 'APENAS_ESCOLA').length;
    const totalDivergent = comparisonData.filter(r => r.status === 'CONCILIADO' && r.has_divergences).length;
    const totalPerfect = comparisonData.filter(r => r.status === 'CONCILIADO' && !r.has_divergences).length;

    document.getElementById('kpi-comp-conciliados').textContent = totalConciliados;
    document.getElementById('kpi-comp-missing').textContent = totalMissing;
    document.getElementById('kpi-comp-divergent').textContent = totalDivergent;
    document.getElementById('kpi-comp-perfect').textContent = totalPerfect;
}

// Renderiza a lista de alunos com status e divergências de conciliação
function renderComparisonTable() {
    const tableBody = document.getElementById('comparison-table-body');
    const startSpan = document.getElementById('comp-pagination-start');
    const endSpan = document.getElementById('comp-pagination-end');
    const totalSpan = document.getElementById('comp-pagination-total');
    const pageIndicator = document.getElementById('comp-page-indicator');
    
    const prevBtn = document.getElementById('btn-comp-page-prev');
    const nextBtn = document.getElementById('btn-comp-page-next');

    const totalRecords = filteredComparisonData.length;

    if (totalRecords === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-12 text-muted">
                    <i data-lucide="info" style="display:inline-block; vertical-align:middle; margin-right:8px; width:20px; height:20px;"></i>
                    Nenhum registro de comparação correspondente aos filtros.
                </td>
            </tr>
        `;
        startSpan.textContent = '0';
        endSpan.textContent = '0';
        totalSpan.textContent = '0';
        pageIndicator.textContent = 'Pág. 1 de 1';
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        lucide.createIcons();
        return;
    }

    const totalPages = Math.ceil(totalRecords / compRowsPerPage);
    if (compCurrentPage > totalPages) compCurrentPage = totalPages;

    const startIdx = (compCurrentPage - 1) * compRowsPerPage;
    const endIdx = Math.min(startIdx + compRowsPerPage, totalRecords);

    const pageRecords = filteredComparisonData.slice(startIdx, endIdx);

    let tableHtml = '';
    pageRecords.forEach(r => {
        let statusBadge = '';
        let divLabel = '';
        
        if (r.status === 'CONCILIADO') {
            statusBadge = '<span class="badge-status conciliado">Conciliado</span>';
            if (r.has_divergences) {
                divLabel = `<span style="color: var(--danger-color); font-weight:600; display:inline-flex; align-items:center; gap:4px;"><i data-lucide="alert-circle" style="width:14px; height:14px;"></i> ${r.divergences_count} divergências</span>`;
            } else {
                divLabel = '<span style="color: var(--success-color); font-weight:600; display:inline-flex; align-items:center; gap:4px;"><i data-lucide="check-circle" style="width:14px; height:14px;"></i> Sem divergências</span>';
            }
        } else if (r.status === 'APENAS_ESCOLA') {
            statusBadge = '<span class="badge-status apenas-escola">Apenas na Escola</span>';
            divLabel = '<span style="color: var(--warning-color); font-weight:600;"><i data-lucide="help-circle" style="width:14px; height:14px; display:inline-block; vertical-align:middle;"></i> Ausente no Censo</span>';
        } else if (r.status === 'APENAS_CENSO') {
            statusBadge = '<span class="badge-status apenas-censo">Apenas no Censo</span>';
            divLabel = '<span style="color: var(--info-color); font-weight:600;"><i data-lucide="help-circle" style="width:14px; height:14px; display:inline-block; vertical-align:middle;"></i> Ausente na Escola</span>';
        }

        tableHtml += `
            <tr class="comp-row" data-id="${r.id}">
                <td class="font-mono">${r.id || '-'}</td>
                <td><div style="font-weight:600; color:var(--text-primary);">${r.nome}</div></td>
                <td class="font-mono">${r.cpf || '-'}</td>
                <td>${statusBadge}</td>
                <td>${divLabel}</td>
                <td class="text-right">
                    <button class="btn btn-secondary btn-icon py-1 px-3 btn-view-comparison" data-id="${r.id}">
                        <i data-lucide="git-compare" style="width: 14px; height: 14px;"></i>
                        <span>Comparar</span>
                    </button>
                </td>
            </tr>
        `;
    });

    tableBody.innerHTML = tableHtml;

    // Atualizar paginação
    startSpan.textContent = startIdx + 1;
    endSpan.textContent = endIdx;
    totalSpan.textContent = totalRecords;
    pageIndicator.textContent = `Pág. ${compCurrentPage} de ${totalPages}`;

    prevBtn.disabled = (compCurrentPage === 1);
    nextBtn.disabled = (compCurrentPage === totalPages);

    // Eventos de clique nas linhas
    const rows = tableBody.querySelectorAll('.comp-row');
    rows.forEach(row => {
        row.style.cursor = 'pointer';
        row.addEventListener('click', (e) => {
            if (!e.target.closest('.btn-view-comparison')) {
                const id = row.getAttribute('data-id');
                const record = comparisonData.find(r => String(r.id) === String(id));
                if (record) openComparisonModal(record);
            }
        });
    });

    const compareBtns = tableBody.querySelectorAll('.btn-view-comparison');
    compareBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            const record = comparisonData.find(r => String(r.id) === String(id));
            if (record) openComparisonModal(record);
        });
    });

    lucide.createIcons();
}

// Abre o modal de comparação detalhada lado a lado
function openComparisonModal(record) {
    activeCompRecord = record;

    const avatar = document.getElementById('modal-comp-avatar');
    const initials = record.nome ? record.nome.split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase() : 'CO';
    avatar.textContent = initials;

    document.getElementById('modal-comp-student-name').textContent = record.nome;

    const statusBadge = document.getElementById('modal-comp-status-badge');
    statusBadge.textContent = record.status === 'CONCILIADO' ? 'Conciliado' : record.status === 'APENAS_ESCOLA' ? 'Ausente no Censo' : 'Apenas no Censo';
    statusBadge.className = `badge-status ${record.status === 'CONCILIADO' ? 'conciliado' : record.status === 'APENAS_ESCOLA' ? 'apenas-escola' : 'apenas-censo'}`;

    const divBadge = document.getElementById('modal-comp-divergences-badge');
    if (record.status === 'CONCILIADO') {
        divBadge.style.display = 'inline-flex';
        if (record.has_divergences) {
            divBadge.textContent = `${record.divergences_count} divergências`;
            divBadge.style.backgroundColor = 'var(--danger-bg)';
            divBadge.style.color = 'var(--danger-color)';
        } else {
            divBadge.textContent = 'Sem divergências';
            divBadge.style.backgroundColor = 'var(--success-bg)';
            divBadge.style.color = 'var(--success-color)';
        }
    } else {
        divBadge.style.display = 'none';
    }

    // Preencher tabela lado a lado
    const tbody = document.getElementById('comparison-side-by-side-body');
    let tbodyHtml = '';

    for (const [fieldName, details] of Object.entries(record.divergences)) {
        const isMatch = details.match;
        const rowClass = isMatch ? 'comparison-row match' : 'comparison-row mismatch';
        
        let statusIcon = '';
        if (isMatch) {
            statusIcon = '<span class="status-icon-match" title="Sem Divergência"><i data-lucide="check" style="width: 16px; height: 16px;"></i></span>';
        } else {
            // Se for o Código da Matrícula (que não é crítico por ser municipal vs nacional), mostra um ícone de info azul, caso contrário ⚠️ vermelho
            if (!details.is_critical) {
                statusIcon = '<span class="status-icon-match" style="color:var(--info-color);" title="ID de banco diferente por design (Normal)"><i data-lucide="info" style="width: 16px; height: 16px;"></i></span>';
            } else {
                statusIcon = '<span class="status-icon-mismatch" title="Informações Diferentes"><i data-lucide="alert-triangle" style="width: 16px; height: 16px;"></i></span>';
            }
        }

        tbodyHtml += `
            <tr class="${rowClass}">
                <td class="field-name">${fieldName}</td>
                <td class="school-val">${details.school_val}</td>
                <td class="censo-val">${details.censo_val}</td>
                <td class="status-col">${statusIcon}</td>
            </tr>
        `;
    }

    tbody.innerHTML = tbodyHtml;

    // Abrir o modal
    document.getElementById('comparison-detail-modal').classList.add('active');
    lucide.createIcons();
}

// Exporta o relatório filtrado de comparação para formato CSV
function exportComparisonToCSV() {
    if (filteredComparisonData.length === 0) {
        alert('Não há dados filtrados de comparação para exportar.');
        return;
    }

    const columns = [
        'ID Matrícula', 'Nome', 'CPF', 'Status no Censo', 'Possui Divergências Críticas', 
        'Total Divergências', 'Campos com Erro'
    ];

    let csvContent = '\uFEFF'; // BOM UTF-8
    csvContent += columns.join(';') + '\n';

    filteredComparisonData.forEach(r => {
        // Coleta quais campos estão com erros
        const errFields = [];
        if (r.status === 'CONCILIADO' && r.has_divergences) {
            for (const [fieldName, details] of Object.entries(r.divergences)) {
                if (!details.match && details.is_critical) {
                    errFields.push(fieldName);
                }
            }
        }
        
        const row = [
            r.id,
            r.nome,
            r.cpf || '',
            r.status === 'CONCILIADO' ? 'CONCILIADO' : r.status === 'APENAS_ESCOLA' ? 'AUSENTE NO CENSO' : 'APENAS NO CENSO',
            r.has_divergences ? 'SIM' : 'NÃO',
            r.divergences_count,
            errFields.join(', ')
        ];

        const rowClean = row.map(val => {
            let val_str = String(val).replace(/"/g, '""').replace(/\r?\n/g, ' ');
            if (val_str.includes(';')) {
                val_str = `"${val_str}"`;
            }
            return val_str;
        });

        csvContent += rowClean.join(';') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    
    const date = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `relatorio_comparativo_censo_${date}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

