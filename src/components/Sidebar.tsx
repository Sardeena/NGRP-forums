import React, { useState, useEffect } from 'react';
import { Shield, Users, Info, MessageCircle, Star } from 'lucide-react';
import { Thread, ServerStats, ForumStats, News } from '../types';
import { collection, query, orderBy, limit, onSnapshot, doc } from 'firebase/firestore';
import { db } from '../firebase';

interface SidebarProps {
  starredThreads?: Thread[];
  onThreadClick?: (id: string, title: string, isLocked: boolean) => void;
  selectedThreadId?: string | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ starredThreads = [], onThreadClick, selectedThreadId }) => {
  const [serverStats, setServerStats] = useState<ServerStats | null>(null);
  const [forumStats, setForumStats] = useState<ForumStats | null>(null);
  const [announcements, setAnnouncements] = useState<News[]>([]);

  useEffect(() => {
    // Fetch Server Stats
    const unsubscribeServer = onSnapshot(doc(db, 'server_stats', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        setServerStats({ id: docSnap.id, ...docSnap.data() } as ServerStats);
      }
    });

    // Fetch Forum Stats
    const unsubscribeForum = onSnapshot(doc(db, 'forum_stats', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        setForumStats({ id: docSnap.id, ...docSnap.data() } as ForumStats);
      }
    });

    // Fetch Latest Announcements (from News)
    const q = query(collection(db, 'news'), orderBy('timestamp', 'desc'), limit(3));
    const unsubscribeAnnouncements = onSnapshot(q, (snapshot) => {
      const fetchedNews: News[] = [];
      snapshot.forEach((doc) => {
        fetchedNews.push({ id: doc.id, ...doc.data() } as News);
      });
      setAnnouncements(fetchedNews);
    });

    return () => {
      unsubscribeServer();
      unsubscribeForum();
      unsubscribeAnnouncements();
    };
  }, []);

  return (
    <div className="flex flex-col gap-4 w-full lg:w-72">
      {/* Starred Threads */}
      {starredThreads.length > 0 && (
        <div className="sidebar-widget border-yellow-500/30">
          <div className="sidebar-header flex items-center gap-2 bg-yellow-500/10 text-yellow-500 border-yellow-500/30">
            <Star className="w-4 h-4 fill-yellow-500" />
            Starred Threads
          </div>
          <div className="p-4 flex flex-col gap-3 text-xs">
            {starredThreads.map(thread => (
              <div 
                key={thread.id} 
                className={`flex flex-col gap-1 border-b border-white/5 pb-2 last:border-0 last:pb-0 group cursor-pointer p-2 rounded transition-all relative overflow-hidden
                  ${selectedThreadId === thread.id ? 'bg-ng-blue/10 border-l-2 border-l-ng-blue shadow-[inset_0_0_15px_rgba(0,163,255,0.1)]' : 'hover:bg-white/5'}
                `}
                onClick={() => onThreadClick?.(thread.id, thread.title, !!thread.isLocked)}
              >
                {selectedThreadId === thread.id && <div className="absolute inset-0 bg-ng-blue/5 blur-xl opacity-30 pointer-events-none" />}
                <span className={`font-bold group-hover:underline truncate relative z-10 ${selectedThreadId === thread.id ? 'text-white' : 'text-ng-blue'}`}>{thread.title}</span>
                <div className="flex justify-between text-[10px] text-gray-500 relative z-10">
                  <span>By {thread.author}</span>
                  <span>{thread.replies} replies</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Server Status */}
      <div className="sidebar-widget">
        <div className="sidebar-header flex items-center gap-2">
          <Shield className="w-4 h-4 text-ng-blue" />
          Server Status
        </div>
        <div className="p-4 flex flex-col gap-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Server:</span>
            <span className={`${serverStats?.status === 'Online' ? 'text-green-500' : 'text-red-500'} font-bold uppercase tracking-widest text-xs`}>
              {serverStats?.status || 'Loading...'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Players:</span>
            <span className="text-gray-200 font-bold">
              {serverStats ? `${serverStats.playersOnline} / ${serverStats.maxPlayers}` : '...'}
            </span>
          </div>
          <div className="mt-2 p-2 bg-black/40 rounded border border-white/5 text-center font-mono text-xs text-ng-blue">
            samp.ng-gaming.net
          </div>
        </div>
      </div>

      {/* Latest Announcements */}
      <div className="sidebar-widget">
        <div className="sidebar-header flex items-center gap-2">
          <Info className="w-4 h-4 text-ng-blue" />
          Latest Announcements
        </div>
        <div className="p-4 flex flex-col gap-3 text-xs">
          {announcements.length > 0 ? announcements.map(news => (
            <div key={news.id} className="flex flex-col gap-1 border-b border-white/5 pb-2 last:border-0 last:pb-0">
              <span className="text-ng-blue font-bold hover:underline cursor-pointer truncate">{news.title}</span>
              <span className="text-gray-500 text-[10px]">{news.date}</span>
            </div>
          )) : (
            <div className="text-gray-500 italic text-[10px]">No announcements.</div>
          )}
        </div>
      </div>

      {/* Discord Widget */}
      <div className="sidebar-widget bg-[#5865F2]/10 border-[#5865F2]/30">
        <div className="sidebar-header bg-[#5865F2]/20 border-[#5865F2]/30 flex items-center gap-2 text-white">
          <MessageCircle className="w-4 h-4" />
          Join Our Discord
        </div>
        <div className="p-6 flex flex-col items-center gap-4">
          <div className="bg-[#5865F2] p-3 rounded-xl shadow-lg">
             <MessageCircle className="w-10 h-10 text-white" />
          </div>
          <div className="text-center">
            <p className="text-white font-bold text-sm">NG-Gaming Community</p>
            <p className="text-[#5865F2] text-xs font-medium">{forumStats?.discordMembersOnline?.toLocaleString() || '1,240'} Members Online</p>
          </div>
          <button className="w-full py-2 bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold rounded transition-colors shadow-md">
            Join Now
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="sidebar-widget">
        <div className="sidebar-header flex items-center gap-2">
          <Users className="w-4 h-4 text-ng-blue" />
          Forum Statistics
        </div>
        <div className="p-4 flex flex-col gap-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-400">Total Posts:</span>
            <span className="text-gray-200">{forumStats?.totalPosts.toLocaleString() || '...'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Total Topics:</span>
            <span className="text-gray-200">{forumStats?.totalTopics.toLocaleString() || '...'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Total Members:</span>
            <span className="text-gray-200">{forumStats?.totalMembers.toLocaleString() || '...'}</span>
          </div>
          <div className="mt-2 pt-2 border-t border-white/5 text-center">
            <span className="text-gray-500">Welcome to our newest member, </span>
            <span className="text-ng-blue font-bold hover:underline cursor-pointer">{forumStats?.newestMember || '...'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
