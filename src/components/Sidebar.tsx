import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Users, FileText, Calendar, TrendingUp, Settings } from 'lucide-react';
import { LogoutButton } from './LogoutButton';

export function Sidebar() {
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', icon: Home, path: '/dashboard' },
    { name: 'Contratos', icon: FileText, path: '/contratos' },
    { name: 'Relatórios', icon: TrendingUp, path: '/relatorios' },
    {name: 'Adiantamentos', icon: Calendar, path: '/adiantamentos'},
    {name: 'Clientes', icon: Users, path: '/' },
  ];
  const navigate = useNavigate();

  const handleLogout = () => {

    localStorage.removeItem('token');
    localStorage.setItem('is_admin', 'false'); 

    navigate('/login');
  };

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl">
      <div className="p-6">
        
        <h2 className="text-xl font-bold text-blue-400">Metropolitan</h2>
        <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">Painel de Cobrança</p>
      </div>

      <nav className="flex-1 mt-4 px-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium text-sm">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t border-slate-800">
        <button className="flex items-center gap-3 text-slate-400 hover:text-red-400 transition">
          <Settings size={20} />
          <span className="text-sm">Configurações</span>
        </button>

          <button 
      onClick={handleLogout}
      className="flex items-center gap-2 text-red-500 hover:text-red-700 font-bold p-2 transition"
    >
      <span>Sair do Sistema</span>
    </button>
      </div>
    </aside>
  );
}