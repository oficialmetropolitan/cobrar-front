import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Lock, User, Loader2, ShieldCheck } from 'lucide-react';
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
      const token = res.data.access_token;
      localStorage.setItem('token', token);
      localStorage.setItem('is_admin', String(res.data.is_admin));
      const meRes = await axios.get('https://api.bancometropolitan.com.br/api/users/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      localStorage.setItem('full_name', meRes.data.full_name);
      localStorage.setItem('user_email', username);
      toast.success('Login realizado com sucesso!');
      navigate('/');
    } catch (error) {
      console.error("Erro no login:", error);
      toast.error('Acesso negado. Verifique seu usuário e senha.');
    } finally {
      setLoading(false);
    }
  };

  const blue1 = '#4f7cff';
  const blue2 = '#7ba4ff';
  const blueRgba = (a: number) => `rgba(79,124,255,${a})`;

  const inputStyle: React.CSSProperties = {
    height: 46, padding: '0 16px 0 40px', background: '#0c1220',
    border: '1px solid #1f2937', borderRadius: 9, color: '#f3f4f6',
    fontFamily: "'DM Sans', sans-serif", fontSize: 14,
  };
  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = blue1;
    e.currentTarget.style.boxShadow = `0 0 0 3px ${blueRgba(.12)}`;
  };
  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = '#1f2937';
    e.currentTarget.style.boxShadow = 'none';
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 12, fontWeight: 600, letterSpacing: '.08em',
    textTransform: 'uppercase', color: '#9ca3af',
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600&family=DM+Sans:wght@300;400;500;600&display=swap');
        @keyframes rise { from { opacity:0; transform:translateY(28px); } to { opacity:1; transform:translateY(0); } }
        input::placeholder { color: #374151 !important; }
      `}</style>
      <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
        style={{ background: '#0c1220', fontFamily: "'DM Sans', sans-serif" }}>
        <div className="absolute rounded-full pointer-events-none"
          style={{ width:480,height:480,background:'radial-gradient(circle,#1e3a5f,transparent 70%)',filter:'blur(90px)',opacity:.25,top:-100,left:-120 }} />
        <div className="absolute rounded-full pointer-events-none"
          style={{ width:360,height:360,background:`radial-gradient(circle,${blue1},transparent 70%)`,filter:'blur(90px)',opacity:.25,bottom:-80,right:-80 }} />
        <div className="w-full max-w-[440px] relative z-10"
          style={{ background:'#111827',border:`1px solid ${blueRgba(.18)}`,borderRadius:16,padding:'40px 36px',animation:'rise .55s cubic-bezier(.22,1,.36,1) both' }}>
          <div className="flex items-center gap-2.5 mb-7">
            <div className="flex items-center justify-center shrink-0"
              style={{ width:36,height:36,borderRadius:8,background:`linear-gradient(135deg,${blue1},${blue2})` }}>
              <ShieldCheck size={18} color="#fff" strokeWidth={2.5} />
            </div>
            <span style={{ fontFamily:"'Playfair Display',serif",fontSize:15,color:blue2,letterSpacing:'.04em' }}>
              Banco Metropolitan
            </span>
          </div>
          <div className="mb-7" style={{ height:1,background:`linear-gradient(90deg,transparent,${blueRgba(.3)},transparent)` }} />
          <h1 style={{ fontFamily:"'Playfair Display',serif",fontSize:23,color:'#fff',marginBottom:8 }}>Painel Administrativo</h1>
          <p style={{ fontSize:13.5,color:'#6b7280',marginBottom:28,lineHeight:1.6 }}>Acesse sua conta para gerenciar a carteira de recebíveis.</p>
          <form onSubmit={handleLogin} noValidate>
            <div className="mb-4">
              <label htmlFor="login-username" className="block mb-1.5" style={labelStyle}>Login (Metropolitan)</label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color:'#4b5563' }} />
                <input id="login-username" type="text" required value={username} onChange={e=>setUsername(e.target.value)}
                  placeholder="seu@email.com" className="w-full outline-none transition-all duration-200" style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
              </div>
            </div>
            <div className="mb-1">
              <label htmlFor="login-password" className="block mb-1.5" style={labelStyle}>Senha</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color:'#4b5563' }} />
                <input id="login-password" type="password" required value={password} onChange={e=>setPassword(e.target.value)}
                  placeholder="••••••••" className="w-full outline-none transition-all duration-200" style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
              </div>
            </div>
            <div className="flex justify-end mb-5">
              <Link to="/esqueci-senha" state={{ email: username }} className="transition-colors duration-200"
                style={{ fontSize:13,color:'#94a3b8',textDecoration:'none' }}
                onMouseEnter={e=>(e.currentTarget.style.color=blue2)} onMouseLeave={e=>(e.currentTarget.style.color='#94a3b8')}>
                Esqueci minha senha
              </Link>
            </div>
            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 transition-all duration-200"
              style={{ height:48,border:'none',borderRadius:9,background:`linear-gradient(135deg,${blue1},${blue2})`,color:'#fff',
                fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:600,letterSpacing:'.04em',
                cursor:loading?'not-allowed':'pointer',opacity:loading?.55:1,boxShadow:`0 4px 18px ${blueRgba(.25)}` }}
              onMouseEnter={e=>{ if(!loading){ e.currentTarget.style.opacity='0.92'; e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow=`0 6px 24px ${blueRgba(.35)}`; }}}
              onMouseLeave={e=>{ e.currentTarget.style.opacity=loading?'0.55':'1'; e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow=`0 4px 18px ${blueRgba(.25)}`; }}>
              {loading ? <Loader2 size={18} className="animate-spin" /> : 'Acessar Sistema'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};