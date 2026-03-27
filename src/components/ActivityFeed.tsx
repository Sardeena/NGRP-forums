import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Activity } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, FileText, User, Clock } from 'lucide-react';

export const ActivityFeed: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, 'activities'),
      orderBy('timestamp', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const acts: Activity[] = [];
      snapshot.forEach((doc) => {
        acts.push({ id: doc.id, ...doc.data() } as Activity);
      });
      setActivities(acts);
    });

    return () => unsubscribe();
  }, []);

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'new_thread':
        return <FileText className="w-4 h-4 text-blue-400" />;
      case 'reply':
        return <MessageSquare className="w-4 h-4 text-green-400" />;
      case 'profile_update':
        return <User className="w-4 h-4 text-purple-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getActivityText = (activity: Activity) => {
    switch (activity.type) {
      case 'new_thread':
        return (
          <>
            <span className="font-bold text-white">{activity.user}</span> created a new thread:{' '}
            <span className="text-blue-400 italic">"{activity.targetTitle}"</span>
          </>
        );
      case 'reply':
        return (
          <>
            <span className="font-bold text-white">{activity.user}</span> replied to:{' '}
            <span className="text-green-400 italic">"{activity.targetTitle}"</span>
          </>
        );
      case 'profile_update':
        return (
          <>
            <span className="font-bold text-white">{activity.user}</span> updated their profile
          </>
        );
      default:
        return null;
    }
  };

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="forum-container rounded-lg overflow-hidden shadow-xl mb-6">
      <div className="glossy-blue p-3 flex items-center gap-2">
        <Clock className="text-white w-5 h-5" />
        <h3 className="text-white font-bold uppercase tracking-widest text-sm">Recent Activity</h3>
      </div>
      <div className="bg-ng-dark/95 p-4">
        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {activities.length > 0 ? (
              activities.map((activity) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-start gap-3 border-b border-white/5 pb-3 last:border-0 last:pb-0"
                >
                  <div className="mt-1 p-1.5 bg-white/5 rounded-full">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-300 leading-relaxed">
                      {getActivityText(activity)}
                    </p>
                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter mt-1 block">
                      {formatTime(activity.timestamp)}
                    </span>
                  </div>
                </motion.div>
              ))
            ) : (
              <p className="text-xs text-gray-500 italic text-center py-4">No recent activity to show.</p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
