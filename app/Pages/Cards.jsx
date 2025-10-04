
import React, { useState, useEffect } from "react";
import { Card as CardEntity } from "@/entities/Card";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Plus, Lock, Unlock, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { motion, AnimatePresence } from "framer-motion";

export default function Cards() {
  const [cards, setCards] = useState([]);
  const [user, setUser] = useState(null);
  const [showCardDetails, setShowCardDetails] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const currentUser = await User.me();
    setUser(currentUser);
    const userCards = await CardEntity.filter({ created_by: currentUser.email });
    setCards(userCards);
  };

  const toggleCardBlock = async (card) => {
    await CardEntity.update(card.id, { is_blocked: !card.is_blocked });
    loadData();
  };

  const toggleCardDetails = (cardId) => {
    setShowCardDetails(prev => ({ ...prev, [cardId]: !prev[cardId] }));
  };

  const createNewCard = async () => {
    const cardNumber = `**** **** **** ${Math.floor(1000 + Math.random() * 9000)}`;
    const colors = [
      "gradient-to-br from-indigo-600 to-purple-600",
      "gradient-to-br from-blue-600 to-cyan-600",
      "gradient-to-br from-pink-600 to-rose-600",
      "gradient-to-br from-orange-600 to-yellow-600",
    ];

    await CardEntity.create({
      card_number: cardNumber,
      card_holder: user.full_name.toUpperCase(),
      expiry_date: "12/28",
      cvv: Math.floor(100 + Math.random() * 900).toString(),
      card_type: "debit",
      limit: 5000,
      used_limit: 0,
      is_active: true,
      is_blocked: false,
      color: colors[Math.floor(Math.random() * colors.length)],
    });

    loadData();
  };

  if (!user) return null;

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Meus Cartões</h1>
            <p className="text-gray-400 mt-1">Gerencie seus cartões virtuais</p>
          </div>
          <Button
            onClick={createNewCard}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Cartão
          </Button>
        </div>

        {user.offline_mode && (
          <Alert className="bg-amber-600/20 border-amber-500">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <AlertDescription className="text-amber-200">
              <strong>Modo Offline Ativo:</strong> Todos os cartões virtuais estão temporariamente bloqueados para compras online. Apenas pagamentos por aproximação estão disponíveis.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {cards.map((card) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <Card className={`bg-gradient-to-br ${card.color} border-none shadow-2xl overflow-hidden relative h-56`}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                  <CardContent className="p-6 relative z-10 h-full flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <CreditCard className="w-10 h-10 text-white/80" />
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleCardDetails(card.id)}
                          className="p-2 hover:bg-white/10 rounded-full transition-colors"
                        >
                          {showCardDetails[card.id] ? (
                            <EyeOff className="w-4 h-4 text-white" />
                          ) : (
                            <Eye className="w-4 h-4 text-white" />
                          )}
                        </button>
                        <button
                          onClick={() => toggleCardBlock(card)}
                          className="p-2 hover:bg-white/10 rounded-full transition-colors"
                        >
                          {card.is_blocked ? (
                            <Lock className="w-4 h-4 text-white" />
                          ) : (
                            <Unlock className="w-4 h-4 text-white" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="text-white font-mono text-lg tracking-wider">
                        {showCardDetails[card.id] ? card.card_number : card.card_number.replace(/\d(?=\d{4})/g, "*")}
                      </div>

                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-white/60 text-xs mb-1">Titular</p>
                          <p className="text-white font-medium text-sm">
                            {showCardDetails[card.id] ? card.card_holder : card.card_holder.replace(/./g, "*")}
                          </p>
                        </div>
                        <div>
                          <p className="text-white/60 text-xs mb-1">Validade</p>
                          <p className="text-white font-medium">{card.expiry_date}</p>
                        </div>
                        {showCardDetails[card.id] && (
                          <div>
                            <p className="text-white/60 text-xs mb-1">CVV</p>
                            <p className="text-white font-medium">{card.cvv}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {(card.is_blocked || user.offline_mode) && (
                      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                        <div className="text-center">
                          <Lock className="w-12 h-12 text-white mx-auto mb-2" />
                          <p className="text-white font-semibold">
                            {user.offline_mode ? "Modo Offline" : "Cartão Bloqueado"}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {card.card_type === "credit" && (
                  <Card className="bg-[#1f2544]/80 backdrop-blur-xl border-white/10 mt-4">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-400 text-sm">Limite Utilizado</span>
                        <span className="text-white font-semibold">
                          R$ {card.used_limit?.toFixed(2)} / R$ {card.limit?.toFixed(2)}
                        </span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(card.used_limit / card.limit) * 100}%` }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {cards.length === 0 && (
          <Card className="bg-[#1f2544]/80 backdrop-blur-xl border-white/10">
            <CardContent className="p-12 text-center">
              <CreditCard className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-white font-semibold text-lg mb-2">Nenhum cartão cadastrado</h3>
              <p className="text-gray-400 mb-6">Crie seu primeiro cartão virtual para começar</p>
              <Button
                onClick={createNewCard}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Cartão
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
