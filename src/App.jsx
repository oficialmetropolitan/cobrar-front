import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { DashboardEvolucaoCompleta } from './Pages/Dashboard';

import { ContratosList } from './Pages/ContratosList';
import { ClienteDetalhes } from './Pages/ClienteDetalhes';
import { ClienteForm } from './Pages/ClienteForm'; 
import { PaginaPrincipal } from './Pages/Home';
import { ClienteEdit } from './Pages/ClienteEditar';
import { Login } from './pages/Login';
import { AdminRoute } from './components/AdminRoute';

import  { AdiantamentosPage } from './Pages/Adiantamento'
import {PaginaResumo} from './Pages/resumo';
import { ContratoEdit } from './Pages/ContratoEditar';
import { BaixaRepasse } from './Pages/TelaBaixaRepasse';




const LayoutProtegido = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        
        <Outlet /> 
      </main>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
       
        <Route path="/login" element={<Login />} />

        <Route element={<AdminRoute><LayoutProtegido /></AdminRoute>}>

            <Route path="/contrato/:id" element={<ContratoEdit />} />
  
            <Route path="/" element={<PaginaPrincipal />} />
            <Route path="/dashboard" element={<DashboardEvolucaoCompleta />} />
            <Route path="/clientes/editar/:id" element={<ClienteEdit />} />
            <Route path="/contratos" element={<ContratosList />} />
          
            <Route path="/clientes/novo" element={<ClienteForm />} />
            <Route path="/clientes/:id" element={<ClienteDetalhes />} />
            <Route path="/adiantamentos" element={<AdiantamentosPage />} />
            <Route path="/relatorios" element={<PaginaResumo />} />
            <Route path="/baixa-repasse" element={<BaixaRepasse />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;