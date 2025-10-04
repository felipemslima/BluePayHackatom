import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Smartphone, Zap, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

// ALTERAÇÃO 1: As URLs agora são os caminhos corretos do roteador.
const actions = [
  { icon: Send, label: "Transferir", color: "from-blue-500 to-cyan-500", url: "/payment" },
  { icon: Smartphone, label: "Pagar", color: "from-purple-500 to-pink-500", url: "/payment" },
  { icon: Zap, label: "PIX", color: "from-green-500 to-emerald-500", url: "/payment" },
  { icon: BarChart3, label: "Investir", color: "from-orange-500 to-yellow-500", url: "/" }, // URL para Dashboard
];

export default function QuickActions() {
  return (
    <Card className="bg-[#1f2544]/80 backdrop-blur-xl border-white/10 shadow-xl">
      <CardContent className="p-6">
        <h3 className="text-white font-semibold mb-4">Ações Rápidas</h3>
        <div className="grid grid-cols-4 gap-4">
          {actions.map((action) => (
            // ALTERAÇÃO 2: A chamada para a função "createPageUrl" foi removida.
            <Link key={action.label} to={action.url}>
              <button className="flex flex-col items-center gap-2 group w-full text-center">
                <div className={`w-14 h-14 bg-gradient-to-br ${action.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs text-gray-300 group-hover:text-white transition-colors">
                  {action.label}
                </span>
              </button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}