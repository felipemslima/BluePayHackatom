import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Check } from "lucide-react";

export default function PaymentMethod({ icon: Icon, title, description, selected, onClick }) {
  return (
    <Card
      onClick={onClick}
      className={`cursor-pointer transition-all duration-200 ${
        selected
          ? "bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border-indigo-500"
          : "bg-[#1f2544]/80 border-white/10 hover:border-white/20"
      }`}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              selected ? "bg-indigo-600" : "bg-white/5"
            }`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold">{title}</h3>
              <p className="text-gray-400 text-sm">{description}</p>
            </div>
          </div>
          {selected && (
            <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}