import React, { useState, useEffect, useMemo } from 'react';
import { Search, Download, FilterX, ChevronLeft, ChevronRight, Eye, Info } from 'lucide-react';

export default function StudentsView({ students, globalSearch, setGlobalSearch, onSelectStudent, showToast, initialFilters, clearInitialFilters }) {
  // 1. Local filter states
  const [localSearch, setLocalSearch] = useState(globalSearch);
  const [etapaFilter, setEtapaFilter] = useState('');
  const [turnoFilter, setTurnoFilter] = useState('');
  const [turmaFilter, setTurmaFilter] = useState('');
  const [bolsaFilter, setBolsaFilter] = useState('');
  const [pcdFilter, setPcdFilter] = useState('');
  const [situacaoFilter, setSituacaoFilter] = useState('');
  
  // Expanded filter states
  const [sexoFilter, setSexoFilter] = useState('');
  const [corFilter, setCorFilter] = useState('');
  const [bairroFilter, setBairroFilter] = useState('');
  const [idadeFilter, setIdadeFilter] = useState('');
  const [transporteFilter, setTransporteFilter] = useState('');
  const [restricaoFilter, setRestricaoFilter] = useState('');
  const [imagemFilter, setImagemFilter] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Sync global search with local state
  useEffect(() => {
    setLocalSearch(globalSearch);
    setCurrentPage(1);
  }, [globalSearch]);

  // Sync initial class filters when navigating from ClassesView
  useEffect(() => {
    if (initialFilters) {
      setEtapaFilter(initialFilters.etapa || '');
      setTurmaFilter(initialFilters.turma || '');
      setTurnoFilter(initialFilters.turno || '');
      setCurrentPage(1);
      if (clearInitialFilters) clearInitialFilters();
    }
  }, [initialFilters, clearInitialFilters]);

  const handleLocalSearchChange = (e) => {
    const val = e.target.value;
    setLocalSearch(val);
    setGlobalSearch(val);
    setCurrentPage(1);
  };

  // 2. Compute dynamic filter options
  const dynamicOptions = useMemo(() => {
    const etapas = [...new Set(students.map(s => s['Período']).filter(Boolean))].sort();
    const turmas = [...new Set(students.map(s => s['Turma']).filter(Boolean))].sort();
    const bairros = [...new Set(students.map(s => s['Bairro']).filter(Boolean))].sort();
    const idades = [...new Set(students.map(s => {
      const val = s['Idade na data atual'] || s['Idade na matrícula'];
      return val ? parseInt(val) : null;
    }).filter(v => v !== null))].sort((a, b) => a - b);
    
    return { etapas, turmas, bairros, idades };
  }, [students]);

  // Reset filters
  const handleClearFilters = () => {
    setLocalSearch('');
    setGlobalSearch('');
    setEtapaFilter('');
    setTurnoFilter('');
    setTurmaFilter('');
    setBolsaFilter('');
    setPcdFilter('');
    setSituacaoFilter('');
    setSexoFilter('');
    setCorFilter('');
    setBairroFilter('');
    setIdadeFilter('');
    setTransporteFilter('');
    setRestricaoFilter('');
    setImagemFilter('');
    setCurrentPage(1);
    showToast('Todos os filtros foram limpos.', 'success');
  };

  // 3. Filtered students list
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const query = localSearch.toLowerCase().trim();
      
      // Text Match
      const nameMatch = !query || 
        (s['Nome'] && s['Nome'].toLowerCase().includes(query)) || 
        (s['Nome social'] && s['Nome social'].toLowerCase().includes(query));
      
      const cpfMatch = !query || 
        (s['CPF'] && s['CPF'].replace(/\D/g, '').includes(query.replace(/\D/g, '')));
      
      const codMatch = !query || 
        (s['Código'] && String(s['Código']).includes(query));
      
      const raMatch = !query || 
        (s['Registro do estudante (RA)'] && String(s['Registro do estudante (RA)']).includes(query));
      
      const textMatch = nameMatch || cpfMatch || codMatch || raMatch;

      // Select Matches
      const etapaMatch = !etapaFilter || s['Período'] === etapaFilter;
      const turnoMatch = !turnoFilter || s['Turno'] === turnoFilter;
      const turmaMatch = !turmaFilter || s['Turma'] === turmaFilter;
      const bolsaMatch = !bolsaFilter || s['Bolsa Família'] === bolsaFilter;
      
      const isPcd = s['Estudante com deficiência'] === 'Sim' || 
                    s['Pessoa física com transtorno(s) que impacta(m) o desenvolvimento da aprendizagem'] === 'Sim' || 
                    (s['CID'] && s['CID'].trim() !== '');
      const pcdMatch = !pcdFilter || (pcdFilter === 'Sim' ? isPcd : !isPcd);

      const situacaoMatch = !situacaoFilter || s['Situação'] === situacaoFilter;
      
      // Extended filters
      const sexoMatch = !sexoFilter || s['Sexo'] === sexoFilter;
      const corVal = s['Cor'] ? s['Cor'].trim() : '';
      const isNaoDeclarada = !corVal || corVal.toLowerCase() === 'não declarada';
      const corMatch = !corFilter || 
        (corFilter === 'Não Declarada' ? isNaoDeclarada : corVal.toLowerCase() === corFilter.toLowerCase());
      const bairroMatch = !bairroFilter || s['Bairro'] === bairroFilter;
      
      const age = s['Idade na data atual'] || s['Idade na matrícula'];
      const idadeMatch = !idadeFilter || (age && parseInt(age) === parseInt(idadeFilter));
      
      const transporteMatch = !transporteFilter || s['Utiliza transporte'] === transporteFilter;
      const restricaoMatch = !restricaoFilter || s['Possui restrição alimentar?'] === restricaoFilter;
      const imagemMatch = !imagemFilter || s['Autorização do Uso de Imagem'] === imagemFilter;

      return textMatch && etapaMatch && turnoMatch && turmaMatch && bolsaMatch && pcdMatch && 
             situacaoMatch && sexoMatch && corMatch && bairroMatch && idadeMatch && 
             transporteMatch && restricaoMatch && imagemMatch;
    });
  }, [students, localSearch, etapaFilter, turnoFilter, turmaFilter, bolsaFilter, pcdFilter, situacaoFilter, sexoFilter, corFilter, bairroFilter, idadeFilter, transporteFilter, restricaoFilter, imagemFilter]);

  // Reset page when filtered data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredStudents.length]);

  // 4. Pagination math
  const totalStudents = filteredStudents.length;
  const totalPages = Math.ceil(totalStudents / rowsPerPage) || 1;
  const activeCurrentPage = currentPage > totalPages ? totalPages : currentPage;
  
  const startIdx = (activeCurrentPage - 1) * rowsPerPage;
  const endIdx = Math.min(startIdx + rowsPerPage, totalStudents);

  const displayedStudents = useMemo(() => {
    return filteredStudents.slice(startIdx, endIdx);
  }, [filteredStudents, startIdx, endIdx]);

  // 5. CSS Status classes helper
  const getStatusClass = (situacao) => {
    if (!situacao) return 'normal';
    const s = situacao.toUpperCase();
    if (s === 'NORMAL') return 'normal';
    if (s === 'TRANSFERIDO' || s.includes('TRANSF')) return 'transferido';
    if (s === 'DESISTENTE' || s.includes('DESIS') || s === 'ABANDONO') return 'desistente';
    return 'normal';
  };

  // 6. CSV Export Function
  const exportToCSV = () => {
    if (filteredStudents.length === 0) {
      showToast('Não há dados filtrados para exportar.', 'error');
      return;
    }

    const columns = [
      'Código', 'Nome', 'Período', 'Turma', 'Turno', 'Situação', 'Data de Nascimento', 'CPF', 
      'Bairro', 'Município', 'Contato 1', 'Filiação 1', 'Filiação 2', 'Estudante com deficiência'
    ];

    let csvContent = '\uFEFF'; // BOM for Excel UTF-8 compatibility
    csvContent += columns.join(';') + '\n';

    filteredStudents.forEach(s => {
      const row = columns.map(colName => {
        let val = s[colName] || '';
        val = String(val).replace(/"/g, '""').replace(/\r?\n/g, ' ');
        if (val.includes(';')) {
          val = `"${val}"`;
        }
        return val;
      });
      csvContent += row.join(';') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);

    const date = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `alunos_filtrados_matilde_guerra_${date}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Exportação concluída com sucesso!', 'success');
  };

  return (
    <section id="view-students" className="content-view active">
      <div className="view-header">
        <div>
          <h2>Diretório de Alunos</h2>
          <p>Consulte, filtre e acesse a ficha completa de cada estudante.</p>
        </div>
        <div className="view-header-actions">
          <button className="btn btn-secondary btn-icon" onClick={exportToCSV}>
            <Download size={16} />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Filtros do Diretório */}
      <div className="filters-panel glass animate-fade-in">
        <div className="filters-grid">
          <div className="filter-group text-search-group">
            <label htmlFor="filter-search">Pesquisa Direta</label>
            <div className="filter-input-wrapper">
              <Search size={16} />
              <input
                type="text"
                id="filter-search"
                value={localSearch}
                onChange={handleLocalSearchChange}
                placeholder="Nome, CPF ou Matrícula..."
              />
            </div>
          </div>
          <div className="filter-group">
            <label htmlFor="filter-etapa">Série / Etapa</label>
            <select
              id="filter-etapa"
              value={etapaFilter}
              onChange={(e) => setEtapaFilter(e.target.value)}
            >
              <option value="">Todas</option>
              {dynamicOptions.etapas.map(etapa => (
                <option key={etapa} value={etapa}>{etapa}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="filter-turno">Turno</label>
            <select
              id="filter-turno"
              value={turnoFilter}
              onChange={(e) => setTurnoFilter(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="MATUTINO">Matutino</option>
              <option value="VESPERTINO">Vespertino</option>
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="filter-turma">Turma</label>
            <select
              id="filter-turma"
              value={turmaFilter}
              onChange={(e) => setTurmaFilter(e.target.value)}
            >
              <option value="">Todas</option>
              {dynamicOptions.turmas.map(turma => (
                <option key={turma} value={turma}>{turma}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="filter-situacao">Situação</label>
            <select
              id="filter-situacao"
              value={situacaoFilter}
              onChange={(e) => setSituacaoFilter(e.target.value)}
            >
              <option value="">Todas</option>
              <option value="NORMAL">Normal</option>
              <option value="TRANSFERIDO">Transferido</option>
              <option value="DESISTENTE">Desistente</option>
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="filter-sexo">Gênero (Sexo)</label>
            <select
              id="filter-sexo"
              value={sexoFilter}
              onChange={(e) => setSexoFilter(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="Feminino">Feminino</option>
              <option value="Masculino">Masculino</option>
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="filter-cor">Raça / Cor</label>
            <select
              id="filter-cor"
              value={corFilter}
              onChange={(e) => setCorFilter(e.target.value)}
            >
              <option value="">Todas</option>
              <option value="Branca">Branca</option>
              <option value="Parda">Parda</option>
              <option value="Preta">Preta</option>
              <option value="Amarela">Amarela</option>
              <option value="Indígena">Indígena</option>
              <option value="Não Declarada">Não Declarada / Sem informação</option>
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="filter-idade">Idade Atual</label>
            <select
              id="filter-idade"
              value={idadeFilter}
              onChange={(e) => setIdadeFilter(e.target.value)}
            >
              <option value="">Todas</option>
              {dynamicOptions.idades.map(idade => (
                <option key={idade} value={idade}>{idade} anos</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="filter-bairro">Bairro de Residência</label>
            <select
              id="filter-bairro"
              value={bairroFilter}
              onChange={(e) => setBairroFilter(e.target.value)}
            >
              <option value="">Todos</option>
              {dynamicOptions.bairros.map(bairro => (
                <option key={bairro} value={bairro}>{bairro}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="filter-bolsa">Bolsa Família</label>
            <select
              id="filter-bolsa"
              value={bolsaFilter}
              onChange={(e) => setBolsaFilter(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="Sim">Sim</option>
              <option value="Não">Não</option>
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="filter-pcd">PCD / Deficiência</label>
            <select
              id="filter-pcd"
              value={pcdFilter}
              onChange={(e) => setPcdFilter(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="Sim">Sim</option>
              <option value="Não">Não</option>
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="filter-transporte">Transporte Escolar</label>
            <select
              id="filter-transporte"
              value={transporteFilter}
              onChange={(e) => setTransporteFilter(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="Sim">Utiliza</option>
              <option value="Não">Não utiliza</option>
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="filter-restricao">Restrição Alimentar</label>
            <select
              id="filter-restricao"
              value={restricaoFilter}
              onChange={(e) => setRestricaoFilter(e.target.value)}
            >
              <option value="">Todas</option>
              <option value="Sim">Possui</option>
              <option value="Não">Não possui</option>
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="filter-imagem">Uso de Imagem</label>
            <select
              id="filter-imagem"
              value={imagemFilter}
              onChange={(e) => setImagemFilter(e.target.value)}
            >
              <option value="">Todas</option>
              <option value="Sim">Autorizado</option>
              <option value="Não">Não Autorizado</option>
              <option value="Não Respondido">Pendente/Sem resposta</option>
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

      {/* Tabela de Alunos */}
      <div className="table-container glass animate-fade-in">
        <div className="table-responsive">
          <table className="students-table">
            <thead>
              <tr>
                <th>Matrícula</th>
                <th>Nome do Aluno</th>
                <th>Etapa de Ensino</th>
                <th>Turma</th>
                <th>Turno</th>
                <th>Idade</th>
                <th>Status</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {totalStudents === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-muted">
                    <Info style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px', width: '20px', height: '20px' }} />
                    Nenhum aluno encontrado com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                displayedStudents.map((s) => {
                  const statusClass = getStatusClass(s['Situação']);
                  const age = s['Idade na data atual'] || s['Idade na matrícula'] || '-';
                  return (
                    <tr
                      key={s['Código']}
                      className="student-row"
                      style={{ cursor: 'pointer' }}
                      onClick={() => onSelectStudent(s)}
                    >
                      <td className="font-mono">{s['Código'] || '-'}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s['Nome']}</div>
                        {s['Nome social'] && (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            Nome Social: {s['Nome social']}
                          </div>
                        )}
                      </td>
                      <td>{s['Período'] || '-'}</td>
                      <td>
                        <span className="badge-turma">{s['Turma'] || '-'}</span>
                      </td>
                      <td>{s['Turno'] || '-'}</td>
                      <td>{age} anos</td>
                      <td>
                        <span className={`badge-status ${statusClass}`}>
                          {s['Situação'] || 'NORMAL'}
                        </span>
                      </td>
                      <td className="text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="btn btn-secondary btn-icon py-1 px-3"
                          onClick={() => onSelectStudent(s)}
                          title="Ver Ficha"
                        >
                          <Eye size={14} />
                          <span>Ficha</span>
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
        {totalStudents > 0 && (
          <div className="table-pagination">
            <div className="pagination-info">
              Mostrando <span>{startIdx + 1}</span> a <span>{endIdx}</span> de{' '}
              <span>{totalStudents}</span> alunos.
            </div>
            <div className="pagination-controls">
              <div className="rows-per-page">
                <span>Linhas por página:</span>
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
                  aria-label="Página Anterior"
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
                  aria-label="Próxima Página"
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
