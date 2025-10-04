import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Transaction } from "@/entities/Transaction";
import BalanceCard from "../components/dashboard/BalanceCard";
import ScoreCard from "../components/dashboard/ScoreCard";
import QuickActions from "../components/dashboard/QuickActions";
import RecentTransactions from "../components/dashboard/RecentTransactions";
import OfflineModeToggle from "../components/dashboard/OfflineModeToggle";
import OfflineModeIndicator from "../components/dashboard/OfflineModeIndicator";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTogglingOffline, setIsTogglingOffline] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const currentUser = await User.me();
    setUser(currentUser);
    
    const userTransactions = await Transaction.filter(
      { created_by: currentUser.email },
      "-created_date",
      5
    );
    setTransactions(userTransactions);
    setIsLoading(false);
  };

  const toggleOfflineMode = async () => {
    setIsTogglingOffline(true);
    const newOfflineMode = !user.offline_mode;
    
    await User.updateMyUserData({
      offline_mode: newOfflineMode
    });
    
    setUser({ ...user, offline_mode: newOfflineMode });
    setIsTogglingOffline(false);
  };

  if (!user) return null;

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

        <RecentTransactions transactions={transactions} isLoading={isLoading} />
      </div>
    </div>
  );
}