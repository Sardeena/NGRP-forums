import React, { useState } from 'react';
import { Shield, Trash2, Ban, ArrowRightLeft, Lock, Unlock } from 'lucide-react';
import { doc, updateDoc, deleteDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, Thread } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface ModerationToolsProps {
  user: UserProfile;
  targetThread?: Thread;
  targetUser?: { uid: string; username: string };
  onActionComplete?: () => void;
}

export const ModerationTools: React.FC<ModerationToolsProps> = ({ user, targetThread, targetUser, onActionComplete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [isBanning, setIsBanning] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [targetForum, setTargetForum] = useState('');

  const isStaff = user.role === 'admin' || user.role === 'moderator';
  if (!isStaff) return null;

  const handleToggleLock = async () => {
    if (!targetThread) return;
    try {
      await updateDoc(doc(db, 'threads', targetThread.id), {
        isLocked: !targetThread.isLocked
      });
      onActionComplete?.();
    } catch (error) {
      console.error('Error toggling lock:', error);
    }
  };

  const handleTogglePin = async () => {
    if (!targetThread) return;
    try {
      await updateDoc(doc(db, 'threads', targetThread.id), {
        isPinned: !targetThread.isPinned
      });
      onActionComplete?.();
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
  };

  const handleDeleteThread = async () => {
    if (!targetThread) return;
    try {
      await deleteDoc(doc(db, 'threads', targetThread.id));
      setIsDeleting(false);
      onActionComplete?.();
    } catch (error) {
      console.error('Error deleting thread:', error);
    }
  };

  const handleMoveThread = async () => {
    if (!targetThread || !targetForum) return;
    try {
      await updateDoc(doc(db, 'threads', targetThread.id), {
        subForum: targetForum
      });
      setIsMoving(false);
      onActionComplete?.();
    } catch (error) {
      console.error('Error moving thread:', error);
    }
  };

  const handleBanUser = async () => {
    if (!targetUser || !banReason.trim()) return;
    try {
      await updateDoc(doc(db, 'users', targetUser.uid), {
        isBanned: true,
        banReason: banReason
      });
      
      // Log activity
      await addDoc(collection(db, 'activities'), {
        type: 'user_banned',
        user: user.username,
        uid: user.uid,
        targetId: targetUser.uid,
        targetTitle: targetUser.username,
        timestamp: Date.now()
      });

      setIsBanning(false);
      setBanReason('');
      onActionComplete?.();
    } catch (error) {
      console.error('Error banning user:', error);
    }
  };

  const forums = [
    "News & Updates", "Server Rules & Guides", "Community Chat", 
    "Factions", "Gangs", "Classifieds & Trades", "LSPD", "LSFD", 
    "Government", "Marketplace", "Bugs", "Suggestions", "Events", "Guides"
  ];

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-500 text-[10px] font-bold uppercase px-4 py-2 rounded transition-all border border-red-500/20 shadow-lg"
      >
        <Shield className="w-4 h-4" />
        Staff Tools
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full right-0 mt-2 w-64 bg-ng-dark border border-white/10 rounded-lg shadow-2xl z-50 overflow-hidden"
          >
            <div className="p-3 bg-red-500/10 border-b border-white/5">
              <span className="text-[10px] font-black italic text-red-500 uppercase tracking-tighter">Moderation Menu</span>
            </div>
            
            <div className="p-2 flex flex-col gap-1">
              {targetThread && (
                <>
                  <ModButton 
                    icon={targetThread.isLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />} 
                    label={targetThread.isLocked ? "Unlock Thread" : "Lock Thread"} 
                    onClick={handleToggleLock}
                  />
                  <ModButton 
                    icon={<Shield className="w-3.5 h-3.5" />} 
                    label={targetThread.isPinned ? "Unpin Thread" : "Pin Thread"} 
                    onClick={handleTogglePin}
                  />
                  <ModButton 
                    icon={<ArrowRightLeft className="w-3.5 h-3.5" />} 
                    label="Move Thread" 
                    onClick={() => setIsMoving(true)}
                  />
                  <ModButton 
                    icon={<Trash2 className="w-3.5 h-3.5" />} 
                    label="Delete Thread" 
                    variant="danger"
                    onClick={() => setIsDeleting(true)}
                  />
                </>
              )}

              {targetUser && (
                <ModButton 
                  icon={<Ban className="w-3.5 h-3.5" />} 
                  label="Ban User" 
                  variant="danger"
                  onClick={() => setIsBanning(true)}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleting && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm" 
              onClick={() => setIsDeleting(false)}
            ></motion.div>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="forum-container w-full max-w-md rounded-lg overflow-hidden relative z-10 shadow-2xl border border-red-500/30"
            >
              <div className="glossy-blue px-6 py-4 flex justify-between items-center border-b border-red-500/30">
                <h3 className="text-lg font-black italic text-white uppercase tracking-tighter flex items-center gap-2">
                  <Trash2 className="text-red-500" /> Delete Thread
                </h3>
              </div>
              <div className="p-6 bg-ng-dark/95 flex flex-col gap-4 text-center">
                <p className="text-gray-300 text-sm">Are you sure you want to delete this thread? This action is permanent and cannot be undone.</p>
                <div className="flex justify-end gap-3 mt-4">
                  <button 
                    onClick={() => setIsDeleting(false)}
                    className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold uppercase tracking-widest rounded transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleDeleteThread}
                    className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold uppercase tracking-widest rounded transition-colors shadow-lg shadow-red-500/20"
                  >
                    Confirm Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Move Thread Modal */}
      <AnimatePresence>
        {isMoving && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm" 
              onClick={() => setIsMoving(false)}
            ></motion.div>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="forum-container w-full max-w-md rounded-lg overflow-hidden relative z-10 shadow-2xl border border-ng-blue/30"
            >
              <div className="glossy-blue px-6 py-4 flex justify-between items-center border-b border-ng-blue/30">
                <h3 className="text-lg font-black italic text-white uppercase tracking-tighter flex items-center gap-2">
                  <ArrowRightLeft className="text-ng-blue" /> Move Thread
                </h3>
              </div>
              <div className="p-6 bg-ng-dark/95 flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Select Target Forum</label>
                  <select 
                    value={targetForum}
                    onChange={(e) => setTargetForum(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded p-3 text-sm text-white focus:outline-none focus:border-ng-blue/50"
                  >
                    <option value="">Select a forum...</option>
                    {forums.map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-3 mt-4">
                  <button 
                    onClick={() => setIsMoving(false)}
                    className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold uppercase tracking-widest rounded transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleMoveThread}
                    disabled={!targetForum}
                    className="px-6 py-2 bg-ng-blue hover:bg-ng-blue/80 text-white text-[10px] font-bold uppercase tracking-widest rounded transition-colors shadow-lg shadow-ng-blue/20 disabled:opacity-50"
                  >
                    Confirm Move
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Ban Modal */}
      <AnimatePresence>
        {isBanning && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm" 
              onClick={() => setIsBanning(false)}
            ></motion.div>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="forum-container w-full max-w-md rounded-lg overflow-hidden relative z-10 shadow-2xl border border-red-500/30"
            >
              <div className="glossy-blue px-6 py-4 flex justify-between items-center border-b border-red-500/30">
                <h3 className="text-lg font-black italic text-white uppercase tracking-tighter flex items-center gap-2">
                  <Ban className="text-red-500" /> Ban User: {targetUser?.username}
                </h3>
              </div>
              <div className="p-6 bg-ng-dark/95 flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Ban Reason</label>
                  <textarea 
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded p-4 text-sm text-white focus:outline-none focus:border-red-500/50 min-h-[100px]"
                    placeholder="Enter reason for ban..."
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button 
                    onClick={() => setIsBanning(false)}
                    className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold uppercase tracking-widest rounded transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleBanUser}
                    className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold uppercase tracking-widest rounded transition-colors shadow-lg shadow-red-500/20"
                  >
                    Confirm Ban
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ModButton: React.FC<{ 
  icon: React.ReactNode; 
  label: string; 
  onClick: () => void;
  variant?: 'default' | 'danger';
}> = ({ icon, label, onClick, variant = 'default' }) => (
  <button 
    onClick={onClick}
    className={`
      w-full flex items-center gap-3 px-3 py-2.5 rounded text-[10px] font-bold uppercase tracking-widest transition-all
      ${variant === 'danger' 
        ? 'text-red-400 hover:bg-red-500/20 hover:text-red-500' 
        : 'text-gray-400 hover:bg-white/5 hover:text-white'}
    `}
  >
    {icon}
    {label}
  </button>
);
