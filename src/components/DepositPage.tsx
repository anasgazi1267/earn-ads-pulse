import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Copy, Upload, DollarSign, Wallet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { dbService } from '@/services/database';

interface PaymentMethod {
  id: string;
  name: string;
  display_name: string;
  admin_id: string;
  instructions?: string;
  min_amount: number;
  max_amount?: number;
}

interface DepositPageProps {
  userInfo: any;
  onBack: () => void;
}

const DepositPage: React.FC<DepositPageProps> = ({ userInfo, onBack }) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [amount, setAmount] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionFee, setConversionFee] = useState(0.1);
  const { toast } = useToast();

  useEffect(() => {
    loadPaymentMethods();
    loadConversionFee();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      const methods = await dbService.getPaymentMethods();
      // Filter out bKash methods
      const filteredMethods = methods.filter(method => 
        method.name !== 'bkash' && method.name.toLowerCase() !== 'bkash'
      );
      setPaymentMethods(filteredMethods);
    } catch (error) {
      console.error('Error loading payment methods:', error);
    }
  };

  const loadConversionFee = async () => {
    try {
      const fee = await dbService.getAdminSetting('conversion_fee_percentage');
      setConversionFee(parseFloat(fee) || 0.1);
    } catch (error) {
      console.error('Error loading conversion fee:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Payment ID copied to clipboard",
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Please upload an image under 5MB",
          variant: "destructive"
        });
        return;
      }
      setScreenshot(file);
    }
  };

  const handleDeposit = async () => {
    if (!selectedMethod || !amount || !transactionId) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const depositAmount = parseFloat(amount);
    if (depositAmount < selectedMethod.min_amount) {
      toast({
        title: "Amount too low",
        description: `Minimum deposit amount is $${selectedMethod.min_amount}`,
        variant: "destructive"
      });
      return;
    }

    if (selectedMethod.max_amount && depositAmount > selectedMethod.max_amount) {
      toast({
        title: "Amount too high",
        description: `Maximum deposit amount is $${selectedMethod.max_amount}`,
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const success = await dbService.createDepositRequest({
        user_id: userInfo.id.toString(),
        amount: depositAmount,
        deposit_method: selectedMethod.name,
        transaction_id: transactionId,
        status: 'pending',
        converted_from_earnings: false
      });

      if (success) {
        toast({
          title: "Deposit request submitted!",
          description: "Your deposit will be processed within 24 hours",
        });
        
        // Reset form
        setAmount('');
        setTransactionId('');
        setScreenshot(null);
        setNote('');
        setSelectedMethod(null);
      } else {
        throw new Error('Failed to submit deposit request');
      }
    } catch (error) {
      console.error('Error submitting deposit:', error);
      toast({
        title: "Error",
        description: "Failed to submit deposit request",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConvertBalance = async () => {
    const currentBalance = userInfo?.balance || 0;
    if (!currentBalance || currentBalance <= 0) {
      toast({
        title: "No balance to convert",
        description: "You need earnings balance to convert",
        variant: "destructive"
      });
      return;
    }

    if (!amount) {
      toast({
        title: "Enter amount",
        description: "Please enter amount to convert",
        variant: "destructive"
      });
      return;
    }

    const convertAmount = parseFloat(amount);
    const feeAmount = convertAmount * conversionFee;
    const finalAmount = convertAmount - feeAmount;

    if (convertAmount > currentBalance) {
      toast({
        title: "Insufficient balance",
        description: "Not enough earnings balance",
        variant: "destructive"
      });
      return;
    }

    setIsConverting(true);
    try {
      const success = await dbService.convertEarningsToDeposit(
        userInfo.telegram_id.toString(),
        convertAmount
      );

      if (success) {
        toast({
          title: "Balance converted!",
          description: `$${finalAmount.toFixed(3)} added to deposit balance (fee: $${feeAmount.toFixed(3)})`,
        });
        setAmount('');
      } else {
        throw new Error('Failed to convert balance');
      }
    } catch (error) {
      console.error('Error converting balance:', error);
      toast({
        title: "Error",
        description: "Failed to convert balance",
        variant: "destructive"
      });
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="text-white hover:bg-white/10 mr-4"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-white">Deposit Funds</h1>
        </div>

        {/* Balance Conversion Card */}
        <Card className="bg-gradient-to-br from-emerald-900/40 to-teal-900/40 backdrop-blur-xl border-emerald-500/20 shadow-xl shadow-emerald-500/10 mb-6">
          <CardHeader>
            <CardTitle className="text-emerald-100 flex items-center text-xl">
              <Wallet className="w-6 h-6 mr-3 text-emerald-400" />
              Convert Earnings Balance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">Available Earnings</Label>
                <p className="text-xl font-bold text-green-400">
                  ${(userInfo?.balance || 0).toFixed(3)}
                </p>
              </div>
              <div>
                <Label className="text-gray-300">Conversion Fee</Label>
                <p className="text-xl font-bold text-red-400">
                  {(conversionFee * 100).toFixed(1)}%
                </p>
              </div>
            </div>
            
            <div>
              <Label htmlFor="convertAmount" className="text-gray-300">
                Amount to Convert
              </Label>
              <Input
                id="convertAmount"
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-gray-700/50 border-gray-600 text-white"
              />
              {amount && (
                <p className="text-sm text-gray-400 mt-1">
                  You'll receive: ${(parseFloat(amount) * (1 - conversionFee)).toFixed(3)} 
                  (Fee: ${(parseFloat(amount) * conversionFee).toFixed(3)})
                </p>
              )}
            </div>

            <Button
              onClick={handleConvertBalance}
              disabled={isConverting || !amount}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600"
            >
              {isConverting ? "Converting..." : "Convert to Deposit Balance"}
            </Button>
          </CardContent>
        </Card>

        {/* External Deposit Card */}
        <Card className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 backdrop-blur-xl border-blue-500/20 shadow-xl shadow-blue-500/10">
          <CardHeader>
            <CardTitle className="text-blue-100 flex items-center text-xl">
              <DollarSign className="w-6 h-6 mr-3 text-blue-400" />
              External Deposit
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Payment Method Selection */}
            <div>
              <Label className="text-gray-300 mb-2 block">
                Select Payment Method
              </Label>
              <Select onValueChange={(value) => {
                const method = paymentMethods.find(m => m.id === value);
                setSelectedMethod(method || null);
              }}>
                <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white">
                  <SelectValue placeholder="Choose payment method" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.id} value={method.id}>
                      {method.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Payment Details */}
            {selectedMethod && (
              <Card className="bg-gray-700/30 border-gray-600/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white font-semibold">{selectedMethod.display_name}</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(selectedMethod.admin_id)}
                      className="border-gray-600 text-gray-300 hover:bg-gray-600"
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy ID
                    </Button>
                  </div>
                  <p className="text-gray-300 text-sm mb-2">
                    Payment ID: <span className="font-mono text-blue-400">{selectedMethod.admin_id}</span>
                  </p>
                  <p className="text-gray-400 text-xs">
                    Min: ${selectedMethod.min_amount} 
                    {selectedMethod.max_amount && ` | Max: $${selectedMethod.max_amount}`}
                  </p>
                  {selectedMethod.instructions && (
                    <p className="text-gray-400 text-sm mt-2">
                      {selectedMethod.instructions}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Amount Input */}
            <div>
              <Label htmlFor="amount" className="text-gray-300">
                Deposit Amount ($)
              </Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-gray-700/50 border-gray-600 text-white"
              />
            </div>

            {/* Transaction ID */}
            <div>
              <Label htmlFor="transactionId" className="text-gray-300">
                Transaction ID *
              </Label>
              <Input
                id="transactionId"
                placeholder="Enter transaction ID"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                className="bg-gray-700/50 border-gray-600 text-white"
              />
            </div>

            {/* Screenshot Upload */}
            <div>
              <Label className="text-gray-300 mb-2 block">
                Payment Screenshot (Optional)
              </Label>
              <div className="flex items-center space-x-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="bg-gray-700/50 border-gray-600 text-white file:bg-gray-600 file:border-0 file:text-white"
                />
                {screenshot && (
                  <div className="flex items-center text-green-400 text-sm">
                    <Upload className="w-4 h-4 mr-1" />
                    {screenshot.name}
                  </div>
                )}
              </div>
            </div>

            {/* Note */}
            <div>
              <Label htmlFor="note" className="text-gray-300">
                Additional Note (Optional)
              </Label>
              <Textarea
                id="note"
                placeholder="Any additional information..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="bg-gray-700/50 border-gray-600 text-white"
                rows={3}
              />
            </div>

            <Button
              onClick={handleDeposit}
              disabled={loading || !selectedMethod || !amount || !transactionId}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
            >
              {loading ? "Submitting..." : "Submit Deposit Request"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DepositPage;