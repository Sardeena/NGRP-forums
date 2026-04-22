import React, { useState, useEffect, useRef } from 'react';
import { User, Clock, ChevronRight, Send, Reply, ThumbsUp, Flag, Share2, Edit2, Save, X as CloseIcon, Star, Lock, Image as ImageIcon, Video, Link as LinkIcon, Trash2, History, Type, Italic, Underline, Palette } from 'lucide-react';
import { Thread, Post, UserProfile } from '../../types';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, getDoc, arrayUnion, arrayRemove, increment } from 'firebase/firestore';
import { db } from '../../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { ModerationTools } from '../ModerationTools';

interface ThreadViewProps {
  threadId: string;
  forumName: string;
  user: UserProfile | null;
  onBack: () => void;
}

export const ThreadView: React.FC<ThreadViewProps> = ({ threadId, forumName, user, onBack }) => {
  const [thread, setThread] = useState<Thread | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [replyText, setReplyText] = useState("");
  const [isEditingThread, setIsEditingThread] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedContent, setEditedContent] = useState("");
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editedPostContent, setEditedPostContent] = useState("");
  const [historyModalPostId, setHistoryModalPostId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const threadRef = doc(db, 'threads', threadId);
    const unsubscribeThread = onSnapshot(threadRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data() as Thread;
        setThread({ ...data, id: doc.id });
        setEditedTitle(data.title);
        setEditedContent(data.content);
      }
      setLoading(false);
    });

    const postsQuery = query(
      collection(db, 'posts'),
      where('threadId', '==', threadId),
      orderBy('timestamp', 'asc')
    );

    const unsubscribePosts = onSnapshot(postsQuery, (snapshot) => {
      const fetchedPosts: Post[] = [];
      snapshot.forEach((doc) => {
        fetchedPosts.push({ id: doc.id, ...doc.data() } as Post);
      });
      setPosts(fetchedPosts);
    });

    return () => {
      unsubscribeThread();
      unsubscribePosts();
    };
  }, [threadId]);

  const handleReply = async () => {
    if (!replyText.trim() || !user || !thread || thread.isLocked) return;

    try {
      const postData = {
        threadId,
        author: user.username,
        authorUid: user.uid,
        authorColor: user.color,
        content: replyText,
        timestamp: Date.now(),
        likes: []
      };

      await addDoc(collection(db, 'posts'), postData);
      
      // Update thread stats
      await updateDoc(doc(db, 'threads', threadId), {
        replies: (thread.replies || 0) + 1,
        lastPost: {
          user: user.username,
          uid: user.uid,
          timestamp: Date.now()
        }
      });
      
      // Update forum stats
      await updateDoc(doc(db, 'forum_stats', 'global'), {
        totalPosts: increment(1)
      });

      // Log activity
      await addDoc(collection(db, 'activities'), {
        type: 'reply',
        user: user.username,
        uid: user.uid,
        targetId: threadId,
        targetTitle: thread.title,
        timestamp: Date.now()
      });

      setReplyText("");
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error('Error posting reply:', error);
    }
  };

  const handleSaveThreadEdit = async () => {
    if (!editedTitle.trim() || !editedContent.trim() || !thread) return;

    try {
      await updateDoc(doc(db, 'threads', threadId), {
        title: editedTitle,
        content: editedContent
      });
      setIsEditingThread(false);
    } catch (error) {
      console.error('Error saving thread edit:', error);
    }
  };

  const handleSavePostEdit = async (postId: string) => {
    if (!editedPostContent.trim()) return;

    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      const historyEntry = {
        content: post.content,
        timestamp: new Date().toLocaleString(),
        author: user?.username || 'Unknown'
      };

      await updateDoc(doc(db, 'posts', postId), {
        content: editedPostContent,
        editHistory: arrayUnion(historyEntry)
      });
      setEditingPostId(null);
    } catch (error) {
      console.error('Error saving post edit:', error);
    }
  };

  const handleToggleLike = async (id: string, isThread: boolean) => {
    if (!user) return;
    const ref = doc(db, isThread ? 'threads' : 'posts', id);
    const item = isThread ? thread : posts.find(p => p.id === id);
    if (!item) return;

    const hasLiked = item.likes?.includes(user.uid);

    try {
      await updateDoc(ref, {
        likes: hasLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
      });
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

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

  const PostDisplay: React.FC<{ 
    content: string; 
    authorUid: string;
    isEditing?: boolean;
    editedContent?: string;
    onEditChange?: (val: string) => void;
    onSave?: () => void;
    onCancel?: () => void;
  }> = ({ content, authorUid, isEditing, editedContent, onEditChange, onSave, onCancel }) => {
    const [profile, setProfile] = useState<UserProfile | null>(null);

    useEffect(() => {
      const fetchProfile = async () => {
        const docRef = doc(db, 'users', authorUid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        }
      };
      fetchProfile();
    }, [authorUid]);

    if (isEditing) {
      return (
        <div className="flex flex-col gap-4 h-full">
          <textarea 
            value={editedContent}
            onChange={(e) => onEditChange?.(e.target.value)}
            className="w-full h-full bg-black/40 border border-white/10 rounded p-4 text-sm text-gray-300 focus:outline-none focus:border-ng-blue/50 min-h-[200px]"
          />
          <div className="flex justify-end gap-2">
            <button 
              onClick={onSave}
              className="px-4 py-2 bg-green-500/20 text-green-500 text-[10px] font-bold uppercase rounded hover:bg-green-500/30"
            >
              Save
            </button>
            <button 
              onClick={onCancel}
              className="px-4 py-2 bg-red-500/20 text-red-500 text-[10px] font-bold uppercase rounded hover:bg-red-500/30"
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full">
        <div className="flex-grow">
          {renderContent(content)}
        </div>
        {profile?.signature && (
          <div className="mt-8 pt-4 border-t border-white/5 text-xs text-gray-500 italic opacity-80">
            {renderContent(profile.signature)}
          </div>
        )}
      </div>
    );
  };

  if (loading) return <div className="text-white text-center py-20 font-bold uppercase tracking-widest animate-pulse">Loading Thread...</div>;
  if (!thread) return <div className="text-white text-center py-20 font-bold uppercase tracking-widest">Thread not found.</div>;

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
        <span className="hover:text-white cursor-pointer" onClick={onBack}>Forums</span>
        <ChevronRight className="w-3 h-3" />
        <span className="hover:text-white cursor-pointer" onClick={onBack}>{forumName}</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-ng-blue truncate max-w-[200px]">{thread.title}</span>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex-grow">
          {isEditingThread ? (
            <input 
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="bg-black/40 border border-ng-blue/50 rounded px-4 py-2 text-xl font-black italic text-white uppercase tracking-tighter w-full max-w-2xl focus:outline-none focus:ring-1 focus:ring-ng-blue"
            />
          ) : (
            <h2 className="text-2xl font-black italic text-white uppercase tracking-tighter drop-shadow-lg flex items-center gap-3">
              {thread.isPinned && <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />}
              {thread.isLocked && <Lock className="w-5 h-5 text-red-500" />}
              {thread.title}
              <button 
                onClick={() => handleToggleLike(thread.id, true)}
                className={`flex items-center gap-2 text-xs transition-colors ml-4 ${thread.likes?.includes(user?.uid || '') ? 'text-ng-blue' : 'text-gray-500 hover:text-white'}`}
              >
                <ThumbsUp className={`w-5 h-5 ${thread.likes?.includes(user?.uid || '') ? 'fill-ng-blue' : ''}`} />
                <span className="font-bold">{thread.likes?.length || 0}</span>
              </button>
            </h2>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {user && (user.role === 'admin' || user.role === 'moderator') && (
            <ModerationTools 
              user={user} 
              targetThread={thread} 
              onActionComplete={() => {}} 
            />
          )}

          {user && user.uid === thread.authorUid && !isEditingThread && (
            <button 
              onClick={() => setIsEditingThread(true)}
              className="bg-ng-blue/20 hover:bg-ng-blue/30 text-ng-blue text-[10px] font-bold uppercase px-4 py-2 rounded transition-colors border border-ng-blue/20 flex items-center gap-2"
            >
              <Edit2 className="w-3 h-3" /> Edit Topic
            </button>
          )}

          {isEditingThread && (
            <div className="flex items-center gap-2">
              <button 
                onClick={handleSaveThreadEdit}
                className="bg-green-500/20 hover:bg-green-500/30 text-green-500 text-[10px] font-bold uppercase px-4 py-2 rounded transition-colors border border-green-500/20 flex items-center gap-2"
              >
                <Save className="w-3 h-3" /> Save
              </button>
              <button 
                onClick={() => setIsEditingThread(false)}
                className="bg-red-500/20 hover:bg-red-500/30 text-red-500 text-[10px] font-bold uppercase px-4 py-2 rounded transition-colors border border-red-500/20 flex items-center gap-2"
              >
                <CloseIcon className="w-3 h-3" /> Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Original Post */}
        <div className="forum-container rounded-lg overflow-hidden flex flex-col md:flex-row">
          <AuthorSidebar author={thread.author} uid={thread.authorUid} />
          <div className="flex-grow bg-ng-dark/95 flex flex-col">
            <div className="p-4 border-b border-white/5 flex justify-between items-center text-[10px] text-gray-500 font-bold uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3" />
                <span>Posted {new Date(thread.createdAt).toLocaleString()}</span>
              </div>
              <span># OP</span>
            </div>
            <div className="p-6 text-gray-300 text-sm leading-relaxed flex-grow min-h-[150px]">
              <PostDisplay 
                content={thread.content} 
                authorUid={thread.authorUid}
                isEditing={isEditingThread}
                editedContent={editedContent}
                onEditChange={setEditedContent}
                onSave={handleSaveThreadEdit}
                onCancel={() => setIsEditingThread(false)}
              />
            </div>
            <div className="p-4 border-t border-white/5 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => handleToggleLike(thread.id, true)}
                  className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${thread.likes?.includes(user?.uid || '') ? 'text-ng-blue' : 'text-gray-500 hover:text-white'}`}
                >
                  <ThumbsUp className={`w-3.5 h-3.5 ${thread.likes?.includes(user?.uid || '') ? 'fill-ng-blue' : ''}`} />
                  {thread.likes?.length || 0} Likes
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Replies */}
        {posts.map((post) => (
          <div key={post.id} className="forum-container rounded-lg overflow-hidden flex flex-col md:flex-row">
            <AuthorSidebar author={post.author} uid={post.authorUid} color={post.authorColor} />
            <div className="flex-grow bg-ng-dark/95 flex flex-col">
              <div className="p-4 border-b border-white/5 flex justify-between items-center text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  <span>Posted {new Date(post.timestamp).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-4">
                  {user && (user.uid === post.authorUid || user.role === 'admin' || user.role === 'moderator') && (
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => {
                          setEditingPostId(post.id);
                          setEditedPostContent(post.content);
                        }}
                        className="text-gray-500 hover:text-ng-blue transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => deleteDoc(doc(db, 'posts', post.id))}
                        className="text-gray-500 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-6 text-gray-300 text-sm leading-relaxed flex-grow">
                <PostDisplay 
                  content={post.content} 
                  authorUid={post.authorUid}
                  isEditing={editingPostId === post.id}
                  editedContent={editedPostContent}
                  onEditChange={setEditedPostContent}
                  onSave={() => handleSavePostEdit(post.id)}
                  onCancel={() => setEditingPostId(null)}
                />
              </div>
              <div className="p-4 border-t border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => handleToggleLike(post.id, false)}
                    className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${post.likes?.includes(user?.uid || '') ? 'text-ng-blue' : 'text-gray-500 hover:text-white'}`}
                  >
                    <ThumbsUp className={`w-3.5 h-3.5 ${post.likes?.includes(user?.uid || '') ? 'fill-ng-blue' : ''}`} />
                    {post.likes?.length || 0} Likes
                  </button>
                  {post.editHistory && post.editHistory.length > 0 && (
                    <button 
                      onClick={() => setHistoryModalPostId(post.id)}
                      className="flex items-center gap-2 text-[10px] text-gray-500 hover:text-white font-bold uppercase tracking-widest"
                    >
                      <History className="w-3.5 h-3.5" />
                      Edited
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      {/* Reply Area */}
      {user ? (
        !thread.isLocked ? (
          <div className="forum-container rounded-lg overflow-hidden mt-4">
            <div className="glossy-blue px-4 py-2 text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <Reply className="w-4 h-4" />
              Quick Reply
            </div>
            <div className="p-6 bg-ng-dark/95 flex flex-col gap-4">
              <div className="flex gap-2 mb-2">
                <button 
                  onClick={() => setReplyText(prev => prev + '[b][/b]')}
                  className="p-1.5 bg-white/5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                  title="Bold"
                >
                  <Type className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setReplyText(prev => prev + '[i][/i]')}
                  className="p-1.5 bg-white/5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                  title="Italic"
                >
                  <Italic className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setReplyText(prev => prev + '[u][/u]')}
                  className="p-1.5 bg-white/5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                  title="Underline"
                >
                  <Underline className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setReplyText(prev => prev + '[color=#00a3ff][/color]')}
                  className="p-1.5 bg-white/5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                  title="Text Color"
                >
                  <Palette className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setReplyText(prev => prev + '[img][/img]')}
                  className="p-1.5 bg-white/5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                  title="Embed Image"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setReplyText(prev => prev + '[video][/video]')}
                  className="p-1.5 bg-white/5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                  title="Embed Video"
                >
                  <Video className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setReplyText(prev => prev + '[url=][/url]')}
                  className="p-1.5 bg-white/5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                  title="Insert Link"
                >
                  <LinkIcon className="w-4 h-4" />
                </button>
              </div>
              <textarea 
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded p-4 text-sm text-white focus:outline-none focus:border-ng-blue/50 min-h-[120px]"
                placeholder="Write your reply here... Use [img]url[/img] for images and [video]url[/video] for YouTube."
              />
              <div className="flex justify-end">
                <button 
                  onClick={handleReply}
                  disabled={!replyText.trim()}
                  className="px-8 py-3 glossy-blue text-white font-bold uppercase tracking-widest rounded shadow-lg hover:brightness-110 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  Post Reply
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="forum-container rounded-lg overflow-hidden mt-4 bg-red-500/5 border border-red-500/20 p-8 flex flex-col items-center text-center gap-4">
            <Lock className="w-12 h-12 text-red-500" />
            <h3 className="text-xl font-black italic text-white uppercase tracking-tighter">This Topic is Locked</h3>
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">You cannot reply to this topic because it has been closed by an administrator.</p>
          </div>
        )
      ) : (
        <div className="forum-container rounded-lg overflow-hidden mt-4 bg-white/5 border border-white/10 p-8 text-center">
          <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">Please login or register to post a reply.</p>
        </div>
      )}

      {/* History Modal */}
      <AnimatePresence>
        {historyModalPostId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
              onClick={() => setHistoryModalPostId(null)}
            ></motion.div>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="forum-container w-full max-w-2xl rounded-lg overflow-hidden relative z-10 shadow-2xl"
            >
              <div className="glossy-blue px-6 py-4 flex justify-between items-center">
                <h3 className="text-lg font-black italic text-white uppercase tracking-tighter">Edit History</h3>
                <button onClick={() => setHistoryModalPostId(null)} className="text-white/50 hover:text-white transition-colors">
                  <CloseIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 bg-ng-dark/95 max-h-[70vh] overflow-y-auto flex flex-col gap-6">
                {posts.find(p => p.id === historyModalPostId)?.editHistory?.slice().reverse().map((entry, i) => (
                  <div key={i} className="border-b border-white/5 pb-6 last:border-0">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2">
                        <User className="w-3 h-3 text-ng-blue" />
                        <span className="text-xs font-bold text-ng-blue">{entry.author}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                        <Clock className="w-3 h-3" />
                        {entry.timestamp}
                      </div>
                    </div>
                    <div className="bg-black/40 p-4 rounded text-sm text-gray-400 italic leading-relaxed whitespace-pre-wrap">
                      {entry.content}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AuthorSidebar: React.FC<{ author: string; uid: string; color?: string }> = ({ author, uid, color }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProfile(docSnap.data() as UserProfile);
      }
    };
    fetchProfile();
  }, [uid]);

  return (
    <div className="w-full md:w-48 bg-black/40 p-6 flex flex-col items-center text-center border-b md:border-b-0 md:border-r border-white/5">
      <div className="relative mb-4">
        <img 
          src={`https://picsum.photos/seed/${uid}/80/80`} 
          alt={author} 
          className="w-20 h-20 rounded-full border-2 border-white/10 shadow-xl object-cover"
          referrerPolicy="no-referrer"
        />
      </div>
      <span className="font-bold text-sm hover:underline cursor-pointer" style={{ color: color || profile?.color || '#00a3ff' }}>{author}</span>
      <span className={`text-[9px] font-bold uppercase tracking-widest mt-1 px-2 py-0.5 rounded ${profile?.role === 'admin' ? 'bg-red-500/20 text-red-500' : profile?.role === 'moderator' ? 'bg-green-500/20 text-green-500' : 'bg-ng-blue/20 text-ng-blue'}`}>
        {profile?.role || 'Member'}
      </span>
      
      <div className="mt-4 w-full flex flex-col gap-1 text-[9px] text-gray-500 font-bold uppercase tracking-widest">
        <div className="flex justify-between">
          <span>Posts:</span>
          <span className="text-gray-300">{profile?.postCount || 0}</span>
        </div>
        <div className="flex justify-between">
          <span>Reputation:</span>
          <span className="text-gray-300">{profile?.reputation || 0}</span>
        </div>
      </div>
    </div>
  );
};
