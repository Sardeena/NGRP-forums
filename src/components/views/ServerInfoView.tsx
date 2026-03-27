import React, { useState, useEffect } from 'react';
import { Info, Shield, Book, Users, Server, Zap } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { ServerStats } from '../../types';

export const ServerInfoView: React.FC = () => {
  const [stats, setStats] = useState<ServerStats | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'server_stats', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        setStats({ id: docSnap.id, ...docSnap.data() } as ServerStats);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="glossy-blue p-4 rounded shadow-lg">
        <h2 className="text-white font-bold uppercase tracking-widest flex items-center gap-2">
          <Info className="w-5 h-5" />
          Server Information
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <InfoCard 
          icon={<Zap className="w-5 h-5" />} 
          title="Server Status" 
          value={stats?.status || "Loading..."} 
          color={stats?.status === 'Online' ? "text-green-500" : "text-red-500"} 
        />
        <InfoCard 
          icon={<Users className="w-5 h-5" />} 
          title="Players Online" 
          value={stats ? `${stats.playersOnline} / ${stats.maxPlayers}` : "..."} 
          color="text-ng-blue" 
        />
        <InfoCard 
          icon={<Server className="w-5 h-5" />} 
          title="Server Version" 
          value={stats?.version || "..."} 
          color="text-gray-400" 
        />
      </div>

      <div className="forum-container rounded overflow-hidden">
        <div className="glossy-blue px-4 py-2 text-xs font-bold text-white uppercase tracking-widest">
          Quick Guides
        </div>
        <div className="p-8 bg-ng-dark/95 flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <h3 className="text-white font-bold uppercase tracking-widest flex items-center gap-2 border-b border-white/5 pb-2">
              <Shield className="w-4 h-4 text-ng-blue" />
              Core Rules
            </h3>
            <ul className="text-xs text-gray-400 leading-relaxed list-disc list-inside flex flex-col gap-2">
              <li>No Deathmatching (DM) - Do not kill players without a valid roleplay reason.</li>
              <li>No Powergaming (PG) - Do not force actions on others or perform unrealistic feats.</li>
              <li>No Metagaming (MG) - Do not use OOC information in IC situations.</li>
              <li>Respect all players and staff members at all times.</li>
            </ul>
          </div>

          <div className="flex flex-col gap-4">
            <h3 className="text-white font-bold uppercase tracking-widest flex items-center gap-2 border-b border-white/5 pb-2">
              <Book className="w-4 h-4 text-ng-blue" />
              Getting Started
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Welcome to NG-Gaming! To get started, you'll need to create a character and pass our basic roleplay quiz. Once you're in, you can find a job, join a faction, or start your own gang. The possibilities are endless in our persistent world.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoCard: React.FC<{ icon: React.ReactNode; title: string; value: string; color: string }> = ({ icon, title, value, color }) => (
  <div className="forum-container rounded overflow-hidden p-6 bg-ng-dark/95 flex items-center gap-4">
    <div className={`p-3 bg-black/40 rounded ${color}`}>
      {icon}
    </div>
    <div className="flex flex-col">
      <span className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">{title}</span>
      <span className={`text-xl font-black italic ${color}`}>{value}</span>
    </div>
  </div>
);
