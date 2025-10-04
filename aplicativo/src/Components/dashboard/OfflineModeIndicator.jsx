import React from "react";
import { WifiOff, Shield } from "lucide-react";
import { motion } from "framer-motion";

export default function OfflineModeIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-4 right-4 z-50 bg-gradient-to-r from-amber-600 to-orange-600 text-white px-4 py-2 rounded-full shadow-2xl flex items-center gap-2"
    >
      <motion.div
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Shield className="w-4 h-4" />
      </motion.div>
      <span className="text-sm font-semibold">Modo Offline Ativo</span>
      <WifiOff className="w-4 h-4" />
    </motion.div>
  );
}