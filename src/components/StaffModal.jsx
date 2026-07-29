import React, { useState } from 'react';
import { X, Printer } from 'lucide-react';

export default function StaffModal({ member, onClose }) {
  const [activeTab, setActiveTab] = useState('pessoais');

  if (!member) return null;

  const nome = member['Nome'] || '?';
  const initials = nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  const isFuncionario = member['_source'] === 'funcionario';
  const cargo = member['Cargo/Função'] || member['Profissão'] || 'Não informado';
  const isAtivo = member['Ativo'] === 'Sim';

  const val = (v, suffix = '') => {
    if (!v || v === '-' || v === 'None') return <span style={{ opacity: 0.5 }}>-</span>;
    return <span>{v + suffix}</span>;
  };

  const endereco = [
    member['Tipo logradouro'] || member['Tipo Logradouro'],
    member['Logradouro'],
    member['Número'] ? `Nº ${member['Número']}` : null,
  ].filter(Boolean).join(', ') || '-';

  const tabs = [
    { id: 'pessoais', label: 'Dados Pessoais' },
    { id: 'profissional', label: 'Vínculo Profissional' },
    { id: 'formacao', label: 'Formação' },
    { id: 'contato', label: 'Contato & Endereço' },
    { id: 'familia', label: 'Filiação' },
  ];

  return (
    <div className="modal-overlay active" id="staff-detail-modal" onClick={onClose}>
      <div className="modal-container glass" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="modal-header">
          <div className="student-modal-meta">
            <div className="student-avatar-large" style={{
              background: isFuncionario
                ? 'linear-gradient(135deg, #0ea5e9, #0284c7)'
                : 'linear-gradient(135deg, #7c3aed, #4f46e5)'
            }}>
              {initials}
            </div>
            <div className="student-title-info">
              <h3>{nome}</h3>
              <div className="badges-row">
                <span className={`badge-turma ${isFuncionario ? '' : 'conciliado'}`}>
                  {isFuncionario ? 'Funcionário' : 'Profissional Escolar'}
                </span>
                <span className={`badge-status ${isAtivo ? 'normal' : 'desistente'}`}>
                  {isAtivo ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {cargo}
              </div>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Fechar Modal">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="modal-tabs">
          {tabs.map(t => (
            <button
              key={t.id}
              className={`tab-btn ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="modal-body scrollable">

          {/* TAB 1: DADOS PESSOAIS */}
          {activeTab === 'pessoais' && (
            <div className="tab-content active">
              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-label">Código</span>
                  <span className="detail-value">{val(member['Código'])}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">CPF</span>
                  <span className="detail-value font-mono">{val(member['CPF'])}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">RG / Identidade</span>
                  <span className="detail-value font-mono">{val(member['Identidade'])}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Data de Nascimento</span>
                  <span className="detail-value">{val(member['Data de Nascimento'])}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Idade</span>
                  <span className="detail-value">{val(member['Idade'], ' anos')}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Sexo</span>
                  <span className="detail-value">{val(member['Sexo'])}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Cor / Raça</span>
                  <span className="detail-value">{val(member['Cor'])}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Naturalidade</span>
                  <span className="detail-value">{val(member['Naturalidade'])}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Nacionalidade</span>
                  <span className="detail-value">{val(member['Nacionalidade'])}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">País de Origem</span>
                  <span className="detail-value">{val(member['País de origem'])}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VÍNCULO PROFISSIONAL */}
          {activeTab === 'profissional' && (
            <div className="tab-content active">
              <div className="details-grid">
                <div className="detail-item col-span-2">
                  <span className="detail-label">Cargo / Função</span>
                  <span className="detail-value">{val(member['Cargo/Função'])}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Profissão</span>
                  <span className="detail-value">{val(member['Profissão'])}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Matrícula Funcional</span>
                  <span className="detail-value font-mono">{val(member['Matrícula'])}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Situação</span>
                  <span className="detail-value">
                    <span className={`badge-status ${isAtivo ? 'normal' : 'desistente'}`}>
                      {isAtivo ? 'Ativo' : 'Inativo'}
                    </span>
                  </span>
                </div>
                {isFuncionario && (
                  <>
                    <div className="detail-item">
                      <span className="detail-label">Data de Admissão</span>
                      <span className="detail-value">{val(member['Data de admissão'])}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Data de Demissão</span>
                      <span className="detail-value">{val(member['Data de demissão'])}</span>
                    </div>
                  </>
                )}
                <div className="detail-item">
                  <span className="detail-label">Carteira de Trabalho</span>
                  <span className="detail-value font-mono">{val(member['Carteira de Trabalho'])}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Série CTPS</span>
                  <span className="detail-value font-mono">{val(member['Série'])}</span>
                </div>
                <div className="detail-item col-span-2">
                  <span className="detail-label">PIS / PASEP / NIS</span>
                  <span className="detail-value font-mono">{val(member['Número do PIS/PASEP/NIS'])}</span>
                </div>
                {!isFuncionario && (
                  <>
                    <div className="detail-item col-span-2">
                      <span className="detail-label">Identificação CENSO</span>
                      <span className="detail-value font-mono">{val(member['Identificação CENSO'])}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Usuário (CPF sem máscara)</span>
                      <span className="detail-value font-mono">{val(member['Usuário'])}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: FORMAÇÃO */}
          {activeTab === 'formacao' && (
            <div className="tab-content active">
              <div className="details-grid">
                <div className="detail-item col-span-2">
                  <span className="detail-label">Escolaridade</span>
                  <span className="detail-value">{val(member['Escolaridade'])}</span>
                </div>
                {!isFuncionario && (
                  <>
                    <div className="detail-item col-span-2">
                      <span className="detail-label">Curso Superior</span>
                      <span className="detail-value">{val(member['Curso superior'])}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Tipo de Instituição</span>
                      <span className="detail-value">{val(member['Tipo de instituição'])}</span>
                    </div>
                    <div className="detail-item col-span-3">
                      <span className="detail-label">Instituição de Ensino</span>
                      <span className="detail-value">{val(member['Instituição'])}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Tipo da Pós Graduação</span>
                      <span className="detail-value">{val(member['Tipo da pós graduação'])}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Área da Pós Graduação</span>
                      <span className="detail-value">{val(member['Área da pós graduação'])}</span>
                    </div>
                    <div className="detail-item col-span-3">
                      <span className="detail-label">Descrição / Título do Curso</span>
                      <span className="detail-value">{val(member['Descrição/Título do curso'])}</span>
                    </div>
                  </>
                )}
                {isFuncionario && (
                  <div className="detail-item col-span-3" style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                    Informações de formação avançada disponíveis apenas para Profissionais Escolares.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: CONTATO & ENDEREÇO */}
          {activeTab === 'contato' && (
            <div className="tab-content active">
              <div className="details-grid">
                <div className="detail-item col-span-3">
                  <span className="detail-label">Logradouro (Rua/Avenida)</span>
                  <span className="detail-value">{val(endereco)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Bairro</span>
                  <span className="detail-value">{val(member['Bairro'])}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Município</span>
                  <span className="detail-value">{val(member['Município'])}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Estado</span>
                  <span className="detail-value">{val(member['Estado'])}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">CEP</span>
                  <span className="detail-value font-mono">{val(member['Cep'])}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Telefone 1</span>
                  <span className="detail-value font-mono">{val(member['Contato 1'])}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Telefone 2</span>
                  <span className="detail-value font-mono">{val(member['Contato 2'])}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Telefone 3</span>
                  <span className="detail-value font-mono">{val(member['Contato 3'])}</span>
                </div>
                <div className="detail-item col-span-2">
                  <span className="detail-label">E-mail</span>
                  <span className="detail-value">{val(member['E-mail'])}</span>
                </div>
                <div className="detail-item col-span-2">
                  <span className="detail-label">E-mail 2</span>
                  <span className="detail-value">{val(member['E-mail 2'])}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: FILIAÇÃO */}
          {activeTab === 'familia' && (
            <div className="tab-content active">
              <div className="details-grid">
                <div className="detail-card col-span-3">
                  <h5 className="detail-card-title">Filiação 1 (Mãe / Responsável)</h5>
                  <div className="details-grid mt-2">
                    <div className="detail-item col-span-3">
                      <span className="detail-label">Nome Completo</span>
                      <span className="detail-value">{val(member['Filiação 1'])}</span>
                    </div>
                  </div>
                </div>
                <div className="detail-card col-span-3">
                  <h5 className="detail-card-title">Filiação 2 (Pai / Responsável)</h5>
                  <div className="details-grid mt-2">
                    <div className="detail-item col-span-3">
                      <span className="detail-label">Nome Completo</span>
                      <span className="detail-value">{val(member['Filiação 2'])}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn btn-secondary btn-icon" onClick={() => window.print()}>
            <Printer size={16} />
            <span>Imprimir Ficha</span>
          </button>
          <button className="btn btn-primary" onClick={onClose}>Fechar</button>
        </div>

      </div>
    </div>
  );
}
