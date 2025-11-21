import { useState, useEffect } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const API_BASE = "https://taskflow-mern-r737.onrender.com/api";

function App() {
    const [todos, setTodos] = useState([]);
    const [popupActive, setPopupActive] = useState(false);
    const [newTodo, setNewTodo] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    // --- CHARGEMENT INITIAL ---
    useEffect(() => {
        const getTodos = async () => {
            setIsLoading(true);
            try {
                const res = await axios.get(API_BASE + "/todos");
                setTodos(res.data);
            } catch {
                toast.error("Impossible de charger les tâches");
            } finally {
                setIsLoading(false);
            }
        };
        getTodos();
    }, []);

    // --- ACTIONS ---

    const completeTodo = async (id) => {
        try {
            const data = await axios.put(API_BASE + "/todos/complete/" + id);
            setTodos(prevTodos => prevTodos.map(todo => {
                if (todo._id === data.data._id) todo.complete = data.data.complete;
                return todo;
            }));
        } catch { toast.error("Erreur de connexion"); }
    }

    const deleteTodo = async (id) => {
        try {
            const data = await axios.delete(API_BASE + "/todos/delete/" + id);
            setTodos(prevTodos => prevTodos.filter(todo => todo._id !== data.data._id));
            toast.success("Tâche supprimée !");
        } catch { toast.error("Erreur lors de la suppression"); }
    }

    const addTodo = async () => {
        if (newTodo.trim() === "") return toast.error("Le texte est vide !");
        try {
            const data = await axios.post(API_BASE + "/todos/new", { text: newTodo });
            setTodos(prevTodos => [...prevTodos, data.data]);
            setPopupActive(false);
            setNewTodo("");
            toast.success("Ajouté !");
        } catch { toast.error("Erreur création"); }
    }

    // --- DRAG & DROP ---
    const handleOnDragEnd = async (result) => {
        if (!result.destination) return;

        const items = Array.from(todos);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        setTodos(items);

        try {
            // Correction ici : on a retiré (err)
            await axios.put(API_BASE + "/todos/reorder", { todos: items });
        } catch {
            toast.error("Erreur de sauvegarde de l'ordre");
        }
    }

    // --- INTERFACE ---
    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col items-center py-12 px-4">
            <Toaster position="bottom-center" toastOptions={{ style: { background: '#333', color: '#fff' } }} />

            {/* HEADER */}
            <div className="w-[45%] md:w-[45%] mb-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8 text-white">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                    </div>
                    <h1 className="text-5xl font-bold tracking-tight">
                        Task<span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-purple-500">Flow</span>
                    </h1>
                </div>
                <div className="text-gray-500 font-bold text-md">{todos.length} Tâches</div>
            </div>

            {/* LISTE */}
            <div className="w-[45%] md:w-[45%]">
                <h4 className="text-sm text-gray-400 mb-6 uppercase tracking-widest font-semibold pl-1">Votre Espace</h4>

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
                                                <div 
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    className={`group p-4 rounded-2xl flex items-center border border-gray-800 hover:border-gray-600 transition-colors 
                                                    ${todo.complete ? "bg-gray-800/50 opacity-50" : "bg-gray-800"}
                                                    ${snapshot.isDragging ? "shadow-2xl shadow-purple-500/40 border-purple-500 scale-105 z-50" : ""}`}
                                                >
                                                    {/* HANDLE */}
                                                    <div {...provided.dragHandleProps} className="mr-4 cursor-grab active:cursor-grabbing text-gray-600 p-3 -ml-3 hover:text-white">
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
                                                        </svg>
                                                    </div>

                                                    {/* CHECKBOX */}
                                                    <div onClick={() => completeTodo(todo._id)} className={`cursor-pointer w-6 h-6 mr-4 rounded-full border-2 flex items-center justify-center transition-colors ${todo.complete ? "bg-green-500 border-green-500" : "border-gray-600 group-hover:border-purple-400"}`}>
                                                        {todo.complete && <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                                                    </div>
                                                    
                                                    {/* TEXTE */}
                                                    <div onClick={() => completeTodo(todo._id)} className={`text-lg font-medium grow text-gray-100 cursor-pointer ${todo.complete ? "line-through" : ""}`}>{todo.text}</div>
                                                    
                                                    {/* DELETE */}
                                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-500/20 hover:text-red-500 cursor-pointer transition-colors" onClick={(e) => { e.stopPropagation(); deleteTodo(todo._id) }}>
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                                    </div>
                                                </div>
                                            )}
                                        </Draggable>
                                    )) : <p className="text-gray-500 text-center">Aucune tâche</p>}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>
                )}
            </div>

            {/* FAB */}
            <div 
                className="fixed bottom-10 right-10 w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-bold bg-linear-to-br from-blue-500 to-purple-600 cursor-pointer shadow-2xl hover:scale-110 hover:rotate-180 transition-all duration-300 z-10" 
                onClick={() => setPopupActive(true)}
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            </div>

            {/* MODAL */}
            {popupActive && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center backdrop-blur-sm z-50 p-4">
                    <div className="bg-gray-900 text-white p-6 rounded-3xl w-full max-w-md border border-gray-700">
                        <div className="absolute top-4 right-4 p-2 cursor-pointer hover:text-red-500" onClick={() => setPopupActive(false)}>X</div>
                        <h3 className="text-2xl font-bold mb-6">Nouvelle Tâche</h3>
                        <input type="text" className="w-full p-4 bg-gray-950 border border-gray-700 rounded-xl mb-6 focus:border-blue-500 focus:outline-none" onChange={e => setNewTodo(e.target.value)} value={newTodo} placeholder="Quoi de neuf ?" autoFocus onKeyDown={(e) => e.key === 'Enter' && addTodo()}/>
                        <div className="w-full p-4 rounded-xl bg-linear-to-r from-blue-500 to-purple-600 font-bold text-center cursor-pointer hover:brightness-110" onClick={addTodo}>Ajouter</div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;