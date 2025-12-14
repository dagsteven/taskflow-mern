import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

// URL DE PRODUCTION (RENDER)
const API_URL = "https://taskflow-mern-r737.onrender.com/api/auth";

// URL DE DÉVELOPPEMENT (LOCALHOST)
// const API_URL = "http://localhost:5000/api/auth";


function Register({ setPage }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const handleRegister = async () => {
        try {
            await axios.post(API_URL + "/register", { username, password });
            toast.success("Compte créé ! Connectez-vous.");
            setPage("login"); // On bascule vers la page de connexion
        } catch (err) {
            toast.error(err.response?.data?.message || "Erreur d'inscription");
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4 font-sans">
            <div className="bg-gray-800 p-8 rounded-2xl w-full max-w-md border border-gray-700 shadow-2xl">
                <h2 className="text-3xl font-bold mb-6 text-center bg-clip-text text-transparent bg-linear-to-r from-blue-400 to-purple-500">
                    Rejoindre TaskFlow
                </h2>
                
                <input 
                    type="text" placeholder="Pseudo" 
                    className="w-full p-4 bg-gray-900 border border-gray-700 rounded-xl mb-4 focus:border-purple-500 focus:outline-none transition-colors"
                    onChange={e => setUsername(e.target.value)}
                />
                <input 
                    type="password" placeholder="Mot de passe" 
                    className="w-full p-4 bg-gray-900 border border-gray-700 rounded-xl mb-6 focus:border-purple-500 focus:outline-none transition-colors"
                    onChange={e => setPassword(e.target.value)}
                />

                <button 
                    onClick={handleRegister}
                    className="w-full p-4 rounded-xl bg-linear-to-r from-blue-500 to-purple-600 font-bold hover:brightness-110 active:scale-95 transition-all"
                >
                    S'inscrire
                </button>

                <p className="text-center mt-6 text-gray-400 text-sm cursor-pointer hover:text-white" onClick={() => setPage("login")}>
                    Déjà un compte ? Se connecter
                </p>
            </div>
        </div>
    );
}

export default Register;