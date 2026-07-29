import React, { useState, useEffect } from 'react';
import { Check, X, AlertCircle } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import ToastContainer from './components/Toast';
import SchoolSelector from './components/SchoolSelector';

// Views
import DashboardView from './components/DashboardView';
import StudentsView from './components/StudentsView';
import ClassesView from './components/ClassesView';
import AnalyticsView from './components/AnalyticsView';
import ComparisonView from './components/ComparisonView';

// Modals
import StudentModal from './components/StudentModal';
import ComparisonModal from './components/ComparisonModal';
import StaffView from './components/StaffView';
import StaffModal from './components/StaffModal';

export default function App() {
  // School selection state
  const [selectedSchool, setSelectedSchool] = useState(null);

  const [students, setStudents] = useState([]);
  const [comparisonData, setComparisonData] = useState([]);
  const [staff, setStaff] = useState([]);
  const [staffComparisonData, setStaffComparisonData] = useState([]);
  const [activeView, setActiveView] = useState('view-dashboard');
  const [globalSearch, setGlobalSearch] = useState('');
  const [activeStudent, setActiveStudent] = useState(null);
  const [activeCompRecord, setActiveCompRecord] = useState(null);
  const [activeStaffMember, setActiveStaffMember] = useState(null);
  const [initialFilters, setInitialFilters] = useState(null);
  
  // Theme state (default to dark-theme)
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Handler: school selected from selector screen
  const handleSchoolSelect = (school) => {
    setSelectedSchool(school);
    setActiveView('view-dashboard');
    // Reset data when switching school
    setStudents([]);
    setComparisonData([]);
    setStaff([]);
    setStaffComparisonData([]);
    setLoading(true);
    setError(null);
  };

  const handleChangeSchool = () => {
    setSelectedSchool(null);
    setStudents([]);
    setComparisonData([]);
    setStaff([]);
    setStaffComparisonData([]);
    setGlobalSearch('');
    setActiveStudent(null);
    setActiveCompRecord(null);
    setActiveStaffMember(null);
    setInitialFilters(null);
  };

  // 1. Toast controller
  const showToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    const icon = type === 'success' 
      ? <Check size={16} style={{ color: '#34d399' }} /> 
      : <AlertCircle size={16} style={{ color: '#f87171' }} />;
      
    const newToast = { id, message, type, icon };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // 2. Load databases
  const loadData = () => {
    setLoading(true);
    setError(null);

    // Choose correct files based on selected school
    const isUbaldo = selectedSchool && selectedSchool.id === 'ubaldo-ramalhete';
    const studentsFile   = isUbaldo ? 'data/students_ubaldo.json'   : 'data/students.json';
    const comparisonFile = isUbaldo ? 'data/comparison_ubaldo.json' : 'data/comparison.json';
    const staffFile      = isUbaldo ? 'data/staff_ubaldo.json'      : 'data/staff.json';
    const staffCompFile  = isUbaldo ? 'data/staff_comparison_ubaldo.json' : 'data/staff_comparison.json';

    const fetchStudents = fetch(studentsFile).then((r) => {
      if (!r.ok) throw new Error(`Não foi possível carregar a lista de alunos (${studentsFile}).`);
      return r.json();
    });

    const fetchComparison = fetch(comparisonFile).then((r) => {
      if (!r.ok) throw new Error(`Não foi possível carregar a comparação do censo (${comparisonFile}).`);
      return r.json();
    });

    const fetchStaff = fetch(staffFile).then((r) => {
      if (!r.ok) return [];
      return r.json();
    }).catch(() => []);

    const fetchStaffComparison = fetch(staffCompFile).then((r) => {
      if (!r.ok) return [];
      return r.json();
    }).catch(() => []);

    Promise.all([fetchStudents, fetchComparison, fetchStaff, fetchStaffComparison])
      .then(([studentsData, compData, staffData, staffCompData]) => {
        setStudents(studentsData);
        setComparisonData(compData);
        setStaff(staffData);
        setStaffComparisonData(staffCompData);
        setLoading(false);
        showToast('Dados escolares carregados com sucesso!', 'success');
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
        setLoading(false);
        showToast('Erro ao inicializar banco de dados.', 'error');
      });
  };

  // Load data whenever a school is selected
  useEffect(() => {
    if (selectedSchool) {
      loadData();
    }
  }, [selectedSchool]);

  // 3. Theme toggle effect
  useEffect(() => {
    const body = document.body;
    if (theme === 'light') {
      body.classList.remove('dark-theme');
      body.classList.add('light-theme');
    } else {
      body.classList.remove('light-theme');
      body.classList.add('dark-theme');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Show school selector if no school chosen
  if (!selectedSchool) {
    return <SchoolSelector onSelectSchool={handleSchoolSelect} />;
  }

  return (
    <div className="app-container">
      {/* Barra de Navegação Lateral */}
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        theme={theme}
        toggleTheme={toggleTheme}
        school={selectedSchool}
        onChangeSchool={handleChangeSchool}
      />

      {/* Painel Principal */}
      <main className="main-content">
        <Topbar
          globalSearch={globalSearch}
          setGlobalSearch={setGlobalSearch}
          activeView={activeView}
          setActiveView={setActiveView}
          school={selectedSchool}
        />

        {/* Corpo Dinâmico de Views */}
        <div className="content-body">
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: '16px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '4px solid rgba(124, 58, 237, 0.1)',
                borderTopColor: 'var(--primary-color)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Carregando dados da escola...</p>
              <style>{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          ) : error ? (
            <div className="glass" style={{ padding: '32px', textAlign: 'center', maxWidth: '600px', margin: '40px auto' }}>
              <AlertCircle size={48} style={{ color: 'var(--danger-color)', marginBottom: '16px' }} />
              <h3 style={{ marginBottom: '12px' }}>Falha no Carregamento</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>{error}</p>
              <button className="btn btn-primary" onClick={loadData}>Tentar Novamente</button>
            </div>
          ) : (
            <>
              {activeView === 'view-dashboard' && (
                <DashboardView
                  students={students}
                  onRefresh={loadData}
                  theme={theme}
                />
              )}

              {activeView === 'view-students' && (
                <StudentsView
                  students={students}
                  globalSearch={globalSearch}
                  setGlobalSearch={setGlobalSearch}
                  onSelectStudent={setActiveStudent}
                  showToast={showToast}
                  initialFilters={initialFilters}
                  clearInitialFilters={() => setInitialFilters(null)}
                />
              )}

              {activeView === 'view-classes' && (
                <ClassesView
                  students={students}
                  onFilterClass={(filters) => {
                    setInitialFilters(filters);
                    setActiveView('view-students');
                  }}
                />
              )}

              {activeView === 'view-analytics' && (
                <AnalyticsView
                  students={students}
                  theme={theme}
                />
              )}

              {activeView === 'view-comparison' && (
                <ComparisonView
                  comparisonData={comparisonData}
                  onSelectRecord={setActiveCompRecord}
                  showToast={showToast}
                  students={students}
                  staff={staff}
                  staffComparisonData={staffComparisonData}
                  onSelectStaff={setActiveStaffMember}
                />
              )}

              {activeView === 'view-staff' && (
                <StaffView
                  staff={staff}
                  onSelectStaff={setActiveStaffMember}
                  showToast={showToast}
                />
              )}
            </>
          )}
        </div>
      </main>

      {/* Modais da Aplicação */}
      {activeStudent && (
        <StudentModal
          student={activeStudent}
          onClose={() => setActiveStudent(null)}
        />
      )}

      {activeCompRecord && (
        <ComparisonModal
          record={activeCompRecord}
          onClose={() => setActiveCompRecord(null)}
          showToast={showToast}
        />
      )}

      {activeStaffMember && (
        <StaffModal
          member={activeStaffMember}
          onClose={() => setActiveStaffMember(null)}
        />
      )}

      {/* Container de Toasts */}
      <ToastContainer toasts={toasts} />
    </div>
  );
}
