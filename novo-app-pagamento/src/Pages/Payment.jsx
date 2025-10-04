import React, { useState, useEffect } from "react";
// REMOVED: Imports for User and Transaction JSON files
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Send, Smartphone, Zap, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import PaymentMethod from "../components/payment/PaymentMethod";
import NFCAnimation from "../components/payment/NFCAnimation";

const paymentMethods = [
  { id: "transfer", icon: Send, title: "Transferência", description: "Para conta bancária" },
  { id: "pix", icon: Zap, title: "PIX", description: "Transferência instantânea" },
  { id: "nfc", icon: Smartphone, title: "Aproximação", description: "Pagamento por NFC" },
];

// ALTERAÇÃO 1: Criamos um usuário falso (mock) com saldo para testar os pagamentos.
const mockUser = {
  account_balance: 12345.67,
  offline_mode: false, // Mude para 'true' para testar o modo offline
};

export default function Payment() {
  // ALTERAÇÃO 2: O estado do componente agora começa com os dados do usuário mock.
  const [user, setUser] = useState(mockUser);
  const [selectedMethod, setSelectedMethod] = useState("transfer");
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [description, setDescription] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showNFC, setShowNFC] = useState(false);
  const [result, setResult] = useState(null);

  // ALTERAÇÃO 3: A lógica de carregar dados (useEffect, loadUser) foi removida.

  const handlePayment = () => { // Removido 'async'
    if (user.offline_mode && selectedMethod !== "nfc") {
      setResult({
        type: "error",
        message: "No modo offline, apenas pagamentos por aproximação (NFC) são permitidos"
      });
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setResult({ type: "error", message: "Valor inválido" });
      return;
    }

    if (selectedMethod !== "nfc" && !recipient) {
      setResult({ type: "error", message: "Informe o destinatário" });
      return;
    }

    const paymentAmount = parseFloat(amount);
    if (paymentAmount > user.account_balance) {
      setResult({ type: "error", message: "Saldo insuficiente" });
      return;
    }

    if (selectedMethod === "nfc") {
      setShowNFC(true);
      setTimeout(() => processNFCPayment(paymentAmount), 3000);
      return;
    }

    processPayment(paymentAmount); // Removido 'await'
  };

  // ALTERAÇÃO 4: As funções de pagamento foram simplificadas para simular as ações.
  const processNFCPayment = (paymentAmount) => { // Removido 'async'
    setIsProcessing(true);
    const newBalance = user.account_balance - paymentAmount;

    console.log("Simulando criação de transação NFC:", {
      type: "nfc_payment",
      amount: paymentAmount,
      description: description || "Pagamento por aproximação",
      status: "completed",
    });

    setShowNFC(false);
    setResult({ type: "success", message: "Pagamento realizado com sucesso!" });
    setAmount("");
    setDescription("");
    setUser({ ...user, account_balance: newBalance });
    setIsProcessing(false);
  };

  const processPayment = (paymentAmount) => { // Removido 'async'
    setIsProcessing(true);
    const newBalance = user.account_balance - paymentAmount;
    
    console.log("Simulando criação de transação:", {
        type: selectedMethod,
        amount: paymentAmount,
        recipient: recipient,
        status: "completed",
    });

    setResult({ type: "success", message: "Pagamento realizado com sucesso!" });
    setAmount("");
    setRecipient("");
    setDescription("");
    setUser({ ...user, account_balance: newBalance });
    setIsProcessing(false);
  };

  // Esta verificação não é mais necessária pois o usuário sempre existirá.
  // if (!user) return null;

  if (showNFC) {
    return (
      <div className="min-h-screen p-6 md:p-8 flex items-center justify-center">
        <Card className="bg-[#1f2544]/80 backdrop-blur-xl border-white/10 shadow-xl max-w-md w-full">
          <CardContent className="p-8">
            <NFCAnimation />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Pagamentos</h1>
          <p className="text-gray-400 mt-1">Escolha a forma de pagamento</p>
        </div>

        {user.offline_mode && (
          <Alert className="bg-amber-600/20 border-amber-500">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <AlertDescription className="text-amber-200">
              <strong>Modo Offline Ativo:</strong> Apenas pagamentos por aproximação (NFC) estão disponíveis para sua segurança.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {paymentMethods.map((method) => (
            <div key={method.id} className="relative">
              <PaymentMethod
                {...method}
                selected={selectedMethod === method.id}
                onClick={() => {
                  setSelectedMethod(method.id);
                  setResult(null);
                }}
              />
              {user.offline_mode && method.id !== "nfc" && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
                  <div className="text-center p-4">
                    <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                    <p className="text-white font-medium text-sm">Bloqueado no modo offline</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <Card className="bg-[#1f2544]/80 backdrop-blur-xl border-white/10 shadow-xl">
          <CardHeader>
            <CardTitle className="text-white">Detalhes do Pagamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="amount" className="text-gray-300">Valor</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-white/5 border-white/10 text-white text-2xl font-bold mt-2"
              />
              <p className="text-gray-400 text-sm mt-2">
                Saldo disponível: R$ {user.account_balance?.toFixed(2)}
              </p>
            </div>

            {selectedMethod !== "nfc" && (
              <div>
                <Label htmlFor="recipient" className="text-gray-300">
                  {selectedMethod === "pix" ? "Chave PIX" : "Conta Destino"}
                </Label>
                <Input
                  id="recipient"
                  placeholder={selectedMethod === "pix" ? "email@exemplo.com" : "000000-0"}
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="bg-white/5 border-white/10 text-white mt-2"
                  disabled={user.offline_mode}
                />
              </div>
            )}

            <div>
              <Label htmlFor="description" className="text-gray-300">Descrição (opcional)</Label>
              <Input
                id="description"
                placeholder="Ex: Pagamento de compras"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-white/5 border-white/10 text-white mt-2"
              />
            </div>

            {result && (
              <Alert className={result.type === "success" ? "bg-green-600/20 border-green-500" : "bg-red-600/20 border-red-500"}>
                {result.type === "success" ? (
                  <CheckCircle className="h-4 w-4 text-green-400" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-400" />
                )}
                <AlertDescription className={result.type === "success" ? "text-green-400" : "text-red-400"}>
                  {result.message}
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handlePayment}
              disabled={isProcessing || (user.offline_mode && selectedMethod !== "nfc")}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-6 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? "Processando..." : "Confirmar Pagamento"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}