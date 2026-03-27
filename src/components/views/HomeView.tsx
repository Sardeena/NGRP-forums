import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Megaphone, Calendar, Zap, ChevronRight, Clock, User, Newspaper } from 'lucide-react';
import { GlobalChat } from '../GlobalChat';
import { ActivityFeed } from '../ActivityFeed';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import { News, Event } from '../../types';

export const HomeView: React.FC = () => {
  const [news, setNews] = useState<News[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);

  useEffect(() => {
    const newsQuery = query(collection(db, 'news'), orderBy('timestamp', 'desc'), limit(5));
    const unsubscribeNews = onSnapshot(newsQuery, (snapshot) => {
      const fetchedNews: News[] = [];
      snapshot.forEach((doc) => {
        fetchedNews.push({ id: doc.id, ...doc.data() } as News);
      });
      setNews(fetchedNews);
    });

    const eventsQuery = query(collection(db, 'events'), orderBy('timestamp', 'asc'), limit(5));
    const unsubscribeEvents = onSnapshot(eventsQuery, (snapshot) => {
      const fetchedEvents: Event[] = [];
      snapshot.forEach((doc) => {
        fetchedEvents.push({ id: doc.id, ...doc.data() } as Event);
      });
      setEvents(fetchedEvents);
    });

    return () => {
      unsubscribeNews();
      unsubscribeEvents();
    };
  }, []);

  useEffect(() => {
    if (news.length === 0) return;
    const timer = setInterval(() => {
      setCurrentNewsIndex((prev) => (prev + 1) % news.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [news.length]);

  const featuredNews = news[currentNewsIndex];

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Featured News Slider */}
      <div className="relative h-64 md:h-80 rounded-lg overflow-hidden shadow-2xl group border border-white/10">
        <AnimatePresence mode="wait">
          {featuredNews ? (
            <motion.div
              key={featuredNews.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0"
            >
              <img 
                src={featuredNews.imageUrl || "https://picsum.photos/seed/gtasa/1200/600"} 
                alt={featuredNews.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-end p-8">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 bg-ng-blue text-[10px] font-bold uppercase tracking-widest rounded">Featured</span>
                  <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {featuredNews.date}
                  </span>
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-white italic tracking-tighter drop-shadow-lg mb-2 uppercase">
                  {featuredNews.title}
                </h2>
                <p className="text-sm text-gray-300 max-w-2xl line-clamp-2">
                  {featuredNews.excerpt}
                </p>
              </div>
            </motion.div>
          ) : (
            <div className="absolute inset-0 bg-ng-dark flex items-center justify-center">
              <span className="text-gray-500 animate-pulse uppercase tracking-widest font-bold text-xs">Loading News...</span>
            </div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Activity Feed */}
        <div className="flex flex-col gap-4">
          <ActivityFeed />
        </div>

        {/* Global Chat */}
        <div className="flex flex-col gap-4">
          <GlobalChat />
        </div>

        {/* Upcoming Events */}
        <div className="flex flex-col gap-4">
          <div className="glossy-blue p-3 rounded shadow-lg flex items-center justify-between">
            <h3 className="text-white font-bold uppercase tracking-widest flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4" />
              Upcoming Events
            </h3>
            <span className="text-[10px] text-white/50 hover:text-white cursor-pointer uppercase tracking-widest font-bold transition-colors">Calendar</span>
          </div>
          <div className="flex flex-col gap-3">
            {events.length > 0 ? events.map((event) => (
              <EventItem 
                key={event.id}
                title={event.title} 
                date={event.date} 
                time={event.time} 
                location={event.location}
              />
            )) : (
              <div className="p-8 text-center text-gray-500 text-xs italic bg-ng-dark/40 rounded border border-white/5">
                No upcoming events.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const EventItem: React.FC<{ title: string; date: string; time: string; location: string }> = ({ title, date, time, location }) => (
  <div className="forum-container rounded overflow-hidden p-5 bg-ng-dark/95 border border-white/5 flex items-center gap-5 hover:bg-white/5 transition-colors cursor-pointer">
    <div className="flex flex-col items-center justify-center min-w-[60px] h-[60px] bg-black/40 rounded border border-white/5">
      <span className="text-[10px] text-ng-blue font-bold uppercase tracking-widest">{date.split(' ')[0]}</span>
      <span className="text-xl font-black text-white italic">{date.split(' ')[1]?.replace(',', '') || ''}</span>
    </div>
    <div className="flex flex-col gap-1">
      <h4 className="text-sm font-bold text-white">{title}</h4>
      <div className="flex items-center gap-3 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {time}</span>
        <span className="flex items-center gap-1"><Megaphone className="w-3 h-3" /> {location}</span>
      </div>
    </div>
  </div>
);
