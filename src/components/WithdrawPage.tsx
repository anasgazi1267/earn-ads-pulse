import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, DollarSign, Users, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { dbService } from '@/services/database';

interface PaymentMethod {
  id: string;
  name: string;
  display_name: string;
  min_amount: number;
  max_amount?: number;
}

interface WithdrawPageProps {
  withdrawalEnabled: boolean;
  referralCount: number;
  userBalance: number;
  userInfo: any;
}

const WithdrawPage: React.FC<WithdrawPageProps> = ({
  withdrawalEnabled,
  referralCount,
  userBalance,
  userInfo
}) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState('');
  const [amount, setAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPaymentMethods();
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

  const handleWithdraw = async () => {
    if (!withdrawalEnabled) {
      toast({
        title: "Withdrawal not available",
        description: "You need at least 5 referrals to withdraw",
        variant: "destructive"
      });
      return;
    }

    if (!selectedMethod || !amount || !walletAddress) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    const withdrawAmount = parseFloat(amount);
    if (withdrawAmount > userBalance) {
      toast({
        title: "Insufficient balance",
        description: "You don't have enough balance to withdraw this amount",
        variant: "destructive"
      });
      return;
    }

    const selectedPaymentMethod = paymentMethods.find(m => m.id === selectedMethod);
    if (selectedPaymentMethod) {
      if (withdrawAmount < selectedPaymentMethod.min_amount) {
        toast({
          title: "Amount too low",
          description: `Minimum withdrawal amount is $${selectedPaymentMethod.min_amount}`,
          variant: "destructive"
        });
        return;
      }

      if (selectedPaymentMethod.max_amount && withdrawAmount > selectedPaymentMethod.max_amount) {
        toast({
          title: "Amount too high",
          description: `Maximum withdrawal amount is $${selectedPaymentMethod.max_amount}`,
          variant: "destructive"
        });
        return;
      }
    }

    setLoading(true);
    try {
      const success = await dbService.createWithdrawalRequest({
        telegram_id: userInfo.id.toString(),
        username: userInfo.username || 'N/A',
        amount: withdrawAmount,
        withdrawal_method: selectedPaymentMethod?.name || selectedMethod,
        wallet_address: walletAddress,
        status: 'pending'
      });

      if (success) {
        toast({
          title: "Withdrawal request submitted!",
          description: "Your withdrawal will be processed within 24-48 hours",
        });
        
        // Reset form
        setAmount('');
        setWalletAddress('');
        setSelectedMethod('');
      } else {
        throw new Error('Failed to submit withdrawal request');
      }
    } catch (error) {
      console.error('Error submitting withdrawal:', error);
      toast({
        title: "Error",
        description: "Failed to submit withdrawal request",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center">
            <DollarSign className="w-6 h-6 mr-2" />
            Withdraw Funds
          </h1>
        </div>

        {/* Balance & Referral Info */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="bg-gray-800/50 backdrop-blur-xl border-gray-700/50">
            <CardContent className="p-4 text-center">
              <DollarSign className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Available Balance</p>
              <p className="text-2xl font-bold text-white">${userBalance.toFixed(3)}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800/50 backdrop-blur-xl border-gray-700/50">
            <CardContent className="p-4 text-center">
              <Users className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Referrals</p>
              <p className="text-2xl font-bold text-white">{referralCount}/5</p>
            </CardContent>
          </Card>
        </div>

        {/* Withdrawal Status Alert */}
        {!withdrawalEnabled && (
          <Alert className="mb-6 bg-orange-900/20 border-orange-500/30">
            <AlertTriangle className="h-4 w-4 text-orange-400" />
            <AlertDescription className="text-orange-300">
              You need at least 5 referrals to enable withdrawals. 
              Current referrals: {referralCount}/5
            </AlertDescription>
          </Alert>
        )}

        {/* Withdrawal Form */}
        <Card className="bg-gray-800/50 backdrop-blur-xl border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-white">Withdrawal Request</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Payment Method Selection */}
            <div>
              <Label className="text-gray-300 mb-2 block">
                Withdrawal Method
              </Label>
              <Select onValueChange={setSelectedMethod} disabled={!withdrawalEnabled}>
                <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white">
                  <SelectValue placeholder="Choose withdrawal method" />
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

            {/* Amount Input */}
            <div>
              <Label htmlFor="amount" className="text-gray-300">
                Withdrawal Amount ($)
              </Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={!withdrawalEnabled}
                className="bg-gray-700/50 border-gray-600 text-white"
                max={userBalance}
              />
              {selectedMethod && paymentMethods.find(m => m.id === selectedMethod) && (
                <p className="text-gray-400 text-sm mt-1">
                  Min: ${paymentMethods.find(m => m.id === selectedMethod)?.min_amount} 
                  {paymentMethods.find(m => m.id === selectedMethod)?.max_amount && 
                    ` | Max: $${paymentMethods.find(m => m.id === selectedMethod)?.max_amount}`
                  }
                </p>
              )}
            </div>

            {/* Wallet Address */}
            <div>
              <Label htmlFor="wallet" className="text-gray-300">
                Wallet Address / Account ID
              </Label>
              <Input
                id="wallet"
                placeholder="Enter your wallet address or account ID"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                disabled={!withdrawalEnabled}
                className="bg-gray-700/50 border-gray-600 text-white"
              />
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleWithdraw}
              disabled={loading || !withdrawalEnabled || !selectedMethod || !amount || !walletAddress}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 disabled:opacity-50"
            >
              {loading ? "Processing..." : "Submit Withdrawal Request"}
            </Button>

            {/* Information */}
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mt-4">
              <h3 className="text-blue-300 font-semibold mb-2">Important Information:</h3>
              <ul className="text-blue-200 text-sm space-y-1">
                <li>• Withdrawals are processed within 24-48 hours</li>
                <li>• Minimum 5 referrals required for withdrawal</li>
                <li>• Double-check your wallet address before submitting</li>
                <li>• Processing fees may apply depending on the method</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WithdrawPage;