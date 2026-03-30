import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Lock, User, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    try {
      const res = await axios.post('https://api.bancometropolitan.com.br/api/auth/token', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      
      // Salva os dados REAIS vindos do seu backend
      localStorage.setItem('token', res.data.access_token);
      localStorage.setItem('is_admin', String(res.data.is_admin)); 
      
      toast.success('Login realizado com sucesso!');
      navigate('/'); 
      
    } catch (error) {
      console.error("Erro no login:", error);
      toast.error('Acesso negado. Verifique seu usuário e senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md">
        <h1 className="text-2xl font-black text-slate-800 text-center mb-6">Painel Administrativo</h1>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Login (Metropolitan)</label>
            <div className="relative mt-1">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" required value={username} onChange={e => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" 
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Senha</label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="password" required value={password} onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" 
              />
            </div>
          </div>

          <button disabled={loading} className="w-full mt-4 bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition flex justify-center">
            {loading ? <Loader2 className="animate-spin" /> : 'Acessar Sistema'}
          </button>
        </form>
      </div>
    </div>
  );
};