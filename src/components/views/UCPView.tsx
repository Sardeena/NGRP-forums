import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Shield, Key, Bell, Globe, Mail, 
  Wallet, Briefcase, Car, Home, Users, 
  Star, Phone, CreditCard, MapPin, History,
  Settings, LogOut, CheckCircle, Palette, Type
} from 'lucide-react';
import { UserProfile } from '../../types';
import { db } from '../../firebase';
import { doc, updateDoc, addDoc, collection } from 'firebase/firestore';

interface UCPViewProps {
  user: UserProfile | null;
}

type UCPTab = 'overview' | 'settings' | 'logs' | 'assets';

const COLORS = [
  { name: 'NG Blue', value: '#00a3ff' },
  { name: 'Red', value: '#ff4444' },
  { name: 'Green', value: '#00c851' },
  { name: 'Yellow', value: '#ffbb33' },
  { name: 'Purple', value: '#aa66cc' },
  { name: 'Orange', value: '#ff8800' },
  { name: 'Pink', value: '#ff4081' },
  { name: 'Cyan', value: '#00e5ff' },
];

export const UCPView: React.FC<UCPViewProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<UCPTab>('overview');
  const [showSuccess, setShowSuccess] = useState(false);
  const [displayColor, setDisplayColor] = useState(user?.color || '#00a3ff');
  const [signature, setSignature] = useState(user?.signature || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayColor(user.color);
      setSignature(user.signature || '');
    }
  }, [user]);

  const handleSave = async (field?: string) => {
    if (!user) return;
    setIsSaving(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      const updates: any = {};
      
      if (field === 'color') updates.color = displayColor;
      else if (field === 'signature') updates.signature = signature;
      else {
        updates.color = displayColor;
        updates.signature = signature;
      }

      await updateDoc(userRef, updates);

      // Log activity
      await addDoc(collection(db, 'activities'), {
        type: 'profile_update',
        user: user.username,
        uid: user.uid,
        targetId: user.uid,
        timestamp: Date.now()
      });

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const renderOverview = () => (
    <div className="flex flex-col gap-6">
      {/* Character Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={<Star className="w-4 h-4" />} label="Level" value="24" color="text-yellow-500" />
        <StatCard icon={<Wallet className="w-4 h-4" />} label="Cash" value="$1,245,000" color="text-green-500" />
        <StatCard icon={<CreditCard className="w-4 h-4" />} label="Bank" value="$45,800,000" color="text-ng-blue" />
        <StatCard icon={<Phone className="w-4 h-4" />} label="Phone" value="555-0124" color="text-purple-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="forum-container rounded overflow-hidden">
            <div className="glossy-blue px-4 py-2 text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Employment & Faction
            </div>
            <div className="p-6 bg-ng-dark/95 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-4">
                <DetailItem label="Primary Job" value="Legal Assistant" />
                <DetailItem label="Faction" value="Los Santos Police Dept." />
                <DetailItem label="Rank" value="Sergeant (Grade 3)" />
              </div>
              <div className="flex flex-col gap-4">
                <DetailItem label="Gang" value="None" />
                <DetailItem label="Warnings" value="0 / 3" />
                <DetailItem label="Playing Hours" value="1,452 Hours" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="forum-container rounded overflow-hidden">
            <div className="glossy-blue px-4 py-2 text-xs font-bold text-white uppercase tracking-widest">
              Account Security
            </div>
            <div className="p-4 bg-ng-dark/95 flex flex-col gap-2">
              <UCPItem icon={<Key className="w-4 h-4" />} label="Password" description="Change credentials" onClick={() => setActiveTab('settings')} />
              <UCPItem icon={<Shield className="w-4 h-4" />} label="2FA Auth" description="Enable security" onClick={() => setActiveTab('settings')} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="flex flex-col gap-6">
        <div className="forum-container rounded overflow-hidden">
          <div className="glossy-blue px-4 py-2 text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Display Appearance
          </div>
          <div className="p-6 bg-ng-dark/95 flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Display Color</label>
              <div className="grid grid-cols-4 gap-3">
                {COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setDisplayColor(color.value)}
                    className={`h-10 rounded border-2 transition-all flex items-center justify-center ${displayColor === color.value ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:border-white/20'}`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  >
                    {displayColor === color.value && <CheckCircle className="w-4 h-4 text-white drop-shadow-md" />}
                  </button>
                ))}
              </div>
              <div className="mt-2 p-3 bg-black/40 rounded border border-white/5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full border border-white/10" style={{ backgroundColor: displayColor }} />
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Preview</span>
                  <span className="text-xs font-black italic uppercase tracking-tighter" style={{ color: displayColor }}>
                    {user?.username || 'Username'}
                  </span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => handleSave('color')}
              disabled={isSaving}
              className="w-full py-3 glossy-blue text-white font-bold uppercase tracking-widest rounded shadow-lg hover:brightness-110 transition-all disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Update Display Color'}
            </button>
          </div>
        </div>

        <div className="forum-container rounded overflow-hidden">
          <div className="glossy-blue px-4 py-2 text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
            <Type className="w-4 h-4" />
            Forum Signature
          </div>
          <div className="p-6 bg-ng-dark/95 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Your Signature</label>
              <textarea 
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded px-4 py-2.5 text-sm text-white focus:outline-none focus:border-ng-blue/50 min-h-[100px]"
                placeholder="Enter your forum signature..."
              />
              <p className="text-[9px] text-gray-600 font-medium">This will appear at the bottom of all your forum posts.</p>
            </div>
            <button 
              onClick={() => handleSave('signature')}
              disabled={isSaving}
              className="w-full py-3 glossy-blue text-white font-bold uppercase tracking-widest rounded shadow-lg hover:brightness-110 transition-all disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Update Signature'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="forum-container rounded overflow-hidden">
          <div className="glossy-blue px-4 py-2 text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
            <Key className="w-4 h-4" />
            Account Security
          </div>
          <div className="p-6 bg-ng-dark/95 flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <UCPInput label="Current Password" type="password" />
              <UCPInput label="New Password" type="password" />
              <UCPInput label="Confirm New Password" type="password" />
            </div>
            <button 
              onClick={() => handleSave()}
              className="w-full py-3 glossy-blue text-white font-bold uppercase tracking-widest rounded shadow-lg hover:brightness-110 transition-all"
            >
              Update Password
            </button>
          </div>
        </div>

        <div className="forum-container rounded overflow-hidden">
          <div className="glossy-blue px-4 py-2 text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Privacy & Notifications
          </div>
          <div className="p-6 bg-ng-dark/95 flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <UCPToggle label="Show Online Status" enabled={true} />
              <UCPToggle label="Email Notifications" enabled={false} />
              <UCPToggle label="Show Character Stats" enabled={true} />
              <UCPToggle label="Two-Factor Authentication" enabled={false} />
            </div>
            <button 
              onClick={() => handleSave()}
              className="w-full py-3 glossy-blue text-white font-bold uppercase tracking-widest rounded shadow-lg hover:brightness-110 transition-all"
            >
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLogs = () => (
    <div className="forum-container rounded overflow-hidden">
      <div className="glossy-blue px-4 py-2 text-xs font-bold text-white uppercase tracking-widest">
        Recent Activity Logs
      </div>
      <div className="bg-ng-dark/95">
        <LogItem action="Login" detail="Logged in from 192.168.1.1" time="Today, 04:30 AM" />
        <LogItem action="Purchase" detail="Bought Infernus for $850,000" time="Yesterday, 11:20 PM" />
        <LogItem action="Faction" detail="Promoted to Sergeant by AdminJohn" time="Mar 20, 2026" />
        <LogItem action="Security" detail="Password changed successfully" time="Mar 15, 2026" />
        <LogItem action="Logout" detail="Session ended (2.5 hours)" time="Mar 14, 2026" />
      </div>
    </div>
  );

  const renderAssets = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="forum-container rounded overflow-hidden">
        <div className="glossy-blue px-4 py-2 text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
          <Car className="w-4 h-4" />
          Vehicles
        </div>
        <div className="p-4 bg-ng-dark/95 flex flex-col gap-2">
          <AssetItem name="Infernus" plate="NG-778" status="Parked" />
          <AssetItem name="Sultan" plate="LS-RP-1" status="Impounded" />
          <AssetItem name="Maverick" plate="AIR-01" status="Hangar" />
        </div>
      </div>

      <div className="forum-container rounded overflow-hidden">
        <div className="glossy-blue px-4 py-2 text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
          <Home className="w-4 h-4" />
          Properties
        </div>
        <div className="p-4 bg-ng-dark/95 flex flex-col gap-2">
          <AssetItem name="Vinewood Mansion" plate="ID: 452" status="Owned" />
          <AssetItem name="LS Apartment" plate="ID: 12" status="Rented" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="glossy-blue p-4 rounded shadow-lg flex justify-between items-center">
        <h2 className="text-white font-bold uppercase tracking-widest flex items-center gap-2">
          <User className="w-5 h-5" />
          User Control Panel
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Character:</span>
          <span className="text-xs font-black italic uppercase tracking-tighter" style={{ color: user?.color || '#00a3ff' }}>
            {user?.username || 'Guest'}
          </span>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<User className="w-3 h-3" />} label="Overview" />
        <TabButton active={activeTab === 'assets'} onClick={() => setActiveTab('assets')} icon={<Briefcase className="w-3 h-3" />} label="Assets" />
        <TabButton active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} icon={<History className="w-3 h-3" />} label="Logs" />
        <TabButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings className="w-3 h-3" />} label="Settings" />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'assets' && renderAssets()}
          {activeTab === 'logs' && renderLogs()}
          {activeTab === 'settings' && renderSettings()}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 right-8 bg-green-500 text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3 z-50"
          >
            <CheckCircle className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-widest">Changes saved successfully!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const TabButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`px-6 py-2.5 rounded flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${active ? 'glossy-blue text-white shadow-lg' : 'bg-black/40 text-gray-500 hover:text-white'}`}
  >
    {icon}
    {label}
  </button>
);

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string; color: string }> = ({ icon, label, value, color }) => (
  <div className="forum-container rounded overflow-hidden p-4 bg-ng-dark/95 flex items-center gap-3 border border-white/5">
    <div className={`p-2 bg-black/40 rounded ${color}`}>
      {icon}
    </div>
    <div className="flex flex-col">
      <span className="text-[9px] uppercase font-bold text-gray-500 tracking-widest">{label}</span>
      <span className={`text-sm font-black italic ${color}`}>{value}</span>
    </div>
  </div>
);

const DetailItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex flex-col gap-1 border-l-2 border-ng-blue/30 pl-3">
    <span className="text-[9px] uppercase font-bold text-gray-500 tracking-widest">{label}</span>
    <span className="text-sm font-bold text-white tracking-tight">{value}</span>
  </div>
);

const AssetItem: React.FC<{ name: string; plate: string; status: string }> = ({ name, plate, status }) => (
  <div className="flex items-center justify-between p-3 rounded bg-black/20 border border-white/5 hover:bg-white/5 transition-colors cursor-pointer">
    <div className="flex flex-col">
      <span className="text-xs font-bold text-white">{name}</span>
      <span className="text-[9px] text-gray-500 uppercase tracking-widest">{plate}</span>
    </div>
    <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-black/40 border border-white/5 ${status === 'Parked' || status === 'Owned' ? 'text-green-500' : 'text-yellow-500'}`}>
      {status}
    </span>
  </div>
);

const UCPItem: React.FC<{ icon: React.ReactNode; label: string; description: string; onClick?: () => void }> = ({ icon, label, description, onClick }) => (
  <div onClick={onClick} className="flex items-center gap-3 p-2 rounded hover:bg-white/5 cursor-pointer transition-colors border border-transparent hover:border-white/10">
    <div className="p-1.5 bg-ng-blue/10 rounded text-ng-blue">
      {icon}
    </div>
    <div className="flex flex-col">
      <span className="text-xs font-bold text-white">{label}</span>
      <span className="text-[9px] text-gray-500 uppercase tracking-wider">{description}</span>
    </div>
  </div>
);

const UCPInput: React.FC<{ label: string; type?: string }> = ({ label, type = "text" }) => (
  <div className="flex flex-col gap-2">
    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</label>
    <input 
      type={type} 
      className="w-full bg-black/40 border border-white/10 rounded px-4 py-2.5 text-sm text-white focus:outline-none focus:border-ng-blue/50"
    />
  </div>
);

const UCPToggle: React.FC<{ label: string; enabled: boolean }> = ({ label, enabled }) => {
  const [isOn, setIsOn] = useState(enabled);
  return (
    <div className="flex items-center justify-between p-3 rounded bg-black/20 border border-white/5">
      <span className="text-xs font-bold text-white uppercase tracking-widest">{label}</span>
      <button 
        onClick={() => setIsOn(!isOn)}
        className={`w-10 h-5 rounded-full relative transition-colors ${isOn ? 'bg-ng-blue' : 'bg-gray-700'}`}
      >
        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isOn ? 'left-6' : 'left-1'}`} />
      </button>
    </div>
  );
};

const LogItem: React.FC<{ action: string; detail: string; time: string }> = ({ action, detail, time }) => (
  <div className="flex items-center justify-between p-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
    <div className="flex flex-col">
      <span className="text-xs font-bold text-white uppercase tracking-widest">{action}</span>
      <span className="text-[10px] text-gray-500 mt-1">{detail}</span>
    </div>
    <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">{time}</span>
  </div>
);
