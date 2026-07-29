import React, { useMemo } from 'react';
import { Users, Clock, UserCheck, List, DoorClosed } from 'lucide-react';

export default function ClassesView({ students, onFilterClass }) {
  // 1. Group students by class name
  const classGroups = useMemo(() => {
    const groups = {};
    students.forEach(s => {
      const className = s['Descrição'] || `${s['Período']} ${s['Turma']}`;
      if (!groups[className]) {
        groups[className] = {
          name: className,
          etapa: s['Período'],
          turmaCode: s['Turma'],
          turno: s['Turno'],
          students: []
        };
      }
      groups[className].students.push(s);
    });

    // Sort classes alphabetically
    return Object.keys(groups)
      .sort()
      .map(key => groups[key]);
  }, [students]);

  if (classGroups.length === 0) {
    return (
      <section id="view-classes" className="content-view active">
        <div className="view-header">
          <div>
            <h2>Divisão de Turmas</h2>
            <p>Visualização agrupada por turmas e análise de lotação.</p>
          </div>
        </div>
        <div className="classes-grid animate-fade-in">
          <div className="col-span-3 text-center py-12 text-muted glass">
            <DoorClosed size={48} style={{ display: 'inline-block', marginBottom: '12px', color: 'var(--text-muted)' }} />
            <p>Nenhuma turma correspondente encontrada para os filtros atuais.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="view-classes" className="content-view active">
      <div className="view-header">
        <div>
          <h2>Divisão de Turmas</h2>
          <p>Visualização agrupada por turmas e análise de lotação.</p>
        </div>
      </div>

      {/* Lista de cartões de turmas */}
      <div className="classes-grid animate-fade-in">
        {classGroups.map((cls) => {
          const totalCount = cls.students.length;
          const activeCount = cls.students.filter(s => s['Situação'] === 'NORMAL').length;

          return (
            <div key={cls.name} className="class-card glass">
              <div className="class-card-header">
                <div className="class-card-title">
                  <h4>{cls.name}</h4>
                  <span>{cls.etapa || 'Série Não Definida'}</span>
                </div>
                <div className="class-student-count">
                  <Users size={14} />
                  <span>{totalCount}</span>
                </div>
              </div>
              <div className="class-card-meta">
                <div className="meta-item">
                  <Clock size={16} />
                  <span>Turno: <strong>{cls.turno || 'Não Definido'}</strong></span>
                </div>
                <div className="meta-item">
                  <UserCheck size={16} />
                  <span>Estudantes Ativos: <strong>{activeCount}</strong></span>
                </div>
              </div>
              <div className="class-card-footer">
                <button
                  className="btn btn-secondary btn-icon py-1.5"
                  onClick={() => onFilterClass({
                    etapa: cls.etapa || '',
                    turma: cls.turmaCode || '',
                    turno: cls.turno || ''
                  })}
                >
                  <List size={14} />
                  <span>Ver Alunos</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
