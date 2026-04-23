export type View = 'home' | 'forums' | 'ucp' | 'server-info' | 'donate' | 'support' | 'forms' | 'forum-detail' | 'thread-view' | 'profile' | 'search' | 'tasks';

export interface Task {
  id: string;
  uid: string;
  title: string;
  completed: boolean;
  createdAt: number;
}

export interface UserProfile {
  uid: string;
  username: string;
  email: string;
  role: 'admin' | 'moderator' | 'member' | 'user';
  color: string;
  joinedAt: string;
  postCount: number;
  reputation: number;
  signature?: string;
  profileViews?: number;
  lastMessageAt?: number;
  isBanned?: boolean;
  banReason?: string;
}

export interface Thread {
  id: string;
  title: string;
  author: string;
  authorUid: string;
  replies: number;
  views: number;
  lastPost: {
    user: string;
    uid: string;
    timestamp: number;
  };
  isPinned: boolean;
  isLocked: boolean;
  subForum: string;
  createdAt: number;
  content: string;
  likes?: string[]; // Array of UIDs
}

export interface Post {
  id: string;
  threadId: string;
  author: string;
  authorUid: string;
  authorColor: string;
  content: string;
  timestamp: number;
  likes?: string[]; // Array of UIDs
  editHistory?: {
    content: string;
    timestamp: string;
    author: string;
  }[];
}

export interface Activity {
  id: string;
  type: 'new_thread' | 'reply' | 'profile_update' | 'user_banned' | 'thread_locked' | 'thread_pinned';
  user: string;
  uid: string;
  targetId: string; // threadId or userId
  targetTitle?: string;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  uid: string;
  user: string;
  text: string;
  timestamp: number;
  color: string;
}

export interface ForumCategory {
  id: string;
  title: string;
  order: number;
  forums: {
    name: string;
    description: string;
    topics: number;
    subForums: string[];
    lastPost?: {
      user: string;
      time: string;
      thread: string;
    };
  }[];
}

export interface News {
  id: string;
  title: string;
  excerpt: string;
  imageUrl?: string;
  author: string;
  date: string;
  isFeatured?: boolean;
  timestamp: number;
}

export interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  timestamp: number;
}

export interface ServerStats {
  id: string;
  status: string;
  playersOnline: number;
  maxPlayers: number;
  version: string;
}

export interface ForumStats {
  id: string;
  totalPosts: number;
  totalTopics: number;
  totalMembers: number;
  newestMember: string;
  discordMembersOnline?: number;
}

export interface SupportTicket {
  id: string;
  uid: string;
  subject: string;
  category: string;
  message: string;
  status: 'Pending' | 'Open' | 'Resolved';
  timestamp: number;
}
