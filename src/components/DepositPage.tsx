import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeftRight, Wallet, DollarSign, Plus, RefreshCw, Coins } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { dbService } from '@/services/database';

interface DepositPageProps {
  userInfo: any;
  onBack: () => void;
}

const DepositPage = ({ userInfo, onBack }: DepositPageProps) => {
  const [depositAmount, setDepositAmount] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [conversionAmount, setConversionAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [adminSettings, setAdminSettings] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await dbService.getAdminSettings();
      setAdminSettings(settings);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const bkashRate = parseFloat(adminSettings.bkash_rate || '120');
  const minDeposit = parseFloat(adminSettings.min_deposit_amount || '120');
  const minConversion = parseFloat(adminSettings.min_conversion_amount || '1.0');
  const conversionFee = parseFloat(adminSettings.conversion_fee || '0.1');

  const handleDeposit = async () => {
    if (!depositAmount || !transactionId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const amount = parseFloat(depositAmount);
    if (amount < minDeposit) {
      toast({
        title: "Error",
        description: `Minimum deposit amount is ৳${minDeposit} BDT`,
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const success = await dbService.createDeposit(
        userInfo.telegram_id,
        amount,
        'bkash',
        transactionId
      );

      if (success) {
        toast({
          title: "Success",
          description: "Deposit request submitted successfully. Please wait for admin approval.",
        });
        setDepositAmount('');
        setTransactionId('');
      } else {
        throw new Error('Deposit failed');
      }
    } catch (error) {
      console.error('Error creating deposit:', error);
      toast({
        title: "Error",
        description: "Failed to submit deposit request",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConversion = async () => {
    if (!conversionAmount) {
      toast({
        title: "Error",
        description: "Please enter amount to convert",
        variant: "destructive"
      });
      return;
    }

    const amount = parseFloat(conversionAmount);
    if (amount < minConversion) {
      toast({
        title: "Error",
        description: `Minimum conversion amount is $${minConversion} USDT`,
        variant: "destructive"
      });
      return;
    }

    if (amount > (userInfo.balance || 0)) {
      toast({
        title: "Error",
        description: "Insufficient earning balance",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const success = await dbService.convertEarningToDeposit(userInfo.telegram_id, amount);
      
      if (success) {
        toast({
          title: "Success",
          description: `Converted $${amount - conversionFee} USDT to deposit balance (Fee: $${conversionFee})`,
        });
        setConversionAmount('');
        // Trigger parent component to refresh user data
        window.location.reload();
      } else {
        throw new Error('Conversion failed');
      }
    } catch (error) {
      console.error('Error converting balance:', error);
      toast({
        title: "Error",
        description: "Failed to convert balance",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-white hover:text-gray-300"
          >
            ← Back
          </Button>
          <h1 className="text-2xl font-bold text-white">Deposit & Convert</h1>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4 text-center">
              <DollarSign className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Earning Balance</p>
              <p className="text-xl font-bold text-white">${(userInfo.balance || 0).toFixed(3)}</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4 text-center">
              <Wallet className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Deposit Balance</p>
              <p className="text-xl font-bold text-white">${(userInfo.deposit_balance || 0).toFixed(3)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Bkash Deposit */}
        <Card className="bg-gray-800 border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Plus className="w-5 h-5 mr-2" />
              Bkash Deposit
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-3">
              <p className="text-blue-300 text-sm">
                <strong>Exchange Rate:</strong> ৳{bkashRate} BDT = $1 USDT
              </p>
              <p className="text-blue-300 text-sm">
                <strong>Minimum:</strong> ৳{minDeposit} BDT
              </p>
            </div>

            <div>
              <Label className="text-white">Amount (BDT)</Label>
              <Input
                type="number"
                placeholder={`Minimum ৳${minDeposit}`}
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
              />
              {depositAmount && (
                <p className="text-gray-400 text-sm mt-1">
                  ≈ ${(parseFloat(depositAmount) / bkashRate).toFixed(3)} USDT
                </p>
              )}
            </div>

            <div>
              <Label className="text-white">Bkash Transaction ID</Label>
              <Input
                type="text"
                placeholder="Enter transaction ID"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>

            <Button 
              onClick={handleDeposit}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Submit Deposit Request
            </Button>
          </CardContent>
        </Card>

        {/* Balance Conversion */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <ArrowLeftRight className="w-5 h-5 mr-2" />
              Convert Earning to Deposit
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3">
              <p className="text-yellow-300 text-sm">
                <strong>Minimum:</strong> ${minConversion} USDT
              </p>
              <p className="text-yellow-300 text-sm">
                <strong>Fee:</strong> ${conversionFee} USDT per conversion
              </p>
            </div>

            <div>
              <Label className="text-white">Amount to Convert (USDT)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder={`Minimum $${minConversion}`}
                value={conversionAmount}
                onChange={(e) => setConversionAmount(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
              />
              {conversionAmount && parseFloat(conversionAmount) >= minConversion && (
                <div className="text-gray-400 text-sm mt-1 space-y-1">
                  <p>Amount after fee: ${(parseFloat(conversionAmount) - conversionFee).toFixed(3)} USDT</p>
                  <p>Fee: ${conversionFee} USDT</p>
                </div>
              )}
            </div>

            <Button 
              onClick={handleConversion}
              disabled={loading || !conversionAmount || parseFloat(conversionAmount) < minConversion}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <ArrowLeftRight className="w-4 h-4 mr-2" />
              )}
              Convert Balance
            </Button>
          </CardContent>
        </Card>

        {/* Info */}
        <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
          <h3 className="text-white font-medium mb-2">How it works:</h3>
          <ul className="text-gray-400 text-sm space-y-1">
            <li>• Deposit via Bkash to get deposit balance</li>
            <li>• Use deposit balance to upload tasks</li>
            <li>• Convert earning balance to deposit balance (with fee)</li>
            <li>• Deposits require admin approval</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DepositPage;