import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Lock, LogIn, UserPlus, Mail, AlertCircle } from 'lucide-react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onForgotPassword?: () => void;
  type: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onForgotPassword, type }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (type === 'register') {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match");
        }
        if (username.length < 3) {
          throw new Error("Username must be at least 3 characters");
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Create user profile in Firestore
        const userProfile = {
          uid: user.uid,
          username: username,
          email: email,
          role: 'member',
          color: '#00a3ff', // Default color
          joinedAt: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          postCount: 0,
          reputation: 0,
        };

        try {
          await setDoc(doc(db, 'users', user.uid), userProfile);
          
          // Update forum stats
          await updateDoc(doc(db, 'forum_stats', 'global'), {
            totalMembers: increment(1),
            newestMember: username
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
        }
        await updateProfile(user, { displayName: username });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onClose();
    } catch (err: any) {
      console.error("Auth error:", err);
      setError(err.message || "An error occurred during authentication");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-[101] forum-container rounded-lg overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="glossy-blue px-6 py-4 flex justify-between items-center">
              <h2 className="text-white font-bold uppercase tracking-widest flex items-center gap-2">
                {type === 'login' ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                {type === 'login' ? 'User Login' : 'Create Account'}
              </h2>
              <button 
                onClick={onClose}
                className="text-white/70 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="p-8 bg-ng-dark/95 flex flex-col gap-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 p-3 rounded flex items-center gap-3 text-red-500 text-xs uppercase font-bold tracking-widest">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-4">
                {type === 'register' && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest ml-1">
                      Username
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input 
                        type="text" 
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter your username..."
                        className="w-full bg-black/40 border border-white/10 rounded py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-ng-blue transition-colors"
                      />
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest ml-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email..."
                      className="w-full bg-black/40 border border-white/10 rounded py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-ng-blue transition-colors"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest ml-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input 
                      type="password" 
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password..."
                      className="w-full bg-black/40 border border-white/10 rounded py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-ng-blue transition-colors"
                    />
                  </div>
                </div>

                {type === 'register' && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest ml-1">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input 
                        type="password" 
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat your password..."
                        className="w-full bg-black/40 border border-white/10 rounded py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-ng-blue transition-colors"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-4">
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 glossy-blue text-white font-bold uppercase tracking-widest rounded shadow-lg hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? 'Processing...' : (type === 'login' ? 'Sign In' : 'Register Now')}
                </button>

                {type === 'login' && (
                  <div className="text-center -mt-2">
                    <span 
                      onClick={onForgotPassword}
                      className="text-[10px] uppercase font-bold text-gray-500 tracking-widest hover:text-ng-blue cursor-pointer transition-colors"
                    >
                      Forgot Password?
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between items-center text-[10px] uppercase font-bold text-gray-500 tracking-widest mt-2">
                  <span className="hover:text-ng-blue cursor-pointer transition-colors">
                    {type === 'login' ? 'Help Center' : 'Terms of Service'}
                  </span>
                  <span className="hover:text-ng-blue cursor-pointer transition-colors">
                    {type === 'login' ? 'Need an account?' : 'Already registered?'}
                  </span>
                </div>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
