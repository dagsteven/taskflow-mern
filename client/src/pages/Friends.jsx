import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';


// URL DE PRODUCTION
const API_BASE = "https://taskflow-mern-r737.onrender.com/api";

function Friends({ token, goBack }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [friends, setFriends] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);

    const getConfig = useCallback(() => ({ 
        headers: { Authorization: `Bearer ${token}` } 
    }), [token]);

    const loadFriends = useCallback(async () => {
        try {
            const res = await axios.get(`${API_BASE}/social/leaderboard`, getConfig());
            setFriends(res.data);
        } catch (err) { console.error(err); }
    }, [getConfig]);

    const loadRequests = useCallback(async () => {
        try {
            const res = await axios.get(`${API_BASE}/social/request/list`, getConfig());
            setRequests(res.data);
        } catch (err) { console.error(err); }
    }, [getConfig]);

    useEffect(() => { 
        loadFriends(); 
        loadRequests();
    }, [loadFriends, loadRequests]);

    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }
        const delayDebounce = setTimeout(async () => {
            try {
                const res = await axios.get(`${API_BASE}/social/search?q=${query.trim()}`, getConfig());
                setResults(res.data);
            } catch (err) { console.error(err); }
        }, 300);
        return () => clearTimeout(delayDebounce);
    }, [query, getConfig]);

    const sendRequest = async (username) => {
        try {
            setLoading(true);
            await axios.post(`${API_BASE}/social/request/send`, { username }, getConfig());
            toast.success(`Demande envoyée à ${username} !`);
            setQuery("");
            setResults([]);
        } catch (err) {
            toast.error(err.response?.data?.message || "Erreur envoi");
        } finally {
            setLoading(false);
        }
    };

    const acceptRequest = async (requesterId) => {
        try {
            await axios.post(`${API_BASE}/social/request/accept`, { requesterId }, getConfig());
            toast.success("Nouvel ami ajouté !");
            loadRequests();
            loadFriends();
        } catch { toast.error("Erreur lors de l'acceptation"); }
    };

    const removeFriend = async (username) => {
        if(!confirm(`Retirer ${username} de vos amis ?`)) return;
        try {
            await axios.post(`${API_BASE}/social/remove`, { username }, getConfig());
            toast.success(`${username} retiré.`);
            loadFriends();
        } catch { toast.error("Erreur suppression"); }
    };

    return (
        <div className="w-full space-y-8">
            
            {/* HEADER INTERNE (Communauté + Retour) */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
                <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-linear-to-r from-purple-400 to-pink-500">
                    Communauté
                </h2>
                <button onClick={goBack} className="flex items-center gap-2 text-gray-400 hover:text-white border border-gray-700 px-5 py-2 rounded-xl hover:bg-gray-800 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" /></svg>
                    Retour aux tâches
                </button>
            </div>

            {/* BLOC RECHERCHE */}
            <div className="bg-gray-800 p-6 rounded-3xl border border-gray-700 shadow-xl">
                <h3 className="text-xl font-bold mb-4 text-gray-200 flex items-center gap-2"><span>🔍</span> Trouver des amis</h3>
                <input 
                    type="text" placeholder="Rechercher un pseudo..." 
                    className="w-full p-4 bg-gray-900 border border-gray-600 rounded-xl focus:border-purple-500 focus:outline-none transition-colors text-lg" 
                    value={query} onChange={(e) => setQuery(e.target.value)} 
                />
                
                {results.length > 0 && (
                    <div className="mt-4 flex flex-col gap-2">
                        {results.map(user => (
                            <div key={user._id} className="flex justify-between items-center p-3 bg-gray-900 rounded-lg border border-gray-700 hover:border-gray-500 transition-colors">
                                <span className="font-medium text-lg ml-2">{user.username}</span>
                                <button onClick={() => sendRequest(user.username)} disabled={loading} className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2">
                                    Inviter
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* BLOC DEMANDES REÇUES */}
            {requests.length > 0 && (
                <div className="bg-gray-800 p-6 rounded-3xl border border-blue-500/30 shadow-xl shadow-blue-900/20">
                    <h3 className="text-xl font-bold mb-4 text-blue-300 flex items-center gap-2"><span>📩</span> Demandes reçues</h3>
                    <div className="flex flex-col gap-2">
                        {requests.map(req => (
                            <div key={req._id} className="flex justify-between items-center p-4 bg-gray-900 rounded-xl border border-gray-700">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white">{req.username.charAt(0).toUpperCase()}</div>
                                    <span className="font-bold text-lg">{req.username}</span>
                                </div>
                                <button onClick={() => acceptRequest(req._id)} className="bg-green-600 hover:bg-green-500 text-white px-5 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2">
                                    Accepter
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* BLOC CLASSEMENT */}
            <div className="bg-gray-800 p-6 rounded-3xl border border-gray-700 shadow-xl">
                <h3 className="text-xl font-bold mb-6 text-gray-200 flex items-center gap-2"><span>🏆</span> Classement & Amis</h3>
                
                {friends.length > 0 ? (
                    <div className="flex flex-col gap-3">
                        {friends.map((friend, index) => (
                            <div key={index} className="flex justify-between items-center p-4 bg-gray-900 rounded-2xl border border-gray-700 relative overflow-hidden group hover:border-gray-500 transition-all">
                                {index === 0 && <div className="absolute left-0 top-0 bottom-0 w-2 bg-yellow-400"></div>}
                                {index === 1 && <div className="absolute left-0 top-0 bottom-0 w-2 bg-gray-400"></div>}
                                {index === 2 && <div className="absolute left-0 top-0 bottom-0 w-2 bg-orange-700"></div>}

                                <div className="flex items-center gap-4 pl-2">
                                    <span className={`font-bold text-xl w-8 ${index < 3 ? 'text-white' : 'text-gray-500'}`}>#{index + 1}</span>
                                    <div className="w-10 h-10 rounded-full bg-gray-800 border border-gray-600 flex items-center justify-center font-bold text-gray-300">{friend.username.charAt(0).toUpperCase()}</div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-lg text-white">{friend.username}</span>
                                        <span className="text-sm text-gray-400 font-medium">{friend.score} Tâches complétées</span>
                                    </div>
                                </div>

                                <button onClick={() => removeFriend(friend.username)} className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all" title="Retirer cet ami">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z" /></svg>
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 text-gray-500 border-2 border-dashed border-gray-700 rounded-xl">
                        <p className="text-sm">Vous n'avez pas encore d'amis.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Friends;