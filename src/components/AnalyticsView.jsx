import React, { useMemo } from 'react';
import { Bar, Line, Doughnut, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

export default function AnalyticsView({ students, theme }) {
  const isDark = theme === 'dark';
  const textColor = isDark ? '#9ca3af' : '#4b5563';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
  const textFamily = 'Outfit, sans-serif';

  const chartColors = {
    violet: { bg: '#7c3aed', fill: 'rgba(124, 58, 237, 0.25)', border: '#7c3aed' },
    blue: { bg: '#0ea5e9' },
    green: { bg: '#10b981' },
    amber: { bg: '#f59e0b', fill: 'rgba(245, 158, 11, 0.25)', border: '#f59e0b' },
    red: { bg: '#ef4444' },
    indigo: { bg: '#6366f1', fill: 'rgba(99, 102, 241, 0.25)', border: '#6366f1' },
    teal: { bg: '#14b8a6', fill: 'rgba(20, 184, 166, 0.25)', border: '#14b8a6' },
    grey: { bg: '#9ca3af', fill: 'rgba(156, 163, 175, 0.25)' },
    palette: [
      '#7c3aed', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', 
      '#6366f1', '#ec4899', '#14b8a6', '#f43f5e', '#8b5cf6'
    ]
  };

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
  const bairrosChartData = useMemo(() => {
    const bairroCounts = {};
    students.forEach(s => {
      const val = s['Bairro'] || 'Não Informado';
      bairroCounts[val] = (bairroCounts[val] || 0) + 1;
    });

    const sortedBairros = Object.keys(bairroCounts)
      .sort((a, b) => bairroCounts[b] - bairroCounts[a])
      .slice(0, 10);
    const sortedBairroValues = sortedBairros.map(k => bairroCounts[k]);

    return {
      labels: sortedBairros.map(b => b.substring(0, 15)),
      datasets: [{
        label: 'Alunos',
        data: sortedBairroValues,
        backgroundColor: chartColors.indigo.fill,
        borderColor: chartColors.indigo.border,
        borderWidth: 2,
        borderRadius: 6
      }]
    };
  }, [students]);

  // 2. Gráfico de Distribuição por Idade Atual
  const idadesChartData = useMemo(() => {
    const idadeCounts = {};
    students.forEach(s => {
      const val = s['Idade na data atual'] || s['Idade na matrícula'];
      if (val) {
        const age = parseInt(val);
        idadeCounts[age] = (idadeCounts[age] || 0) + 1;
      }
    });

    const sortedAges = Object.keys(idadeCounts).map(Number).sort((a, b) => a - b);
    const sortedAgeValues = sortedAges.map(age => idadeCounts[age]);

    return {
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
    };
  }, [students]);

  // 3. Gráfico Detalhado de Necessidades Especiais (AEE/PCD)
  const deficienciasChartData = useMemo(() => {
    const defCounts = {
      'Autismo (TEA)': 0,
      'TDAH / Aprendizagem': 0,
      'Outras Deficiências': 0,
      'Sem Necessidades': 0
    };

    students.forEach(s => {
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

    return {
      labels: Object.keys(defCounts),
      datasets: [{
        data: Object.values(defCounts),
        backgroundColor: [chartColors.violet.bg, chartColors.amber.bg, chartColors.red.bg, chartColors.grey.fill],
        borderColor: isDark ? '#13151b' : '#ffffff',
        borderWidth: 2
      }]
    };
  }, [students, isDark]);

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

  // 4. Autorização do Uso de Imagem
  const imagemChartData = useMemo(() => {
    const imgCounts = { 'Sim': 0, 'Não': 0, 'Não Respondido': 0 };
    students.forEach(s => {
      const val = s['Autorização do Uso de Imagem'] || 'Não Respondido';
      if (val === 'Sim') imgCounts['Sim']++;
      else if (val === 'Não') imgCounts['Não']++;
      else imgCounts['Não Respondido']++;
    });

    return {
      labels: ['Autorizado', 'Não Autorizado', 'Pendente/Sem info'],
      datasets: [{
        data: [imgCounts['Sim'], imgCounts['Não'], imgCounts['Não Respondido']],
        backgroundColor: [chartColors.green.bg, chartColors.red.bg, chartColors.grey.bg],
        borderColor: isDark ? '#13151b' : '#ffffff',
        borderWidth: 2
      }]
    };
  }, [students, isDark]);

  const imagemPieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'right',
        labels: { color: textColor, font: { family: textFamily } }
      }
    }
  };

  return (
    <section id="view-analytics" className="content-view active">
      <div className="view-header">
        <div>
          <h2>Análise de Dados Avançada</h2>
          <p>Relatórios demográficos, distribuição por bairro e de saúde.</p>
        </div>
      </div>

      <div className="dashboard-grid animate-fade-in">
        {/* Distribuição Geográfica (Bairros) */}
        <div className="chart-card glass col-span-2">
          <div className="chart-header">
            <h4>Concentração de Alunos por Bairro (Top 10 Bairros)</h4>
            <span className="chart-subtitle">Residência dos alunos matriculados</span>
          </div>
          <div className="chart-body" style={{ height: '350px' }}>
            <Bar data={bairrosChartData} options={commonOptions} />
          </div>
        </div>

        {/* Idade dos Alunos */}
        <div className="chart-card glass">
          <div className="chart-header">
            <h4>Distribuição por Idade Atual</h4>
            <span className="chart-subtitle">Faixa etária da escola</span>
          </div>
          <div className="chart-body">
            <Line data={idadesChartData} options={commonOptions} />
          </div>
        </div>

        {/* Necessidades Especiais */}
        <div className="chart-card glass">
          <div className="chart-header">
            <h4>Necessidades Especiais (TEA/PCD)</h4>
            <span className="chart-subtitle">Alunos diagnosticados com alguma deficiência ou transtorno</span>
          </div>
          <div className="chart-body-pie">
            <Doughnut data={deficienciasChartData} options={pieOptions} />
          </div>
        </div>

        {/* Autorização de Imagem */}
        <div className="chart-card glass col-span-2">
          <div className="chart-header">
            <h4>Autorização de Uso de Imagem pela Escola</h4>
            <span className="chart-subtitle">Percentual de liberação das famílias</span>
          </div>
          <div className="chart-body-pie" style={{ maxHeight: '250px' }}>
            <Pie data={imagemChartData} options={imagemPieOptions} />
          </div>
        </div>
      </div>
    </section>
  );
}
