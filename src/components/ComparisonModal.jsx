import React from 'react';
import { X, Printer, Check, AlertTriangle, Info, Copy } from 'lucide-react';

export default function ComparisonModal({ record, onClose, showToast }) {
  if (!record) return null;

  const initials = record.nome 
    ? record.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() 
    : 'CO';

  const handleCopy = (text, fieldName) => {
    if (!text || text === '-') {
      showToast('Nenhum valor para copiar.', 'error');
      return;
    }
    navigator.clipboard.writeText(text);
    showToast(`"${fieldName}" copiado para a área de transferência!`, 'success');
  };

  return (
    <div className="modal-overlay active" id="comparison-detail-modal">
      <div className="modal-container glass" style={{ maxWidth: '950px', height: '90%' }}>
        
        <div className="modal-header">
          <div className="student-modal-meta">
            <div className="student-avatar-large">
              {initials}
            </div>
            <div className="student-title-info">
              <h3>{record.nome}</h3>
              <div className="badges-row">
                <span className={`badge-status ${
                  record.status === 'CONCILIADO' ? 'conciliado' : 'apenas-escola'
                }`}>
                  {record.status === 'CONCILIADO' ? 'Conciliado' : 'Ausente no Censo'}
                </span>
                {record.status === 'CONCILIADO' && (
                  <span className={`badge-turma ${record.has_divergences ? 'divergente' : 'clean'}`} style={{
                    backgroundColor: record.has_divergences ? 'var(--danger-bg)' : 'var(--success-bg)',
                    color: record.has_divergences ? 'var(--danger-color)' : 'var(--success-color)'
                  }}>
                    {record.has_divergences ? `${record.divergences_count} divergências` : 'Sem divergências'}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Fechar Modal">
            <X size={20} />
          </button>
        </div>

        {/* Corpo do modal - Exibição Lado a Lado */}
        <div className="modal-body scrollable">
          <p className="comparison-intro" style={{ marginBottom: '20px', fontSize: '14px', color: 'var(--text-secondary)' }}>
            Abaixo estão listadas todas as informações comparadas entre as duas bases. Linhas em vermelho destacam diferenças cadastrais que devem ser revisadas.
          </p>
          
          <div className="comparison-table-wrapper">
            <table className="side-by-side-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.08em' }}>Campo Analisado</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.08em' }}>Informação na Escola (Planilha)</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.08em' }}>Informação no Censo Oficial</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.08em', textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(record.divergences).map(([fieldName, details]) => {
                  const isMatch = details.match;
                  const rowClass = isMatch ? 'comparison-row match' : 'comparison-row mismatch';
                  const sVal = details.school_val !== undefined ? details.school_val : (details.school ?? '-');
                  const cVal = details.censo_val !== undefined ? details.censo_val : (details.censo ?? '-');
                  
                  let statusIcon = null;
                  if (isMatch) {
                    statusIcon = (
                      <span className="status-icon-match" title="Sem Divergência">
                        <Check size={16} />
                      </span>
                    );
                  } else {
                    if (!details.is_critical) {
                      statusIcon = (
                        <span className="status-icon-match" style={{ color: 'var(--info-color)' }} title="ID de banco diferente por design (Normal)">
                          <Info size={16} />
                        </span>
                      );
                    } else {
                      statusIcon = (
                        <span className="status-icon-mismatch" title="Informações Diferentes">
                          <AlertTriangle size={16} />
                        </span>
                      );
                    }
                  }

                  return (
                    <tr key={fieldName} className={rowClass}>
                      <td className="field-name" style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>{fieldName}</td>
                      <td className="school-val" style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>{sVal}</td>
                      <td className="censo-val" style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
                        <span>{cVal}</span>
                        {!isMatch && details.is_critical && (
                          <button
                            className="btn-copy-val"
                            onClick={() => handleCopy(String(cVal), fieldName)}
                            title="Copiar valor correto do Censo"
                          >
                            <Copy size={12} />
                          </button>
                        )}
                      </td>
                      <td className="status-col" style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', textAlign: 'center' }}>
                        {statusIcon}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => window.print()}>
            <Printer size={16} />
            <span>Imprimir Relatório</span>
          </button>
          <button className="btn btn-primary" onClick={onClose}>Fechar</button>
        </div>
        
      </div>
    </div>
  );
}
