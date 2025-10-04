import React, { useState, useEffect } from "react";
// REMOVED: Imports for User and Transaction JSON files.
import BalanceCard from "../components/dashboard/BalanceCard";
import ScoreCard from "../components/dashboard/ScoreCard";
import QuickActions from "../components/dashboard/QuickActions";
import RecentTransactions from "../components/dashboard/RecentTransactions";
import OfflineModeToggle from "../components/dashboard/OfflineModeToggle";
import OfflineModeIndicator from "../components/dashboard/OfflineModeIndicator";

// ALTERAÇÃO 1: Criamos um usuário e uma lista de transações falsas (mock).
const mockUser = {
  full_name: "Felipe Teste",
  email: "felipe.teste@email.com",
  account_balance: 12345.67,
  credit_score: 820,
  offline_mode: false,
};

const mockTransactions = [
  { type: "pix", amount: 50.0, description: "Cafeteria do Zé", category: "food", status: "completed", created_date: "2025-10-04T12:30:00Z" },
  { type: "nfc_payment", amount: 25.5, description: "Mercado Perto de Casa", category: "shopping", status: "completed", created_date: "2025-10-04T09:15:00Z" },
  { type: "transfer", amount: 1200.0, description: "Pagamento Aluguel", category: "bills", status: "completed", created_date: "2025-10-03T18:00:00Z" },
  { type: "deposit", amount: 3000.0, description: "Salário", category: "other", status: "completed", created_date: "2025-10-01T10:00:00Z" },
  { type: "bill_payment", amount: 89.9, description: "Conta de Internet", category: "bills", status: "pending", created_date: "2025-09-30T11:45:00Z" },
];


export default function Dashboard() {
  // ALTERAÇÃO 2: O estado do componente agora começa com os dados falsos.
  const [user, setUser] = useState(mockUser);
  const [transactions, setTransactions] = useState(mockTransactions);
  const [isTogglingOffline, setIsTogglingOffline] = useState(false);

  // ALTERAÇÃO 3: A lógica de carregar dados (useEffect, loadData) foi removida,
  // pois os dados já estão disponíveis desde o início.

  // ALTERAÇÃO 4: A função de modo offline foi simplificada para alterar apenas o estado local.
  const toggleOfflineMode = () => {
    setIsTogglingOffline(true);
    // Simula um pequeno atraso, como se estivesse processando
    setTimeout(() => {
      setUser(currentUser => ({ ...currentUser, offline_mode: !currentUser.offline_mode }));
      setIsTogglingOffline(false);
    }, 500);
  };

  return (
    <div className="min-h-screen p-6 md:p-8">
      {user.offline_mode && <OfflineModeIndicator />}
      
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Olá, {user.full_name?.split(' ')[0]} 👋
            </h1>
            <p className="text-gray-400 mt-1">Bem-vindo de volta ao seu banco digital</p>
          </div>
        </div>

        <OfflineModeToggle 
          isOffline={user.offline_mode || false}
          onToggle={toggleOfflineMode}
          isLoading={isTogglingOffline}
        />

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <BalanceCard balance={user.account_balance || 0} />
          </div>
          <ScoreCard score={user.credit_score || 650} />
        </div>

        <QuickActions />

        {/* O 'isLoading' foi removido porque os dados são carregados instantaneamente */}
        <RecentTransactions transactions={transactions} isLoading={false} />
      </div>
    </div>
  );
}