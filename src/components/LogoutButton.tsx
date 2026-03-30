import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';

export const LogoutButton = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // 1. Remove as chaves do navegador
    localStorage.removeItem('token');
    localStorage.removeItem('is_admin');

    // 2. Opcional: Limpa qualquer outro dado que você tenha salvo
    // localStorage.clear(); 

    // 3. Feedback visual
    toast.success('Você saiu com segurança!');

    // 4. Manda o usuário para a tela de login
    navigate('/login');
  };

  return (
    <button 
      onClick={handleLogout}
      className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
    >
      <LogOut size={18} />
      <span>Sair</span>
    </button>
  );
};