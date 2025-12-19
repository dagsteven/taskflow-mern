import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

import Login from './pages/Login';
import Register from './pages/Register';
import Friends from './pages/Friends';
import { playSuccessSound } from './sounds';

// URL DE PRODUCTION
const API_BASE = "https://taskflow-mern-r737.onrender.com/api";

function App() {
    const [token, setToken] = useState(localStorage.getItem("token"));
    const [username, setUsername] = useState(localStorage.getItem("username") || "Invité");
    
    const [view, setView] = useState("tasks"); 
    const [page, setPage] = useState("login");
    const [todos, setTodos] = useState([]);
    const [popupActive, setPopupActive] = useState(false);
    const [newTodo, setNewTodo] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    
    // Notification
    const [hasNotification, setHasNotification] = useState(false);
    const [currentLeaderboardSignature, setCurrentLeaderboardSignature] = useState("");

    // Édition
    const [editingId, setEditingId] = useState(null);
    const [editText, setEditText] = useState("");
    const [editIsPublic, setEditIsPublic] = useState(false);
    const [newTodoPublic, setNewTodoPublic] = useState(false);
    const [streak, setStreak] = useState(0);

    // --- FONCTIONS STABILISÉES ---
    
    const getConfig = useCallback(() => ({
        headers: { Authorization: `Bearer ${token}` }
    }), [token]);

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        localStorage.removeItem("savedLeaderboard");
        setToken(null);
        setUsername("Invité");
        setTodos([]);
        setStreak(0);
        setView("tasks");
        toast('À bientôt !', { icon: '👋' });
    };

    const checkNotifications = useCallback(async () => {
        try {
            const reqRes = await axios.get(API_BASE + "/social/request/list", getConfig());
            const hasPendingRequests = reqRes.data.length > 0;

            const leadRes = await axios.get(API_BASE + "/social/leaderboard", getConfig());
            const newSignature = JSON.stringify(leadRes.data.map(u => u.username));
            setCurrentLeaderboardSignature(newSignature);

            const savedSignature = localStorage.getItem("savedLeaderboard");
            const hasLeaderboardChanged = savedSignature && savedSignature !== newSignature;

            if (hasPendingRequests || hasLeaderboardChanged) {
                setHasNotification(true);
            } else {
                setHasNotification(false);
            }
        } catch (err) { console.error("Erreur check notif", err); }
    }, [getConfig]);

    const handleOpenFriends = () => {
        setView(view === "friends" ? "tasks" : "friends");
        setHasNotification(false);
        if (currentLeaderboardSignature) {
            localStorage.setItem("savedLeaderboard", currentLeaderboardSignature);
        }
    };

    // --- CHARGEMENT PRINCIPAL ---
    useEffect(() => {
        if (!token) return;
        
        const fetchData = async () => {
            try {
                const res = await axios.get(API_BASE + "/todos", getConfig());
                if (Array.isArray(res.data)) {
                    setTodos(res.data);
                } else {
                    setTodos(res.data.todos);
                    if (res.data.streak) setStreak(res.data.streak);
                }
                await checkNotifications();
            } catch (err) {
                if(err.response && err.response.status === 401) logout();
            } finally {
                setIsLoading(false);
            }
        };

        fetchData(); 

        const intervalId = setInterval(() => {
            fetchData();
        }, 10000);

        return () => clearInterval(intervalId);

    }, [token, getConfig, checkNotifications]);

    // --- ACTIONS ---

    const completeTodo = async (id) => {
        const taskToToggle = todos.find(todo => todo._id === id);
        if (taskToToggle && !taskToToggle.complete) playSuccessSound();
        try {
            const res = await axios.put(API_BASE + "/todos/complete/" + id, {}, getConfig());
            const updatedTask = res.data.todo;
            if (res.data.newStreak !== undefined && res.data.newStreak !== null) {
                if (res.data.newStreak > streak) toast.success("🔥 Série en cours !");
                setStreak(res.data.newStreak);
            }
            setTodos(prev => prev.map(todo => todo._id === updatedTask._id ? updatedTask : todo));
        } catch { toast.error("Erreur connexion"); }
    }

    const deleteTodo = async (id) => {
        try {
            await axios.delete(API_BASE + "/todos/delete/" + id, getConfig());
            setTodos(prev => prev.filter(todo => todo._id !== id));
            toast.success("Supprimé !");
        } catch { toast.error("Erreur suppression"); }
    }

    const addTodo = async () => {
        if (!newTodo.trim()) return;
        try {
            const res = await axios.post(API_BASE + "/todos/new", { text: newTodo, isPublic: newTodoPublic }, getConfig());
            setTodos([...todos, res.data]);
            setPopupActive(false);
            setNewTodo("");
            setNewTodoPublic(false);
            toast.success("Ajouté !");
        } catch { toast.error("Erreur création"); }
    }

    const startEditing = (id, text, isPublic) => { setEditingId(id); setEditText(text); setEditIsPublic(isPublic); };
    const cancelEditing = () => { setEditingId(null); setEditText(""); setEditIsPublic(false); };
    
    const saveEdit = async (id) => {
        if (!editText.trim()) return;
        try {
            const res = await axios.put(API_BASE + "/todos/edit/" + id, { text: editText, isPublic: editIsPublic }, getConfig());
            setTodos(prev => prev.map(todo => todo._id === id ? res.data : todo));
            setEditingId(null);
            toast.success("Modifié !");
        } catch { toast.error("Erreur modification"); }
    };

    const handleOnDragEnd = async (result) => {
        if (!result.destination) return;
        const items = Array.from(todos);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);
        setTodos(items);
        try { await axios.put(API_BASE + "/todos/reorder", { todos: items }, getConfig()); } catch {
            toast.error("Impossible de sauvegarder l'ordre");
        }
    }

    if (!token) {
        return (
            <>
                <Toaster position="bottom-center" toastOptions={{ style: { background: '#333', color: '#fff' } }} />
                {page === "login" ? <Login setToken={setToken} setPage={setPage} setUsername={setUsername} /> : <Register setPage={setPage} />}
            </>
        );
    }

    const totalTasks = todos.length;
    const completedTasks = todos.filter(t => t.complete).length;
    const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
    const hour = new Date().getHours();
    const greeting = hour < 18 ? "Bonjour" : "Bonsoir";
    const initial = username.charAt(0).toUpperCase();

    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col items-center py-12 px-4">
            <Toaster position="bottom-center" toastOptions={{ style: { background: '#333', color: '#fff' } }} />

            <div className="w-full max-w-3xl mb-8 flex items-center justify-between">
                <div className="flex items-center gap-4 cursor-pointer" onClick={() => setView("tasks")}>
                    <div className="w-14 h-14 rounded-full bg-linear-to-br from-indigo-500 via-purple-500 to-pink-500 p-0.5 shadow-lg shadow-purple-500/30">
                        <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center text-xl font-bold text-white">
                            {initial}
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-gray-400 text-sm font-medium uppercase tracking-wider">{greeting},</span>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold text-white leading-tight">{username}</h1>
                            {streak > 0 && (
                                <div className="flex items-center gap-1 bg-orange-900/50 border border-orange-600 px-2 py-0.5 rounded-full animate-pulse">
                                    <span className="text-lg">🔥</span><span className="text-sm font-bold text-orange-400">{streak}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleOpenFriends}
                        className={`relative p-3 rounded-xl transition-all border ${view === "friends" ? "bg-purple-600 border-purple-500 text-white" : "bg-gray-800 text-purple-400 border-gray-700 hover:bg-gray-700"}`}
                        title="Communauté"
                    >
                        {hasNotification && (
                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                        )}
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
                    </button>

                    <button onClick={logout} className="p-3 rounded-xl bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-red-400 transition-all border border-gray-700" title="Se déconnecter">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></svg>
                    </button>
                </div>
            </div>

            {view === "friends" ? (
                // ICI : ON PASSE L'ARGUMENT "currentUsername"
                <div className="w-full max-w-3xl">
                    <Friends token={token} goBack={() => setView("tasks")} currentUsername={username} />
                </div>
            ) : (
                <>
                    {/* ... Le reste du code des tâches ... */}
                    <div className="w-full max-w-3xl mb-8">
                        <div className="flex justify-between text-sm text-gray-400 mb-2 font-medium"><span>Progression</span><span>{progress}%</span></div>
                        <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden border border-gray-700"><div className="bg-linear-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div></div>
                        {progress === 100 && totalTasks > 0 && <p className="text-center text-sm text-green-400 mt-2 animate-bounce">🎉 Bravo ! Tout est terminé !</p>}
                    </div>

                    <div className="w-full max-w-3xl">
                        {isLoading ? (
                            <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-10 w-10 border-2 border-purple-500"></div></div>
                        ) : (
                            <DragDropContext onDragEnd={handleOnDragEnd}>
                                <Droppable droppableId="todos">
                                    {(provided) => (
                                        <div className="space-y-4" {...provided.droppableProps} ref={provided.innerRef}>
                                            {todos.length > 0 ? todos.map((todo, index) => (
                                                <Draggable key={todo._id} draggableId={todo._id} index={index}>
                                                    {(provided, snapshot) => (
                                                        <div ref={provided.innerRef} {...provided.draggableProps} className={`group p-4 rounded-2xl flex items-center border border-gray-800 hover:border-gray-600 transition-colors ${todo.complete ? "bg-gray-800/50 opacity-50" : "bg-gray-800"} ${snapshot.isDragging ? "shadow-2xl shadow-purple-500/40 border-purple-500 scale-105 z-50" : ""}`}>
                                                            {editingId === todo._id ? (
                                                                <div className="flex items-center w-full gap-2 min-w-0">
                                                                    <input type="text" value={editText} onChange={(e) => setEditText(e.target.value)} className="grow bg-gray-900 border border-purple-500 rounded-lg p-2 text-white outline-none min-w-0" autoFocus onKeyDown={(e) => e.key === 'Enter' && saveEdit(todo._id)} />
                                                                    <div onClick={() => setEditIsPublic(!editIsPublic)} className={`px-2 py-2 rounded-lg cursor-pointer text-xs font-bold border transition-colors shrink-0 ${editIsPublic ? "bg-blue-900/50 border-blue-500 text-blue-400" : "bg-gray-700 border-gray-600 text-gray-400"}`}>{editIsPublic ? "Pub" : "Priv"}</div>
                                                                    <div className="flex gap-1 shrink-0">
                                                                        <div onClick={() => saveEdit(todo._id)} className="p-2 text-green-400 hover:bg-green-400/20 rounded-lg cursor-pointer"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg></div>
                                                                        <div onClick={cancelEditing} className="p-2 text-red-400 hover:bg-red-400/20 rounded-lg cursor-pointer"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></div>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <div {...provided.dragHandleProps} className="mr-4 cursor-grab active:cursor-grabbing text-gray-600 p-3 -ml-3 hover:text-white shrink-0"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" /></svg></div>
                                                                    <div onClick={() => completeTodo(todo._id)} className={`cursor-pointer w-6 h-6 mr-4 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${todo.complete ? "bg-green-500 border-green-500" : "border-gray-600 group-hover:border-purple-400"}`}>{todo.complete && <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}</div>
                                                                    <div onClick={() => completeTodo(todo._id)} className={`text-lg font-medium grow text-gray-100 cursor-pointer flex flex-wrap items-center gap-2 min-w-0 ${todo.complete ? "line-through" : ""}`}>
                                                                        <span className="wrap-break-word w-full">{todo.text}</span>
                                                                        {todo.isPublic ? <span className="text-[10px] bg-blue-900/50 text-blue-400 px-1.5 py-0.5 rounded-full border border-blue-800 shrink-0">Public</span> : <span className="text-[10px] bg-gray-700/50 text-gray-500 px-1.5 py-0.5 rounded-full border border-gray-600 shrink-0">Privé</span>}
                                                                    </div>
                                                                    <div className="flex gap-1 shrink-0 ml-2">
                                                                        <div onClick={() => startEditing(todo._id, todo.text, todo.isPublic)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-blue-500/20 hover:text-blue-400 cursor-pointer transition-colors"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg></div>
                                                                        <div onClick={(e) => { e.stopPropagation(); deleteTodo(todo._id) }} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-500/20 hover:text-red-500 cursor-pointer transition-colors"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></div>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    )}
                                                </Draggable>
                                            )) : <div className="text-center py-10 text-gray-500"><p className="text-xl mb-2">🔒</p><p>Espace sécurisé vide.</p></div>}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </DragDropContext>
                        )}
                    </div>

                    <div className="fixed bottom-10 right-10 w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-bold bg-linear-to-br from-blue-500 to-purple-600 cursor-pointer shadow-2xl hover:scale-110 hover:rotate-90 transition-all duration-300 z-10" onClick={() => setPopupActive(true)}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg></div>

                    {popupActive && (
                        <div className="fixed inset-0 bg-black/80 flex items-center justify-center backdrop-blur-sm z-50 p-4">
                            <div className="bg-gray-900 text-white p-6 rounded-3xl w-full max-w-md border border-gray-700">
                                <div className="absolute top-4 right-4 p-2 cursor-pointer hover:text-red-500" onClick={() => setPopupActive(false)}>X</div>
                                <h3 className="text-2xl font-bold mb-6">Nouvelle Tâche</h3>
                                <input type="text" className="w-full p-4 bg-gray-950 border border-gray-700 rounded-xl mb-6 focus:border-blue-500 focus:outline-none" onChange={e => setNewTodo(e.target.value)} value={newTodo} placeholder="Quoi de neuf ?" autoFocus onKeyDown={(e) => e.key === 'Enter' && addTodo()}/>
                                <div className={`flex items-center gap-3 p-3 rounded-xl mb-6 cursor-pointer border transition-all ${newTodoPublic ? "bg-blue-900/30 border-blue-500" : "bg-gray-800 border-gray-700"}`} onClick={() => setNewTodoPublic(!newTodoPublic)}>
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${newTodoPublic ? "border-blue-400 bg-blue-400" : "border-gray-500"}`}>{newTodoPublic && <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-white"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}</div>
                                    <div className="flex flex-col"><span className={`font-bold ${newTodoPublic ? "text-blue-400" : "text-gray-400"}`}>{newTodoPublic ? "Tâche Publique 🌍" : "Tâche Privée 🔒"}</span><span className="text-xs text-gray-500">{newTodoPublic ? "Visible par les amis & Compte pour le classement" : "Invisible & Ne compte pas pour le classement"}</span></div>
                                </div>
                                <div className="w-full p-4 rounded-xl bg-linear-to-r from-blue-500 to-purple-600 font-bold text-center cursor-pointer hover:brightness-110" onClick={addTodo}>Ajouter</div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default App;