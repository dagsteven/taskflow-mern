import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

// URL de Production (Render) ou Local
const API_URL = "https://taskflow-mern-r737.onrender.com/api/auth";

// AJOUTE setUsername DANS LES PROPS ICI 👇
function Login({ setToken, setPage, setUsername }) {
    const [username, setUsernameInput] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = async () => {
        try {
            const res = await axios.post(API_URL + "/login", { username, password });
            
            localStorage.setItem("token", res.data.token);
            localStorage.setItem("username", res.data.username);
            
            setToken(res.data.token);
            setUsername(res.data.username); // ⚠️ C'EST ICI QUE CA SE JOUE
            
            toast.success("Bon retour " + res.data.username + " !");
        } catch (err) {
            toast.error(err.response?.data?.message || "Erreur de connexion");
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4 font-sans">
            <div className="bg-gray-800 p-8 rounded-2xl w-full max-w-md border border-gray-700 shadow-2xl">
                <h2 className="text-3xl font-bold mb-6 text-center bg-clip-text text-transparent bg-linear-to-r from-blue-400 to-purple-500">
                    Connexion
                </h2>
                
                <input 
                    type="text" placeholder="Pseudo" 
                    className="w-full p-4 bg-gray-900 border border-gray-700 rounded-xl mb-4 focus:border-blue-500 focus:outline-none transition-colors"
                    onChange={e => setUsernameInput(e.target.value)}
                />
                <input 
                    type="password" placeholder="Mot de passe" 
                    className="w-full p-4 bg-gray-900 border border-gray-700 rounded-xl mb-6 focus:border-blue-500 focus:outline-none transition-colors"
                    onChange={e => setPassword(e.target.value)}
                />

                <button 
                    onClick={handleLogin}
                    className="w-full p-4 rounded-xl bg-linear-to-r from-blue-500 to-purple-600 font-bold hover:brightness-110 active:scale-95 transition-all"
                >
                    Se connecter
                </button>

                <p className="text-center mt-6 text-gray-400 text-sm cursor-pointer hover:text-white" onClick={() => setPage("register")}>
                    Pas de compte ? S'inscrire
                </p>
            </div>
        </div>
    );
}

export default Login;