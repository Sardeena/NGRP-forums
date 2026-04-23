import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ListTodo, Plus, CheckCircle2, Circle, Trash2, Calendar, AlertCircle, Zap } from 'lucide-react';
import { db } from '../../firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Task, UserProfile } from '../../types';

interface TasksViewProps {
  user: UserProfile | null;
}

export const TasksView: React.FC<TasksViewProps> = ({ user }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'tasks'),
      where('uid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedTasks: Task[] = [];
      snapshot.forEach((doc) => {
        fetchedTasks.push({ id: doc.id, ...doc.data() } as Task);
      });
      setTasks(fetchedTasks);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTaskTitle.trim()) return;

    try {
      await addDoc(collection(db, 'tasks'), {
        uid: user.uid,
        title: newTaskTitle.trim(),
        completed: false,
        createdAt: Date.now()
      });
      setNewTaskTitle('');
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const toggleTask = async (taskId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'tasks', taskId), {
        completed: !currentStatus
      });
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  if (!user) {
    return (
      <div className="forum-container p-12 flex flex-col items-center justify-center text-center gap-6">
        <AlertCircle className="w-16 h-16 text-yellow-500" />
        <h2 className="text-2xl font-black italic text-white uppercase tracking-tighter">Login Required</h2>
        <p className="text-gray-500 max-w-md uppercase font-bold text-xs tracking-widest leading-relaxed">
          You must be logged in to manage your tasks. Personal task lists are securely stored for registered members.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto">
      <div className="glossy-blue p-4 rounded shadow-lg flex justify-between items-center">
        <h2 className="text-white font-bold uppercase tracking-widest flex items-center gap-2">
          <ListTodo className="w-5 h-5" />
          Personal Task List
        </h2>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-white/50" />
          <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
        </div>
      </div>

      <div className="forum-container rounded-lg p-6 bg-ng-dark/95 flex flex-col gap-6">
        <form onSubmit={addTask} className="flex gap-4">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Add a new goal or reminder..."
            className="flex-grow bg-black/40 border border-white/10 rounded px-6 py-3 text-xs font-bold uppercase tracking-widest text-white placeholder:text-gray-600 focus:outline-none focus:border-ng-blue transition-all"
          />
          <button
            type="submit"
            disabled={!newTaskTitle.trim()}
            className="glossy-blue px-8 py-3 rounded text-white font-bold uppercase tracking-widest text-xs flex items-center gap-2 hover:brightness-110 disabled:opacity-50 disabled:grayscale transition-all"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </form>

        <div className="flex flex-col gap-3">
          {loading ? (
            <div className="flex justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ng-blue"></div>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center p-12 border-2 border-dashed border-white/5 rounded">
              <p className="text-gray-500 uppercase font-bold text-[10px] tracking-widest">No tasks yet. Plan your next RP session!</p>
            </div>
          ) : (
            <AnimatePresence>
              {tasks.map((task) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className={`flex items-center justify-between p-4 bg-black/30 border ${task.completed ? 'border-green-500/20' : 'border-white/5'} rounded transition-all group`}
                >
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => toggleTask(task.id, task.completed)}
                      className={`p-1 rounded-full transition-colors ${task.completed ? 'text-green-500' : 'text-gray-600 hover:text-ng-blue'}`}
                    >
                      {task.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                    </button>
                    <span className={`text-xs font-bold uppercase tracking-wide ${task.completed ? 'text-gray-600 line-through' : 'text-white'}`}>
                      {task.title}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-2 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    title="Delete Task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {tasks.length > 0 && (
          <div className="pt-4 border-t border-white/5 flex justify-between items-center">
            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">
              {tasks.filter(t => t.completed).length} of {tasks.length} tasks completed
            </span>
            <div className="flex gap-1 h-1.5 w-32 bg-black/40 rounded-full overflow-hidden">
              <div 
                className="bg-ng-blue h-full transition-all duration-500"
                style={{ width: `${(tasks.filter(t => t.completed).length / tasks.length) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-ng-blue/5 border border-ng-blue/10 rounded flex items-center gap-4">
          <div className="p-3 bg-ng-blue/10 rounded-full text-ng-blue">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-white uppercase tracking-widest underline decoration-ng-blue">Pro Tip</span>
            <span className="text-[9px] text-gray-500 uppercase tracking-widest mt-1">Consistency is key to leveling up your RP stats.</span>
          </div>
        </div>
        <div className="p-4 bg-green-500/5 border border-green-500/10 rounded flex items-center gap-4">
          <div className="p-3 bg-green-500/10 rounded-full text-green-500">
            <Zap className="w-5 h-5 text-yellow-500 fill-yellow-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-white uppercase tracking-widest underline decoration-green-500">Milestone</span>
            <span className="text-[9px] text-gray-500 uppercase tracking-widest mt-1">Complete 10 tasks to earn a unique forum badge.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
