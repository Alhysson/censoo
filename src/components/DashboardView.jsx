import React from 'react';
import { RefreshCw, Users, Baby, BookOpen, HeartHandshake, Accessibility } from 'lucide-react';
import { Bar, Doughnut, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function DashboardView({ students, onRefresh, theme }) {
  const isDark = theme === 'dark';
  const textColor = isDark ? '#9ca3af' : '#4b5563';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
  const textFamily = 'Outfit, sans-serif';

  // 1. Calculations for KPIs
  const totalStudents = students.length;

  const infantilStudents = students.filter(s => {
    const etapa = s['Etapa de ensino'] || '';
    return etapa.toLowerCase().includes('infantil') || 
           etapa.toLowerCase().includes('pré-escola') || 
           (s['Período'] && s['Período'].toLowerCase().includes('período'));
  });

  const fundamentalStudents = students.filter(s => {
    const etapa = s['Etapa de ensino'] || '';
    return etapa.toLowerCase().includes('fundamental') || 
           (s['Período'] && s['Período'].toLowerCase().includes('ano'));
  });

  const bolsaStudents = students.filter(s => s['Bolsa Família'] === 'Sim');

  const aeeStudents = students.filter(s => {
    return s['Estudante com deficiência'] === 'Sim' || 
           s['Pessoa física com transtorno(s) que impacta(m) o desenvolvimento da aprendizagem'] === 'Sim' ||
           (s['Tipo de Atendimento Educacional Especializado'] && s['Tipo de Atendimento Educacional Especializado'] !== '');
  });

  const infantilPct = totalStudents ? ((infantilStudents.length / totalStudents) * 100).toFixed(1) : 0;
  const fundamentalPct = totalStudents ? ((fundamentalStudents.length / totalStudents) * 100).toFixed(1) : 0;
  const bolsaPct = totalStudents ? ((bolsaStudents.length / totalStudents) * 100).toFixed(1) : 0;
  const aeePct = totalStudents ? ((aeeStudents.length / totalStudents) * 100).toFixed(1) : 0;

  // 2. Chart Colors
  const chartColors = {
    violet: { border: '#7c3aed', fill: 'rgba(124, 58, 237, 0.25)', bg: '#7c3aed' },
    blue: { bg: '#0ea5e9' },
    amber: { bg: '#f59e0b' },
    pink: { bg: '#ec4899' },
    indigo: { bg: '#6366f1' },
    emerald: { bg: '#10b981' },
    grey: { bg: '#9ca3af' },
    palette: [
      '#7c3aed', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', 
      '#6366f1', '#ec4899', '#14b8a6', '#f43f5e', '#8b5cf6'
    ]
  };

  // 3. Etapas (Bar chart) data
  const etapaCounts = {};
  students.forEach(s => {
    const val = s['Período'] || 'Não Definido';
    etapaCounts[val] = (etapaCounts[val] || 0) + 1;
  });

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

  const etapasChartData = {
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
  };

  const stagesOptions = {
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

  // 4. Turnos (Doughnut chart)
  const turnoCounts = {};
  students.forEach(s => {
    let val = s['Turno'] || 'Não Informado';
    val = val.toUpperCase();
    turnoCounts[val] = (turnoCounts[val] || 0) + 1;
  });

  const turnoLabels = Object.keys(turnoCounts);
  const turnoBgColors = turnoLabels.map(l => {
    if(l === 'MATUTINO') return chartColors.blue.bg;
    if(l === 'VESPERTINO') return chartColors.amber.bg;
    if(l === 'INTEGRAL') return chartColors.emerald.bg;
    return chartColors.grey.bg;
  });

  const turnosChartData = {
    labels: turnoLabels.map(l => l.charAt(0) + l.slice(1).toLowerCase()),
    datasets: [{
      data: Object.values(turnoCounts),
      backgroundColor: turnoBgColors,
      borderColor: isDark ? '#13151b' : '#ffffff',
      borderWidth: 2
    }]
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: { color: textColor, font: { family: textFamily } }
      }
    }
  };

  // 5. Gênero (Pie chart)
  const sexoCounts = { 'Feminino': 0, 'Masculino': 0 };
  students.forEach(s => {
    const val = s['Sexo'] || 'Não Informado';
    if (sexoCounts[val] !== undefined) {
      sexoCounts[val]++;
    } else {
      sexoCounts[val] = (sexoCounts[val] || 0) + 1;
    }
  });

  const sexoChartData = {
    labels: Object.keys(sexoCounts),
    datasets: [{
      data: Object.values(sexoCounts),
      backgroundColor: [chartColors.pink.bg, chartColors.indigo.bg, chartColors.grey.bg],
      borderColor: isDark ? '#13151b' : '#ffffff',
      borderWidth: 2
    }]
  };

  // 6. Cor / Raça (Horizontal Bar chart)
  const corCounts = {};
  students.forEach(s => {
    const val = s['Cor'] || 'Não Declarada';
    corCounts[val] = (corCounts[val] || 0) + 1;
  });

  const corChartData = {
    labels: Object.keys(corCounts),
    datasets: [{
      label: 'Alunos',
      data: Object.values(corCounts),
      backgroundColor: chartColors.palette.slice(0, Object.keys(corCounts).length).map(c => c + '44'),
      borderColor: chartColors.palette.slice(0, Object.keys(corCounts).length),
      borderWidth: 2,
      borderRadius: 6
    }]
  };

  const corOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: { legend: { display: false } },
    scales: {
      x: {
        grid: { color: gridColor },
        ticks: { color: textColor, font: { family: textFamily } },
        beginAtZero: true
      },
      y: {
        grid: { color: gridColor },
        ticks: { color: textColor, font: { family: textFamily } }
      }
    }
  };

  return (
    <section id="view-dashboard" className="content-view active">
      <div className="view-header animate-fade-in">
        <div>
          <h2>Painel Geral</h2>
          <p>Estatísticas rápidas e visão geral do censo escolar.</p>
        </div>
        <button className="btn btn-primary btn-icon" onClick={onRefresh}>
          <RefreshCw size={16} />
          <span>Atualizar Dados</span>
        </button>
      </div>

      {/* Cartões de Indicadores (KPIs) */}
      <div className="kpi-grid animate-fade-in">
        <div className="kpi-card glass">
          <div className="kpi-icon-wrapper color-violet">
            <Users size={22} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Total de Alunos</span>
            <h3 className="kpi-value">{totalStudents}</h3>
            <span className="kpi-subtext">Ativos no Censo</span>
          </div>
        </div>
        <div className="kpi-card glass">
          <div className="kpi-icon-wrapper color-blue">
            <Baby size={22} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Educação Infantil</span>
            <h3 className="kpi-value">{infantilStudents.length}</h3>
            <span className="kpi-subtext">{infantilPct}% do total</span>
          </div>
        </div>
        <div className="kpi-card glass">
          <div className="kpi-icon-wrapper color-green">
            <BookOpen size={22} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Ensino Fundamental</span>
            <h3 className="kpi-value">{fundamentalStudents.length}</h3>
            <span className="kpi-subtext">{fundamentalPct}% do total</span>
          </div>
        </div>
        <div className="kpi-card glass">
          <div className="kpi-icon-wrapper color-amber">
            <HeartHandshake size={22} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Bolsa Família</span>
            <h3 className="kpi-value">{bolsaStudents.length}</h3>
            <span className="kpi-subtext">{bolsaPct}% dos alunos</span>
          </div>
        </div>
        <div className="kpi-card glass">
          <div className="kpi-icon-wrapper color-red">
            <Accessibility size={22} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Atendimento AEE/PCD</span>
            <h3 className="kpi-value">{aeeStudents.length}</h3>
            <span className="kpi-subtext">{aeePct}% necessitam</span>
          </div>
        </div>
      </div>

      {/* Grid de Gráficos */}
      <div className="dashboard-grid animate-fade-in">
        <div className="chart-card glass col-span-2">
          <div className="chart-header">
            <h4>Distribuição de Matrículas por Etapa de Ensino</h4>
            <span className="chart-subtitle">Quantidade de alunos em cada série</span>
          </div>
          <div className="chart-body">
            <Bar data={etapasChartData} options={stagesOptions} />
          </div>
        </div>

        <div className="chart-card glass">
          <div className="chart-header">
            <h4>Alunos por Turno</h4>
            <span className="chart-subtitle">Período de aula</span>
          </div>
          <div className="chart-body-pie">
            <Doughnut data={turnosChartData} options={pieOptions} />
          </div>
        </div>

        <div className="chart-card glass">
          <div className="chart-header">
            <h4>Gênero dos Alunos</h4>
            <span className="chart-subtitle">Sexo declarado</span>
          </div>
          <div className="chart-body-pie">
            <Pie data={sexoChartData} options={pieOptions} />
          </div>
        </div>

        <div className="chart-card glass col-span-2">
          <div className="chart-header">
            <h4>Distribuição por Raça/Cor</h4>
            <span className="chart-subtitle">Autodeclaração étnica</span>
          </div>
          <div className="chart-body">
            <Bar data={corChartData} options={corOptions} />
          </div>
        </div>
      </div>
    </section>
  );
}
