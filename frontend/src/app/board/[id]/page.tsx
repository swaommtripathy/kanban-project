'use client';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useSocket } from '@/context/SocketContext';
import { Sun, Moon } from 'lucide-react';

interface Task {
  _id: string;
  list_id: string;
  title: string;
  position: number;
}

interface List {
  _id: string;
  title: string;
  position: number;
  tasks: Task[];
}

export default function BoardPage() {
  const untypedParams = useParams();
  const boardId = (untypedParams?.id as string) || '';
  
  const socket = useSocket();
  
  const [lists, setLists] = useState<List[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [mounted, setMounted] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('dark');

  const [newListTitle, setNewListTitle] = useState<string>('');
  const [newTaskTitles, setNewTaskTitles] = useState<{ [listId: string]: string }>({});
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState<string>('');

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

  // Array of style configurations shifting borders depending on index allocation
  const columnStyles = [
    { border: 'border-indigo-500/30 dark:border-indigo-500/30', text: 'text-indigo-600 dark:text-indigo-400', dragBg: 'bg-indigo-600', dragBorder: 'border-indigo-400' },
    { border: 'border-emerald-500/30 dark:border-emerald-500/30', text: 'text-emerald-600 dark:text-emerald-400', dragBg: 'bg-emerald-600', dragBorder: 'border-emerald-400' },
    { border: 'border-violet-500/30 dark:border-violet-500/30', text: 'text-violet-600 dark:text-violet-400', dragBg: 'bg-violet-600', dragBorder: 'border-violet-400' },
    { border: 'border-amber-500/30 dark:border-amber-500/30', text: 'text-amber-600 dark:text-amber-400', dragBg: 'bg-amber-600', dragBorder: 'border-amber-400' },
    { border: 'border-cyan-500/30 dark:border-cyan-500/30', text: 'text-cyan-600 dark:text-cyan-400', dragBg: 'bg-cyan-600', dragBorder: 'border-cyan-400' }
  ];

  // Align theme directly against document token on mount pass safely
  useEffect(() => {
    setMounted(true);
    const savedTheme = (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
    setCurrentTheme(savedTheme);
    
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const handleToggleTheme = () => {
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setCurrentTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    const fetchBoardData = async () => {
      if (!boardId) return;
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${BACKEND_URL}/api/boards/${boardId}`, {
          method: 'GET',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (res.ok) {
          const data = await res.json();
          setLists(data.lists || []);
        }
      } catch (err) {
        console.error("Error loading workspace data:", err);
      } finally {
        setLoading(false);
      }
    };
    
    if (mounted && boardId) {
      fetchBoardData();
    }
  }, [boardId, BACKEND_URL, mounted]);

  useEffect(() => {
    if (!socket || !boardId || !mounted) return;

    socket.emit('join-board', boardId);

    const handleUiUpdate = (data: { lists: List[] }) => {
      setLists(data.lists);
    };

    socket.on('ui-render-update', handleUiUpdate);

    return () => {
      socket.off('ui-render-update', handleUiUpdate);
    };
  }, [socket, boardId, mounted]);

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListTitle.trim() || !boardId) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/api/lists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ board_id: boardId, title: newListTitle })
      });

      if (res.ok) {
        const createdList = await res.json();
        const updatedLists = [...lists, { ...createdList, tasks: [] }];
        setLists(updatedLists);
        setNewListTitle('');
        socket?.emit('board-updated', { boardId, lists: updatedLists });
      }
    } catch (err) {
      console.error("Failed to create list:", err);
    }
  };

  const handleCreateTask = async (listId: string) => {
    const taskTitle = newTaskTitles[listId];
    if (!taskTitle || !taskTitle.trim()) return;

    const targetList = lists.find(l => l._id === listId);
    if (!targetList) return;

    const existingTasks = targetList.tasks || [];
    const position = existingTasks.length > 0 
      ? existingTasks[existingTasks.length - 1].position + 1000 
      : 1000;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          list_id: listId, 
          title: taskTitle,
          position: position 
        })
      });

      if (res.ok) {
        const createdTask = await res.json();
        const updatedLists = lists.map((list) => {
          if (list._id === listId) {
            return { ...list, tasks: [...existingTasks, createdTask] };
          }
          return list;
        });

        setLists(updatedLists);
        setNewTaskTitles((prev) => ({ ...prev, [listId]: '' }));
        socket?.emit('board-updated', { boardId, lists: updatedLists });
      }
    } catch (err) {
      console.error("Failed to create task:", err);
    }
  };

  const handleStartTaskEdit = (task: Task) => {
    setEditingTaskId(task._id);
    setEditingTaskTitle(task.title);
  };

  const handleCancelTaskEdit = () => {
    setEditingTaskId(null);
    setEditingTaskTitle('');
  };

  const handleSaveTaskEdit = async (task: Task) => {
    if (!editingTaskTitle.trim() || editingTaskId !== task._id) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/api/tasks/${task._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: editingTaskTitle.trim() })
      });

      if (res.ok) {
        const updatedTask = await res.json();
        const updatedLists = lists.map((list) => ({
          ...list,
          tasks: list.tasks.map((t) => t._id === updatedTask._id ? { ...t, title: updatedTask.title } : t)
        }));

        setLists(updatedLists);
        setEditingTaskId(null);
        setEditingTaskTitle('');
        socket?.emit('board-updated', { boardId, lists: updatedLists });
      }
    } catch (err) {
      console.error('Could not save task edit:', err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const confirmDelete = window.confirm('Delete this card? This action cannot be undone.');
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok || res.status === 204) {
        const updatedLists = lists.map((list) => ({
          ...list,
          tasks: list.tasks.filter((task) => task._id !== taskId)
        }));

        setLists(updatedLists);
        if (editingTaskId === taskId) {
          handleCancelTaskEdit();
        }
        socket?.emit('board-updated', { boardId, lists: updatedLists });
      }
    } catch (err) {
      console.error('Could not delete task:', err);
    }
  };

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;

    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const updatedLists = JSON.parse(JSON.stringify(lists)) as List[];
    const sourceList = updatedLists.find(l => l._id === source.droppableId);
    const destList = updatedLists.find(l => l._id === destination.droppableId);
    
    if (!sourceList || !destList) return;

    const [movedTask] = sourceList.tasks.splice(source.index, 1);
    
    let newPos: number;
    const targetTasks = destList.tasks;
    if (targetTasks.length === 0) {
      newPos = 1000;
    } else if (destination.index === 0) {
      newPos = targetTasks[0].position / 2;
    } else if (destination.index === targetTasks.length) {
      newPos = targetTasks[targetTasks.length - 1].position + 1000;
    } else {
      newPos = (targetTasks[destination.index - 1].position + targetTasks[destination.index].position) / 2;
    }

    movedTask.position = newPos;
    movedTask.list_id = destination.droppableId;
    
    destList.tasks.splice(destination.index, 0, movedTask);
    destList.tasks.sort((a, b) => a.position - b.position);
    
    setLists(updatedLists);

    if (socket) {
      socket.emit('board-updated', { boardId, lists: updatedLists });
    }

    try {
      await fetch(`${BACKEND_URL}/api/tasks/${draggableId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ list_id: destination.droppableId, position: newPos })
      });
    } catch (err) {
      console.error("Database failed sync:", err);
    }
  };

  if (!mounted) return null;

  if (loading) {
    return <div className="h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-500 dark:text-slate-400 font-medium tracking-wide">Synchronizing board components...</div>;
  }

  return (
    <div className="h-screen flex flex-col bg-slate-100 dark:bg-[#0b0f19] text-slate-900 dark:text-white select-none antialiased transition-colors duration-300">
      {/* HEADER SECTION ADJUSTED FOR FULL COMPATIBILITY THEMES */}
      <header className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-md px-6 transition-colors">
        <div className="flex items-center gap-6">
          <button 
            type="button"
            onClick={() => window.location.href = '/dashboard'}
            className="text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            ← Dashboard
          </button>
          <div className="h-4 w-px bg-slate-300 dark:bg-slate-800" />
          <h1 className="font-extrabold text-xl bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-cyan-400 bg-clip-text text-transparent tracking-tight">
            Collaborative Board Manager
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            type="button"
            onClick={handleToggleTheme}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:scale-105 transition-all shadow-sm"
          >
            {currentTheme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>
          <button
            type="button"
            onClick={() => { localStorage.clear(); window.location.href = '/'; }}
            className="px-4 py-2 bg-transparent hover:bg-red-50 dark:hover:bg-red-950/20 border border-slate-200 dark:border-slate-800 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold transition-all"
          >
            Logout
          </button>
        </div>
      </header>
      
      {/* CANVAS COLUMNS WINDOW CONTAINER */}
      <div className="flex-1 flex gap-5 p-6 overflow-x-auto items-start">
        <DragDropContext onDragEnd={onDragEnd}>
          {lists.map((list, index) => {
            const currentStyle = columnStyles[index % columnStyles.length];
            return (
              <div 
                key={list._id} 
                className={`w-72 bg-white dark:bg-slate-900 p-4 rounded-2xl flex flex-col max-h-[82vh] border border-slate-200 ${currentStyle.border} shadow-lg flex-shrink-0 transition-all`}
              >
                <div className="flex items-center justify-between mb-4 px-1">
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 tracking-wide text-sm truncate max-w-[80%]">{list.title}</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-950 border border-slate-200 ${currentStyle.border} ${currentStyle.text}`}>
                    {list.tasks?.length || 0}
                  </span>
                </div>
                
                <Droppable droppableId={list._id}>
                  {(provided) => (
                    <div 
                      ref={provided.innerRef} 
                      {...provided.droppableProps} 
                      className="flex-1 overflow-y-auto space-y-2.5 min-h-[20px] max-h-[58vh] pr-1 mb-3 custom-scrollbar"
                    >
                      {list.tasks.map((task, idx) => (
                        <Draggable draggableId={task._id} index={idx} key={task._id}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`p-3.5 rounded-xl text-sm font-semibold border transition-all ${
                                snapshot.isDragging 
                                  ? `${currentStyle.dragBg} ${currentStyle.dragBorder} text-white scale-[1.02] shadow-2xl rotate-[1deg]` 
                                  : 'bg-slate-50 dark:bg-[#141b2d] border-slate-200 dark:border-slate-800/80 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-2 min-w-0">
                                  <button
                                    type="button"
                                    {...provided.dragHandleProps}
                                    className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-200 text-lg leading-none"
                                    aria-label="Drag card"
                                  >
                                    ⋮⋮
                                  </button>

                                  {editingTaskId === task._id ? (
                                    <input
                                      value={editingTaskTitle}
                                      onChange={(e) => setEditingTaskTitle(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          handleSaveTaskEdit(task);
                                        }
                                        if (e.key === 'Escape') {
                                          handleCancelTaskEdit();
                                        }
                                      }}
                                      className="min-w-0 flex-1 bg-transparent border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1 text-sm text-slate-900 dark:text-slate-100 outline-none"
                                      autoFocus
                                    />
                                  ) : (
                                    <p className="truncate">{task.title}</p>
                                  )}
                                </div>

                                <div className="flex items-center gap-1">
                                  {editingTaskId === task._id ? (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleSaveTaskEdit(task)}
                                        className="text-[11px] font-semibold uppercase text-emerald-600 hover:text-emerald-500"
                                      >
                                        Save
                                      </button>
                                      <button
                                        type="button"
                                        onClick={handleCancelTaskEdit}
                                        className="text-[11px] font-semibold uppercase text-slate-500 hover:text-slate-400"
                                      >
                                        Cancel
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleStartTaskEdit(task)}
                                        className="text-slate-400 hover:text-indigo-500"
                                        title="Edit card"
                                      >
                                        ✎
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteTask(task._id)}
                                        className="text-slate-400 hover:text-rose-500"
                                        title="Delete card"
                                      >
                                        🗑
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>

                <div className="mt-auto pt-3 border-t border-slate-200 dark:border-slate-800/60">
                  <input
                    type="text"
                    placeholder="+ Add a card..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-xl px-3.5 py-2.5 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-indigo-500 transition-all shadow-inner"
                    value={newTaskTitles[list._id] || ''}
                    onChange={(e) => setNewTaskTitles({ ...newTaskTitles, [list._id]: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateTask(list._id)}
                  />
                </div>
              </div>
            );
          })}
        </DragDropContext>

        <form onSubmit={handleCreateList} className="w-72 bg-white/60 dark:bg-slate-900/30 p-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 hover:border-indigo-500 transition-all shadow-md flex-shrink-0">
          <input
            type="text"
            placeholder="+ Add another column..."
            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-indigo-500 transition-all mb-2.5 shadow-inner"
            value={newListTitle}
            onChange={(e) => setNewListTitle(e.target.value)}
          />
          {newListTitle.trim() && (
            <button type="submit" className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold tracking-wide transition-all shadow-md">
              Confirm New Column
            </button>
          )}
        </form>
      </div>
    </div>
  );
}