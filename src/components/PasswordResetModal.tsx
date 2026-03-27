import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';
import { auth } from '../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

interface PasswordResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBackToLogin: () => void;
}

export const PasswordResetModal: React.FC<PasswordResetModalProps> = ({ isOpen, onClose, onBackToLogin }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
    } catch (err: any) {
      console.error("Reset error:", err);
      setError(err.message || "Failed to send reset email");
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
                <KeyRound className="w-5 h-5" />
                Reset Password
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

              {success && (
                <div className="bg-green-500/10 border border-green-500/20 p-3 rounded flex items-center gap-3 text-green-500 text-xs uppercase font-bold tracking-widest">
                  <CheckCircle2 className="w-4 h-4" />
                  Reset link sent to your email!
                </div>
              )}

              <div className="flex flex-col gap-4">
                <p className="text-xs text-gray-400 leading-relaxed">
                  Enter the email address associated with your account and we'll send you a link to reset your password.
                </p>
                
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
              </div>

              <div className="flex flex-col gap-4">
                <button 
                  type="submit"
                  disabled={loading || success}
                  className="w-full py-3 glossy-blue text-white font-bold uppercase tracking-widest rounded shadow-lg hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
                
                <div className="text-center">
                  <span 
                    onClick={onBackToLogin}
                    className="text-[10px] uppercase font-bold text-gray-500 tracking-widest hover:text-ng-blue cursor-pointer transition-colors"
                  >
                    Back to Login
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
