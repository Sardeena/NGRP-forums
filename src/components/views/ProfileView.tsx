import React, { useState, useEffect } from 'react';
import { FileText, Star, MessageSquare, User as UserIcon, Clock } from 'lucide-react';
import { Thread, UserProfile, SupportTicket } from '../../types';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';

interface ProfileViewProps {
  starredThreads: Thread[];
  onThreadClick: (id: string, title: string, isLocked: boolean) => void;
  selectedThreadId?: string | null;
  user: UserProfile | null;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ starredThreads, onThreadClick, selectedThreadId, user }) => {
  const [myTickets, setMyTickets] = useState<SupportTicket[]>([]);
  const [myThreadsCount, setMyThreadsCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Fetch user's support tickets (applications)
    const ticketsQuery = query(
      collection(db, 'support_tickets'),
      where('uid', '==', user.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribeTickets = onSnapshot(ticketsQuery, (snapshot) => {
      const tickets: SupportTicket[] = [];
      snapshot.forEach((doc) => {
        tickets.push({ id: doc.id, ...doc.data() } as SupportTicket);
      });
      setMyTickets(tickets);
    });

    // Fetch user's threads count
    const threadsQuery = query(
      collection(db, 'threads'),
      where('authorUid', '==', user.uid)
    );

    const unsubscribeThreads = onSnapshot(threadsQuery, (snapshot) => {
      setMyThreadsCount(snapshot.size);
    });

    return () => {
      unsubscribeTickets();
      unsubscribeThreads();
    };
  }, [user?.uid]);

  if (!user) {
    return (
      <div className="forum-container rounded-lg p-12 flex flex-col items-center text-center gap-4 bg-ng-dark/95">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-gray-600 mb-4 border border-white/10">
          <UserIcon className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-black italic text-white uppercase tracking-tighter">Please Login</h2>
        <p className="text-gray-500 text-xs max-w-xs uppercase font-bold tracking-widest text-[10px]">
          You must be logged in to view your profile.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* User Info Header */}
      <div className="forum-container rounded-lg overflow-hidden">
        <div className="glossy-blue p-6 flex items-center gap-6">
          <img 
            src={`https://picsum.photos/seed/${user.username}/120/120`} 
            alt="User Avatar" 
            className="w-24 h-24 rounded-full border-4 border-white/20 shadow-2xl"
            referrerPolicy="no-referrer"
          />
          <div className="flex flex-col">
            <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter" style={{ color: user.color }}>{user.username}</h2>
            <div className="flex items-center gap-3 mt-2">
              <span className="bg-ng-blue/20 text-ng-blue text-[10px] font-bold uppercase px-3 py-1 rounded border border-ng-blue/20">{user.role}</span>
              <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Joined {user.joinedAt}</span>
            </div>
          </div>
        </div>
        <div className="bg-ng-dark/95 p-6 grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-white/5">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total Posts</span>
            <span className="text-xl font-black italic text-white uppercase tracking-tighter">{user.postCount}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Reputation</span>
            <span className={`text-xl font-black italic uppercase tracking-tighter ${user.reputation >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {user.reputation >= 0 ? '+' : ''}{user.reputation}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Threads Started</span>
            <span className="text-xl font-black italic text-white uppercase tracking-tighter">{myThreadsCount}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Profile Views</span>
            <span className="text-xl font-black italic text-white uppercase tracking-tighter">{user.profileViews || 0}</span>
          </div>
        </div>
      </div>

      {/* My Applications Section */}
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-black italic text-white uppercase tracking-tighter flex items-center gap-2">
          <FileText className="w-5 h-5 text-ng-blue" />
          My Applications & Tickets
        </h2>
        <div className="flex flex-col gap-4">
          {myTickets.length > 0 ? myTickets.map((ticket) => (
            <div key={ticket.id} className="forum-container rounded overflow-hidden p-6 bg-ng-dark/95 flex justify-between items-center border border-white/5 hover:border-white/10 transition-all">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${ticket.status === 'Pending' ? 'bg-yellow-500/10 text-yellow-500' : ticket.status === 'Open' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest">{ticket.subject}</h3>
                  <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                    <span>ID: {ticket.id.slice(0, 8).toUpperCase()}</span>
                    <span>•</span>
                    <span>Category: {ticket.category}</span>
                    <span>•</span>
                    <span>Submitted: {new Date(ticket.timestamp).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded border ${ticket.status === 'Pending' ? 'border-yellow-500/20 text-yellow-500 bg-yellow-500/5' : ticket.status === 'Open' ? 'border-green-500/20 text-green-500 bg-green-500/5' : 'border-red-500/20 text-red-500 bg-red-500/5'}`}>
                  {ticket.status}
                </span>
              </div>
            </div>
          )) : (
            <div className="p-8 text-center text-gray-500 text-xs italic bg-ng-dark/40 rounded border border-white/5">
              No applications or tickets found.
            </div>
          )}
        </div>
      </div>

      {/* Starred Threads Section */}
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-black italic text-white uppercase tracking-tighter flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
          Starred Threads
        </h2>
        <div className="flex flex-col gap-4">
          {starredThreads.length > 0 ? (
            starredThreads.map((thread) => (
              <div 
                key={thread.id} 
                onClick={() => onThreadClick?.(thread.id, thread.title, !!thread.isLocked)}
                className={`forum-container rounded overflow-hidden p-6 bg-ng-dark/95 flex justify-between items-center border transition-all cursor-pointer group relative
                  ${selectedThreadId === thread.id ? 'bg-ng-blue/10 border-ng-blue shadow-[inset_0_0_20px_rgba(0,163,255,0.1)]' : 'border-white/5 hover:border-ng-blue/30'}
                `}
              >
                {selectedThreadId === thread.id && <div className="absolute inset-0 bg-ng-blue/5 blur-2xl opacity-30 pointer-events-none" />}
                <div className="flex items-center gap-4 relative z-10">
                  <div className="p-3 rounded-full bg-yellow-500/10 text-yellow-500">
                    <Star className="w-5 h-5 fill-yellow-500" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest group-hover:text-ng-blue transition-colors">{thread.title}</h3>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                      <span>Started by {thread.author}</span>
                      <span>•</span>
                      <span>{thread.createdAt}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest">
                    <span className="text-gray-500 flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" /> {thread.replies}
                    </span>
                    <span className="text-gray-500 flex items-center gap-1">
                      <UserIcon className="w-3 h-3" /> {thread.views}
                    </span>
                  </div>
                  <button className="text-[10px] font-bold text-ng-blue hover:underline uppercase tracking-widest">View Thread</button>
                </div>
              </div>
            ))
          ) : (
            <div className="forum-container rounded-lg p-12 flex flex-col items-center text-center gap-4 bg-ng-dark/95">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-gray-600 mb-4 border border-white/10">
                <Star className="w-10 h-10" />
              </div>
              <h2 className="text-xl font-black italic text-white uppercase tracking-tighter">No Starred Threads</h2>
              <p className="text-gray-500 text-xs max-w-xs uppercase font-bold tracking-widest text-[10px]">
                Threads you star in the forums will appear here for quick access.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
