import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar, NavTabId } from './components/Sidebar';
import { WelcomeModal } from './components/WelcomeModal';
import { DashboardView } from './views/DashboardView';
import { ClassView } from './views/ClassView';
import { StudentsView } from './views/StudentsView';
import { AttendanceView } from './views/AttendanceView';
import { CommentsView } from './views/CommentsView';
import { GroupWorkView } from './views/GroupWorkView';
import { TeamsView } from './views/TeamsView';
import { CompetitionView } from './views/CompetitionView';
import { GradesView } from './views/GradesView';
import { SeatingView } from './views/SeatingView';
import { TimetableView } from './views/TimetableView';
import { FinanceView } from './views/FinanceView';
import { LuckyWheelView } from './views/LuckyWheelView';
import { ReportsView } from './views/ReportsView';
import { SettingsView } from './views/SettingsView';
import { ClassProStore } from './types';
import { loadStore, saveStore } from './utils/storage';
import { soundManager } from './utils/audio';

export default function App() {
  const [store, setStore] = useState<ClassProStore>(() => loadStore());
  const [currentTab, setCurrentTab] = useState<NavTabId>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return !localStorage.getItem('CLASS_PRO_ONBOARDED_V1');
  });

  // Auto-persist store to localStorage whenever updated
  useEffect(() => {
    saveStore(store);
  }, [store]);

  const updateStore = (updater: (prev: ClassProStore) => ClassProStore) => {
    setStore(prev => {
      const next = updater(prev);
      saveStore(next);
      return next;
    });
  };

  const currentClass = store.classes.find(c => c.id === store.currentClassId) || store.classes[0];

  const handleSelectClass = (classId: string) => {
    updateStore(prev => ({
      ...prev,
      currentClassId: classId
    }));
  };

  const handleToggleSound = () => {
    updateStore(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        soundEnabled: !prev.settings.soundEnabled
      }
    }));
  };

  const handleCloseWelcome = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('CLASS_PRO_ONBOARDED_V1', 'true');
    }
    setShowWelcome(false);
    soundManager.playSuccess(store.settings.soundEnabled);
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 overflow-hidden font-sans">
      {/* Welcome Onboarding Modal */}
      <WelcomeModal
        isOpen={showWelcome}
        onClose={handleCloseWelcome}
        onUpdateStore={updateStore}
        soundEnabled={store.settings.soundEnabled}
      />

      {/* Navigation Sidebar (15 modules) */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        soundEnabled={store.settings.soundEnabled}
        isSampleData={currentClass?.isSampleData}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Sticky Top Header */}
        <Header
          currentClass={currentClass}
          allClasses={store.classes}
          studentCount={store.students.length}
          soundEnabled={store.settings.soundEnabled}
          onToggleSound={handleToggleSound}
          onSelectClass={handleSelectClass}
          onCreateClass={() => setCurrentTab('classes')}
          onOpenSettings={() => setCurrentTab('settings')}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          fullStore={store}
        />

        {/* Viewport content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {currentTab === 'dashboard' && (
              <DashboardView
                store={store}
                onNavigate={(tab) => setCurrentTab(tab)}
                onQuickAction={(action) => console.log(action)}
              />
            )}

            {currentTab === 'classes' && (
              <ClassView
                store={store}
                onUpdateStore={updateStore}
                onSelectClass={handleSelectClass}
              />
            )}

            {currentTab === 'students' && (
              <StudentsView
                store={store}
                onUpdateStore={updateStore}
              />
            )}

            {currentTab === 'attendance' && (
              <AttendanceView
                store={store}
                onUpdateStore={updateStore}
              />
            )}

            {currentTab === 'comments' && (
              <CommentsView
                store={store}
                onUpdateStore={updateStore}
              />
            )}

            {currentTab === 'groups' && (
              <GroupWorkView
                store={store}
                onUpdateStore={updateStore}
              />
            )}

            {currentTab === 'teams' && (
              <TeamsView
                store={store}
                onUpdateStore={updateStore}
              />
            )}

            {currentTab === 'competition' && (
              <CompetitionView
                store={store}
                onUpdateStore={updateStore}
              />
            )}

            {currentTab === 'grades' && (
              <GradesView
                store={store}
                onUpdateStore={updateStore}
              />
            )}

            {currentTab === 'seating' && (
              <SeatingView
                store={store}
                onUpdateStore={updateStore}
              />
            )}

            {currentTab === 'timetable' && (
              <TimetableView
                store={store}
                onUpdateStore={updateStore}
              />
            )}

            {currentTab === 'finance' && (
              <FinanceView
                store={store}
                onUpdateStore={updateStore}
              />
            )}

            {currentTab === 'wheel' && (
              <LuckyWheelView
                store={store}
                onUpdateStore={updateStore}
              />
            )}

            {currentTab === 'reports' && (
              <ReportsView
                store={store}
              />
            )}

            {currentTab === 'settings' && (
              <SettingsView
                store={store}
                onUpdateStore={updateStore}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
