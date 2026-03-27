import React from 'react';
import { MessageSquare, User, Clock } from 'lucide-react';

interface ForumRowProps {
  name: string;
  description: string;
  topics: number;
  lastPost: {
    user: string;
    time: string;
    thread: string;
    avatar?: string;
  };
  subForums?: string[];
  onForumClick?: (name: string) => void;
}

const ForumRow: React.FC<ForumRowProps> = ({ name, description, topics, lastPost, subForums, onForumClick }) => {
  const defaultAvatar = `https://picsum.photos/seed/${lastPost.user}/40/40`;
  
  return (
    <div className="forum-row flex flex-col p-4 gap-4 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-4 w-full">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-ng-blue/20 border border-ng-blue/40 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-ng-blue" />
          </div>
        </div>
        
        <div className="flex-grow min-w-0">
          <h3 
            onClick={() => onForumClick?.(name)}
            className="text-ng-blue font-bold text-lg hover:underline cursor-pointer truncate"
          >
            {name}
          </h3>
          <p className="text-gray-400 text-sm line-clamp-1">
            {description}
          </p>
          
          {subForums && subForums.length > 0 && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
              <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Sub-forums:</span>
              {subForums.map((sub, idx) => (
                <span 
                  key={idx} 
                  onClick={() => onForumClick?.(sub)}
                  className="text-[10px] font-bold text-ng-blue hover:underline cursor-pointer flex items-center gap-1"
                >
                  <MessageSquare className="w-3 h-3 opacity-50" />
                  {sub}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="hidden md:flex flex-col items-center w-24 text-center">
          <span className="text-xl font-bold text-gray-200">{topics}</span>
          <span className="text-[10px] uppercase text-gray-500 font-bold">Topics</span>
        </div>

        <div className="hidden lg:flex flex-col w-56 text-xs text-gray-400 border-l border-ng-border pl-4">
          <div className="truncate text-gray-200 font-medium hover:underline cursor-pointer mb-1">
            {lastPost.thread}
          </div>
          <div className="flex items-center gap-2">
            <img 
              src={lastPost.avatar || defaultAvatar} 
              alt={lastPost.user}
              className="w-6 h-6 rounded-full border border-white/10 shadow-sm object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="text-gray-500">By</span>
                <span className="text-ng-blue hover:underline cursor-pointer font-medium">{lastPost.user}</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-gray-500">
                <Clock className="w-3 h-3" />
                {lastPost.time}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ForumCategoryProps {
  title: string;
  forums: ForumRowProps[];
  onForumClick?: (name: string) => void;
}

export const ForumCategory: React.FC<ForumCategoryProps> = ({ title, forums, onForumClick }) => {
  return (
    <div className="mb-6 forum-container rounded-lg overflow-hidden">
      <div className="glossy-blue px-4 py-2.5 flex justify-between items-center">
        <h2 className="font-bold text-white tracking-wide uppercase text-sm drop-shadow-md">
          {title}
        </h2>
        <div className="hidden md:flex gap-12 text-[10px] font-bold text-white/70 uppercase pr-4">
          <span className="w-24 text-center">Stats</span>
          <span className="w-48">Last Post</span>
        </div>
      </div>
      <div className="bg-ng-dark/40">
        {forums.map((forum, idx) => (
          <ForumRow key={idx} {...forum} onForumClick={onForumClick} />
        ))}
      </div>
    </div>
  );
};
