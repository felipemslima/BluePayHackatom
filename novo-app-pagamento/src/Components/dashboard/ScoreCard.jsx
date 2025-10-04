import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function ScoreCard({ score }) {
  const getScoreColor = (score) => {
    if (score >= 750) return "text-green-400";
    if (score >= 650) return "text-yellow-400";
    return "text-orange-400";
  };

  const getScoreLabel = (score) => {
    if (score >= 750) return "Excelente";
    if (score >= 650) return "Bom";
    return "Regular";
  };

  const scorePercentage = ((score - 300) / 550) * 100;

  return (
    <Card className="bg-[#1f2544]/80 backdrop-blur-xl border-white/10 shadow-xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center gap-2 text-lg">
          <Award className="w-5 h-5 text-indigo-400" />
          Score de Crédito
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <div className={`text-4xl font-bold ${getScoreColor(score)}`}>
                {score}
              </div>
              <p className="text-gray-400 text-sm mt-1">{getScoreLabel(score)}</p>
            </div>
            <div className="flex items-center gap-1 text-green-400 text-sm">
              <TrendingUp className="w-4 h-4" />
              <span>+15 pts</span>
            </div>
          </div>
          
          <Progress value={scorePercentage} className="h-2 bg-white/10" />
          
          <p className="text-gray-400 text-xs">
            Faixa: 300 - 850 pontos
          </p>
        </div>
      </CardContent>
    </Card>
  );
}