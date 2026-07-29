import React, { useState, useMemo, useEffect } from 'react';
import {
  Search, Download, FilterX, ChevronLeft, ChevronRight, Eye, Info,
  BriefcaseIcon, GraduationCap, User, Phone, Mail, MapPin, Briefcase
} from 'lucide-react';

export default function StaffView({ staff, onSelectStaff, showToast }) {
  // --- Filter States ---
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [cargoFilter, setCargoFilter] = useState('');
  const [escolaridadeFilter, setEscolaridadeFilter] = useState('');
  const [ativoFilter, setAtivoFilter] = useState('');
  const [sexoFilter, setSexoFilter] = useState('');
  const [corFilter, setCorFilter] = useState('');
  const [bairroFilter, setBairroFilter] = useState('');

  // --- Pagination ---
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // --- Dynamic options ---
  const dynamicOptions = useMemo(() => {
    const cargos = [...new Set(staff.map(s => {
      const c = s['Cargo/Função'] || s['Profissão'];
      return c && c !== '-' ? c : null;
    }).filter(Boolean))].sort();

    const escolaridades = [...new Set(staff.map(s => s['Escolaridade']).filter(Boolean))].sort();
    const bairros = [...new Set(staff.map(s => s['Bairro']).filter(Boolean))].sort();

    return { cargos, escolaridades, bairros };
  }, [staff]);

  // --- KPIs ---
  const kpis = useMemo(() => {
    const total = staff.length;
    const funcionarios = staff.filter(s => s['_source'] === 'funcionario').length;
    const profissionais = staff.filter(s => s['_source'] === 'profissional_escolar').length;
    const ativos = staff.filter(s => s['Ativo'] === 'Sim').length;
    const superior = staff.filter(s =>
      (s['Escolaridade'] || '').toLowerCase().includes('superior')
    ).length;
    return { total, funcionarios, profissionais, ativos, superior };
  }, [staff]);

  // --- Filtered list ---
  const filteredStaff = useMemo(() => {
    return staff.filter(s => {
      const query = search.toLowerCase().trim();
      const name = (s['Nome'] || '').toLowerCase();
      const cpf = (s['CPF'] || '').replace(/\D/g, '');
      const searchQuery = query.replace(/\D/g, '');
      const textMatch = !query ||
        name.includes(query) ||
        (searchQuery && cpf.includes(searchQuery)) ||
        (s['Código'] && String(s['Código']).includes(query));

      const sourceMatch = !sourceFilter || s['_source'] === sourceFilter;

      const cargo = s['Cargo/Função'] || s['Profissão'] || '';
      const cargoMatch = !cargoFilter || cargo === cargoFilter;

      const escMatch = !escolaridadeFilter ||
        (s['Escolaridade'] || '').toLowerCase().includes(escolaridadeFilter.toLowerCase());

      const ativoMatch = !ativoFilter || s['Ativo'] === ativoFilter;
      const sexoMatch = !sexoFilter || s['Sexo'] === sexoFilter;

      const corVal = (s['Cor'] || '').trim();
      const isNaoDeclarada = !corVal || corVal.toLowerCase() === 'não declarada';
      const corMatch = !corFilter ||
        (corFilter === 'Não Declarada' ? isNaoDeclarada : corVal.toLowerCase() === corFilter.toLowerCase());

      const bairroMatch = !bairroFilter || s['Bairro'] === bairroFilter;

      return textMatch && sourceMatch && cargoMatch && escMatch && ativoMatch && sexoMatch && corMatch && bairroMatch;
    });
  }, [staff, search, sourceFilter, cargoFilter, escolaridadeFilter, ativoFilter, sexoFilter, corFilter, bairroFilter]);

  useEffect(() => { setCurrentPage(1); }, [filteredStaff.length]);

  // --- Pagination math ---
  const total = filteredStaff.length;
  const totalPages = Math.ceil(total / rowsPerPage) || 1;
  const activePage = Math.min(currentPage, totalPages);
  const startIdx = (activePage - 1) * rowsPerPage;
  const endIdx = Math.min(startIdx + rowsPerPage, total);
  const displayed = useMemo(() => filteredStaff.slice(startIdx, endIdx), [filteredStaff, startIdx, endIdx]);

  // --- Clear Filters ---
  const handleClear = () => {
    setSearch('');
    setSourceFilter('');
    setCargoFilter('');
    setEscolaridadeFilter('');
    setAtivoFilter('');
    setSexoFilter('');
    setCorFilter('');
    setBairroFilter('');
    setCurrentPage(1);
    showToast('Filtros limpos.', 'success');
  };

  // --- CSV Export ---
  const exportCSV = () => {
    if (filteredStaff.length === 0) {
      showToast('Nenhum dado para exportar.', 'error');
      return;
    }
    const cols = ['Código', 'Nome', 'CPF', 'Cargo/Função', 'Escolaridade', 'Ativo', 'Sexo', 'Cor', 'Bairro', 'Contato 1', 'E-mail'];
    let csv = '\uFEFF' + cols.join(';') + '\n';
    filteredStaff.forEach(s => {
      const row = cols.map(c => {
        let v = (s[c] || '').replace(/"/g, '""').replace(/\r?\n/g, ' ');
        return v.includes(';') ? `"${v}"` : v;
      });
      csv += row.join(';') + '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `profissionais_${new Date().toISOString().slice(0,10)}.csv`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('CSV exportado com sucesso!', 'success');
  };

  const getSourceLabel = (source) => {
    if (source === 'funcionario') return { label: 'Funcionário', cls: 'badge-turma' };
    return { label: 'Prof. Escolar', cls: 'badge-turma conciliado' };
  };

  return (
    <section id="view-staff" className="content-view active">
      {/* Header */}
      <div className="view-header">
        <div>
          <h2>Profissionais Escolares</h2>
          <p>Diretório de funcionários e profissionais da escola.</p>
        </div>
        <div className="view-header-actions">
          <button className="btn btn-secondary btn-icon" onClick={exportCSV}>
            <Download size={16} />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid animate-fade-in">
        <div className="kpi-card glass">
          <div className="kpi-icon-wrapper color-violet">
            <User size={22} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Total Profissionais</span>
            <h3 className="kpi-value">{kpis.total}</h3>
            <span className="kpi-subtext">No quadro escolar</span>
          </div>
        </div>
        <div className="kpi-card glass">
          <div className="kpi-icon-wrapper color-blue">
            <Briefcase size={22} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Funcionários</span>
            <h3 className="kpi-value">{kpis.funcionarios}</h3>
            <span className="kpi-subtext">Administrativo / Apoio</span>
          </div>
        </div>
        <div className="kpi-card glass">
          <div className="kpi-icon-wrapper color-green">
            <GraduationCap size={22} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Profissionais Escolares</span>
            <h3 className="kpi-value">{kpis.profissionais}</h3>
            <span className="kpi-subtext">Docentes / Pedagógico</span>
          </div>
        </div>
        <div className="kpi-card glass">
          <div className="kpi-icon-wrapper color-amber">
            <User size={22} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Ativos</span>
            <h3 className="kpi-value">{kpis.ativos}</h3>
            <span className="kpi-subtext">Vínculo ativo</span>
          </div>
        </div>
        <div className="kpi-card glass">
          <div className="kpi-icon-wrapper color-red">
            <GraduationCap size={22} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Nível Superior</span>
            <h3 className="kpi-value">{kpis.superior}</h3>
            <span className="kpi-subtext">Com graduação</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-panel glass animate-fade-in">
        <div className="filters-grid">
          <div className="filter-group text-search-group">
            <label htmlFor="staff-filter-search">Pesquisa Direta</label>
            <div className="filter-input-wrapper">
              <Search size={16} />
              <input
                type="text"
                id="staff-filter-search"
                value={search}
                onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                placeholder="Nome, CPF ou Código..."
              />
            </div>
          </div>

          <div className="filter-group">
            <label htmlFor="staff-filter-source">Tipo de Vínculo</label>
            <select id="staff-filter-source" value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}>
              <option value="">Todos</option>
              <option value="funcionario">Funcionário</option>
              <option value="profissional_escolar">Profissional Escolar</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="staff-filter-cargo">Cargo / Função</label>
            <select id="staff-filter-cargo" value={cargoFilter} onChange={e => setCargoFilter(e.target.value)}>
              <option value="">Todos</option>
              {dynamicOptions.cargos.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="staff-filter-escolaridade">Escolaridade</label>
            <select id="staff-filter-escolaridade" value={escolaridadeFilter} onChange={e => setEscolaridadeFilter(e.target.value)}>
              <option value="">Todas</option>
              {dynamicOptions.escolaridades.map(e => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="staff-filter-ativo">Situação</label>
            <select id="staff-filter-ativo" value={ativoFilter} onChange={e => setAtivoFilter(e.target.value)}>
              <option value="">Todas</option>
              <option value="Sim">Ativo</option>
              <option value="Não">Inativo</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="staff-filter-sexo">Gênero (Sexo)</label>
            <select id="staff-filter-sexo" value={sexoFilter} onChange={e => setSexoFilter(e.target.value)}>
              <option value="">Todos</option>
              <option value="Feminino">Feminino</option>
              <option value="Masculino">Masculino</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="staff-filter-cor">Raça / Cor</label>
            <select id="staff-filter-cor" value={corFilter} onChange={e => setCorFilter(e.target.value)}>
              <option value="">Todas</option>
              <option value="Branca">Branca</option>
              <option value="Parda">Parda</option>
              <option value="Preta">Preta</option>
              <option value="Amarela">Amarela</option>
              <option value="Indígena">Indígena</option>
              <option value="Não Declarada">Não Declarada</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="staff-filter-bairro">Bairro de Residência</label>
            <select id="staff-filter-bairro" value={bairroFilter} onChange={e => setBairroFilter(e.target.value)}>
              <option value="">Todos</option>
              {dynamicOptions.bairros.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div className="filter-group btn-clear-group">
            <button className="btn btn-secondary btn-full" onClick={handleClear}>
              <FilterX size={16} />
              <span>Limpar Filtros</span>
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
                <th>Código</th>
                <th>Nome</th>
                <th>Vínculo</th>
                <th>Cargo / Função</th>
                <th>Escolaridade</th>
                <th>Situação</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {total === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted">
                    <Info style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px', width: '20px', height: '20px' }} />
                    Nenhum profissional encontrado com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                displayed.map((s, idx) => {
                  const { label, cls } = getSourceLabel(s['_source']);
                  const cargo = s['Cargo/Função'] || s['Profissão'] || '-';
                  const isAtivo = s['Ativo'] === 'Sim';
                  return (
                    <tr
                      key={s['Código'] || idx}
                      className="student-row"
                      style={{ cursor: 'pointer' }}
                      onClick={() => onSelectStaff(s)}
                    >
                      <td className="font-mono">{s['Código'] || '-'}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s['Nome']}</div>
                        {s['CPF'] && (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{s['CPF']}</div>
                        )}
                      </td>
                      <td>
                        <span className={cls}>{label}</span>
                      </td>
                      <td>{cargo}</td>
                      <td>{s['Escolaridade'] || '-'}</td>
                      <td>
                        <span className={`badge-status ${isAtivo ? 'normal' : 'desistente'}`}>
                          {isAtivo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="text-right" onClick={e => e.stopPropagation()}>
                        <button
                          className="btn btn-secondary btn-icon py-1 px-3"
                          onClick={() => onSelectStaff(s)}
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

        {/* Pagination */}
        {total > 0 && (
          <div className="table-pagination">
            <div className="pagination-info">
              Mostrando <span>{startIdx + 1}</span> a <span>{endIdx}</span> de <span>{total}</span> profissionais.
            </div>
            <div className="pagination-controls">
              <div className="rows-per-page">
                <span>Linhas por página:</span>
                <select value={rowsPerPage} onChange={e => { setRowsPerPage(parseInt(e.target.value)); setCurrentPage(1); }}>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
              <div className="pagination-buttons">
                <button className="btn btn-pagination" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={activePage === 1}>
                  <ChevronLeft size={16} />
                </button>
                <span className="page-indicator">Pág. {activePage} de {totalPages}</span>
                <button className="btn btn-pagination" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={activePage === totalPages}>
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
