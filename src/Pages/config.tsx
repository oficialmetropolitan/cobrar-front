import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import { Eye, EyeOff, Lock, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';

/* ─── Password strength helpers ─────────────────────────────────── */
const checks = [
    { label: 'Mínimo 8 caracteres',        test: (p: string) => p.length >= 8 },
    { label: 'Letra maiúscula',             test: (p: string) => /[A-Z]/.test(p) },
    { label: 'Letra minúscula',             test: (p: string) => /[a-z]/.test(p) },
    { label: 'Número',                      test: (p: string) => /[0-9]/.test(p) },
    { label: 'Caractere especial (!@#…)',   test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

const strengthLabel = (score: number) => {
    if (score <= 1) return { label: 'Muito fraca', color: '#ef4444' };
    if (score === 2) return { label: 'Fraca',       color: '#f97316' };
    if (score === 3) return { label: 'Razoável',    color: '#eab308' };
    if (score === 4) return { label: 'Forte',       color: '#22c55e' };
    return               { label: 'Muito forte',   color: '#10b981' };
};

/* ─── Component ──────────────────────────────────────────────────── */
const RedefinirSenhaPage = () => {
    const [password, setPassword]               = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPass, setShowPass]               = useState(false);
    const [showConfirm, setShowConfirm]         = useState(false);
    const [loading, setLoading]                 = useState(false);
    const [done, setDone]                       = useState(false);

    const [searchParams] = useSearchParams();
    const navigate       = useNavigate();
    const token          = searchParams.get('token');

    useEffect(() => {
        if (!token) {
            toast.error('Token de redefinição não encontrado ou inválido.');
            navigate('/esqueci-senha');
        }
    }, [token, navigate]);

    const passedChecks = checks.filter(c => c.test(password)).length;
    const strength     = strengthLabel(passedChecks);
    const match        = password && confirmPassword && password === confirmPassword;
    const mismatch     = confirmPassword && password !== confirmPassword;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) { toast.error('As senhas não coincidem.'); return; }
        setLoading(true);
        try {
            const apiUrl   = import.meta.env.VITE_API_URL || 'https://api.bancometropolitan.com.br';
            const response = await axios.post(`${apiUrl}/api/auth/reset-password`, {
                token,
                new_password: password,
            });
            toast.success(response.data.message);
            setDone(true);
            setTimeout(() => navigate('/login'), 2500);
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                toast.error(`Erro: ${error.response.data.detail || 'Tente novamente.'}`);
            } else {
                toast.error('Ocorreu um erro inesperado.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600&family=DM+Sans:wght@300;400;500;600&display=swap');

                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

                .rsw-root {
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

                /* ambient orbs */
                .rsw-root::before, .rsw-root::after {
                    content: '';
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(90px);
                    opacity: .25;
                    pointer-events: none;
                }
                .rsw-root::before {
                    width: 480px; height: 480px;
                    background: radial-gradient(circle, #1e3a5f, transparent 70%);
                    top: -100px; left: -120px;
                }
                .rsw-root::after {
                    width: 360px; height: 360px;
                    background: radial-gradient(circle, #c9a84c, transparent 70%);
                    bottom: -80px; right: -80px;
                }

                /* card */
                .rsw-card {
                    width: 100%;
                    max-width: 440px;
                    background: #111827;
                    border: 1px solid rgba(201,168,76,.18);
                    border-radius: 16px;
                    padding: 40px 36px;
                    position: relative;
                    z-index: 1;
                    animation: rsw-rise .55s cubic-bezier(.22,1,.36,1) both;
                }
                @keyframes rsw-rise {
                    from { opacity: 0; transform: translateY(28px); }
                    to   { opacity: 1; transform: translateY(0); }
                }

                /* logo strip */
                .rsw-logo {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 28px;
                }
                .rsw-logo-icon {
                    width: 36px; height: 36px;
                    border-radius: 8px;
                    background: linear-gradient(135deg, #c9a84c, #e8c96d);
                    display: flex; align-items: center; justify-content: center;
                    flex-shrink: 0;
                }
                .rsw-logo-name {
                    font-family: 'Playfair Display', serif;
                    font-size: 15px;
                    color: #c9a84c;
                    letter-spacing: .04em;
                }

                .rsw-divider {
                    height: 1px;
                    background: linear-gradient(90deg, transparent, rgba(201,168,76,.3), transparent);
                    margin-bottom: 28px;
                }

                /* headings */
                .rsw-title {
                    font-family: 'Playfair Display', serif;
                    font-size: 24px;
                    color: #f0e6cc;
                    margin-bottom: 6px;
                }
                .rsw-subtitle {
                    font-size: 13.5px;
                    color: #6b7280;
                    margin-bottom: 28px;
                    line-height: 1.5;
                }

                /* field */
                .rsw-field + .rsw-field { margin-top: 18px; }

                .rsw-label {
                    display: block;
                    font-size: 12px;
                    font-weight: 600;
                    letter-spacing: .08em;
                    text-transform: uppercase;
                    color: #9ca3af;
                    margin-bottom: 7px;
                }

                .rsw-input-wrap {
                    position: relative;
                }
                .rsw-input-icon {
                    position: absolute;
                    left: 13px; top: 50%;
                    transform: translateY(-50%);
                    color: #4b5563;
                    pointer-events: none;
                }
                .rsw-input {
                    width: 100%;
                    height: 46px;
                    padding: 0 42px 0 40px;
                    background: #0c1220;
                    border: 1px solid #1f2937;
                    border-radius: 9px;
                    color: #f3f4f6;
                    font-family: 'DM Sans', sans-serif;
                    font-size: 14px;
                    outline: none;
                    transition: border-color .2s, box-shadow .2s;
                }
                .rsw-input::placeholder { color: #374151; }
                .rsw-input:focus {
                    border-color: #c9a84c;
                    box-shadow: 0 0 0 3px rgba(201,168,76,.12);
                }
                .rsw-input.is-match   { border-color: #22c55e; }
                .rsw-input.is-mismatch{ border-color: #ef4444; }

                .rsw-eye {
                    position: absolute;
                    right: 12px; top: 50%;
                    transform: translateY(-50%);
                    background: none; border: none; cursor: pointer;
                    color: #4b5563;
                    display: flex; align-items: center;
                    padding: 4px;
                    border-radius: 4px;
                    transition: color .15s;
                }
                .rsw-eye:hover { color: #9ca3af; }

                /* strength bar */
                .rsw-strength {
                    margin-top: 10px;
                }
                .rsw-strength-bar {
                    display: grid;
                    grid-template-columns: repeat(5, 1fr);
                    gap: 4px;
                    margin-bottom: 5px;
                }
                .rsw-strength-seg {
                    height: 3px;
                    border-radius: 99px;
                    background: #1f2937;
                    transition: background .3s;
                }

                .rsw-strength-meta {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .rsw-strength-label {
                    font-size: 11px;
                    font-weight: 600;
                    letter-spacing: .05em;
                    text-transform: uppercase;
                    transition: color .3s;
                }
                .rsw-checks {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 4px 10px;
                    margin-top: 8px;
                }
                .rsw-check {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 11px;
                    color: #6b7280;
                    transition: color .2s;
                }
                .rsw-check.ok { color: #22c55e; }

                /* match hint */
                .rsw-match-hint {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    font-size: 12px;
                    margin-top: 7px;
                    min-height: 16px;
                    transition: color .2s;
                }

                /* button */
                .rsw-btn {
                    margin-top: 26px;
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
                .rsw-btn:hover:not(:disabled) {
                    opacity: .92;
                    transform: translateY(-1px);
                    box-shadow: 0 6px 24px rgba(201,168,76,.3);
                }
                .rsw-btn:active:not(:disabled) { transform: translateY(0); }
                .rsw-btn:disabled { opacity: .55; cursor: not-allowed; }

                /* spinner */
                .rsw-spin {
                    width: 18px; height: 18px;
                    border: 2px solid rgba(12,18,32,.3);
                    border-top-color: #0c1220;
                    border-radius: 50%;
                    animation: rsw-rotate .7s linear infinite;
                }
                @keyframes rsw-rotate { to { transform: rotate(360deg); } }

                /* success state */
                .rsw-success {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    gap: 12px;
                    padding: 8px 0;
                    animation: rsw-rise .45s cubic-bezier(.22,1,.36,1) both;
                }
                .rsw-success-icon {
                    width: 64px; height: 64px;
                    border-radius: 50%;
                    background: rgba(34,197,94,.1);
                    display: flex; align-items: center; justify-content: center;
                    animation: rsw-pop .5s cubic-bezier(.34,1.56,.64,1) .1s both;
                }
                @keyframes rsw-pop {
                    from { opacity: 0; transform: scale(.5); }
                    to   { opacity: 1; transform: scale(1); }
                }
                .rsw-success-title {
                    font-family: 'Playfair Display', serif;
                    font-size: 21px;
                    color: #f0e6cc;
                }
                .rsw-success-sub {
                    font-size: 13.5px;
                    color: #6b7280;
                    line-height: 1.5;
                }
                .rsw-progress {
                    width: 100%;
                    height: 2px;
                    background: #1f2937;
                    border-radius: 99px;
                    overflow: hidden;
                    margin-top: 6px;
                }
                .rsw-progress-bar {
                    height: 100%;
                    background: linear-gradient(90deg, #c9a84c, #e8c96d);
                    animation: rsw-fill 2.4s linear both;
                    border-radius: 99px;
                }
                @keyframes rsw-fill {
                    from { width: 0; }
                    to   { width: 100%; }
                }
            `}</style>

            <div className="rsw-root">
                <div className="rsw-card">

                    {/* Logo */}
                    <div className="rsw-logo">
                        <div className="rsw-logo-icon">
                            <ShieldCheck size={18} color="#0c1220" strokeWidth={2.5} />
                        </div>
                        <span className="rsw-logo-name">Banco Metropolitan</span>
                    </div>
                    <div className="rsw-divider" />

                    {done ? (
                        /* ── Success screen ── */
                        <div className="rsw-success">
                            <div className="rsw-success-icon">
                                <CheckCircle2 size={32} color="#22c55e" />
                            </div>
                            <p className="rsw-success-title">Senha redefinida!</p>
                            <p className="rsw-success-sub">
                                Sua nova senha foi salva com sucesso.<br />
                                Redirecionando para o login…
                            </p>
                            <div className="rsw-progress">
                                <div className="rsw-progress-bar" />
                            </div>
                        </div>
                    ) : (
                        /* ── Form ── */
                        <>
                            <p className="rsw-title">Crie sua nova senha</p>
                            <p className="rsw-subtitle">
                                Escolha uma senha segura para proteger sua conta.
                            </p>

                            <form onSubmit={handleSubmit} noValidate>
                                {/* Nova senha */}
                                <div className="rsw-field">
                                    <label className="rsw-label" htmlFor="password">Nova senha</label>
                                    <div className="rsw-input-wrap">
                                        <Lock size={15} className="rsw-input-icon" />
                                        <input
                                            id="password"
                                            className="rsw-input"
                                            type={showPass ? 'text' : 'password'}
                                            value={password}
                                            placeholder="••••••••"
                                            onChange={e => setPassword(e.target.value)}
                                            required
                                            autoComplete="new-password"
                                        />
                                        <button
                                            type="button"
                                            className="rsw-eye"
                                            onClick={() => setShowPass(v => !v)}
                                            aria-label={showPass ? 'Ocultar senha' : 'Mostrar senha'}
                                        >
                                            {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                                        </button>
                                    </div>

                                    {/* strength */}
                                    {password.length > 0 && (
                                        <div className="rsw-strength">
                                            <div className="rsw-strength-bar">
                                                {checks.map((_, i) => (
                                                    <div
                                                        key={i}
                                                        className="rsw-strength-seg"
                                                        style={{
                                                            background: i < passedChecks
                                                                ? strength.color
                                                                : undefined
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                            <div className="rsw-strength-meta">
                                                <span
                                                    className="rsw-strength-label"
                                                    style={{ color: strength.color }}
                                                >
                                                    {strength.label}
                                                </span>
                                            </div>
                                            <div className="rsw-checks">
                                                {checks.map(c => (
                                                    <span
                                                        key={c.label}
                                                        className={`rsw-check${c.test(password) ? ' ok' : ''}`}
                                                    >
                                                        {c.test(password)
                                                            ? <CheckCircle2 size={11} />
                                                            : <XCircle size={11} />
                                                        }
                                                        {c.label}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Confirmar senha */}
                                <div className="rsw-field">
                                    <label className="rsw-label" htmlFor="confirmPassword">
                                        Confirme a nova senha
                                    </label>
                                    <div className="rsw-input-wrap">
                                        <Lock size={15} className="rsw-input-icon" />
                                        <input
                                            id="confirmPassword"
                                            className={`rsw-input${match ? ' is-match' : mismatch ? ' is-mismatch' : ''}`}
                                            type={showConfirm ? 'text' : 'password'}
                                            value={confirmPassword}
                                            placeholder="••••••••"
                                            onChange={e => setConfirmPassword(e.target.value)}
                                            required
                                            autoComplete="new-password"
                                        />
                                        <button
                                            type="button"
                                            className="rsw-eye"
                                            onClick={() => setShowConfirm(v => !v)}
                                            aria-label={showConfirm ? 'Ocultar senha' : 'Mostrar senha'}
                                        >
                                            {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                                        </button>
                                    </div>
                                    <div
                                        className="rsw-match-hint"
                                        style={{ color: match ? '#22c55e' : '#ef4444' }}
                                    >
                                        {match && <><CheckCircle2 size={13} /> As senhas coincidem</>}
                                        {mismatch && <><XCircle size={13} /> As senhas não coincidem</>}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="rsw-btn"
                                    disabled={loading || passedChecks < 3 || !match}
                                >
                                    {loading
                                        ? <><div className="rsw-spin" /> Salvando…</>
                                        : 'Salvar nova senha'
                                    }
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