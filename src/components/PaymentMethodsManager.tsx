import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  platform: string;
  admin_id: string;
  display_name: string;
  instructions: string;
  min_amount: number;
  max_amount?: number;
  exchange_rate: number;
  is_active: boolean;
}

const PaymentMethodsManager = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const defaultMethod: Omit<PaymentMethod, 'id'> = {
    name: '',
    type: 'both',
    platform: 'binance',
    admin_id: '',
    display_name: '',
    instructions: '',
    min_amount: 1.0,
    max_amount: undefined,
    exchange_rate: 1.0,
    is_active: true
  };

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPaymentMethods(data || []);
    } catch (error) {
      console.error('Error loading payment methods:', error);
      toast({
        title: "Error",
        description: "Failed to load payment methods",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (method: Omit<PaymentMethod, 'id'> | PaymentMethod) => {
    try {
      if ('id' in method) {
        // Update existing
        const { error } = await supabase
          .from('payment_methods')
          .update(method)
          .eq('id', method.id);

        if (error) throw error;
        toast({ title: "Success", description: "Payment method updated" });
      } else {
        // Create new
        const { error } = await supabase
          .from('payment_methods')
          .insert([method]);

        if (error) throw error;
        toast({ title: "Success", description: "Payment method created" });
      }

      setEditingMethod(null);
      setShowForm(false);
      loadPaymentMethods();
    } catch (error) {
      console.error('Error saving payment method:', error);
      toast({
        title: "Error",
        description: "Failed to save payment method",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment method?')) return;

    try {
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({ title: "Success", description: "Payment method deleted" });
      loadPaymentMethods();
    } catch (error) {
      console.error('Error deleting payment method:', error);
      toast({
        title: "Error",
        description: "Failed to delete payment method",
        variant: "destructive"
      });
    }
  };

  const toggleActive = async (method: PaymentMethod) => {
    try {
      const { error } = await supabase
        .from('payment_methods')
        .update({ is_active: !method.is_active })
        .eq('id', method.id);

      if (error) throw error;
      loadPaymentMethods();
    } catch (error) {
      console.error('Error toggling payment method:', error);
    }
  };

  const PaymentMethodForm = ({ method, onSave, onCancel }: {
    method: Omit<PaymentMethod, 'id'> | PaymentMethod;
    onSave: (method: any) => void;
    onCancel: () => void;
  }) => {
    const [formData, setFormData] = useState(method);

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
        <div className="md:col-span-2">
          <Label className="text-white">Name</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="bg-gray-700 border-gray-600 text-white"
            placeholder="e.g., Binance Pay"
          />
        </div>

        <div>
          <Label className="text-white">Type</Label>
          <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
            <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="deposit">Deposit Only</SelectItem>
              <SelectItem value="withdrawal">Withdrawal Only</SelectItem>
              <SelectItem value="both">Both</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-white">Platform</Label>
          <Select value={formData.platform} onValueChange={(value) => setFormData({ ...formData, platform: value })}>
            <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="binance">Binance</SelectItem>
              <SelectItem value="payeer">Payeer</SelectItem>
              <SelectItem value="bkash">Bkash</SelectItem>
              <SelectItem value="usdt">USDT</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-white">Admin ID/Address</Label>
          <Input
            value={formData.admin_id}
            onChange={(e) => setFormData({ ...formData, admin_id: e.target.value })}
            className="bg-gray-700 border-gray-600 text-white"
            placeholder="Admin account ID"
          />
        </div>

        <div>
          <Label className="text-white">Display Name</Label>
          <Input
            value={formData.display_name}
            onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
            className="bg-gray-700 border-gray-600 text-white"
            placeholder="Name shown to users"
          />
        </div>

        <div>
          <Label className="text-white">Min Amount</Label>
          <Input
            type="number"
            step="0.1"
            value={formData.min_amount}
            onChange={(e) => setFormData({ ...formData, min_amount: parseFloat(e.target.value) || 0 })}
            className="bg-gray-700 border-gray-600 text-white"
          />
        </div>

        <div>
          <Label className="text-white">Exchange Rate (to USD)</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.exchange_rate}
            onChange={(e) => setFormData({ ...formData, exchange_rate: parseFloat(e.target.value) || 1 })}
            className="bg-gray-700 border-gray-600 text-white"
          />
        </div>

        <div className="md:col-span-2">
          <Label className="text-white">Instructions</Label>
          <Input
            value={formData.instructions}
            onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
            className="bg-gray-700 border-gray-600 text-white"
            placeholder="Instructions for users"
          />
        </div>

        <div className="md:col-span-2 flex gap-3">
          <Button
            onClick={() => onSave(formData)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
          <Button
            onClick={onCancel}
            variant="outline"
            className="border-gray-600 text-gray-300"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-white">Payment Methods</CardTitle>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Method
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <PaymentMethodForm
            method={defaultMethod}
            onSave={handleSave}
            onCancel={() => setShowForm(false)}
          />
        )}

        {editingMethod && (
          <PaymentMethodForm
            method={editingMethod}
            onSave={handleSave}
            onCancel={() => setEditingMethod(null)}
          />
        )}

        <div className="space-y-3">
          {paymentMethods.map((method) => (
            <div key={method.id} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-white font-medium">{method.display_name}</h3>
                    <Badge variant={method.type === 'both' ? 'default' : 'secondary'}>
                      {method.type}
                    </Badge>
                    <Badge variant={method.is_active ? 'default' : 'destructive'}>
                      {method.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <p className="text-gray-300 text-sm mb-1">
                    <strong>Platform:</strong> {method.platform} | <strong>ID:</strong> {method.admin_id}
                  </p>
                  <p className="text-gray-300 text-sm mb-1">
                    <strong>Min:</strong> ${method.min_amount} | <strong>Rate:</strong> {method.exchange_rate}x
                  </p>
                  <p className="text-gray-400 text-sm">{method.instructions}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleActive(method)}
                    className="border-gray-600"
                  >
                    {method.is_active ? 'Disable' : 'Enable'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingMethod(method)}
                    className="border-gray-600"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(method.id)}
                    className="border-red-600 text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-400 mt-2">Loading payment methods...</p>
          </div>
        )}

        {!loading && paymentMethods.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-400">No payment methods configured</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentMethodsManager;