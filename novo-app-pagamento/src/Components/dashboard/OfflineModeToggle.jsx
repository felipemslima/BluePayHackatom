import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, WifiOff, Lock, Eye, AlertTriangle, CheckCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";

export default function OfflineModeToggle({ isOffline, onToggle, isLoading }) {
  return (
    <Card className={`transition-all duration-500 ${
      isOffline 
        ? "bg-gradient-to-br from-amber-600/20 to-orange-600/20 border-amber-500/50 shadow-2xl" 
        : "bg-[#1f2544]/80 backdrop-blur-xl border-white/10"
    }`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.div 
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                isOffline ? "bg-amber-600" : "bg-white/5"
              }`}
              animate={isOffline ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {isOffline ? (
                <WifiOff className="w-6 h-6 text-white" />
              ) : (
                <Shield className="w-6 h-6 text-gray-400" />
              )}
            </motion.div>
            <div>
              <h3 className="text-white font-semibold flex items-center gap-2">
                Modo Offline
                {isOffline && (
                  <Badge className="bg-amber-600 text-white border-none">
                    ATIVO
                  </Badge>
                )}
              </h3>
              <p className="text-gray-400 text-sm">
                {isOffline ? "Segurança máxima ativada" : "Ative para maior proteção"}
              </p>
            </div>
          </div>
          <Switch
            checked={isOffline}
            onCheckedChange={onToggle}
            disabled={isLoading}
          />
        </div>

        <AnimatePresence>
          {isOffline && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 pt-4 border-t border-amber-500/30"
            >
              <p className="text-amber-200 text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Recursos de Segurança Ativos:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-3 bg-black/20 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span className="text-white text-sm">Bloqueio de transações online</span>
                </div>
                
                <div className="flex items-center gap-2 p-3 bg-black/20 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span className="text-white text-sm">Autenticação biométrica obrigatória</span>
                </div>
                
                <div className="flex items-center gap-2 p-3 bg-black/20 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span className="text-white text-sm">Cartões virtuais bloqueados</span>
                </div>
                
                <div className="flex items-center gap-2 p-3 bg-black/20 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span className="text-white text-sm">Monitoramento de fraudes intensificado</span>
                </div>
                
                <div className="flex items-center gap-2 p-3 bg-black/20 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span className="text-white text-sm">Notificações em tempo real</span>
                </div>
                
                <div className="flex items-center gap-2 p-3 bg-black/20 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span className="text-white text-sm">Dados criptografados localmente</span>
                </div>
              </div>

              <div className="p-3 bg-amber-900/30 rounded-lg border border-amber-600/30 mt-3">
                <p className="text-amber-200 text-xs flex items-start gap-2">
                  <Lock className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Proteção Extra:</strong> Neste modo, apenas transações presenciais com 
                    aproximação (NFC) são permitidas. Ideal para viagens ou situações onde você 
                    suspeita de atividades suspeitas.
                  </span>
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}