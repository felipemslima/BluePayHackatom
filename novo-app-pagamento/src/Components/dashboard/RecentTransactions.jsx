import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownLeft, Smartphone } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

const getTransactionIcon = (type) => {
  if (type === "deposit") return <ArrowDownLeft className="w-4 h-4 text-green-400" />;
  if (type === "nfc_payment") return <Smartphone className="w-4 h-4 text-purple-400" />;
  return <ArrowUpRight className="w-4 h-4 text-orange-400" />;
};

const getTransactionColor = (type) => {
  if (type === "deposit") return "text-green-400";
  return "text-orange-400";
};

export default function RecentTransactions({ transactions, isLoading }) {
  return (
    <Card className="bg-[#1f2544]/80 backdrop-blur-xl border-white/10 shadow-xl">
      <CardHeader className="border-b border-white/10">
        <CardTitle className="text-white text-lg">Transações Recentes</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {isLoading ? (
            Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-5 w-20" />
              </div>
            ))
          ) : transactions.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Nenhuma transação ainda</p>
          ) : (
            transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between py-2 hover:bg-white/5 rounded-lg px-2 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center">
                    {getTransactionIcon(transaction.type)}
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{transaction.description}</p>
                    <p className="text-gray-400 text-xs">
                      {format(new Date(transaction.created_date), "dd MMM, HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                <span className={`font-semibold ${getTransactionColor(transaction.type)}`}>
                  {transaction.type === "deposit" ? "+" : "-"}R$ {transaction.amount.toFixed(2)}
                </span>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}