import React, { useState, useMemo, useEffect } from 'react';
import { Search, Download, FilterX, ChevronLeft, ChevronRight, GitCompare, AlertCircle, CheckCircle, HelpCircle, Info, Users, UsersRound, ArrowLeft, Eye } from 'lucide-react';

export default function ComparisonView({ comparisonData, onSelectRecord, showToast, students = [], staff = [], staffComparisonData = [], onSelectStaff }) {
  // Mode: null = selection screen | 'alunos' | 'profissionais'
  const [mode, setMode] = useState(null);

  // 1. Alunos comparison filter states
  const [compSearch, setCompSearch] = useState('');
  const [compStatus, setCompStatus] = useState('');
  const [compDivergence, setCompDivergence] = useState('');
  const [compEtapa, setCompEtapa] = useState('');
  const [compTurma, setCompTurma] = useState('');
  const [compTurno, setCompTurno] = useState('');
  const [compField, setCompField] = useState('');

  // 2. Staff comparison filter states
  const [staffSearch, setStaffSearch] = useState('');
  const [staffStatus, setStaffStatus] = useState('');
  const [staffDivergence, setStaffDivergence] = useState('');
  const [staffCargo, setStaffCargo] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Map students by code for lookup
  const studentMap = useMemo(() => {
    const map = new Map();
    students.forEach(s => {
      if (s && s['Código']) {
        map.set(String(s['Código']), s);
      }
    });
    return map;
  }, [students]);

  // 2. Compute overall KPIs
  const kpis = useMemo(() => {
    const totalConciliados = comparisonData.filter(r => r.status === 'CONCILIADO').length;
    const totalMissing = comparisonData.filter(r => r.status === 'APENAS_ESCOLA').length;
    const totalDivergent = comparisonData.filter(r => r.status === 'CONCILIADO' && r.has_divergences).length;
    const totalPerfect = comparisonData.filter(r => r.status === 'CONCILIADO' && !r.has_divergences).length;
    return { totalConciliados, totalMissing, totalDivergent, totalPerfect };
  }, [comparisonData]);

  // 3. Compute Field Error Concentration (Top Discrepant Fields)
  const fieldErrorCounts = useMemo(() => {
    const counts = {};
    comparisonData.forEach(r => {
      if (r.status === 'CONCILIADO' && r.has_divergences) {
        Object.entries(r.divergences).forEach(([field, details]) => {
          if (!details.match && details.is_critical) {
            counts[field] = (counts[field] || 0) + 1;
          }
        });
      }
    });

    return Object.entries(counts)
      .map(([field, count]) => ({ field, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Take top 5
  }, [comparisonData]);

  // Compute dynamic options for filters
  const dynamicOptions = useMemo(() => {
    const etapas = [...new Set(students.map(s => s['Período']).filter(Boolean))].sort();
    const turmas = [...new Set(students.map(s => s['Turma']).filter(Boolean))].sort();
    return { etapas, turmas };
  }, [students]);

  const comparedFields = useMemo(() => {
    const fields = new Set();
    comparisonData.forEach(r => {
      if (r.divergences) {
        Object.keys(r.divergences).forEach(f => fields.add(f));
      }
    });
    return [...fields].sort();
  }, [comparisonData]);

  // Clear filters
  const handleClearFilters = () => {
    setCompSearch('');
    setCompStatus('');
    setCompDivergence('');
    setCompEtapa('');
    setCompTurma('');
    setCompTurno('');
    setCompField('');
    setCurrentPage(1);
    showToast('Filtros de conciliação limpos.', 'success');
  };

  // 4. Filtered records list
  const filteredData = useMemo(() => {
    return comparisonData.filter(r => {
      const query = compSearch.toLowerCase().trim();
      
      // Search Match
      const nameMatch = !query || (r.nome && r.nome.toLowerCase().includes(query));
      const cpfMatch = !query || (r.cpf && r.cpf.replace(/\D/g, '').includes(query.replace(/\D/g, '')));
      const idMatch = !query || (r.id && String(r.id).includes(query));
      const textMatch = nameMatch || cpfMatch || idMatch;

      // Status Match
      const statusMatch = !compStatus || r.status === compStatus;

      // Divergence Match
      let divMatch = true;
      if (compDivergence === 'divergent') {
        divMatch = r.status === 'CONCILIADO' && r.has_divergences;
      } else if (compDivergence === 'clean') {
        divMatch = r.status === 'CONCILIADO' && !r.has_divergences;
      }

      // School metadata matches
      const s = studentMap.get(String(r.id));
      const etapaMatch = !compEtapa || (s && s['Período'] === compEtapa);
      const turmaMatch = !compTurma || (s && s['Turma'] === compTurma);
      const turnoMatch = !compTurno || (s && s['Turno'] === compTurno);

      // Specific divergent field mismatch
      let fieldMatch = true;
      if (compField) {
        fieldMatch = r.status === 'CONCILIADO' && 
                     r.divergences[compField] && 
                     !r.divergences[compField].match &&
                     r.divergences[compField].is_critical;
      }

      return textMatch && statusMatch && divMatch && etapaMatch && turmaMatch && turnoMatch && fieldMatch;
    });
  }, [comparisonData, compSearch, compStatus, compDivergence, compEtapa, compTurma, compTurno, compField, studentMap]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredData.length]);

  // 5. Pagination math
  const totalRecords = filteredData.length;
  const totalPages = Math.ceil(totalRecords / rowsPerPage) || 1;
  const activeCurrentPage = currentPage > totalPages ? totalPages : currentPage;
  
  const startIdx = (activeCurrentPage - 1) * rowsPerPage;
  const endIdx = Math.min(startIdx + rowsPerPage, totalRecords);

  const displayedRecords = useMemo(() => {
    return filteredData.slice(startIdx, endIdx);
  }, [filteredData, startIdx, endIdx]);

  // 6. CSV Exporter for Comparison Reports
  const exportComparisonToCSV = () => {
    if (filteredData.length === 0) {
      showToast('Não há dados filtrados de comparação para exportar.', 'error');
      return;
    }

    const columns = [
      'ID Matrícula', 'Nome', 'CPF', 'Status no Censo', 'Possui Divergências Críticas', 
      'Total Divergências', 'Campos com Erro'
    ];

    let csvContent = '\uFEFF'; // BOM UTF-8
    csvContent += columns.join(';') + '\n';

    filteredData.forEach(r => {
      const errFields = [];
      if (r.status === 'CONCILIADO' && r.has_divergences) {
        Object.entries(r.divergences).forEach(([fieldName, details]) => {
          if (!details.match && details.is_critical) {
            errFields.push(fieldName);
          }
        });
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

    showToast('Relatório de conciliação exportado!', 'success');
  };

  // =============================================
  // STAFF COMPARISON FILTERING (mode === 'profissionais')
  // =============================================
  const staffCompData = useMemo(() => {
    if (staffComparisonData && staffComparisonData.length > 0) {
      return staffComparisonData;
    }
    // Fallback if staffComparisonData not loaded yet
    return staff.map(s => ({
      id: s['Código'] || s['CPF'],
      nome: s['Nome'],
      cpf: s['CPF'],
      status: 'APENAS_ESCOLA',
      has_divergences: false,
      divergences_count: 0,
      divergences: {},
      school_data: s,
      censo_data: null
    }));
  }, [staffComparisonData, staff]);

  // KPIs for Staff Comparison
  const staffKPIs = useMemo(() => {
    const totalConciliados = staffCompData.filter(r => r.status === 'CONCILIADO').length;
    const totalMissing = staffCompData.filter(r => r.status === 'APENAS_ESCOLA').length;
    const totalDivergent = staffCompData.filter(r => r.status === 'CONCILIADO' && r.has_divergences).length;
    const totalPerfect = staffCompData.filter(r => r.status === 'CONCILIADO' && !r.has_divergences).length;
    return { totalConciliados, totalMissing, totalDivergent, totalPerfect };
  }, [staffCompData]);

  // Dynamic cargo options
  const staffCargos = useMemo(() => {
    const cargos = [...new Set(staffCompData.map(r => {
      const s = r.school_data;
      return s ? (s['Cargo/Função'] || s['Profissão']) : null;
    }).filter(Boolean))].sort();
    return cargos;
  }, [staffCompData]);

  // Filtered staff comparison list
  const filteredStaffComp = useMemo(() => {
    return staffCompData.filter(r => {
      const q = staffSearch.toLowerCase().trim();
      const textMatch = !q ||
        (r.nome || '').toLowerCase().includes(q) ||
        (r.cpf || '').replace(/\D/g, '').includes(q.replace(/\D/g, '')) ||
        (r.id || '').includes(q);

      const statusMatch = !staffStatus || r.status === staffStatus;

      let divMatch = true;
      if (staffDivergence === 'divergent') {
        divMatch = r.status === 'CONCILIADO' && r.has_divergences;
      } else if (staffDivergence === 'clean') {
        divMatch = r.status === 'CONCILIADO' && !r.has_divergences;
      }

      const s = r.school_data;
      const cargo = s ? (s['Cargo/Função'] || s['Profissão'] || '') : '';
      const cargoMatch = !staffCargo || cargo === staffCargo;

      return textMatch && statusMatch && divMatch && cargoMatch;
    });
  }, [staffCompData, staffSearch, staffStatus, staffDivergence, staffCargo]);

  // Staff pagination math
  const staffTotalPages = Math.ceil(filteredStaffComp.length / rowsPerPage) || 1;
  const staffActivePage = Math.min(currentPage, staffTotalPages);
  const staffStartIdx = (staffActivePage - 1) * rowsPerPage;
  const staffEndIdx = Math.min(staffStartIdx + rowsPerPage, filteredStaffComp.length);
  const displayedStaffComp = useMemo(() => filteredStaffComp.slice(staffStartIdx, staffEndIdx), [filteredStaffComp, staffStartIdx, staffEndIdx]);

  // =============================================
  // RENDER: SELECTION SCREEN
  // =============================================
  if (mode === null) {
    return (
      <section id="view-comparison" className="content-view active">
        <div className="view-header animate-fade-in">
          <div>
            <h2>Conciliação com Censo Oficial</h2>
            <p>Selecione o grupo que deseja comparar com os dados do Censo.</p>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
          maxWidth: '780px',
          margin: '48px auto',
        }}>
          {/* Card Alunos */}
          <button
            onClick={() => { setMode('alunos'); setCurrentPage(1); }}
            style={{
              background: 'var(--bg-card)',
              border: '2px solid var(--border-color)',
              borderRadius: '20px',
              padding: '40px 32px',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
              backdropFilter: 'blur(12px)',
              boxShadow: 'var(--card-shadow)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--primary-color)';
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 16px 40px rgba(124,58,237,0.18)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--card-shadow)';
            }}
          >
            <div style={{
              width: '72px', height: '72px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(124,58,237,0.35)',
            }}>
              <Users size={32} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: '20px', marginBottom: '8px', color: 'var(--text-primary)' }}>Alunos</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Compare os dados dos alunos matriculados na escola com os registros do Censo Escolar oficial.
              </p>
            </div>
            <div style={{ marginTop: '4px' }}>
              <span className="badge-turma conciliado" style={{ fontSize: '12px', padding: '4px 12px' }}>
                {comparisonData.length} registros disponíveis
              </span>
            </div>
          </button>

          {/* Card Profissionais */}
          <button
            onClick={() => { setMode('profissionais'); setCurrentPage(1); }}
            style={{
              background: 'var(--bg-card)',
              border: '2px solid var(--border-color)',
              borderRadius: '20px',
              padding: '40px 32px',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
              backdropFilter: 'blur(12px)',
              boxShadow: 'var(--card-shadow)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#0ea5e9';
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 16px 40px rgba(14,165,233,0.18)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--card-shadow)';
            }}
          >
            <div style={{
              width: '72px', height: '72px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(14,165,233,0.35)',
            }}>
              <UsersRound size={32} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: '20px', marginBottom: '8px', color: 'var(--text-primary)' }}>Profissionais</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Compare os dados dos funcionários e profissionais escolares com o Censo Escolar oficial.
              </p>
            </div>
            <div style={{ marginTop: '4px' }}>
              <span className="badge-turma conciliado" style={{ fontSize: '12px', padding: '4px 12px' }}>
                {staffKPIs.totalConciliados} conciliações com o Censo
              </span>
            </div>
          </button>
        </div>
      </section>
    );
  }

  // =============================================
  // RENDER: PROFISSIONAIS MODE
  // =============================================
  if (mode === 'profissionais') {
    return (
      <section id="view-comparison-staff" className="content-view active">
        <div className="view-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              className="btn btn-secondary btn-icon"
              onClick={() => { setMode(null); setCurrentPage(1); }}
              style={{ padding: '6px 12px' }}
            >
              <ArrowLeft size={16} />
              <span>Voltar</span>
            </button>
            <div>
              <h2>Profissionais — Conciliação com Censo Oficial</h2>
              <p>Compare as informações dos funcionários e professores com o relatório oficial do Censo Escolar.</p>
            </div>
          </div>
        </div>

        {/* KPIs da Comparação de Profissionais */}
        <div className="kpi-grid animate-fade-in">
          <div className="kpi-card glass">
            <div className="kpi-icon-wrapper color-green">
              <CheckCircle size={22} />
            </div>
            <div className="kpi-info">
              <span className="kpi-label">Conciliados</span>
              <h3 className="kpi-value">{staffKPIs.totalConciliados}</h3>
              <span className="kpi-subtext">Presentes nas duas bases</span>
            </div>
          </div>
          <div className="kpi-card glass">
            <div className="kpi-icon-wrapper color-amber">
              <AlertCircle size={22} />
            </div>
            <div className="kpi-info">
              <span className="kpi-label">Ausentes no Censo</span>
              <h3 className="kpi-value">{staffKPIs.totalMissing}</h3>
              <span className="kpi-subtext">Apenas na Escola (fora de sala)</span>
            </div>
          </div>
          <div className="kpi-card glass">
            <div className="kpi-icon-wrapper color-red">
              <AlertCircle size={22} />
            </div>
            <div className="kpi-info">
              <span className="kpi-label">Com Divergências</span>
              <h3 className="kpi-value">{staffKPIs.totalDivergent}</h3>
              <span className="kpi-subtext">Necessitam correção</span>
            </div>
          </div>
          <div className="kpi-card glass">
            <div className="kpi-icon-wrapper color-violet">
              <CheckCircle size={22} />
            </div>
            <div className="kpi-info">
              <span className="kpi-label">Sem Divergências</span>
              <h3 className="kpi-value">{staffKPIs.totalPerfect}</h3>
              <span className="kpi-subtext">Cadastros 100% integrados</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-panel glass animate-fade-in">
          <div className="filters-grid">
            <div className="filter-group text-search-group">
              <label>Pesquisar Profissional</label>
              <div className="filter-input-wrapper">
                <Search size={16} />
                <input
                  type="text"
                  value={staffSearch}
                  onChange={e => { setStaffSearch(e.target.value); setCurrentPage(1); }}
                  placeholder="Nome, CPF ou Código..."
                />
              </div>
            </div>
            <div className="filter-group">
              <label>Status no Censo</label>
              <select value={staffStatus} onChange={e => { setStaffStatus(e.target.value); setCurrentPage(1); }}>
                <option value="">Todos</option>
                <option value="CONCILIADO">Conciliado (Nas duas bases)</option>
                <option value="APENAS_ESCOLA">Ausente no Censo (Apenas na Escola)</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Dados Cadastrais</label>
              <select value={staffDivergence} onChange={e => { setStaffDivergence(e.target.value); setCurrentPage(1); }}>
                <option value="">Todos</option>
                <option value="clean">Sem Divergências (100% OK)</option>
                <option value="divergent">Com Divergências</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Cargo / Função</label>
              <select value={staffCargo} onChange={e => { setStaffCargo(e.target.value); setCurrentPage(1); }}>
                <option value="">Todos</option>
                {staffCargos.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="filter-group btn-clear-group">
              <button className="btn btn-secondary btn-full" onClick={() => { setStaffSearch(''); setStaffStatus(''); setStaffDivergence(''); setStaffCargo(''); setCurrentPage(1); showToast('Filtros limpos.', 'success'); }}>
                <FilterX size={16} /><span>Limpar Filtros</span>
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="table-container glass animate-fade-in">
          <div className="table-responsive">
            <table className="students-table">
              <thead>
                <tr>
                  <th>ID/Código</th>
                  <th>Nome do Profissional</th>
                  <th>CPF</th>
                  <th>Status no Censo</th>
                  <th>Divergências</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaffComp.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-muted">
                    <Info style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px', width: '18px', height: '18px' }} />
                    Nenhum profissional encontrado com os filtros selecionados.
                  </td></tr>
                ) : (
                  displayedStaffComp.map((r) => {
                    let statusBadge = null;
                    let divLabel = null;

                    if (r.status === 'CONCILIADO') {
                      statusBadge = <span className="badge-status conciliado">Conciliado</span>;
                      if (r.has_divergences) {
                        divLabel = (
                          <span style={{ color: 'var(--danger-color)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <AlertCircle size={14} />
                            {r.divergences_count} divergências
                          </span>
                        );
                      } else {
                        divLabel = (
                          <span style={{ color: 'var(--success-color)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle size={14} />
                            Sem divergências (100% OK)
                          </span>
                        );
                      }
                    } else {
                      statusBadge = <span className="badge-status apenas-escola">Apenas na Escola</span>;
                      divLabel = (
                        <span style={{ color: 'var(--warning-color)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <HelpCircle size={14} />
                          Fora do relatório de sala do Censo
                        </span>
                      );
                    }

                    return (
                      <tr key={r.id} className="comp-row" style={{ cursor: 'pointer' }} onClick={() => onSelectRecord(r)}>
                        <td className="font-mono">{r.id || '-'}</td>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.nome}</div>
                        </td>
                        <td className="font-mono">{r.cpf || '-'}</td>
                        <td>{statusBadge}</td>
                        <td>{divLabel}</td>
                        <td className="text-right" onClick={e => e.stopPropagation()}>
                          <button className="btn btn-secondary btn-icon py-1 px-3" onClick={() => onSelectRecord(r)}>
                            <GitCompare size={14} /><span>Comparar</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {filteredStaffComp.length > 0 && (
            <div className="table-pagination">
              <div className="pagination-info">
                Mostrando <span>{staffStartIdx + 1}</span> a <span>{staffEndIdx}</span> de <span>{filteredStaffComp.length}</span> registros.
              </div>
              <div className="pagination-controls">
                <div className="rows-per-page">
                  <span>Linhas:</span>
                  <select value={rowsPerPage} onChange={e => { setRowsPerPage(parseInt(e.target.value)); setCurrentPage(1); }}>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>
                <div className="pagination-buttons">
                  <button className="btn btn-pagination" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={staffActivePage === 1}><ChevronLeft size={16} /></button>
                  <span className="page-indicator">Pág. {staffActivePage} de {staffTotalPages}</span>
                  <button className="btn btn-pagination" onClick={() => setCurrentPage(p => Math.min(p + 1, staffTotalPages))} disabled={staffActivePage === staffTotalPages}><ChevronRight size={16} /></button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    );
  }

  // =============================================
  // RENDER: ALUNOS MODE
  // =============================================
  return (
    <section id="view-comparison" className="content-view active">
      {/* Header with back button */}
      <div className="view-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            className="btn btn-secondary btn-icon"
            onClick={() => { setMode(null); setCurrentPage(1); }}
            style={{ padding: '6px 12px' }}
          >
            <ArrowLeft size={16} />
            <span>Voltar</span>
          </button>
          <div>
            <h2>Alunos — Conciliação com Censo Oficial</h2>
            <p>Compare as informações do banco escolar com o censo e identifique divergências.</p>
          </div>
        </div>
        <div className="view-header-actions">
          <button className="btn btn-secondary btn-icon" onClick={exportComparisonToCSV}>
            <Download size={16} />
            <span>Exportar Relatório</span>
          </button>
        </div>
      </div>

      {/* KPIs da Comparação */}
      <div className="kpi-grid animate-fade-in">
        <div className="kpi-card glass">
          <div className="kpi-icon-wrapper color-green">
            <CheckCircle size={22} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Conciliados</span>
            <h3 className="kpi-value">{kpis.totalConciliados}</h3>

            <span className="kpi-subtext">Presentes nas duas bases</span>
          </div>
        </div>
        <div className="kpi-card glass">
          <div className="kpi-icon-wrapper color-amber">
            <AlertCircle size={22} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Ausentes no Censo</span>
            <h3 className="kpi-value">{kpis.totalMissing}</h3>
            <span className="kpi-subtext">Apenas na Escola</span>
          </div>
        </div>
        <div className="kpi-card glass">
          <div className="kpi-icon-wrapper color-red">
            <AlertCircle size={22} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Com Divergências</span>
            <h3 className="kpi-value">{kpis.totalDivergent}</h3>
            <span className="kpi-subtext">Necessitam correção</span>
          </div>
        </div>
        <div className="kpi-card glass">
          <div className="kpi-icon-wrapper color-violet">
            <CheckCircle size={22} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Sem Divergências</span>
            <h3 className="kpi-value">{kpis.totalPerfect}</h3>
            <span className="kpi-subtext">Cadastros 100% corretos</span>
          </div>
        </div>
      </div>

      {/* Layout de Duas Colunas: Gráfico de Concentração de Erros + Tabela */}
      <div className="dashboard-grid animate-fade-in" style={{ marginBottom: '24px' }}>
        {/* Painel de Filtros de Comparação */}
        <div className="filters-panel glass col-span-2" style={{ margin: 0, height: '100%' }}>
          <div className="filters-grid">
            <div className="filter-group text-search-group">
              <label htmlFor="comp-filter-search">Pesquisar Aluno</label>
              <div className="filter-input-wrapper">
                <Search size={16} />
                <input
                  type="text"
                  id="comp-filter-search"
                  value={compSearch}
                  onChange={(e) => setCompSearch(e.target.value)}
                  placeholder="Nome, CPF ou Matrícula..."
                />
              </div>
            </div>
            <div className="filter-group">
              <label htmlFor="comp-filter-status">Status no Censo</label>
              <select
                id="comp-filter-status"
                value={compStatus}
                onChange={(e) => setCompStatus(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="CONCILIADO">Conciliado (Nas duas bases)</option>
                <option value="APENAS_ESCOLA">Ausente no Censo (Apenas na Escola)</option>
              </select>
            </div>
            <div className="filter-group">
              <label htmlFor="comp-filter-divergence">Dados Cadastrais</label>
              <select
                id="comp-filter-divergence"
                value={compDivergence}
                onChange={(e) => setCompDivergence(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="divergent">Com Divergências Críticas</option>
                <option value="clean">Sem Divergências (100% OK)</option>
              </select>
            </div>
            <div className="filter-group">
              <label htmlFor="comp-filter-etapa">Série / Etapa</label>
              <select
                id="comp-filter-etapa"
                value={compEtapa}
                onChange={(e) => setCompEtapa(e.target.value)}
              >
                <option value="">Todas</option>
                {dynamicOptions.etapas.map(etapa => (
                  <option key={etapa} value={etapa}>{etapa}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label htmlFor="comp-filter-turma">Turma</label>
              <select
                id="comp-filter-turma"
                value={compTurma}
                onChange={(e) => setCompTurma(e.target.value)}
              >
                <option value="">Todas</option>
                {dynamicOptions.turmas.map(turma => (
                  <option key={turma} value={turma}>{turma}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label htmlFor="comp-filter-turno">Turno</label>
              <select
                id="comp-filter-turno"
                value={compTurno}
                onChange={(e) => setCompTurno(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="MATUTINO">Matutino</option>
                <option value="VESPERTINO">Vespertino</option>
              </select>
            </div>
            <div className="filter-group">
              <label htmlFor="comp-filter-field">Divergência Específica</label>
              <select
                id="comp-filter-field"
                value={compField}
                onChange={(e) => setCompField(e.target.value)}
              >
                <option value="">Todas</option>
                {comparedFields.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <div className="filter-group btn-clear-group">
              <button className="btn btn-secondary btn-full" onClick={handleClearFilters}>
                <FilterX size={16} />
                <span>Limpar Filtros</span>
              </button>
            </div>
          </div>
        </div>

        {/* Concentração de Erros por Campo */}
        <div className="chart-card glass discrepancy-breakdown-card" style={{ minHeight: '100%', padding: '20px' }}>
          <div className="chart-header" style={{ marginBottom: '10px' }}>
            <h4 style={{ fontSize: '15px' }}>Campos com Mais Inconsistências</h4>
            <span className="chart-subtitle">Top 5 dados divergentes na auditoria</span>
          </div>
          <div className="discrepancy-breakdown-list">
            {fieldErrorCounts.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '10px' }}>
                Nenhuma divergência registrada.
              </p>
            ) : (
              fieldErrorCounts.map((item) => {
                // Percentage based on total divergent students
                const maxDivergences = kpis.totalDivergent || 1;
                const percentage = ((item.count / maxDivergences) * 100).toFixed(0);
                return (
                  <div key={item.field} className="discrepancy-breakdown-item">
                    <div className="discrepancy-item-info">
                      <span style={{ color: 'var(--text-primary)', fontSize: '12px' }}>{item.field}</span>
                      <span style={{ color: 'var(--danger-color)' }}>{item.count} alunos ({percentage}%)</span>
                    </div>
                    <div className="discrepancy-item-bar-bg">
                      <div
                        className="discrepancy-item-bar-fill"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Tabela de Comparação */}
      <div className="table-container glass animate-fade-in">
        <div className="table-responsive">
          <table className="students-table">
            <thead>
              <tr>
                <th>ID/Matrícula</th>
                <th>Nome do Aluno</th>
                <th>CPF</th>
                <th>Status no Censo</th>
                <th>Divergências</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {totalRecords === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted">
                    <Info style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px', width: '20px', height: '20px' }} />
                    Nenhum registro de comparação correspondente aos filtros.
                  </td>
                </tr>
              ) : (
                displayedRecords.map((r) => {
                  let statusBadge = '';
                  let divLabel = null;

                  if (r.status === 'CONCILIADO') {
                    statusBadge = '<span class="badge-status conciliado">Conciliado</span>';
                    if (r.has_divergences) {
                      divLabel = (
                        <span style={{ color: 'var(--danger-color)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <AlertCircle size={14} />
                          {r.divergences_count} divergências
                        </span>
                      );
                    } else {
                      divLabel = (
                        <span style={{ color: 'var(--success-color)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle size={14} />
                          Sem divergências
                        </span>
                      );
                    }
                  } else if (r.status === 'APENAS_ESCOLA') {
                    statusBadge = '<span class="badge-status apenas-escola">Apenas na Escola</span>';
                    divLabel = (
                      <span style={{ color: 'var(--warning-color)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <HelpCircle size={14} />
                        Ausente no Censo
                      </span>
                    );
                  }

                  return (
                    <tr
                      key={r.id}
                      className="comp-row"
                      style={{ cursor: 'pointer' }}
                      onClick={() => onSelectRecord(r)}
                    >
                      <td className="font-mono">{r.id || '-'}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.nome}</div>
                      </td>
                      <td className="font-mono">{r.cpf || '-'}</td>
                      <td dangerouslySetInnerHTML={{ __html: statusBadge }}></td>
                      <td>{divLabel}</td>
                      <td className="text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="btn btn-secondary btn-icon py-1 px-3"
                          onClick={() => onSelectRecord(r)}
                        >
                          <GitCompare size={14} />
                          <span>Comparar</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {totalRecords > 0 && (
          <div className="table-pagination">
            <div className="pagination-info">
              Mostrando <span>{startIdx + 1}</span> a <span>{endIdx}</span> de{' '}
              <span>{totalRecords}</span> registros.
            </div>
            <div className="pagination-controls">
              <div className="rows-per-page">
                <span>Linhas:</span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(parseInt(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              <div className="pagination-buttons">
                <button
                  className="btn btn-pagination"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={activeCurrentPage === 1}
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="page-indicator">
                  Pág. {activeCurrentPage} de {totalPages}
                </span>
                <button
                  className="btn btn-pagination"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={activeCurrentPage === totalPages}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
