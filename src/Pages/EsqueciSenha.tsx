import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import { Mail, ShieldCheck, ArrowLeft, CheckCircle2 } from 'lucide-react';

const EsqueciSenhaPage = () => {
    const [email, setEmail]   = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent]     = useState(false);

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
                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

                .esp-root {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #0c1220;
                    font-family: 'DM Sans', sans-serif;
                    overflow: hidden;
                    position: relative;
                    padding: 24px;
                }
                .esp-root::before, .esp-root::after {
                    content: '';
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(90px);
                    opacity: .25;
                    pointer-events: none;
                }
                .esp-root::before {
                    width: 480px; height: 480px;
                    background: radial-gradient(circle, #1e3a5f, transparent 70%);
                    top: -100px; left: -120px;
                }
                .esp-root::after {
                    width: 360px; height: 360px;
                    background: radial-gradient(circle, #c9a84c, transparent 70%);
                    bottom: -80px; right: -80px;
                }

                .esp-card {
                    width: 100%;
                    max-width: 440px;
                    background: #111827;
                    border: 1px solid rgba(201,168,76,.18);
                    border-radius: 16px;
                    padding: 40px 36px;
                    position: relative;
                    z-index: 1;
                    animation: esp-rise .55s cubic-bezier(.22,1,.36,1) both;
                }
                @keyframes esp-rise {
                    from { opacity: 0; transform: translateY(28px); }
                    to   { opacity: 1; transform: translateY(0); }
                }

                .esp-logo {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 28px;
                }
                .esp-logo-icon {
                    width: 36px; height: 36px;
                    border-radius: 8px;
                    background: linear-gradient(135deg, #c9a84c, #e8c96d);
                    display: flex; align-items: center; justify-content: center;
                    flex-shrink: 0;
                }
                .esp-logo-name {
                    font-family: 'Playfair Display', serif;
                    font-size: 15px;
                    color: #c9a84c;
                    letter-spacing: .04em;
                }
                .esp-divider {
                    height: 1px;
                    background: linear-gradient(90deg, transparent, rgba(201,168,76,.3), transparent);
                    margin-bottom: 28px;
                }

                .esp-icon-wrap {
                    width: 52px; height: 52px;
                    border-radius: 12px;
                    background: rgba(201,168,76,.08);
                    border: 1px solid rgba(201,168,76,.2);
                    display: flex; align-items: center; justify-content: center;
                    margin-bottom: 18px;
                }
                .esp-title {
                    font-family: 'Playfair Display', serif;
                    font-size: 23px;
                    color: #f0e6cc;
                    margin-bottom: 8px;
                }
                .esp-subtitle {
                    font-size: 13.5px;
                    color: #6b7280;
                    margin-bottom: 28px;
                    line-height: 1.6;
                }

                .esp-label {
                    display: block;
                    font-size: 12px;
                    font-weight: 600;
                    letter-spacing: .08em;
                    text-transform: uppercase;
                    color: #9ca3af;
                    margin-bottom: 7px;
                }
                .esp-input-wrap { position: relative; }
                .esp-input-icon {
                    position: absolute;
                    left: 13px; top: 50%;
                    transform: translateY(-50%);
                    color: #4b5563;
                    pointer-events: none;
                }
                .esp-input {
                    width: 100%;
                    height: 46px;
                    padding: 0 16px 0 40px;
                    background: #0c1220;
                    border: 1px solid #1f2937;
                    border-radius: 9px;
                    color: #f3f4f6;
                    font-family: 'DM Sans', sans-serif;
                    font-size: 14px;
                    outline: none;
                    transition: border-color .2s, box-shadow .2s;
                }
                .esp-input::placeholder { color: #374151; }
                .esp-input:focus {
                    border-color: #c9a84c;
                    box-shadow: 0 0 0 3px rgba(201,168,76,.12);
                }

                .esp-btn {
                    margin-top: 20px;
                    width: 100%;
                    height: 48px;
                    border: none;
                    border-radius: 9px;
                    background: linear-gradient(135deg, #c9a84c, #e8c96d);
                    color: #0c1220;
                    font-family: 'DM Sans', sans-serif;
                    font-size: 14px;
                    font-weight: 600;
                    letter-spacing: .04em;
                    cursor: pointer;
                    display: flex; align-items: center; justify-content: center; gap: 8px;
                    transition: opacity .2s, transform .15s, box-shadow .2s;
                    box-shadow: 0 4px 18px rgba(201,168,76,.2);
                }
                .esp-btn:hover:not(:disabled) {
                    opacity: .92;
                    transform: translateY(-1px);
                    box-shadow: 0 6px 24px rgba(201,168,76,.3);
                }
                .esp-btn:disabled { opacity: .55; cursor: not-allowed; }

                .esp-spin {
                    width: 18px; height: 18px;
                    border: 2px solid rgba(12,18,32,.3);
                    border-top-color: #0c1220;
                    border-radius: 50%;
                    animation: esp-rotate .7s linear infinite;
                }
                @keyframes esp-rotate { to { transform: rotate(360deg); } }

                .esp-back {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    margin-top: 22px;
                    color: #4b5563;
                    font-size: 13px;
                    text-decoration: none;
                    transition: color .2s;
                    width: fit-content;
                }
                .esp-back:hover { color: #c9a84c; }

                /* success */
                .esp-success {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    gap: 12px;
                    padding: 8px 0;
                    animation: esp-rise .45s cubic-bezier(.22,1,.36,1) both;
                }
                .esp-success-icon {
                    width: 64px; height: 64px;
                    border-radius: 50%;
                    background: rgba(201,168,76,.1);
                    display: flex; align-items: center; justify-content: center;
                    animation: esp-pop .5s cubic-bezier(.34,1.56,.64,1) .1s both;
                }
                @keyframes esp-pop {
                    from { opacity: 0; transform: scale(.5); }
                    to   { opacity: 1; transform: scale(1); }
                }
                .esp-success-title {
                    font-family: 'Playfair Display', serif;
                    font-size: 21px;
                    color: #f0e6cc;
                }
                .esp-success-sub {
                    font-size: 13.5px;
                    color: #6b7280;
                    line-height: 1.6;
                }
                .esp-success-note {
                    font-size: 12px;
                    color: #374151;
                    background: #0c1220;
                    border: 1px solid #1f2937;
                    border-radius: 8px;
                    padding: 12px 16px;
                    line-height: 1.6;
                    margin-top: 4px;
                    width: 100%;
                    text-align: left;
                }
            `}</style>

            <div className="esp-root">
                <div className="esp-card">

                    <div className="esp-logo">
                        <div className="esp-logo-icon">
                            <ShieldCheck size={18} color="#0c1220" strokeWidth={2.5} />
                        </div>
                        <span className="esp-logo-name">Banco Metropolitan</span>
                    </div>
                    <div className="esp-divider" />

                    {sent ? (
                        <div className="esp-success">
                            <div className="esp-success-icon">
                                <CheckCircle2 size={30} color="#c9a84c" />
                            </div>
                            <p className="esp-success-title">E-mail enviado!</p>
                            <p className="esp-success-sub">
                                Se uma conta com o endereço <strong style={{ color: '#f0e6cc' }}>{email}</strong> existir,
                                você receberá um link de redefinição em breve.
                            </p>
                            <p className="esp-success-note">
                                ⏱ O link expira em <strong>15 minutos</strong>.<br />
                                Verifique também a pasta de spam caso não encontre o e-mail.
                            </p>
                            <Link to="/login" className="esp-back">
                                <ArrowLeft size={14} /> Voltar para o login
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="esp-icon-wrap">
                                <Mail size={22} color="#c9a84c" />
                            </div>
                            <p className="esp-title">Esqueceu a senha?</p>
                            <p className="esp-subtitle">
                                Digite o e-mail associado à sua conta e enviaremos
                                um link seguro para criar uma nova senha.
                            </p>

                            <form onSubmit={handleSubmit} noValidate>
                                <label className="esp-label" htmlFor="email">Endereço de e-mail</label>
                                <div className="esp-input-wrap">
                                    <Mail size={15} className="esp-input-icon" />
                                    <input
                                        id="email"
                                        className="esp-input"
                                        type="email"
                                        value={email}
                                        placeholder="seu@email.com"
                                        onChange={e => setEmail(e.target.value)}
                                        required
                                        autoComplete="email"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="esp-btn"
                                    disabled={loading || !email}
                                >
                                    {loading
                                        ? <><div className="esp-spin" /> Enviando…</>
                                        : 'Enviar link de redefinição'
                                    }
                                </button>
                            </form>

                            <Link to="/login" className="esp-back">
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