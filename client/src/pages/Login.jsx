import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

// URL de Production
const API_URL = "https://taskflow-mern-r737.onrender.com/api/auth";

function Login({ setToken, setPage, setUsername }) {
    const [usernameInput, setUsernameInput] = useState("");
    const [password, setPassword] = useState("");
    
    // NOUVEAU : État pour voir le mot de passe
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async () => {
        try {
            // NOUVEAU : .trim() nettoie les espaces avant d'envoyer
            const cleanUsername = usernameInput.trim();

            const res = await axios.post(API_URL + "/login", { 
                username: cleanUsername, 
                password 
            });
            
            localStorage.setItem("token", res.data.token);
            localStorage.setItem("username", res.data.username);
            
            setToken(res.data.token);
            setUsername(res.data.username);
            
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
                
                {/* Champ Pseudo */}
                <input 
                    type="text" placeholder="Pseudo" 
                    className="w-full p-4 bg-gray-900 border border-gray-700 rounded-xl mb-4 focus:border-blue-500 focus:outline-none transition-colors"
                    onChange={e => setUsernameInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />

                {/* Champ Mot de passe avec Oeil */}
                <div className="relative mb-6">
                    <input 
                        type={showPassword ? "text" : "password"} // Ici on change le type dynamiquement
                        placeholder="Mot de passe" 
                        className="w-full p-4 bg-gray-900 border border-gray-700 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                        onChange={e => setPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    />
                    {/* Icône Oeil cliquable */}
                    <div 
                        className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-white"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? (
                            // Oeil Barré (Masquer)
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                        ) : (
                            // Oeil Ouvert (Voir)
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        )}
                    </div>
                </div>

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