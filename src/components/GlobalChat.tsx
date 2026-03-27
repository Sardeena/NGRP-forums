import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, AlertCircle, Smile } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import EmojiPicker, { Theme, EmojiClickData } from 'emoji-picker-react';
import { db, auth } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, getDoc } from 'firebase/firestore';
import { ChatMessage, UserProfile } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

export const GlobalChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setInputValue(prev => prev + emojiData.emoji);
    // Keep the picker open for multiple emojis, or close it? 
    // Usually users want to add multiple, so I'll keep it open.
  };

  useEffect(() => {
    let unsubscribeMessages: (() => void) | null = null;

    const unsubscribeAuth = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setUser(userDoc.data() as UserProfile);
        }

        // Start listening to messages only when authenticated
        const q = query(
          collection(db, 'chat_messages'),
          orderBy('timestamp', 'asc'),
          limit(50)
        );

        unsubscribeMessages = onSnapshot(q, (snapshot) => {
          const msgs: ChatMessage[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            msgs.push({
              id: doc.id,
              ...data,
              timestamp: data.timestamp?.toMillis() || Date.now()
            } as ChatMessage);
          });
          setMessages(msgs);
          setError(null);
        }, (err) => {
          handleFirestoreError(err, OperationType.GET, 'chat_messages');
        });
      } else {
        setUser(null);
        setMessages([]);
        if (unsubscribeMessages) {
          unsubscribeMessages();
          unsubscribeMessages = null;
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeMessages) unsubscribeMessages();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!inputValue.trim()) return;
    if (!user) {
      setError("You must be logged in to chat");
      return;
    }

    if (cooldown > 0) {
      setError(`Please wait ${cooldown}s before sending another message`);
      return;
    }

    try {
      const now = Date.now();
      const lastMessageAt = user.lastMessageAt || 0;
      
      if (now - lastMessageAt < 30000) {
        const remaining = Math.ceil((30000 - (now - lastMessageAt)) / 1000);
        setCooldown(remaining);
        setError(`Rate limit: Please wait ${remaining}s`);
        return;
      }

      try {
        await addDoc(collection(db, 'chat_messages'), {
          uid: user.uid,
          user: user.username,
          text: inputValue,
          timestamp: serverTimestamp(),
          color: user.color
        });

        await updateDoc(doc(db, 'users', user.uid), {
          lastMessageAt: now
        });

        setInputValue('');
        setCooldown(30);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'chat_messages/users');
      }
    } catch (err: any) {
      console.error("Send error:", err);
      setError(err.message || "Failed to send message");
    }
  };

  return (
    <div className="forum-container rounded-lg overflow-hidden flex flex-col h-[400px] border border-white/5 bg-ng-dark/95">
      {/* Chat Header */}
      <div className="glossy-blue p-3 flex items-center justify-between shadow-lg">
        <h3 className="text-white font-bold uppercase tracking-widest flex items-center gap-2 text-xs">
          <MessageSquare className="w-3.5 h-3.5" />
          Legacy Gaming Global Chat
        </h3>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[9px] text-white/70 font-bold uppercase tracking-widest">Online</span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5 scrollbar-thin scrollbar-thumb-white/10">
        <AnimatePresence initial={false}>
          {user ? (
            messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-baseline gap-1.5 group"
              >
                <span 
                  className={`text-[10px] italic uppercase tracking-tighter shrink-0 ${msg.uid === user?.uid ? 'font-black' : 'font-bold'}`} 
                  style={{ color: msg.color }}
                >
                  {msg.user}:
                </span>
                <span className="text-[11px] leading-tight break-words" style={{ color: msg.color }}>
                  {msg.text}
                </span>
                <span className="text-[8px] text-gray-700 font-bold uppercase tracking-widest ml-auto opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  {formatTime(msg.timestamp)}
                </span>
              </motion.div>
            ))
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 gap-3">
              <MessageSquare className="w-8 h-8 text-gray-700" />
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest leading-relaxed">
                Please log in to view and participate in the global chat.
              </p>
            </div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Error/Cooldown Info */}
      <AnimatePresence>
        {(error || cooldown > 0) && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={`px-3 py-1 text-[9px] font-bold uppercase tracking-widest flex items-center gap-2 ${error ? 'bg-red-500/20 text-red-500' : 'bg-ng-blue/20 text-ng-blue'}`}
          >
            <AlertCircle className="w-3 h-3" />
            {error || `Cooldown: ${cooldown}s`}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="relative" ref={pickerRef}>
        <AnimatePresence>
          {showEmojiPicker && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute bottom-full right-0 mb-4 z-50 shadow-2xl"
            >
              <EmojiPicker
                onEmojiClick={onEmojiClick}
                theme={Theme.DARK}
                lazyLoadEmojis={true}
                width={300}
                height={400}
                skinTonesDisabled
                searchDisabled={false}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSendMessage} className="p-4 bg-black/40 border-t border-white/5 flex gap-2">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            disabled={!user}
            className={`p-2 rounded transition-all hover:bg-white/5 ${showEmojiPicker ? 'text-ng-blue' : 'text-gray-500 hover:text-white'} disabled:opacity-50`}
            title="Add Emoji"
          >
            <Smile className="w-4 h-4" />
          </button>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={user ? "Type a message..." : "Login to chat"}
            disabled={!user}
            className="flex-1 bg-black/60 border border-white/10 rounded px-4 py-2 text-xs text-white focus:outline-none focus:border-ng-blue/50 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || !user || cooldown > 0}
            className="p-2 glossy-blue rounded text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:brightness-110"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
