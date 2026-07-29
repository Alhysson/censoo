import React, { useState } from 'react';
import { GraduationCap, Building2, ArrowRight, MapPin, Users, BookOpen } from 'lucide-react';

const SCHOOLS = [
  {
    id: 'matilde-guerra',
    name: 'Profª Matilde Guerra Comério',
    short: 'Matilde Guerra',
    city: 'Colatina - ES',
    code: 'MGC',
    type: 'Ensino Fundamental e Médio',
    color: '#7c3aed',
    glow: 'rgba(124, 58, 237, 0.35)',
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
    icon: '🎓',
  },
  {
    id: 'ubaldo-ramalhete',
    name: 'EMEF Ubaldo Ramalhete Mello',
    short: 'Ubaldo Ramalhete',
    city: 'Colatina - ES',
    code: 'URM',
    type: 'Ensino Fundamental',
    color: '#0ea5e9',
    glow: 'rgba(14, 165, 233, 0.35)',
    gradient: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
    icon: '🏫',
  },
];

export default function SchoolSelector({ onSelectSchool }) {
  const [hovered, setHovered] = useState(null);
  const [selected, setSelected] = useState(null);
  const [entering, setEntering] = useState(false);

  const handleSelect = (school) => {
    if (entering) return;
    setSelected(school.id);
    setEntering(true);

    setTimeout(() => {
      onSelectSchool(school);
    }, 600);
  };

  return (
    <div className="school-selector-overlay">
      {/* Background animated blobs */}
      <div className="selector-blob selector-blob-1" />
      <div className="selector-blob selector-blob-2" />
      <div className="selector-blob selector-blob-3" />

      <div className={`school-selector-container ${entering ? 'selector-exiting' : 'selector-entering'}`}>
        {/* Header */}
        <div className="selector-header">
          <div className="selector-logo">
            <div className="selector-logo-icon">
              <GraduationCap size={32} />
            </div>
          </div>
          <h1 className="selector-title">Gestão Escolar</h1>
          <p className="selector-subtitle">
            Selecione a escola que deseja acessar para continuar
          </p>
          <div className="selector-divider" />
        </div>

        {/* School Cards */}
        <div className="selector-cards">
          {SCHOOLS.map((school) => {
            const isHovered = hovered === school.id;
            const isSelected = selected === school.id;
            return (
              <button
                key={school.id}
                className={`school-card ${isHovered ? 'school-card-hovered' : ''} ${isSelected ? 'school-card-selected' : ''}`}
                style={{
                  '--school-color': school.color,
                  '--school-glow': school.glow,
                  '--school-gradient': school.gradient,
                }}
                onMouseEnter={() => setHovered(school.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => handleSelect(school)}
                disabled={entering}
              >
                {/* Top accent line */}
                <div className="school-card-accent" />

                {/* Card inner */}
                <div className="school-card-inner">
                  {/* Badge + Icon */}
                  <div className="school-card-icon-row">
                    <div className="school-card-avatar">
                      <span className="school-card-emoji">{school.icon}</span>
                    </div>
                    <div className="school-card-badge">{school.code}</div>
                  </div>

                  {/* Info */}
                  <div className="school-card-info">
                    <h2 className="school-card-name">{school.name}</h2>
                    <div className="school-card-meta">
                      <span className="school-card-meta-item">
                        <MapPin size={13} />
                        {school.city}
                      </span>
                      <span className="school-card-meta-item">
                        <BookOpen size={13} />
                        {school.type}
                      </span>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="school-card-cta">
                    <span className="school-card-cta-text">
                      {isSelected ? 'Acessando...' : 'Acessar Plataforma'}
                    </span>
                    <div className="school-card-cta-icon">
                      {isSelected ? (
                        <div className="school-card-spinner" />
                      ) : (
                        <ArrowRight size={16} />
                      )}
                    </div>
                  </div>
                </div>

                {/* Glow overlay on hover */}
                <div className="school-card-glow" />
              </button>
            );
          })}
        </div>

        {/* Footer note */}
        <p className="selector-footer-note">
          Sistema de Gestão Educacional · Secretaria Municipal de Colatina
        </p>
      </div>
    </div>
  );
}
