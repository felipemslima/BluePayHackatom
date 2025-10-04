
import React, { useState, useEffect, useCallback } from "react";
import { Transaction } from "@/entities/Transaction";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Search, ArrowUpRight, ArrowDownLeft, Smartphone, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const categoryLabels = {
  food: "Alimentação",
  transport: "Transporte",
  shopping: "Compras",
  bills: "Contas",
  entertainment: "Entretenimento",
  health: "Saúde",
  education: "Educação",
  other: "Outros",
};

const getTransactionIcon = (type) => {
  if (type === "deposit") return <ArrowDownLeft className="w-5 h-5 text-green-400" />;
  if (type === "nfc_payment") return <Smartphone className="w-5 h-5 text-purple-400" />;
  return <ArrowUpRight className="w-5 h-5 text-orange-400" />;
};

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    const user = await User.me();
    const userTransactions = await Transaction.filter(
      { created_by: user.email },
      "-created_date"
    );
    setTransactions(userTransactions);
  };

  const filterTransactions = useCallback(() => {
    let filtered = transactions;

    if (searchTerm) {
      filtered = filtered.filter(
        (t) =>
          t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.recipient?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType !== "all") {
      filtered = filtered.filter((t) => t.type === filterType);
    }

    if (filterCategory !== "all") {
      filtered = filtered.filter((t) => t.category === filterCategory);
    }

    setFilteredTransactions(filtered);
  }, [searchTerm, filterType, filterCategory, transactions]); // Dependencies for useCallback

  useEffect(() => {
    filterTransactions();
  }, [filterTransactions]); // Now useEffect depends on the memoized function

  const getTotalByType = (type) => {
    return transactions
      .filter((t) => t.type === type)
      .reduce((sum, t) => sum + t.amount, 0);
  };

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Extrato</h1>
          <p className="text-gray-400 mt-1">Histórico completo de transações</p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border-green-500/30">
            <CardContent className="p-6">
              <p className="text-green-400 text-sm mb-2">Total Recebido</p>
              <p className="text-white text-2xl font-bold">
                R$ {getTotalByType("deposit").toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-600/20 to-red-600/20 border-orange-500/30">
            <CardContent className="p-6">
              <p className="text-orange-400 text-sm mb-2">Total Gasto</p>
              <p className="text-white text-2xl font-bold">
                R$ {(getTotalByType("withdrawal") + getTotalByType("transfer") + getTotalByType("pix") + getTotalByType("nfc_payment")).toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-500/30">
            <CardContent className="p-6">
              <p className="text-purple-400 text-sm mb-2">Transações</p>
              <p className="text-white text-2xl font-bold">{transactions.length}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-[#1f2544]/80 backdrop-blur-xl border-white/10">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-white flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar transação..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white"
                />
              </div>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="deposit">Depósito</SelectItem>
                  <SelectItem value="transfer">Transferência</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="nfc_payment">NFC</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas categorias</SelectItem>
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1f2544]/80 backdrop-blur-xl border-white/10">
          <CardContent className="p-6">
            <div className="space-y-4">
              {filteredTransactions.length === 0 ? (
                <p className="text-gray-400 text-center py-8">Nenhuma transação encontrada</p>
              ) : (
                filteredTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 hover:bg-white/5 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center">
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div>
                        <p className="text-white font-medium">{transaction.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-gray-400 text-sm">
                            {format(new Date(transaction.created_date), "dd MMM yyyy, HH:mm", { locale: ptBR })}
                          </p>
                          {transaction.category && (
                            <Badge variant="outline" className="text-xs bg-white/5 border-white/10 text-gray-300">
                              {categoryLabels[transaction.category]}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-lg ${transaction.type === "deposit" ? "text-green-400" : "text-orange-400"}`}>
                        {transaction.type === "deposit" ? "+" : "-"}R$ {transaction.amount.toFixed(2)}
                      </p>
                      <p className="text-gray-400 text-sm">
                        Saldo: R$ {transaction.balance_after?.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
