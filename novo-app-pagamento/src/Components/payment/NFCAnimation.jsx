import React from "react";
import { Smartphone, Radio } from "lucide-react";
import { motion } from "framer-motion";

export default function NFCAnimation() {
  return (
    <div className="relative w-full h-64 flex items-center justify-center">
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.1, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute w-48 h-48 bg-indigo-600/20 rounded-full"
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.5, 0.2, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.3,
        }}
        className="absolute w-40 h-40 bg-purple-600/20 rounded-full"
      />
      <div className="relative z-10 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl mx-auto flex items-center justify-center shadow-2xl mb-4">
          <Smartphone className="w-10 h-10 text-white" />
        </div>
        <Radio className="w-8 h-8 text-indigo-400 mx-auto animate-pulse" />
        <p className="text-white font-semibold mt-4">Aproxime seu dispositivo</p>
        <p className="text-gray-400 text-sm">Aguardando pagamento...</p>
      </div>
    </div>
  );
}