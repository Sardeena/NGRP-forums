import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { ForumCategory } from './components/ForumCategory';
import { Sidebar } from './components/Sidebar';
import { motion, AnimatePresence } from 'motion/react';
import { View, Thread, UserProfile } from './types';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { SearchView } from './components/views/SearchView';
import { collection, query, orderBy, onSnapshot, doc, getDocs, addDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './lib/firestore-errors';
import { ForumCategory as ForumCategoryType, News, Event, ServerStats } from './types';

// Views
import { HomeView } from './components/views/HomeView';
import { UCPView } from './components/views/UCPView';
import { ServerInfoView } from './components/views/ServerInfoView';
import { DonateView } from './components/views/DonateView';
import { SupportView } from './components/views/SupportView';
import { FormsView } from './components/views/FormsView';
import { ForumDetailView } from './components/views/ForumDetailView';
import { ThreadView } from './components/views/ThreadView';
import { ProfileView } from './components/views/ProfileView';

const forumData = []; // Removed static data

export default function App() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [forumCategories, setForumCategories] = useState<ForumCategoryType[]>([]);
  const [selectedForum, setSelectedForum] = useState<string | null>(null);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [selectedThreadTitle, setSelectedThreadTitle] = useState<string | null>(null);
  const [isThreadLocked, setIsThreadLocked] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [threads, setThreads] = useState<Thread[]>([]); // For sidebar/starred
  const [selectedFormType, setSelectedFormType] = useState<string | null>(null);

  // Real-time forum stats calculation
  const processedCategories = useMemo(() => {
    return forumCategories.map(category => ({
      ...category,
      forums: category.forums.map(forum => {
        const forumThreads = threads.filter(t => t.subForum === forum.name);
        const lastThread = forumThreads[0]; // threads are ordered by createdAt desc
        return {
          ...forum,
          topics: forumThreads.length,
          lastPost: lastThread ? {
            user: lastThread.lastPost?.user || lastThread.author,
            time: new Date(lastThread.lastPost?.timestamp || lastThread.createdAt).toLocaleString(),
            thread: lastThread.title
          } : forum.lastPost
        };
      })
    }));
  }, [forumCategories, threads]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Fetch user profile from Firestore
        const unsubscribeProfile = onSnapshot(doc(db, 'users', firebaseUser.uid), (docSnap) => {
          if (docSnap.exists()) {
            setUser(docSnap.data() as UserProfile);
          } else {
            console.warn("User profile not found in Firestore");
            setUser(null);
          }
          setLoading(false);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
          setLoading(false);
        });

        return () => unsubscribeProfile();
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Fetch forum categories
  useEffect(() => {
    const q = query(collection(db, 'forum_categories'), orderBy('order', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const categories: ForumCategoryType[] = [];
      snapshot.forEach((doc) => {
        categories.push({ id: doc.id, ...doc.data() } as ForumCategoryType);
      });
      setForumCategories(categories);
      
      // Seed data if empty
      if (snapshot.empty) {
        seedInitialData();
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch threads for sidebar/starred
  useEffect(() => {
    const q = query(collection(db, 'threads'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedThreads: Thread[] = [];
      snapshot.forEach((doc) => {
        fetchedThreads.push({ id: doc.id, ...doc.data() } as Thread);
      });
      setThreads(fetchedThreads);
    });
    return () => unsubscribe();
  }, []);

  const seedInitialData = async () => {
    console.log("Seeding initial data...");
    
    // Seed Forum Categories
    const initialForums = [
      {
        title: "Announcements",
        order: 1,
        forums: [
          {
            name: "News & Updates",
            description: "Official news and updates regarding the Reckless RP community.",
            topics: 54,
            lastPost: { user: "AdminJohn", time: "Today, 10:45 AM", thread: "Server Update 3.1.5" },
            subForums: ["Archive", "Press Releases"]
          }
        ]
      },
      {
        title: "Server Information",
        order: 2,
        forums: [
          {
            name: "Server Rules & Guides",
            description: "Everything you need to know about playing on our server.",
            topics: 32,
            lastPost: { user: "ModRay", time: "Yesterday, 5:30 PM", thread: "Server Rules" },
            subForums: ["New Player Guide", "FAQ"]
          }
        ]
      },
      {
        title: "General Discussion",
        order: 3,
        forums: [
          {
            name: "Community Chat",
            description: "Talk about anything and everything here.",
            topics: 124,
            lastPost: { user: "MaxSteve", time: "Today, 07:00 AM", thread: "Apple Balls" },
            subForums: ["Off-Topic", "Media"]
          },
          {
            name: "Factions",
            description: "Official and unofficial faction discussion.",
            topics: 78,
            lastPost: { user: "OfficerBoy", time: "Today, 07:00 AM", thread: "LSPD Roster" },
            subForums: ["LSPD", "LSFD", "Government"]
          },
          {
            name: "Gangs",
            description: "The underworld of San Andreas.",
            topics: 65,
            lastPost: { user: "GamerBoy", time: "Today, 07:00 AM", thread: "Aztec HQS" },
            subForums: ["Gang Applications", "Gang Media"]
          }
        ]
      },
      {
        title: "Marketplace",
        order: 4,
        forums: [
          {
            name: "Classifieds & Trades",
            description: "Buy, sell, or trade your in-game assets.",
            topics: 89,
            lastPost: { user: "RichGuy", time: "Today, 11:15 AM", thread: "Selling House" },
            subForums: ["Real Estate", "Vehicles", "Services"]
          }
        ]
      }
    ];

    for (const cat of initialForums) {
      await addDoc(collection(db, 'forum_categories'), cat);
    }

    // Seed News
    await addDoc(collection(db, 'news'), {
      title: "SUMMER TURF WARS EVENT",
      excerpt: "The heat is rising in Los Santos! Join the city-wide turf war event starting this weekend. Double XP and unique rewards for all participants.",
      imageUrl: "https://picsum.photos/seed/gtasa/1200/600",
      author: "AdminJohn",
      date: "Mar 24, 2026",
      isFeatured: true,
      timestamp: Date.now()
    });

    // Seed Events
    const initialEvents = [
      { title: "LS Drag Racing Championship", date: "Mar 28, 2026", time: "20:00 Server Time", location: "LS Airport", timestamp: Date.now() + 86400000 },
      { title: "Community Town Hall Meeting", date: "Mar 30, 2026", time: "18:00 Server Time", location: "TS3 / Discord", timestamp: Date.now() + 259200000 },
      { title: "Easter Egg Hunt 2026", date: "Apr 05, 2026", time: "All Day", location: "All San Andreas", timestamp: Date.now() + 777600000 }
    ];

    for (const ev of initialEvents) {
      await addDoc(collection(db, 'events'), ev);
    }

    // Seed Server Stats
    await setDoc(doc(db, 'server_stats', 'global'), {
      status: "Online",
      playersOnline: 124,
      maxPlayers: 500,
      version: "v3.1.5"
    });

    // Seed Forum Stats
    await setDoc(doc(db, 'forum_stats', 'global'), {
      totalPosts: 1245672,
      totalTopics: 84210,
      totalMembers: 42105,
      newestMember: "GamerX99",
      discordMembersOnline: 1240
    });
  };

  // Increment profile views
  useEffect(() => {
    if (currentView === 'profile' && user) {
      const userRef = doc(db, 'users', user.uid);
      updateDoc(userRef, {
        profileViews: increment(1)
      }).catch(err => console.error("Error incrementing profile views:", err));
    }
  }, [currentView, user?.uid]);

  const handleForumClick = (name: string) => {
    setSelectedForum(name);
    setCurrentView('forum-detail');
  };

  const handleViewChange = (view: View) => {
    setCurrentView(view);
    if (view === 'forums') setSelectedForum(null);
    if (view !== 'search') setSearchQuery("");
    if (view !== 'forms') setSelectedFormType(null);
    window.scrollTo(0, 0);
  };

  const handleFormSelect = (form: string) => {
    setSelectedFormType(form);
  };

  const handleThreadClick = (id: string, title: string, isLocked: boolean) => {
    setSelectedThreadId(id);
    setSelectedThreadTitle(title);
    setIsThreadLocked(isLocked);
    setCurrentView('thread-view');
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentView('search');
  };

  const starredThreads = threads.filter(t => t.likes?.includes(user?.uid || ''));

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <HomeView />;
      case 'forums':
        return (
          <div className="flex flex-col">
            {processedCategories.map((category) => (
              <ForumCategory 
                key={category.id} 
                {...category} 
                onForumClick={handleForumClick}
              />
            ))}
          </div>
        );
      case 'forum-detail':
        return (
          <ForumDetailView 
            key={selectedForum || 'forum-detail'}
            forumName={selectedForum || 'Forum'} 
            user={user}
            onBack={() => setCurrentView('forums')} 
            onThreadClick={handleThreadClick}
            selectedThreadId={selectedThreadId}
          />
        );
      case 'thread-view':
        return (
          <ThreadView 
            key={selectedThreadId || 'thread-view'}
            threadId={selectedThreadId || ''}
            forumName={selectedForum || 'Forum'}
            user={user}
            onBack={() => setCurrentView('forum-detail')} 
          />
        );
      case 'search':
        return (
          <SearchView 
            key={searchQuery || 'search'}
            searchQuery={searchQuery}
            onThreadClick={handleThreadClick}
          />
        );
      case 'ucp':
        return <UCPView user={user} />;
      case 'server-info':
        return <ServerInfoView />;
      case 'donate':
        return <DonateView />;
      case 'support':
        return <SupportView user={user} />;
      case 'forms':
        return (
          <FormsView 
            key={selectedFormType || 'forms'}
            selectedFormType={selectedFormType as any}
            user={user}
          />
        );
      case 'profile':
        return (
          <ProfileView 
            user={user}
            starredThreads={starredThreads}
            onThreadClick={handleThreadClick}
            selectedThreadId={selectedThreadId}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center">
      <div className="w-full max-w-7xl flex flex-col shadow-2xl bg-black/20">
        <Header 
          currentView={currentView} 
          onViewChange={handleViewChange}
          onSearch={handleSearch}
          onFormSelect={handleFormSelect}
          user={user}
          loading={loading}
        />
        
        <main className="p-4 md:p-8 flex flex-col lg:flex-row gap-8">
          {/* Main Content Area */}
          <motion.div 
            key={currentView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex-grow flex flex-col"
          >
            <AnimatePresence mode="wait">
              {renderView()}
            </AnimatePresence>
          </motion.div>

          {/* Sidebar */}
          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="hidden lg:block w-80"
          >
            <Sidebar 
              starredThreads={starredThreads}
              onThreadClick={handleThreadClick}
              selectedThreadId={selectedThreadId}
            />
          </motion.aside>
        </main>

        <footer className="w-full bg-black/40 border-t border-white/5 p-8 flex flex-col items-center gap-4 text-gray-500 text-xs">
          <div className="flex gap-6">
            <span className="hover:text-white cursor-pointer">Contact Us</span>
            <span className="hover:text-white cursor-pointer">Reckless RP</span>
            <span className="hover:text-white cursor-pointer">Privacy Policy</span>
          </div>
          <div className="text-center flex flex-col gap-1">
            <p>Powered by Invision Power Board © 2026 Reckless RP</p>
            <p className="text-[10px] opacity-50 uppercase tracking-widest">Driven by Passion</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
