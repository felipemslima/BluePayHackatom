import React, { useState, useEffect } from "react";
// REMOVIDO: import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Award, User as UserIcon, Phone, CreditCard, Key, Bell, Shield } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";

// ALTERAÇÃO 1: Criamos um usuário falso (mock) com todos os dados necessários para a tela.
const mockUser = {
  full_name: "Felipe Teste",
  email: "felipe.teste@email.com",
  account_number: "123456-7",
  role: "admin",
  credit_score: 820,
  phone: "(11) 98765-4321",
  pix_key: "felipe.teste@email.com",
  nfc_enabled: true,
};

export default function Profile() {
  // ALTERAÇÃO 2: O estado agora começa com os dados do nosso usuário mock.
  const [user, setUser] = useState(mockUser);
  const [phone, setPhone] = useState(user.phone || "");
  const [pixKey, setPixKey] = useState(user.pix_key || "");
  const [nfcEnabled, setNfcEnabled] = useState(user.nfc_enabled !== false);
  const [saveMessage, setSaveMessage] = useState("");

  // ALTERAÇÃO 3: As funções de carregar e salvar dados foram simplificadas.
  // O useEffect e o loadUser não são mais necessários, pois os dados já estão aqui.

  const handleSave = () => {
    console.log("Salvando dados:", { phone, pix_key: pixKey, nfc_enabled: nfcEnabled });
    setSaveMessage("Dados atualizados com sucesso!");
    setTimeout(() => setSaveMessage(""), 3000);
    // Em um app real, você atualizaria o estado do usuário aqui.
  };

  // Esta verificação não é mais necessária, pois o usuário sempre existirá.
  // if (!user) return null;

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

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Perfil</h1>
          <p className="text-gray-400 mt-1">Gerencie suas informações pessoais</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border-indigo-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <UserIcon className="w-5 h-5" />
                Informações Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-gray-400 text-sm">Nome Completo</p>
                <p className="text-white font-semibold text-lg">{user.full_name}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Email</p>
                <p className="text-white font-semibold">{user.email}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Conta</p>
                <p className="text-white font-semibold font-mono">
                  {user.account_number || "000000-0"}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Tipo de Conta</p>
                <Badge className="bg-indigo-600 mt-1">
                  {user.role === "admin" ? "Premium" : "Standard"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border-green-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Award className="w-5 h-5" />
                Score de Crédito
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6">
                <div className={`text-6xl font-bold ${getScoreColor(user.credit_score || 650)}`}>
                  {user.credit_score || 650}
                </div>
                <p className="text-gray-300 mt-2 text-lg">{getScoreLabel(user.credit_score || 650)}</p>
                <p className="text-gray-400 text-sm mt-4">Faixa: 300 - 850 pontos</p>
              </div>
              
              <div className="space-y-2 mt-4 pt-4 border-t border-white/10">
                <p className="text-white font-medium text-sm">Dicas para melhorar:</p>
                <ul className="text-gray-400 text-xs space-y-1">
                  <li>• Pague suas contas em dia</li>
                  <li>• Mantenha saldo positivo</li>
                  <li>• Use menos de 30% do limite</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-[#1f2544]/80 backdrop-blur-xl border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Dados de Contato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="phone" className="text-gray-300">Telefone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(00) 00000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-white/5 border-white/10 text-white mt-2"
              />
            </div>

            <div>
              <Label htmlFor="pix" className="text-gray-300">Chave PIX</Label>
              <Input
                id="pix"
                placeholder="email@exemplo.com ou telefone"
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                className="bg-white/5 border-white/10 text-white mt-2"
              />
              <p className="text-gray-400 text-xs mt-1">
                Use para receber transferências instantâneas
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1f2544]/80 backdrop-blur-xl border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Configurações de Segurança
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-purple-400" />
                <div>
                  <p className="text-white font-medium">Pagamento por Aproximação (NFC)</p>
                  <p className="text-gray-400 text-sm">Pague com um toque no celular</p>
                </div>
              </div>
              <Switch
                checked={nfcEnabled}
                onCheckedChange={setNfcEnabled}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-white font-medium">Notificações Push</p>
                  <p className="text-gray-400 text-sm">Receba alertas de transações</p>
                </div>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
              <div className="flex items-center gap-3">
                <Key className="w-5 h-5 text-amber-400" />
                <div>
                  <p className="text-white font-medium">Autenticação em Duas Etapas</p>
                  <p className="text-gray-400 text-sm">Proteção extra para sua conta</p>
                </div>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {saveMessage && (
          <Alert className="bg-green-600/20 border-green-500">
            <AlertDescription className="text-green-400">
              {saveMessage}
            </AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleSave}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-6 text-lg font-semibold"
        >
          Salvar Alterações
        </Button>
      </div>
    </div>
  );
}