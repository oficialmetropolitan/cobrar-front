import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Users, FileText, Calendar, TrendingUp, Settings, BarChart2, Sun, Moon, LogOut, Key } from 'lucide-react';
import { LogoutButton } from './LogoutButton';
import { useTheme } from './ThemeContext';

export function Sidebar() {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  
  const menuItems = [
    { name: 'Por mês', icon: Home, path: '/dashboard' },
    { name: 'Relatórios', icon: TrendingUp, path: '/relatorios' },
    { name: 'Gráficos', icon: BarChart2, path: '/graficos' },
    { name: 'Adiantamentos', icon: Calendar, path: '/adiantamentos' },
    { name: 'Clientes', icon: Users, path: '/' },
  ];
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.setItem('is_admin', 'false'); 
    navigate('/login');
  };

const username = localStorage.getItem('full_name') || 'Usuário';

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-colors duration-200">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-lg">
            {username.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800 dark:text-white">{username}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Metropolitan</p>

          </div>
        </div>
        <h2 className="text-xl font-bold text-indigo-600 dark:text-indigo-400">Metropolitan</h2>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1 font-bold">Painel de Cobrança</p>
      </div>

      <nav className="flex-1 mt-2 px-4 space-y-1.5">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${
                isActive 
                  ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <item.icon size={18} className={isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
        <button 
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all text-sm font-medium"
        >
          <div className="flex items-center gap-3">
            {theme === 'dark' ? <Moon size={18} className="text-slate-400" /> : <Sun size={18} className="text-slate-400" />}
            <span>Tema {theme === 'dark' ? 'Escuro' : 'Claro'}</span>
          </div>
          <div className="w-8 h-4 bg-slate-200 dark:bg-slate-700 rounded-full relative transition-colors">
            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${theme === 'dark' ? 'left-4.5 bg-indigo-400' : 'left-0.5'}`} />
          </div>
        </button>

        <div>
          <button
            onClick={() => navigate('/esqueci-senha', { state: { email: localStorage.getItem('user_email') || '' } })}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all text-sm font-medium"
          >
            <Key size={18} />
            <span>Redefinir Senha</span>
          </button> 
        </div>
        
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all text-sm font-bold mt-2"
        >
          <LogOut size={18} />
          <span>Sair do Sistema</span>
        </button>
      </div>
    </aside>

  );
}