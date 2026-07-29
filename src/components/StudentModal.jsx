import React, { useState, useEffect } from 'react';
import { X, Printer } from 'lucide-react';

export default function StudentModal({ student, onClose }) {
  const [activeTab, setActiveTab] = useState('pessoais');

  if (!student) return null;

  // 1. Initial Generator
  const initials = student['Nome'] 
    ? student['Nome'].split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() 
    : 'AL';

  // 2. CPF formatting utility
  const formatCPF = (cpf) => {
    if (!cpf) return '-';
    const cleaned = String(cpf).replace(/\D/g, '');
    if (cleaned.length !== 11) return String(cpf);
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  // 3. Helper to display value or fallback
  const setVal = (value, suffix = '') => {
    if (value === undefined || value === null || value === '' || value === '-' || value === 'Não Informado') {
      return <span style={{ opacity: 0.5 }}>-</span>;
    }
    return <span>{value + suffix}</span>;
  };

  // 4. Status badge class
  const getStatusClass = (situacao) => {
    if (!situacao) return 'normal';
    const s = situacao.toUpperCase();
    if (s === 'NORMAL') return 'normal';
    if (s === 'TRANSFERIDO' || s.includes('TRANSF')) return 'transferido';
    if (s === 'DESISTENTE' || s.includes('DESIS') || s === 'ABANDONO') return 'desistente';
    return 'normal';
  };

  // Construct full address
  const logradouro = student['Logradouro'] || '';
  const tipoLog = student['Tipo Logradouro'] || '';
  const num = student['Número'] ? `, Nº ${student['Número']}` : '';
  const fullAddress = (tipoLog + ' ' + logradouro + num).trim() || '-';

  return (
    <div className="modal-overlay active" id="student-detail-modal">
      <div className="modal-container glass">
        
        {/* Cabeçalho do Modal */}
        <div className="modal-header">
          <div className="student-modal-meta">
            <div className="student-avatar-large">
              {initials}
            </div>
            <div className="student-title-info">
              <h3>{student['Nome'] || 'Sem Nome'}</h3>
              <div className="badges-row">
                <span className={`badge-status ${getStatusClass(student['Situação'])}`}>
                  {student['Situação'] || 'NORMAL'}
                </span>
                <span className="badge-turma">
                  {student['Descrição'] || student['Período'] || '-'}
                </span>
                <span className="badge-turno">
                  {student['Turno'] || 'Turno Indefinido'}
                </span>
              </div>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Fechar Modal">
            <X size={20} />
          </button>
        </div>

        {/* Navegação em Abas */}
        <div className="modal-tabs">
          <button 
            className={`tab-btn ${activeTab === 'pessoais' ? 'active' : ''}`}
            onClick={() => setActiveTab('pessoais')}
          >
            Dados Pessoais
          </button>
          <button 
            className={`tab-btn ${activeTab === 'escolar' ? 'active' : ''}`}
            onClick={() => setActiveTab('escolar')}
          >
            Vida Escolar
          </button>
          <button 
            className={`tab-btn ${activeTab === 'contato' ? 'active' : ''}`}
            onClick={() => setActiveTab('contato')}
          >
            Contato & Endereço
          </button>
          <button 
            className={`tab-btn ${activeTab === 'familia' ? 'active' : ''}`}
            onClick={() => setActiveTab('familia')}
          >
            Família & Responsáveis
          </button>
          <button 
            className={`tab-btn ${activeTab === 'saude' ? 'active' : ''}`}
            onClick={() => setActiveTab('saude')}
          >
            Saúde & Acessibilidade
          </button>
          <button 
            className={`tab-btn ${activeTab === 'outros' ? 'active' : ''}`}
            onClick={() => setActiveTab('outros')}
          >
            Outros Serviços
          </button>
        </div>

        {/* Conteúdo das Abas */}
        <div className="modal-body scrollable">
          
          {/* TAB 1: DADOS PESSOAIS */}
          {activeTab === 'pessoais' && (
            <div className="tab-content active">
              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-label">Nome Completo</span>
                  <span className="detail-value">{setVal(student['Nome'])}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Nome Social</span>
                  <span className="detail-value">{setVal(student['Nome social'])}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Data de Nascimento</span>
                  <span className="detail-value">{setVal(student['Data de Nascimento'])}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Idade Atual</span>
                  <span className="detail-value">
                    {setVal(student['Idade na data atual'] || student['Idade na matrícula'], ' anos')}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">CPF</span>
                  <span className="detail-value">{setVal(formatCPF(student['CPF']))}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Sexo</span>
                  <span className="detail-value">{setVal(student['Sexo'])}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Raça / Cor</span>
                  <span className="detail-value">{setVal(student['Cor'])}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Nacionalidade</span>
                  <span className="detail-value">{setVal(student['Nacionalidade'])}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Naturalidade</span>
                  <span className="detail-value">{setVal(student['Naturalidade'])}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Povo Indígena</span>
                  <span className="detail-value">{setVal(student['Povo indígena'])}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VIDA ESCOLAR */}
          {activeTab === 'escolar' && (
            <div className="tab-content active">
              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-label">Código de Matrícula</span>
                  <span className="detail-value">{setVal(student['Código'])}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Código do Estudante</span>
                  <span className="detail-value">{setVal(student['Código do estudante'])}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Registro do Estudante (RA)</span>
                  <span className="detail-value">{setVal(student['Registro do estudante (RA)'])}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Código CENSO</span>
                  <span className="detail-value">{setVal(student['Identificação CENSO'])}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Etapa de Ensino</span>
                  <span className="detail-value">{setVal(student['Etapa de ensino'])}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Turma</span>
                  <span className="detail-value">{setVal(student['Turma'])}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Turno</span>
                  <span className="detail-value">{setVal(student['Turno'])}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Situação Escolar</span>
                  <span className="detail-value">{setVal(student['Situação'])}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Data da Matrícula</span>
                  <span className="detail-value">{setVal(student['Data da matrícula'])}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Data da Movimentação (Saída)</span>
                  <span className="detail-value">{setVal(student['Data da movimentação'])}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Confirmação de Rematrícula</span>
                  <span className="detail-value">{setVal(student['Confirmou rematrícula'])}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Escola Anterior</span>
                  <span className="detail-value">{setVal(student['Escola Anterior'])}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CONTATO E ENDEREÇO */}
          {activeTab === 'contato' && (
            <div className="tab-content active">
              <div className="details-grid">
                <div className="detail-item col-span-3">
                  <span className="detail-label">Logradouro (Rua/Avenida)</span>
                  <span className="detail-value">{setVal(fullAddress)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Bairro</span>
                  <span className="detail-value">{setVal(student['Bairro'])}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">CEP</span>
                  <span className="detail-value">{setVal(student['Cep'])}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Cidade / UF</span>
                  <span className="detail-value">
                    {setVal((student['Município'] || 'Colatina') + ' - ' + (student['Estado'] || 'ES'))}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Telefone Principal (Contato 1)</span>
                  <span className="detail-value font-mono">{setVal(student['Contato 1'])}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Telefone Secundário (Contato 2)</span>
                  <span className="detail-value font-mono">{setVal(student['Contato 2'])}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Telefone de Recado (Contato 3)</span>
                  <span className="detail-value font-mono">{setVal(student['Contato 3'])}</span>
                </div>
                <div className="detail-item col-span-2">
                  <span className="detail-label">E-mail do Aluno / Família</span>
                  <span className="detail-value">{setVal(student['E-mail'])}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Ponto de Referência</span>
                  <span className="detail-value">{setVal(student['Ponto de referência'])}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FAMÍLIA E RESPONSÁVEIS */}
          {activeTab === 'familia' && (
            <div className="tab-content active">
              <div className="details-grid">
                {/* Filiação 1 */}
                <div className="detail-card col-span-3">
                  <h5 className="detail-card-title">Filiação 1 (Mãe/Responsável)</h5>
                  <div className="details-grid mt-2">
                    <div className="detail-item col-span-2">
                      <span className="detail-label">Nome Completo</span>
                      <span className="detail-value">{setVal(student['Filiação 1'])}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">CPF</span>
                      <span className="detail-value">{setVal(formatCPF(student['CPF Filiação 1']))}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Telefone</span>
                      <span className="detail-value font-mono">{setVal(student['Contato Filiação 1'])}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Falecido(a)</span>
                      <span className="detail-value">{setVal(student['Falecido Filiação 1'])}</span>
                    </div>
                  </div>
                </div>

                {/* Filiação 2 */}
                <div className="detail-card col-span-3">
                  <h5 className="detail-card-title">Filiação 2 (Pai/Responsável)</h5>
                  <div className="details-grid mt-2">
                    <div className="detail-item col-span-2">
                      <span className="detail-label">Nome Completo</span>
                      <span className="detail-value">{setVal(student['Filiação 2'])}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">CPF</span>
                      <span className="detail-value">{setVal(formatCPF(student['CPF Filiação 2']))}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Telefone</span>
                      <span className="detail-value font-mono">{setVal(student['Contato Filiação 2'])}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Falecido(a)</span>
                      <span className="detail-value">{setVal(student['Falecido Filiação 2'])}</span>
                    </div>
                  </div>
                </div>

                {/* Responsável Legal */}
                <div className="detail-card col-span-3">
                  <h5 className="detail-card-title">Responsável Financeiro/Legal</h5>
                  <div className="details-grid mt-2">
                    <div className="detail-item col-span-2">
                      <span className="detail-label">Nome do Responsável</span>
                      <span className="detail-value">{setVal(student['Responsável'])}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">CPF do Responsável</span>
                      <span className="detail-value">{setVal(formatCPF(student['CPF do responsável']))}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SAÚDE E ACESSIBILIDADE */}
          {activeTab === 'saude' && (
            <div className="tab-content active">
              <div className="details-grid">
                <div className="detail-item col-span-2">
                  <span className="detail-label">Cartão Nacional do SUS</span>
                  <span className="detail-value font-mono">{setVal(student['Nº do Cartão Nacional do SUS'])}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Estudante com Deficiência (PCD)</span>
                  <span className="detail-value">{setVal(student['Estudante com deficiência'])}</span>
                </div>
                <div className="detail-item col-span-3">
                  <span className="detail-label">Tipo de Deficiência / Transtorno (TEA)</span>
                  <span className="detail-value">
                    {setVal(student['Tipo de deficiência, transtorno do espectro autista e altas habilidades/superdotação'])}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Impacto na Aprendizagem</span>
                  <span className="detail-value">{setVal(student['Pessoa física com transtorno(s) que impacta(m) o desenvolvimento da aprendizagem'])}</span>
                </div>
                <div className="detail-item col-span-2">
                  <span className="detail-label">Transtornos de Aprendizagem</span>
                  <span className="detail-value">{setVal(student['Tipo(s) de transtorno(s) que impacta(m) o desenvolvimento da aprendizagem'])}</span>
                </div>
                <div className="detail-item col-span-3">
                  <span className="detail-label">Recursos Necessários para Avaliações (Saeb/Inep)</span>
                  <span className="detail-value">{setVal(student['Recursos necessários para uso do estudante e para a participação em avaliações do Inep (Saeb)'])}</span>
                </div>
                <div className="detail-item col-span-2">
                  <span className="detail-label">Atendimento Educacional Especializado (AEE)</span>
                  <span className="detail-value">{setVal(student['Tipo de Atendimento Educacional Especializado'])}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Código CID</span>
                  <span className="detail-value font-mono">{setVal(student['CID'])}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Frequenta a APAE</span>
                  <span className="detail-value">{setVal(student['Frequenta a APAE'])}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Possui Restrição Alimentar</span>
                  <span className="detail-value">{setVal(student['Possui restrição alimentar?'])}</span>
                </div>
                <div className="detail-item col-span-2">
                  <span className="detail-label">Descrição da Restrição Alimentar</span>
                  <span className="detail-value">{setVal(student['Restrição alimentar'])}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: OUTROS SERVIÇOS */}
          {activeTab === 'outros' && (
            <div className="tab-content active">
              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-label">Utiliza Transporte Escolar</span>
                  <span className="detail-value">{setVal(student['Utiliza transporte'])}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Poder Público Responsável</span>
                  <span className="detail-value">{setVal(student['Poder Público Responsável'])}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Tipo de Veículo do Transporte</span>
                  <span className="detail-value">{setVal(student['Transporte escolar'])}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Utiliza Passe Escolar</span>
                  <span className="detail-value">{setVal(student['Utiliza passe'])}</span>
                </div>
                <div className="detail-item col-span-2">
                  <span className="detail-label">Autorização do Uso de Imagem pela Escola</span>
                  <span className="detail-value">{setVal(student['Autorização do Uso de Imagem'])}</span>
                </div>
                <div className="detail-item col-span-2">
                  <span className="detail-label">Avaliado por Plano de Desenvolvimento Individual (PDI/PEI)</span>
                  <span className="detail-value">{setVal(student['Avaliado por PDI/PEI/PDP'])}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Código da Unidade de Energia</span>
                  <span className="detail-value font-mono">{setVal(student['Código de consumidor de energia'])}</span>
                </div>
                <div className="detail-item col-span-2">
                  <span className="detail-label">Localização da Residência (Área)</span>
                  <span className="detail-value">{setVal(student['Localização da Residência (CENSO)'])}</span>
                </div>
                <div className="detail-item col-span-3">
                  <span className="detail-label">Observações da Ficha</span>
                  <span className="detail-value">{setVal(student['Observação'])}</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Rodapé do Modal */}
        <div className="modal-footer">
          <button className="btn btn-secondary btn-icon" onClick={() => window.print()}>
            <Printer size={16} />
            <span>Imprimir Ficha (PDF)</span>
          </button>
          <button className="btn btn-primary" onClick={onClose}>Fechar</button>
        </div>

      </div>
    </div>
  );
}
