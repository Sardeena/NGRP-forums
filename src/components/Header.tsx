import React, { useState, useRef, useEffect } from 'react';
import { Home, MessageSquare, Settings, Info, DollarSign, LifeBuoy, LogIn, UserPlus, FileText, User, ChevronDown, Users, ShieldAlert, Car, Search, Moon, Sun, ListTodo } from 'lucide-react';
import { AuthModal } from './AuthModal';
import { PasswordResetModal } from './PasswordResetModal';
import { motion, AnimatePresence } from 'motion/react';

import { View, UserProfile } from '../types';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

interface HeaderProps {
  currentView: View;
  onViewChange: (view: View) => void;
  onFormSelect?: (form: string) => void;
  onSearch: (query: string) => void;
  user: UserProfile | null;
  loading: boolean;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onViewChange, onFormSelect, onSearch, user, loading }) => {
  const [authModal, setAuthModal] = useState<{ isOpen: boolean; type: 'login' | 'register' }>({
    isOpen: false,
    type: 'login',
  });
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isFormsDropdownOpen, setIsFormsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDark, setIsDark] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    } else {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = !isDark;
    setIsDark(nextTheme);
    if (nextTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsFormsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openModal = (type: 'login' | 'register') => {
    setAuthModal({ isOpen: true, type });
  };

  const closeModal = () => {
    setAuthModal((prev) => ({ ...prev, isOpen: false }));
  };

  const openResetModal = () => {
    closeModal();
    setIsResetModalOpen(true);
  };

  const closeResetModal = () => {
    setIsResetModalOpen(false);
  };

  const backToLogin = () => {
    closeResetModal();
    openModal('login');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
      setSearchQuery("");
    }
  };

  return (
    <header className="w-full flex flex-col">
      {/* Top Bar */}
      <div className="bg-black/60 border-b border-white/5 py-2 px-4 flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
        <div className="flex gap-4">
          <span className="hover:text-white cursor-pointer transition-colors">Contact Us</span>
          <span className="hover:text-white cursor-pointer transition-colors">Reckless RP</span>
          <span className="hover:text-white cursor-pointer transition-colors">Privacy Policy</span>
        </div>
        <div className="flex gap-4 items-center">
          <button 
            onClick={toggleTheme}
            className="p-1.5 rounded-full hover:bg-white/10 transition-colors mr-2 cursor-pointer flex items-center justify-center"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDark ? <Sun className="w-3.5 h-3.5 text-yellow-500" /> : <Moon className="w-3.5 h-3.5 text-white" />}
          </button>
          <div className="h-3 w-[1px] bg-white/10 mr-2"></div>
          {loading ? (
            <span>Loading...</span>
          ) : user ? (
            <div className="flex gap-4 items-center">
              <span>Welcome back, <span className="text-white font-bold" style={{ color: user.color }}>{user.username}</span>!</span>
              <span 
                onClick={() => signOut(auth)}
                className="text-ng-blue hover:underline cursor-pointer"
              >
                Logout
              </span>
            </div>
          ) : (
            <>
              <span>Welcome Guest! Please</span>
              <div className="flex gap-2">
                <span 
                  onClick={() => openModal('login')}
                  className="text-ng-blue hover:underline cursor-pointer"
                >
                  Login
                </span>
                <span>or</span>
                <span 
                  onClick={() => openModal('register')}
                  className="text-ng-blue hover:underline cursor-pointer"
                >
                  Register
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Logo Area */}
      <div className="py-8 px-4 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-3">
          <div 
            onClick={() => onViewChange('home')}
            className="w-16 h-16 glossy-blue rounded-lg flex items-center justify-center shadow-2xl transform -rotate-3 border-2 border-white/20 cursor-pointer"
          >
            <span className="text-white font-black text-3xl italic drop-shadow-lg">RK</span>
          </div>
          <div className="flex flex-col">
            <h1 
              onClick={() => onViewChange('home')}
              className="text-4xl font-black text-white tracking-tighter drop-shadow-2xl italic cursor-pointer"
            >
              RECKLESS <span className="text-ng-blue">RP</span>
            </h1>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em] ml-1">
              San Andreas Roleplay
            </span>
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="w-full md:w-80 relative group">
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search threads, posts, users..."
            className="w-full bg-black/40 border border-white/10 rounded-full py-2.5 pl-10 pr-4 text-[10px] font-bold uppercase tracking-widest text-white placeholder:text-gray-600 focus:outline-none focus:border-ng-blue/50 transition-all shadow-inner"
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-ng-blue transition-colors" />
        </form>
      </div>

      {/* Navigation Menu */}
      <nav className="glossy-blue w-full h-14 flex items-center px-4 shadow-xl">
        <div className="flex h-full">
          <NavItem 
            onClick={() => onViewChange('home')}
            icon={<Home className="w-4 h-4" />} 
            label="Home" 
            active={currentView === 'home'} 
          />
          <NavItem 
            onClick={() => onViewChange('forums')}
            icon={<MessageSquare className="w-4 h-4" />} 
            label="Forums" 
            active={currentView === 'forums' || currentView === 'forum-detail' || currentView === 'thread-view'} 
          />
          
          {/* Forms Dropdown */}
          <div 
            ref={dropdownRef}
            className="relative h-full"
            onMouseEnter={() => setIsFormsDropdownOpen(true)}
            onMouseLeave={() => setIsFormsDropdownOpen(false)}
          >
            <NavItem 
              onClick={() => onViewChange('forms')}
              icon={<FileText className="w-4 h-4" />} 
              label="Forms" 
              active={currentView === 'forms'} 
              hasDropdown
              isDropdownOpen={isFormsDropdownOpen}
            />
            <AnimatePresence>
              {isFormsDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 w-64 bg-ng-dark border border-white/10 shadow-2xl z-50 overflow-hidden rounded-b-lg"
                >
                  <DropdownItem 
                    icon={<Users className="w-4 h-4" />} 
                    label="LSPD Application" 
                    onClick={() => {
                      onViewChange('forms');
                      onFormSelect?.('lspd');
                      setIsFormsDropdownOpen(false);
                    }}
                  />
                  <DropdownItem 
                    icon={<ShieldAlert className="w-4 h-4" />} 
                    label="Ban Appeal" 
                    onClick={() => {
                      onViewChange('forms');
                      onFormSelect?.('ban-appeal');
                      setIsFormsDropdownOpen(false);
                    }}
                  />
                  <DropdownItem 
                    icon={<Car className="w-4 h-4" />} 
                    label="Refund Request" 
                    onClick={() => {
                      onViewChange('forms');
                      onFormSelect?.('refund');
                      setIsFormsDropdownOpen(false);
                    }}
                  />
                  <DropdownItem 
                    icon={<Users className="w-4 h-4" />} 
                    label="Gang Registration" 
                    onClick={() => {
                      onViewChange('forms');
                      onFormSelect?.('gang');
                      setIsFormsDropdownOpen(false);
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <NavItem 
            onClick={() => onViewChange('ucp')}
            icon={<Settings className="w-4 h-4" />} 
            label="User Control Panel" 
            active={currentView === 'ucp'} 
          />
          <NavItem 
            onClick={() => onViewChange('server-info')}
            icon={<Info className="w-4 h-4" />} 
            label="Server Information" 
            active={currentView === 'server-info'} 
          />
          <NavItem 
            onClick={() => onViewChange('donate')}
            icon={<DollarSign className="w-4 h-4" />} 
            label="Donate" 
            active={currentView === 'donate'} 
          />
          <NavItem 
            onClick={() => onViewChange('support')}
            icon={<LifeBuoy className="w-4 h-4" />} 
            label="Support" 
            active={currentView === 'support'} 
          />
          <NavItem 
            onClick={() => onViewChange('profile')}
            icon={<User className="w-4 h-4" />} 
            label="Profile" 
            active={currentView === 'profile'} 
          />
          <NavItem 
            onClick={() => onViewChange('tasks')}
            icon={<ListTodo className="w-4 h-4" />} 
            label="Tasks" 
            active={currentView === 'tasks'} 
          />
        </div>
        <div className="ml-auto flex h-full">
          {user ? (
            <NavItem 
              onClick={() => onViewChange('profile')}
              icon={<User className="w-4 h-4" />} 
              label={user.username} 
              active={currentView === 'profile'}
            />
          ) : (
            <>
              <NavItem 
                onClick={() => openModal('login')}
                icon={<LogIn className="w-4 h-4" />} 
                label="Login" 
              />
              <NavItem 
                onClick={() => openModal('register')}
                icon={<UserPlus className="w-4 h-4" />} 
                label="Register" 
              />
            </>
          )}
        </div>
      </nav>

      <AuthModal 
        isOpen={authModal.isOpen} 
        onClose={closeModal} 
        onForgotPassword={openResetModal}
        type={authModal.type} 
      />

      <PasswordResetModal 
        isOpen={isResetModalOpen} 
        onClose={closeResetModal} 
        onBackToLogin={backToLogin}
      />
    </header>
  );
};

const NavItem: React.FC<{ 
  icon: React.ReactNode; 
  label: string; 
  active?: boolean; 
  onClick?: () => void;
  hasDropdown?: boolean;
  isDropdownOpen?: boolean;
}> = ({ icon, label, active, onClick, hasDropdown, isDropdownOpen }) => {
  return (
    <div 
      onClick={onClick}
      className={`
        h-full px-6 flex items-center gap-2 cursor-pointer transition-all border-r border-white/10
        ${active ? 'bg-black/20 shadow-inner' : 'hover:bg-white/10'}
      `}
    >
      <span className={`${active ? 'text-white' : 'text-white/70'}`}>{icon}</span>
      <span className={`text-xs font-bold uppercase tracking-wider ${active ? 'text-white' : 'text-white/80'}`}>
        {label}
      </span>
      {hasDropdown && (
        <ChevronDown className={`w-3 h-3 text-white/50 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
      )}
    </div>
  );
};

const DropdownItem: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void }> = ({ icon, label, onClick }) => (
  <div 
    onClick={onClick}
    className="px-4 py-3 flex items-center gap-3 hover:bg-ng-blue/20 cursor-pointer transition-colors border-b border-white/5 last:border-0"
  >
    <span className="text-ng-blue">{icon}</span>
    <span className="text-[10px] font-bold text-white uppercase tracking-widest">{label}</span>
  </div>
);
