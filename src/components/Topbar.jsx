import React, { useEffect, useState } from 'react';
import { Search, Calendar } from 'lucide-react';

export default function Topbar({ globalSearch, setGlobalSearch, activeView, setActiveView, school }) {
  const [dateDisplay, setDateDisplay] = useState('Carregando...');

  useEffect(() => {
    const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const now = new Date();
    const dateStr = `${days[now.getDay()]}, ${now.getDate()} de ${months[now.getMonth()]} de ${now.getFullYear()}`;
    setDateDisplay(dateStr);
  }, []);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setGlobalSearch(val);
    if (activeView !== 'view-students' && activeView !== 'view-comparison') {
      setActiveView('view-students');
    }
  };

  const schoolCode  = school ? school.code  : 'ADM';
  const schoolColor = school ? school.color : '#7c3aed';
  const schoolShort = school ? school.short : 'Secretaria';

  return (
    <header className="topbar">
      <div className="topbar-search">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon-top" />
          <input
            type="text"
            value={globalSearch}
            onChange={handleSearchChange}
            placeholder="Buscar aluno por nome, CPF ou matrícula..."
          />
        </div>
      </div>
      <div className="topbar-actions">
        <div className="current-date">
          <Calendar size={16} />
          <span>{dateDisplay}</span>
        </div>
        <div className="user-profile">
          <div className="avatar" style={{ background: `linear-gradient(135deg, ${schoolColor} 0%, ${schoolColor}cc 100%)` }}>
            <span>{schoolCode}</span>
          </div>
          <div className="profile-info">
            <span className="profile-name">{schoolShort}</span>
            <span className="profile-role">Administrador</span>
          </div>
        </div>
      </div>
    </header>
  );
}
