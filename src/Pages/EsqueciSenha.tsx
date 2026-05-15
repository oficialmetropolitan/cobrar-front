import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import { Mail, ShieldCheck, ArrowLeft, CheckCircle2 } from 'lucide-react';

const EsqueciSenhaPage = () => {
    const location = useLocation();
    const emailFromLogin = (location.state as any)?.email || '';

    const [email, setEmail]     = useState(emailFromLogin);
    const [loading, setLoading] = useState(false);
    const [sent, setSent]       = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'https://api.bancometropolitan.com.br';
           await axios.post(`${apiUrl}/api/auth/forgot-password-admin`, { email });
            setSent(true);
        } catch {
            toast.error('Ocorreu um erro inesperado. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600&family=DM+Sans:wght@300;400;500;600&display=swap');
                @keyframes esp-rise {
                    from { opacity: 0; transform: translateY(28px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes esp-pop {
                    from { opacity: 0; transform: scale(.5); }
                    to   { opacity: 1; transform: scale(1); }
                }
                @keyframes esp-rotate { to { transform: rotate(360deg); } }
                input::placeholder { color: #374151 !important; }
            `}</style>

            <div
                className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
                style={{ background: '#0c1220', fontFamily: "'DM Sans', sans-serif" }}
            >
                {/* Ambient orbs */}
                <div
                    className="absolute rounded-full pointer-events-none"
                    style={{
                        width: 480, height: 480,
                        background: 'radial-gradient(circle, #1e3a5f, transparent 70%)',
                        filter: 'blur(90px)', opacity: 0.25,
                        top: -100, left: -120,
                    }}
                />
                <div
                    className="absolute rounded-full pointer-events-none"
                    style={{
                        width: 360, height: 360,
                        background: 'radial-gradient(circle, #4f7cff, transparent 70%)',
                        filter: 'blur(90px)', opacity: 0.25,
                        bottom: -80, right: -80,
                    }}
                />

                <div
                    className="w-full max-w-[440px] relative z-10"
                    style={{
                        background: '#111827',
                        border: '1px solid rgba(79,124,255,.18)',
                        borderRadius: 16,
                        padding: '40px 36px',
                        animation: 'esp-rise .55s cubic-bezier(.22,1,.36,1) both',
                    }}
                >
                    {/* Logo */}
                    <div className="flex items-center gap-2.5 mb-7">
                        <div
                            className="flex items-center justify-center shrink-0"
                            style={{
                                width: 36, height: 36, borderRadius: 8,
                                background: 'linear-gradient(135deg, #4f7cff, #7ba4ff)',
                            }}
                        >
                            <ShieldCheck size={18} color="#ffffff" strokeWidth={2.5} />
                        </div>
                        <span
                            style={{
                                fontFamily: "'Playfair Display', serif",
                                fontSize: 15, color: '#7ba4ff', letterSpacing: '.04em',
                            }}
                        >
                            Banco Metropolitan
                        </span>
                    </div>

                    {/* Divider */}
                    <div
                        className="mb-7"
                        style={{
                            height: 1,
                            background: 'linear-gradient(90deg, transparent, rgba(79,124,255,.3), transparent)',
                        }}
                    />

                    {sent ? (
                        <div
                            className="flex flex-col items-center text-center gap-3 py-2"
                            style={{ animation: 'esp-rise .45s cubic-bezier(.22,1,.36,1) both' }}
                        >
                            <div
                                className="flex items-center justify-center"
                                style={{
                                    width: 64, height: 64, borderRadius: '50%',
                                    background: 'rgba(79,124,255,.1)',
                                    animation: 'esp-pop .5s cubic-bezier(.34,1.56,.64,1) .1s both',
                                }}
                            >
                                <CheckCircle2 size={30} color="#4f7cff" />
                            </div>
                            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 21, color: '#ffffff' }}>
                                E-mail enviado!
                            </p>
                            <p style={{ fontSize: 13.5, color: '#6b7280', lineHeight: 1.6 }}>
                                Se uma conta com o endereço <strong style={{ color: '#e0e7ff' }}>{email}</strong> existir,
                                você receberá um link de redefinição em breve.
                            </p>
                            <p
                                className="w-full text-left"
                                style={{
                                    fontSize: 12, color: '#94a3b8',
                                    background: '#0c1220',
                                    border: '1px solid #1f2937',
                                    borderRadius: 8,
                                    padding: '12px 16px',
                                    lineHeight: 1.6,
                                    marginTop: 4,
                                }}
                            >
                                ⏱ O link expira em <strong>15 minutos</strong>.<br />
                                Verifique também a pasta de spam caso não encontre o e-mail.
                            </p>
                            <Link
                                to="/login"
                                className="flex items-center gap-1.5 mt-2 transition-colors duration-200"
                                style={{ color: '#94a3b8', fontSize: 13, textDecoration: 'none' }}
                                onMouseEnter={e => (e.currentTarget.style.color = '#7ba4ff')}
                                onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
                            >
                                <ArrowLeft size={14} /> Voltar para o login
                            </Link>
                        </div>
                    ) : (
                        <>
                            {/* Icon */}
                            <div
                                className="flex items-center justify-center mb-4"
                                style={{
                                    width: 52, height: 52, borderRadius: 12,
                                    background: 'rgba(79,124,255,.08)',
                                    border: '1px solid rgba(79,124,255,.2)',
                                }}
                            >
                                <Mail size={22} color="#4f7cff" />
                            </div>

                            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 23, color: '#ffffff', marginBottom: 8 }}>
                                Redefinir senha?
                            </p>
                            <p style={{ fontSize: 13.5, color: '#6b7280', marginBottom: 28, lineHeight: 1.6 }}>
                                Digite o e-mail associado à sua conta e enviaremos
                                um link seguro para criar uma nova senha.
                            </p>

                            <form onSubmit={handleSubmit} noValidate>
                                <label
                                    htmlFor="email"
                                    className="block mb-1.5"
                                    style={{
                                        fontSize: 12, fontWeight: 600, letterSpacing: '.08em',
                                        textTransform: 'uppercase', color: '#9ca3af',
                                    }}
                                >
                                    Endereço de e-mail
                                </label>
                                <div className="relative">
                                    <Mail
                                        size={15}
                                        className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                                        style={{ color: '#4b5563' }}
                                    />
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        placeholder="seu@email.com"
                                        onChange={e => setEmail(e.target.value)}
                                        required
                                        autoComplete="email"
                                        autoFocus
                                        className="w-full outline-none transition-all duration-200"
                                        style={{
                                            height: 46, padding: '0 16px 0 40px',
                                            background: '#0c1220',
                                            border: '1px solid #1f2937',
                                            borderRadius: 9, color: '#f3f4f6',
                                            fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                                        }}
                                        onFocus={e => {
                                            e.currentTarget.style.borderColor = '#4f7cff';
                                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(79,124,255,.12)';
                                        }}
                                        onBlur={e => {
                                            e.currentTarget.style.borderColor = '#1f2937';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || !email}
                                    className="w-full flex items-center justify-center gap-2 mt-5 transition-all duration-200"
                                    style={{
                                        height: 48, border: 'none', borderRadius: 9,
                                        background: 'linear-gradient(135deg, #4f7cff, #7ba4ff)',
                                        color: '#ffffff', fontFamily: "'DM Sans', sans-serif",
                                        fontSize: 14, fontWeight: 600, letterSpacing: '.04em',
                                        cursor: (loading || !email) ? 'not-allowed' : 'pointer',
                                        opacity: (loading || !email) ? 0.55 : 1,
                                        boxShadow: '0 4px 18px rgba(79,124,255,.25)',
                                    }}
                                    onMouseEnter={e => {
                                        if (!loading && email) {
                                            e.currentTarget.style.opacity = '0.92';
                                            e.currentTarget.style.transform = 'translateY(-1px)';
                                            e.currentTarget.style.boxShadow = '0 6px 24px rgba(79,124,255,.35)';
                                        }
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.opacity = (loading || !email) ? '0.55' : '1';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 4px 18px rgba(79,124,255,.25)';
                                    }}
                                >
                                    {loading ? (
                                        <>
                                            <div
                                                style={{
                                                    width: 18, height: 18,
                                                    border: '2px solid rgba(255,255,255,.3)',
                                                    borderTopColor: '#ffffff',
                                                    borderRadius: '50%',
                                                    animation: 'esp-rotate .7s linear infinite',
                                                }}
                                            />
                                            Enviando…
                                        </>
                                    ) : (
                                        'Enviar link de redefinição'
                                    )}
                                </button>
                            </form>

                            <Link
                                to="/login"
                                className="flex items-center gap-1.5 mt-5 w-fit transition-colors duration-200"
                                style={{ color: '#94a3b8', fontSize: 13, textDecoration: 'none' }}
                                onMouseEnter={e => (e.currentTarget.style.color = '#7ba4ff')}
                                onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
                            >
                                <ArrowLeft size={14} /> Voltar para o login
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export default EsqueciSenhaPage;