import React from 'react';
import { GraduationCap, LayoutDashboard, Users, DoorOpen, BarChart3, GitCompare, UsersRound, ArrowLeftRight } from 'lucide-react';

export default function Sidebar({ activeView, setActiveView, theme, toggleTheme, school, onChangeSchool }) {
  const menuItems = [
    { id: 'view-dashboard', label: 'Painel Geral', icon: LayoutDashboard },
    { id: 'view-students', label: 'Alunos', icon: Users },
    { id: 'view-classes', label: 'Turmas', icon: DoorOpen },
    { id: 'view-staff', label: 'Profissionais', icon: UsersRound },
    { id: 'view-analytics', label: 'Análise de Dados', icon: BarChart3 },
    { id: 'view-comparison', label: 'Comparação Censo', icon: GitCompare },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-container">
          <div className="logo-icon">
            <GraduationCap size={24} />
          </div>
          <div className="logo-text">
            <h1>{school ? school.short : 'Gestão Escolar'}</h1>
            <span>Gestão Escolar</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <ul>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <li
                key={item.id}
                className={`nav-item ${isActive ? 'active active-nav-item' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveView(item.id);
                }}
              >
                <a href="#">
                  <Icon size={20} />
                  <span>{item.label}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <div className="theme-toggle-container">
          <span className="theme-label">
            {theme === 'dark' ? 'Tema Escuro' : 'Tema Claro'}
          </span>
          <button
            className="theme-toggle-btn"
            id="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label="Alternar Tema"
          >
            <span className="toggle-slider"></span>
          </button>
        </div>
        <div className="school-badge" style={{ cursor: 'default' }}>
          <p className="school-name">{school ? school.name : 'Escola'}</p>
          <p className="school-city">{school ? school.city : ''}</p>
        </div>
        {onChangeSchool && (
          <button
            className="btn btn-secondary btn-full"
            onClick={onChangeSchool}
            style={{ fontSize: '13px', gap: '8px', padding: '9px 16px' }}
          >
            <ArrowLeftRight size={14} />
            Trocar Escola
          </button>
        )}
      </div>
    </aside>
  );
}
