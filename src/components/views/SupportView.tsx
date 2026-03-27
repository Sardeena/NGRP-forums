import React, { useState, useEffect } from 'react';
import { LifeBuoy, MessageSquare, Shield, HelpCircle, Plus, Clock, CheckCircle, Send, X, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, where, onSnapshot, addDoc, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { UserProfile, SupportTicket } from '../../types';
import { handleFirestoreError, OperationType } from '../../lib/firestore-errors';

interface SupportViewProps {
  user: UserProfile | null;
}

export const SupportView: React.FC<SupportViewProps> = ({ user }) => {
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTicket, setNewTicket] = useState({
    subject: '',
    category: 'General Support',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'support_tickets'),
      where('uid', '==', user.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ticketsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SupportTicket[];
      setTickets(ticketsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'support_tickets');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleTicketSubmit = async () => {
    if (!user || !newTicket.subject || !newTicket.message) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'support_tickets'), {
        uid: user.uid,
        subject: newTicket.subject,
        category: newTicket.category,
        message: newTicket.message,
        status: 'Pending',
        timestamp: Date.now()
      });

      setSubmitted(true);
      setNewTicket({ subject: '', category: 'General Support', message: '' });
      setTimeout(() => {
        setSubmitted(false);
        setShowNewTicket(false);
      }, 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'support_tickets');
    } finally {
      setSubmitting(false);
    }
  };

  const stats = {
    pending: tickets.filter(t => t.status === 'Pending').length,
    open: tickets.filter(t => t.status === 'Open').length,
    resolved: tickets.filter(t => t.status === 'Resolved').length
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Shield className="w-16 h-16 text-gray-700" />
        <h2 className="text-xl font-black italic text-white uppercase tracking-tighter">Authentication Required</h2>
        <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">Please log in to access the support system.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="glossy-blue p-4 rounded shadow-lg flex justify-between items-center">
        <h2 className="text-white font-bold uppercase tracking-widest flex items-center gap-2">
          <LifeBuoy className="w-5 h-5" />
          Support Ticket System
        </h2>
        {!showNewTicket && (
          <button 
            onClick={() => setShowNewTicket(true)}
            className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white text-[10px] font-bold uppercase tracking-widest rounded shadow-lg transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Ticket
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {showNewTicket ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            key="new-ticket-form"
            className="forum-container rounded overflow-hidden"
          >
            <div className="glossy-blue px-4 py-2 text-xs font-bold text-white uppercase tracking-widest flex justify-between items-center">
              <span>Create New Support Ticket</span>
              <button onClick={() => setShowNewTicket(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-8 bg-ng-dark/95 flex flex-col gap-6">
              {submitted ? (
                <div className="flex flex-col items-center text-center gap-4 py-12">
                  <CheckCircle className="w-16 h-16 text-green-500" />
                  <h3 className="text-xl font-black italic text-white uppercase tracking-tighter">Ticket Created!</h3>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">Your ticket has been successfully submitted.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Subject</label>
                      <input 
                        type="text" 
                        value={newTicket.subject}
                        onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded px-4 py-2.5 text-sm text-white focus:outline-none focus:border-ng-blue/50"
                        placeholder="Brief description of the issue"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Category</label>
                      <select 
                        value={newTicket.category}
                        onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded px-4 py-2.5 text-sm text-white focus:outline-none focus:border-ng-blue/50"
                      >
                        <option>General Support</option>
                        <option>Bug Report</option>
                        <option>Player Report</option>
                        <option>Asset Refund</option>
                        <option>Technical Issue</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Message</label>
                    <textarea 
                      value={newTicket.message}
                      onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded p-4 text-sm text-white focus:outline-none focus:border-ng-blue/50 min-h-[150px]"
                      placeholder="Please provide as much detail as possible..."
                    />
                  </div>
                  <div className="p-4 bg-ng-blue/10 border border-ng-blue/20 rounded flex gap-4 items-start">
                    <AlertCircle className="w-5 h-5 text-ng-blue flex-shrink-0 mt-0.5" />
                    <p className="text-[10px] text-ng-blue/80 leading-relaxed uppercase font-bold tracking-tight">
                      Please do not create multiple tickets for the same issue. 
                      Our staff team will respond to your ticket as soon as possible.
                    </p>
                  </div>
                  <button 
                    onClick={handleTicketSubmit}
                    disabled={submitting || !newTicket.subject || !newTicket.message}
                    className="w-full py-4 glossy-blue text-white font-bold uppercase tracking-widest rounded shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Submit Ticket
                  </button>
                </>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            key="ticket-list"
            className="flex flex-col gap-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <SupportStat icon={<Clock className="w-5 h-5" />} title="Pending Tickets" value={stats.pending.toString()} color="text-yellow-500" />
              <SupportStat icon={<MessageSquare className="w-5 h-5" />} title="Open Tickets" value={stats.open.toString()} color="text-ng-blue" />
              <SupportStat icon={<CheckCircle className="w-5 h-5" />} title="Resolved Tickets" value={stats.resolved.toString()} color="text-green-500" />
            </div>

            <div className="forum-container rounded overflow-hidden">
              <div className="glossy-blue px-4 py-2 text-xs font-bold text-white uppercase tracking-widest flex justify-between">
                <span>Your Support Tickets</span>
                <span className="opacity-50">Last updated: {new Date().toLocaleTimeString()}</span>
              </div>
              <div className="p-0 bg-ng-dark/95 flex flex-col">
                {loading ? (
                  <div className="p-12 flex justify-center">
                    <Loader2 className="w-8 h-8 text-ng-blue animate-spin" />
                  </div>
                ) : tickets.length > 0 ? (
                  tickets.map(ticket => (
                    <TicketRow 
                      key={ticket.id}
                      id={`#${ticket.id.slice(0, 4).toUpperCase()}`}
                      subject={ticket.subject}
                      status={ticket.status}
                      date={new Date(ticket.timestamp).toLocaleDateString()}
                    />
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-500 text-[10px] uppercase font-bold tracking-widest border-t border-white/5">
                    No tickets found.
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SupportStat: React.FC<{ icon: React.ReactNode; title: string; value: string; color: string }> = ({ icon, title, value, color }) => (
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

const TicketRow: React.FC<{ id: string; subject: string; status: string; date: string }> = ({ id, subject, status, date }) => {
  const statusColor = status === 'Pending' ? 'text-yellow-500' : status === 'Open' ? 'text-ng-blue' : 'text-green-500';
  
  return (
    <div className="p-4 flex items-center justify-between border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer group">
      <div className="flex items-center gap-4">
        <span className="text-xs font-bold text-gray-500 w-12">{id}</span>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-white group-hover:text-ng-blue transition-colors">{subject}</span>
          <span className="text-[10px] text-gray-500 uppercase tracking-widest">{date}</span>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-black/40 rounded border border-white/5 ${statusColor}`}>
          {status}
        </span>
        <button className="text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-white transition-colors">
          View
        </button>
      </div>
    </div>
  );
};
