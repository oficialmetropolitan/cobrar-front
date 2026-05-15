import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import { Eye, EyeOff, Lock, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';

const checks = [
  { label: 'Mínimo 8 caracteres', test: (p: string) => p.length >= 8 },
  { label: 'Letra maiúscula', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Letra minúscula', test: (p: string) => /[a-z]/.test(p) },
  { label: 'Número', test: (p: string) => /[0-9]/.test(p) },
  { label: 'Caractere especial (!@#…)', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];
const strengthLabel = (s: number) => {
  if (s <= 1) return { label: 'Muito fraca', color: '#ef4444' };
  if (s === 2) return { label: 'Fraca', color: '#f97316' };
  if (s === 3) return { label: 'Razoável', color: '#eab308' };
  if (s === 4) return { label: 'Forte', color: '#22c55e' };
  return { label: 'Muito forte', color: '#10b981' };
};

const blue1 = '#4f7cff';
const blue2 = '#7ba4ff';
const blueRgba = (a: number) => `rgba(79,124,255,${a})`;

const RedefinirSenhaPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const emailFromUrl = searchParams.get('email') || '';

  useEffect(() => {
    if (!token) { toast.error('Token de redefinição não encontrado ou inválido.'); navigate('/esqueci-senha'); }
  }, [token, navigate]);

  const passedChecks = checks.filter(c => c.test(password)).length;
  const strength = strengthLabel(passedChecks);
  const match = password && confirmPassword && password === confirmPassword;
  const mismatch = confirmPassword && password !== confirmPassword;
  const canSubmit = !loading && passedChecks >= 3 && match;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { toast.error('As senhas não coincidem.'); return; }
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://api.bancometropolitan.com.br';
      const response = await axios.post(`${apiUrl}/api/auth/reset-password`, { token, new_password: password });
      toast.success(response.data.message);
      setDone(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        toast.error(`Erro: ${error.response.data.detail || 'Tente novamente.'}`);
      } else { toast.error('Ocorreu um erro inesperado.'); }
    } finally { setLoading(false); }
  };

  const inputBase: React.CSSProperties = {
    height: 46, padding: '0 42px 0 40px', background: '#0c1220',
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
    fontSize: 12, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: '#9ca3af',
  };
  const eyeStyle: React.CSSProperties = {
    background: 'none', border: 'none', cursor: 'pointer', color: '#4b5563',
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600&family=DM+Sans:wght@300;400;500;600&display=swap');
        @keyframes rsw-rise { from { opacity:0; transform:translateY(28px); } to { opacity:1; transform:translateY(0); } }
        @keyframes rsw-pop { from { opacity:0; transform:scale(.5); } to { opacity:1; transform:scale(1); } }
        @keyframes rsw-rotate { to { transform:rotate(360deg); } }
        @keyframes rsw-fill { from { width:0; } to { width:100%; } }
        input::placeholder { color: #374151 !important; }
      `}</style>

      <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
        style={{ background: '#0c1220', fontFamily: "'DM Sans', sans-serif" }}>
        <div className="absolute rounded-full pointer-events-none"
          style={{ width:480,height:480,background:'radial-gradient(circle,#1e3a5f,transparent 70%)',filter:'blur(90px)',opacity:.25,top:-100,left:-120 }} />
        <div className="absolute rounded-full pointer-events-none"
          style={{ width:360,height:360,background:`radial-gradient(circle,${blue1},transparent 70%)`,filter:'blur(90px)',opacity:.25,bottom:-80,right:-80 }} />

        <div className="w-full max-w-[440px] relative z-10"
          style={{ background:'#111827',border:`1px solid ${blueRgba(.18)}`,borderRadius:16,padding:'40px 36px',animation:'rsw-rise .55s cubic-bezier(.22,1,.36,1) both' }}>

          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-7">
            <div className="flex items-center justify-center shrink-0"
              style={{ width:36,height:36,borderRadius:8,background:`linear-gradient(135deg,${blue1},${blue2})` }}>
              <ShieldCheck size={18} color="#fff" strokeWidth={2.5} />
            </div>
            <span style={{ fontFamily:"'Playfair Display',serif",fontSize:15,color:blue2,letterSpacing:'.04em' }}>Banco Metropolitan</span>
          </div>
          <div className="mb-7" style={{ height:1,background:`linear-gradient(90deg,transparent,${blueRgba(.3)},transparent)` }} />

          {done ? (
            <div className="flex flex-col items-center text-center gap-3 py-2"
              style={{ animation:'rsw-rise .45s cubic-bezier(.22,1,.36,1) both' }}>
              <div className="flex items-center justify-center"
                style={{ width:64,height:64,borderRadius:'50%',background:'rgba(34,197,94,.1)',animation:'rsw-pop .5s cubic-bezier(.34,1.56,.64,1) .1s both' }}>
                <CheckCircle2 size={32} color="#22c55e" />
              </div>
              <p style={{ fontFamily:"'Playfair Display',serif",fontSize:21,color:'#fff' }}>Senha redefinida!</p>
              <p style={{ fontSize:13.5,color:'#6b7280',lineHeight:1.5 }}>
                Sua nova senha foi salva com sucesso.<br />Redirecionando para o login…
              </p>
              <div className="w-full mt-1.5 overflow-hidden" style={{ height:2,background:'#1f2937',borderRadius:99 }}>
                <div style={{ height:'100%',borderRadius:99,background:`linear-gradient(90deg,${blue1},${blue2})`,animation:'rsw-fill 2.4s linear both' }} />
              </div>
            </div>
          ) : (
            <>
              <p style={{ fontFamily:"'Playfair Display',serif",fontSize:24,color:'#fff',marginBottom:6 }}>Crie sua nova senha</p>
              <p style={{ fontSize:13.5,color:'#6b7280',marginBottom:28,lineHeight:1.5 }}>
                Escolha uma senha segura para proteger sua conta.
                {emailFromUrl && <><br /><span style={{ color:'#9ca3af' }}>Conta: </span><strong style={{ color:'#e0e7ff' }}>{emailFromUrl}</strong></>}
              </p>

              <form onSubmit={handleSubmit} noValidate>
                {/* Nova senha */}
                <div className="mb-4">
                  <label htmlFor="password" className="block mb-1.5" style={labelStyle}>Nova senha</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color:'#4b5563' }} />
                    <input id="password" type={showPass?'text':'password'} value={password} placeholder="••••••••"
                      onChange={e=>setPassword(e.target.value)} required autoComplete="new-password"
                      className="w-full outline-none transition-all duration-200" style={inputBase} onFocus={onFocus} onBlur={onBlur} />
                    <button type="button" onClick={()=>setShowPass(v=>!v)} aria-label={showPass?'Ocultar':'Mostrar'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center p-1 rounded transition-colors" style={eyeStyle}
                      onMouseEnter={e=>(e.currentTarget.style.color='#9ca3af')} onMouseLeave={e=>(e.currentTarget.style.color='#4b5563')}>
                      {showPass ? <EyeOff size={15}/> : <Eye size={15}/>}
                    </button>
                  </div>
                  {password.length > 0 && (
                    <div className="mt-2.5">
                      <div className="grid grid-cols-5 gap-1 mb-1">
                        {checks.map((_,i) => <div key={i} className="rounded-full transition-colors duration-300"
                          style={{ height:3,background:i<passedChecks?strength.color:'#1f2937' }} />)}
                      </div>
                      <span className="transition-colors duration-300"
                        style={{ fontSize:11,fontWeight:600,letterSpacing:'.05em',textTransform:'uppercase',color:strength.color }}>{strength.label}</span>
                      <div className="flex flex-wrap gap-x-2.5 gap-y-1 mt-2">
                        {checks.map(c => <span key={c.label} className="flex items-center gap-1 transition-colors duration-200"
                          style={{ fontSize:11,color:c.test(password)?'#22c55e':'#6b7280' }}>
                          {c.test(password)?<CheckCircle2 size={11}/>:<XCircle size={11}/>}{c.label}
                        </span>)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirmar senha */}
                <div className="mb-1">
                  <label htmlFor="confirmPassword" className="block mb-1.5" style={labelStyle}>Confirme a nova senha</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color:'#4b5563' }} />
                    <input id="confirmPassword" type={showConfirm?'text':'password'} value={confirmPassword} placeholder="••••••••"
                      onChange={e=>setConfirmPassword(e.target.value)} required autoComplete="new-password"
                      className="w-full outline-none transition-all duration-200"
                      style={{ ...inputBase, borderColor: match?'#22c55e':mismatch?'#ef4444':'#1f2937' }}
                      onFocus={onFocus} onBlur={onBlur} />
                    <button type="button" onClick={()=>setShowConfirm(v=>!v)} aria-label={showConfirm?'Ocultar':'Mostrar'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center p-1 rounded transition-colors" style={eyeStyle}
                      onMouseEnter={e=>(e.currentTarget.style.color='#9ca3af')} onMouseLeave={e=>(e.currentTarget.style.color='#4b5563')}>
                      {showConfirm ? <EyeOff size={15}/> : <Eye size={15}/>}
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5" style={{ fontSize:12,minHeight:16,color:match?'#22c55e':'#ef4444' }}>
                    {match && <><CheckCircle2 size={13}/> As senhas coincidem</>}
                    {mismatch && <><XCircle size={13}/> As senhas não coincidem</>}
                  </div>
                </div>

                <button type="submit" disabled={!canSubmit} className="w-full flex items-center justify-center gap-2 mt-6 transition-all duration-200"
                  style={{ height:48,border:'none',borderRadius:9,background:`linear-gradient(135deg,${blue1},${blue2})`,color:'#fff',
                    fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:600,letterSpacing:'.04em',
                    cursor:canSubmit?'pointer':'not-allowed',opacity:canSubmit?1:.55,boxShadow:`0 4px 18px ${blueRgba(.25)}` }}
                  onMouseEnter={e=>{ if(canSubmit){ e.currentTarget.style.opacity='0.92'; e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow=`0 6px 24px ${blueRgba(.35)}`; }}}
                  onMouseLeave={e=>{ e.currentTarget.style.opacity=canSubmit?'1':'0.55'; e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow=`0 4px 18px ${blueRgba(.25)}`; }}>
                  {loading ? (<><div style={{ width:18,height:18,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'rsw-rotate .7s linear infinite' }}/> Salvando…</>) : 'Salvar nova senha'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default RedefinirSenhaPage;