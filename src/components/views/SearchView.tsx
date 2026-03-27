import React, { useState, useEffect } from 'react';
import { Search, MessageSquare, User, Clock, ChevronRight } from 'lucide-react';
import { Thread } from '../../types';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';

interface SearchViewProps {
  searchQuery: string;
  onThreadClick: (id: string, title: string, isLocked: boolean) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({ searchQuery, onThreadClick }) => {
  const [results, setResults] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const performSearch = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'threads'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const allThreads: Thread[] = [];
        querySnapshot.forEach((doc) => {
          allThreads.push({ id: doc.id, ...doc.data() } as Thread);
        });

        const filtered = allThreads.filter(thread => 
          thread.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          thread.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          thread.author.toLowerCase().includes(searchQuery.toLowerCase())
        );

        setResults(filtered);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    };

    if (searchQuery) {
      performSearch();
    }
  }, [searchQuery]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 glossy-blue rounded-lg flex items-center justify-center shadow-lg">
          <Search className="text-white w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-black italic text-white uppercase tracking-tighter">Search Results</h2>
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Showing results for: <span className="text-ng-blue">"{searchQuery}"</span></p>
        </div>
      </div>

      {loading ? (
        <div className="text-white text-center py-20 font-bold uppercase tracking-widest animate-pulse">Searching...</div>
      ) : results.length > 0 ? (
        <div className="forum-container rounded-lg overflow-hidden">
          <div className="glossy-blue px-6 py-3 text-[10px] font-bold text-white uppercase tracking-widest grid grid-cols-12 gap-4">
            <div className="col-span-12 md:col-span-7">Topic</div>
            <div className="hidden md:block col-span-2 text-center">Stats</div>
            <div className="hidden md:block col-span-3">Last Post</div>
          </div>
          <div className="bg-ng-dark/95 divide-y divide-white/5">
            {results.map((thread) => (
              <div 
                key={thread.id}
                onClick={() => onThreadClick(thread.id, thread.title, thread.isLocked)}
                className="grid grid-cols-12 gap-4 p-6 hover:bg-white/5 transition-colors cursor-pointer group"
              >
                <div className="col-span-12 md:col-span-7 flex gap-4">
                  <div className="w-10 h-10 rounded bg-black/40 flex items-center justify-center text-ng-blue group-hover:scale-110 transition-transform">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-sm font-bold text-white group-hover:text-ng-blue transition-colors">{thread.title}</h3>
                    <div className="flex items-center gap-2 text-[9px] text-gray-500 font-bold uppercase tracking-widest">
                      <span>By {thread.author}</span>
                      <span>•</span>
                      <span>{new Date(thread.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="hidden md:flex col-span-2 flex-col items-center justify-center gap-1">
                  <span className="text-xs font-bold text-white">{thread.replies || 0}</span>
                  <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Replies</span>
                </div>
                <div className="hidden md:flex col-span-3 flex-col justify-center gap-1">
                  <div className="flex items-center gap-2">
                    <User className="w-3 h-3 text-ng-blue" />
                    <span className="text-[10px] font-bold text-white truncate">{thread.lastPost?.user}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[8px] text-gray-500 font-bold uppercase tracking-widest">
                    <Clock className="w-2.5 h-2.5" />
                    <span>{new Date(thread.lastPost?.timestamp || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="forum-container rounded-lg overflow-hidden p-20 text-center bg-white/5 border border-white/10">
          <Search className="w-16 h-16 text-gray-600 mx-auto mb-4 opacity-20" />
          <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">No results found for your search.</p>
        </div>
      )}
    </div>
  );
};
