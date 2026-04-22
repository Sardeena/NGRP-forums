import React, { useState, useEffect, useMemo } from 'react';
import { MessageSquare, User, Clock, ChevronRight, Pin, Lock, ArrowUpDown, Plus, X, AlertCircle, Star, Bell, BellOff, ThumbsUp, Type, Italic, Underline, Palette, Image as ImageIcon, Video, Link as LinkIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Thread, UserProfile } from '../../types';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, getDoc, increment, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../../firebase';

interface ForumDetailViewProps {
  forumName: string;
  user: UserProfile | null;
  onBack: () => void;
  onThreadClick: (threadId: string, threadTitle: string, isLocked: boolean) => void;
  selectedThreadId?: string | null;
}

type SortOption = 'lastPost' | 'views' | 'replies' | 'createdNewest' | 'createdOldest';

const SUB_FORUMS = ["Announcements", "General", "Factions", "Government", "Marketplace", "Bugs", "Events", "Guides", "Suggestions"];

export const ForumDetailView: React.FC<ForumDetailViewProps> = ({ forumName, user, onBack, onThreadClick, selectedThreadId }) => {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('lastPost');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreatingTopic, setIsCreatingTopic] = useState(false);
  const [topicTitle, setTopicTitle] = useState("");
  const [topicContent, setTopicContent] = useState("");
  const [selectedSubForum, setSelectedSubForum] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const pageSize = 10;

  const renderContent = (content: string) => {
    let processed = content;
    
    // Basic formatting
    processed = processed.replace(/\[b\](.*?)\[\/b\]/g, '<strong>$1</strong>');
    processed = processed.replace(/\[i\](.*?)\[\/i\]/g, '<em>$1</em>');
    processed = processed.replace(/\[u\](.*?)\[\/u\]/g, '<u>$1</u>');
    
    // Color
    processed = processed.replace(/\[color=(.*?)\](.*?)\[\/color\]/g, '<span style="color: $1">$2</span>');
    
    // Links
    processed = processed.replace(/\[url=(.*?)\](.*?)\[\/url\]/g, '<a href="$1" target="_blank" class="text-ng-blue hover:underline font-bold">$2</a>');
    processed = processed.replace(/\[url\](.*?)\[\/url\]/g, '<a href="$1" target="_blank" class="text-ng-blue hover:underline font-bold">$1</a>');
    
    // Images
    processed = processed.replace(/\[img\](.*?)\[\/img\]/g, '<img src="$1" class="max-w-full h-auto rounded-lg my-4 shadow-lg border border-white/10" referrerPolicy="no-referrer" />');
    
    // Videos
    processed = processed.replace(/\[video\](.*?)\[\/video\]/g, (match, url) => {
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const videoId = url.split('v=')[1] || url.split('/').pop();
        return `<div class="aspect-video my-4 rounded-lg overflow-hidden shadow-lg border border-white/10"><iframe width="100%" height="100%" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe></div>`;
      }
      return `<video src="${url}" controls class="max-w-full h-auto rounded-lg my-4 shadow-lg border border-white/10"></video>`;
    });

    return <div dangerouslySetInnerHTML={{ __html: processed.replace(/\n/g, '<br />') }} />;
  };

  useEffect(() => {
    setLoading(true);
    // We fetch all threads for now and filter client-side to handle the "sub-forum" logic 
    // which might be nested or just a field.
    const q = query(collection(db, 'threads'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedThreads: Thread[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as Thread;
        // Basic filtering: if it belongs to this forum category or the specific sub-forum
        // In a real app, you'd have more robust category/subforum mapping
        if (data.subForum === forumName || (selectedSubForum && data.subForum === selectedSubForum) || (!selectedSubForum && SUB_FORUMS.includes(data.subForum))) {
           fetchedThreads.push({ id: doc.id, ...data } as Thread);
        }
      });
      setThreads(fetchedThreads);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching threads:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [forumName, selectedSubForum]);

  const sortedThreads = useMemo(() => {
    return [...threads].sort((a, b) => {
      // Pinned threads always at top
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      if (sortBy === 'lastPost') return (b.lastPost?.timestamp || 0) - (a.lastPost?.timestamp || 0);
      if (sortBy === 'views') return (b.views || 0) - (a.views || 0);
      if (sortBy === 'replies') return (b.replies || 0) - (a.replies || 0);
      if (sortBy === 'createdNewest') return (b.createdAt || 0) - (a.createdAt || 0);
      if (sortBy === 'createdOldest') return (a.createdAt || 0) - (b.createdAt || 0);
      return 0;
    });
  }, [threads, sortBy]);

  const paginatedThreads = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedThreads.slice(start, start + pageSize);
  }, [sortedThreads, currentPage]);

  const totalPages = Math.ceil(sortedThreads.length / pageSize);

  const handleCreateTopic = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    if (!topicTitle.trim() || !topicContent.trim()) return;

    try {
      const now = Date.now();
      const threadData = {
        title: topicTitle,
        content: topicContent,
        author: user.username,
        authorUid: user.uid,
        replies: 0,
        views: 0,
        lastPost: {
          user: user.username,
          uid: user.uid,
          timestamp: now
        },
        isPinned: false,
        isLocked: false,
        subForum: selectedSubForum || forumName,
        createdAt: now
      };

      const docRef = await addDoc(collection(db, 'threads'), threadData);
      
      // Update forum stats
      await updateDoc(doc(db, 'forum_stats', 'global'), {
        totalTopics: increment(1)
      });
      
      // Log activity
      await addDoc(collection(db, 'activities'), {
        type: 'new_thread',
        user: user.username,
        uid: user.uid,
        targetId: docRef.id,
        targetTitle: topicTitle,
        timestamp: now
      });

      setIsCreatingTopic(false);
      setTopicTitle("");
      setTopicContent("");
    } catch (error) {
      console.error('Error creating topic:', error);
    }
  };

  const toggleAction = async (e: React.MouseEvent, threadId: string, field: string, value: any) => {
    e.stopPropagation();
    if (!user || (user.role !== 'admin' && user.role !== 'moderator')) return;
    try {
      await updateDoc(doc(db, 'threads', threadId), { [field]: value });
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
    }
  };

  const handleToggleLike = async (e: React.MouseEvent, threadId: string) => {
    e.stopPropagation();
    if (!user) return;
    const thread = threads.find(t => t.id === threadId);
    if (!thread) return;

    const hasLiked = thread.likes?.includes(user.uid);
    const ref = doc(db, 'threads', threadId);

    try {
      await updateDoc(ref, {
        likes: hasLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
      });
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumbs & Action */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
          <span className="hover:text-white cursor-pointer transition-colors" onClick={onBack}>Forums</span>
          <ChevronRight className="w-3 h-3" />
          <span 
            className={`cursor-pointer transition-colors ${selectedSubForum ? 'hover:text-white' : 'text-ng-blue'}`}
            onClick={() => { setSelectedSubForum(null); setCurrentPage(1); }}
          >
            {forumName}
          </span>
          {selectedSubForum && (
            <>
              <ChevronRight className="w-3 h-3" />
              <span className="text-ng-blue">{selectedSubForum}</span>
            </>
          )}
        </div>
        {user && (
          <button 
            onClick={() => setIsCreatingTopic(true)}
            className="bg-ng-blue hover:bg-blue-500 text-white text-[10px] font-bold uppercase px-6 py-2 rounded shadow-lg flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" /> Start New Topic
          </button>
        )}
      </div>

      {/* Sub-Forums Section */}
      <div className="forum-container rounded-lg overflow-hidden">
        <div className="glossy-blue px-4 py-2 text-[10px] font-bold text-white uppercase tracking-widest flex items-center gap-2">
          <MessageSquare className="w-3.5 h-3.5" /> Sub-Forums
        </div>
        <div className="p-4 bg-ng-dark/40 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <button
            onClick={() => { setSelectedSubForum(null); setCurrentPage(1); }}
            className={`text-left px-3 py-2 rounded border transition-all text-[10px] font-bold uppercase tracking-wider flex items-center gap-2
              ${!selectedSubForum 
                ? 'bg-ng-blue/20 border-ng-blue text-white shadow-[0_0_10px_rgba(0,163,255,0.2)]' 
                : 'bg-black/20 border-white/5 text-gray-400 hover:border-white/20 hover:text-white hover:bg-white/5'
              }
            `}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${!selectedSubForum ? 'bg-ng-blue animate-pulse' : 'bg-gray-600'}`} />
            All Threads
          </button>
          {SUB_FORUMS.map((sub) => (
            <button
              key={sub}
              onClick={() => { setSelectedSubForum(sub); setCurrentPage(1); }}
              className={`text-left px-3 py-2 rounded border transition-all text-[10px] font-bold uppercase tracking-wider flex items-center gap-2
                ${selectedSubForum === sub 
                  ? 'bg-ng-blue/20 border-ng-blue text-white shadow-[0_0_10px_rgba(0,163,255,0.2)]' 
                  : 'bg-black/20 border-white/5 text-gray-400 hover:border-white/20 hover:text-white hover:bg-white/5'
                }
              `}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${selectedSubForum === sub ? 'bg-ng-blue animate-pulse' : 'bg-gray-600'}`} />
              {sub}
            </button>
          ))}
        </div>
      </div>

      <div className="forum-container rounded-lg overflow-hidden">
        <div className="glossy-blue px-4 py-3 flex flex-col md:flex-row justify-between items-center gap-4">
          <h2 className="font-bold text-white tracking-wide uppercase text-sm drop-shadow-md">
            {selectedSubForum || forumName}
          </h2>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-black/40 rounded-lg p-1 border border-white/10 shadow-inner">
              <span className="text-[10px] font-black italic text-white/30 uppercase tracking-tighter px-3 flex items-center gap-2 border-r border-white/5 mr-1">
                <ArrowUpDown className="w-3.5 h-3.5" /> Sort By
              </span>
              <div className="flex gap-1">
                {(['lastPost', 'views', 'replies', 'createdNewest'] as SortOption[]).map((option) => (
                  <button
                    key={option}
                    onClick={() => { setSortBy(option); setCurrentPage(1); }}
                    className={`text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-md transition-all flex items-center gap-2
                      ${sortBy === option 
                        ? 'bg-ng-blue text-white shadow-[0_0_15px_rgba(0,163,255,0.4)] border border-white/20' 
                        : 'text-white/40 hover:text-white hover:bg-white/5 border border-transparent'
                      }`}
                  >
                    {option === 'lastPost' ? 'Recent' : option === 'createdNewest' ? 'Newest' : option}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-ng-dark/40 min-h-[400px] relative">
          <div className="hidden md:flex items-center px-4 py-2 bg-black/40 border-b border-white/5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
            <div className="flex-grow">Topic</div>
            <div className="w-24 text-center">Created</div>
            <div className="w-24 text-center">Stats</div>
            <div className="w-48 pl-4">Last Post Info</div>
          </div>

          {loading ? (
            <div className="text-white text-center py-20 font-bold uppercase tracking-widest animate-pulse">Loading Topics...</div>
          ) : paginatedThreads.length > 0 ? (
            paginatedThreads.map((thread) => (
              <div 
                key={thread.id} 
                onClick={() => onThreadClick(thread.id, thread.title, !!thread.isLocked)}
                className={`flex flex-col md:flex-row items-center p-4 gap-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-all cursor-pointer group relative
                  ${thread.isPinned ? 'bg-yellow-500/5' : ''}
                  ${thread.isLocked ? 'bg-red-500/5' : ''}
                  ${selectedThreadId === thread.id ? 'bg-ng-blue/10 border-l-2 border-l-ng-blue' : ''}
                `}
              >
                <div className="flex-shrink-0 relative z-10">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-300
                    ${thread.isPinned 
                      ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-500' 
                      : thread.isLocked 
                        ? 'bg-red-500/20 border-red-500/50 text-red-500'
                        : 'bg-ng-blue/10 border-ng-blue/40 text-ng-blue'
                    }
                  `}>
                    {thread.isLocked ? <Lock className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                  </div>
                </div>

                <div className="flex-grow min-w-0 relative z-10">
                  <div className="flex items-center gap-2 mb-1">
                    {thread.isPinned && (
                      <span className="bg-yellow-500/20 text-yellow-500 text-[8px] font-bold uppercase px-1.5 py-0.5 rounded border border-yellow-500/20 flex items-center gap-1">
                        <Pin className="w-2 h-2" /> Pinned
                      </span>
                    )}
                    {thread.isLocked && (
                      <span className="bg-red-500/20 text-red-500 text-[8px] font-bold uppercase px-1.5 py-0.5 rounded border border-red-500/20 flex items-center gap-1">
                        <Lock className="w-2 h-2" /> Locked
                      </span>
                    )}
                  </div>
                  <h3 className={`font-bold text-lg group-hover:text-ng-blue transition-colors truncate ${thread.isPinned ? 'text-yellow-100' : 'text-gray-200'}`}>
                    {thread.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    <span>By <span className="text-ng-blue">{thread.author}</span></span>
                    <span>•</span>
                    <span>{thread.subForum}</span>
                  </div>
                </div>

                <div className="hidden md:flex flex-col items-center w-24 text-center relative z-10">
                  <span className="text-[10px] font-bold text-gray-300">{new Date(thread.createdAt).toLocaleDateString()}</span>
                  <span className="text-[8px] uppercase text-gray-500 font-bold">Posted</span>
                </div>

                <div className="hidden md:flex flex-col items-center w-24 text-center relative z-10">
                  <span className="text-sm font-bold text-gray-200">{thread.replies || 0}</span>
                  <span className="text-[8px] uppercase text-gray-500 font-bold">Replies</span>
                </div>

                <div className="hidden md:flex flex-col items-center w-24 text-center relative z-10">
                  <button 
                    onClick={(e) => handleToggleLike(e, thread.id)}
                    className={`flex flex-col items-center transition-colors ${thread.likes?.includes(user?.uid || '') ? 'text-ng-blue' : 'text-gray-500 hover:text-white'}`}
                  >
                    <ThumbsUp className={`w-4 h-4 mb-1 ${thread.likes?.includes(user?.uid || '') ? 'fill-ng-blue' : ''}`} />
                    <span className="text-sm font-bold">{thread.likes?.length || 0}</span>
                    <span className="text-[8px] uppercase font-bold">Likes</span>
                  </button>
                </div>

                <div className="hidden md:flex flex-col w-48 text-xs text-gray-400 border-l border-white/5 pl-4 relative z-10">
                  <div className="flex items-center gap-2">
                    <img 
                      src={`https://picsum.photos/seed/${thread.lastPost?.uid}/32/32`} 
                      alt={thread.lastPost?.user}
                      className="w-8 h-8 rounded-full border border-white/10 shadow-lg"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex flex-col">
                      <span className="text-ng-blue font-bold hover:underline">{thread.lastPost?.user}</span>
                      <span className="text-[10px] text-gray-500">{new Date(thread.lastPost?.timestamp || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-[400px] text-center p-8">
              <AlertCircle className="w-10 h-10 text-gray-600 mb-4" />
              <h3 className="text-xl font-black italic text-white uppercase tracking-tighter mb-2">No Topics Found</h3>
              <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Be the first to start a conversation!</p>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button 
              key={p} 
              onClick={() => setCurrentPage(p)}
              className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold border transition-all ${p === currentPage ? 'glossy-blue text-white border-white/20 shadow-lg' : 'bg-black/40 text-gray-500 border-white/5 hover:border-white/20 hover:text-white'}`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* New Topic Modal */}
      <AnimatePresence>
        {isCreatingTopic && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-lg forum-container rounded-lg overflow-hidden shadow-2xl"
            >
              <div className="glossy-blue px-6 py-4 flex justify-between items-center">
                <h3 className="text-white font-black italic uppercase tracking-tighter text-lg">Start New Topic</h3>
                <button onClick={() => setIsCreatingTopic(false)} className="text-white/50 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreateTopic} className="p-8 bg-ng-dark/95 flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Topic Title</label>
                  <input 
                    name="title"
                    value={topicTitle}
                    onChange={(e) => setTopicTitle(e.target.value)}
                    required
                    className="w-full bg-black/40 border border-white/10 rounded px-4 py-3 text-sm text-white focus:outline-none focus:border-ng-blue/50"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Initial Post</label>
                  <div className="flex gap-2 mb-1">
                    <button 
                      type="button"
                      onClick={() => setTopicContent(prev => prev + '[b][/b]')}
                      className="p-1.5 bg-white/5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                      title="Bold"
                    >
                      <Type className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      type="button"
                      onClick={() => setTopicContent(prev => prev + '[i][/i]')}
                      className="p-1.5 bg-white/5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                      title="Italic"
                    >
                      <Italic className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      type="button"
                      onClick={() => setTopicContent(prev => prev + '[u][/u]')}
                      className="p-1.5 bg-white/5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                      title="Underline"
                    >
                      <Underline className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      type="button"
                      onClick={() => setTopicContent(prev => prev + '[color=#00a3ff][/color]')}
                      className="p-1.5 bg-white/5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                      title="Text Color"
                    >
                      <Palette className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      type="button"
                      onClick={() => setTopicContent(prev => prev + '[img][/img]')}
                      className="p-1.5 bg-white/5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                      title="Embed Image"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      type="button"
                      onClick={() => setTopicContent(prev => prev + '[video][/video]')}
                      className="p-1.5 bg-white/5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                      title="Embed Video"
                    >
                      <Video className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      type="button"
                      onClick={() => setTopicContent(prev => prev + '[url=][/url]')}
                      className="p-1.5 bg-white/5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                      title="Insert Link"
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <textarea 
                    name="content"
                    value={topicContent}
                    onChange={(e) => setTopicContent(e.target.value)}
                    required
                    className="w-full bg-black/40 border border-white/10 rounded p-4 text-sm text-white focus:outline-none focus:border-ng-blue/50 min-h-[150px]"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full py-3 glossy-blue text-white font-bold uppercase tracking-widest text-[10px] rounded shadow-lg"
                >
                  Post Topic
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
