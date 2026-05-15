import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { DashboardEvolucaoCompleta } from './Pages/Dashboard';

import { ContratosList } from './Pages/ContratosList';
import { ClienteDetalhes } from './Pages/ClienteDetalhes';
import { ClienteForm } from './Pages/ClienteForm'; 
import { PaginaPrincipal } from './Pages/Home';
import { ClienteEdit } from './Pages/ClienteEditar';
import { Login } from './Pages/Login';
import { AdminRoute } from './components/AdminRoute';

import  { AdiantamentosPage } from './Pages/Adiantamento'
import {PaginaResumo} from './Pages/resumo';
import { ContratoEdit } from './Pages/ContratoEditar';
import { BaixaRepasse } from './Pages/TelaBaixaRepasse';
import { PaginaGraficos } from './Pages/graficos';
import { Toaster } from 'sonner';
import { ThemeProvider } from './components/ThemeContext';
import EsqueciSenhaPage from './Pages/EsqueciSenha';
import RedefinirSenhaPage from './Pages/RedefinirSenhaPage';


const LayoutProtegido = () => {
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-slate-900 transition-colors duration-200">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet /> 
      </main>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <Toaster position="bottom-right" richColors />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />


          <Route element={<AdminRoute><LayoutProtegido /></AdminRoute>}>
              <Route path="/contrato/:id" element={<ContratoEdit />} />
              <Route path="/" element={<PaginaPrincipal />} />
              <Route path="/dashboard" element={<DashboardEvolucaoCompleta />} />
              <Route path="/clientes/editar/:id" element={<ClienteEdit />} />
              <Route path="/contratos" element={<ContratosList />} />
              <Route path="/graficos" element={<PaginaGraficos />} />
              <Route path="/clientes/novo" element={<ClienteForm />} />
              <Route path="/clientes/:id" element={<ClienteDetalhes />} />
              <Route path="/adiantamentos" element={<AdiantamentosPage />} />
              <Route path="/relatorios" element={<PaginaResumo />} />
              <Route path="/baixa-repasse" element={<BaixaRepasse />} />
            <Route path="/esqueci-senha"   element={<EsqueciSenhaPage />} />
          <Route path="/redefinir-senha" element={<RedefinirSenhaPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;