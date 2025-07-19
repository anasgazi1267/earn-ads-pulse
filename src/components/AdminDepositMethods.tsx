import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DepositMethod {
  id: string;
  name: string;
  fields: string[];
  isActive: boolean;
}

interface WithdrawalMethod {
  id: string;
  name: string;
  fields: string[];
  isActive: boolean;
}

const AdminDepositMethods: React.FC = () => {
  const { toast } = useToast();
  const [depositMethods, setDepositMethods] = useState<DepositMethod[]>([
    { id: '1', name: 'Bkash', fields: ['Phone Number', 'Transaction ID'], isActive: true },
    { id: '2', name: 'Nagad', fields: ['Phone Number', 'Transaction ID'], isActive: false }
  ]);
  
  const [withdrawalMethods, setWithdrawalMethods] = useState<WithdrawalMethod[]>([
    { id: '1', name: 'Binance USDT', fields: ['Wallet Address', 'Network'], isActive: true },
    { id: '2', name: 'TonWallet USDT', fields: ['Wallet Address'], isActive: false }
  ]);

  const [newDepositMethod, setNewDepositMethod] = useState({ name: '', fields: [''] });
  const [newWithdrawalMethod, setNewWithdrawalMethod] = useState({ name: '', fields: [''] });
  const [editingDeposit, setEditingDeposit] = useState<string | null>(null);
  const [editingWithdrawal, setEditingWithdrawal] = useState<string | null>(null);

  const addDepositField = () => {
    setNewDepositMethod(prev => ({
      ...prev,
      fields: [...prev.fields, '']
    }));
  };

  const updateDepositField = (index: number, value: string) => {
    setNewDepositMethod(prev => ({
      ...prev,
      fields: prev.fields.map((field, i) => i === index ? value : field)
    }));
  };

  const removeDepositField = (index: number) => {
    setNewDepositMethod(prev => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index)
    }));
  };

  const addWithdrawalField = () => {
    setNewWithdrawalMethod(prev => ({
      ...prev,
      fields: [...prev.fields, '']
    }));
  };

  const updateWithdrawalField = (index: number, value: string) => {
    setNewWithdrawalMethod(prev => ({
      ...prev,
      fields: prev.fields.map((field, i) => i === index ? value : field)
    }));
  };

  const removeWithdrawalField = (index: number) => {
    setNewWithdrawalMethod(prev => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index)
    }));
  };

  const saveDepositMethod = () => {
    if (!newDepositMethod.name.trim()) {
      toast({
        title: "Error",
        description: "Method name is required",
        variant: "destructive"
      });
      return;
    }

    const validFields = newDepositMethod.fields.filter(field => field.trim());
    if (validFields.length === 0) {
      toast({
        title: "Error", 
        description: "At least one field is required",
        variant: "destructive"
      });
      return;
    }

    const newMethod: DepositMethod = {
      id: Date.now().toString(),
      name: newDepositMethod.name,
      fields: validFields,
      isActive: true
    };

    setDepositMethods(prev => [...prev, newMethod]);
    setNewDepositMethod({ name: '', fields: [''] });
    
    toast({
      title: "Success",
      description: "Deposit method added successfully"
    });
  };

  const saveWithdrawalMethod = () => {
    if (!newWithdrawalMethod.name.trim()) {
      toast({
        title: "Error",
        description: "Method name is required",
        variant: "destructive"
      });
      return;
    }

    const validFields = newWithdrawalMethod.fields.filter(field => field.trim());
    if (validFields.length === 0) {
      toast({
        title: "Error",
        description: "At least one field is required", 
        variant: "destructive"
      });
      return;
    }

    const newMethod: WithdrawalMethod = {
      id: Date.now().toString(),
      name: newWithdrawalMethod.name,
      fields: validFields,
      isActive: true
    };

    setWithdrawalMethods(prev => [...prev, newMethod]);
    setNewWithdrawalMethod({ name: '', fields: [''] });
    
    toast({
      title: "Success",
      description: "Withdrawal method added successfully"
    });
  };

  const toggleDepositMethodStatus = (id: string) => {
    setDepositMethods(prev => prev.map(method => 
      method.id === id ? { ...method, isActive: !method.isActive } : method
    ));
  };

  const toggleWithdrawalMethodStatus = (id: string) => {
    setWithdrawalMethods(prev => prev.map(method => 
      method.id === id ? { ...method, isActive: !method.isActive } : method
    ));
  };

  const deleteDepositMethod = (id: string) => {
    setDepositMethods(prev => prev.filter(method => method.id !== id));
    toast({
      title: "Success",
      description: "Deposit method deleted"
    });
  };

  const deleteWithdrawalMethod = (id: string) => {
    setWithdrawalMethods(prev => prev.filter(method => method.id !== id));
    toast({
      title: "Success", 
      description: "Withdrawal method deleted"
    });
  };

  return (
    <div className="space-y-6">
      {/* Deposit Methods */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Deposit Methods Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add New Deposit Method */}
          <div className="bg-gray-700 p-4 rounded-lg space-y-4">
            <h3 className="text-white font-medium">Add New Deposit Method</h3>
            
            <div>
              <Label htmlFor="deposit-name" className="text-gray-300">Method Name</Label>
              <Input
                id="deposit-name"
                value={newDepositMethod.name}
                onChange={(e) => setNewDepositMethod(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Rocket, Upay"
                className="bg-gray-600 border-gray-500 text-white"
              />
            </div>

            <div>
              <Label className="text-gray-300">Required Fields</Label>
              {newDepositMethod.fields.map((field, index) => (
                <div key={index} className="flex space-x-2 mt-2">
                  <Input
                    value={field}
                    onChange={(e) => updateDepositField(index, e.target.value)}
                    placeholder="Field name (e.g., Phone Number)"
                    className="bg-gray-600 border-gray-500 text-white"
                  />
                  {newDepositMethod.fields.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeDepositField(index)}
                      className="text-red-400 border-red-400 hover:bg-red-400/20"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={addDepositField}
                className="mt-2 text-blue-400 border-blue-400 hover:bg-blue-400/20"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Field
              </Button>
            </div>

            <Button onClick={saveDepositMethod} className="bg-green-600 hover:bg-green-700">
              <Save className="w-4 h-4 mr-2" />
              Save Deposit Method
            </Button>
          </div>

          {/* Existing Deposit Methods */}
          <div className="space-y-2">
            <h3 className="text-white font-medium">Existing Deposit Methods</h3>
            {depositMethods.map((method) => (
              <div key={method.id} className="flex items-center justify-between bg-gray-700 p-3 rounded-lg">
                <div>
                  <span className="text-white font-medium">{method.name}</span>
                  <div className="text-gray-400 text-sm">
                    Fields: {method.fields.join(', ')}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={method.isActive ? "default" : "secondary"}>
                    {method.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleDepositMethodStatus(method.id)}
                    className="text-blue-400 border-blue-400 hover:bg-blue-400/20"
                  >
                    {method.isActive ? 'Disable' : 'Enable'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteDepositMethod(method.id)}
                    className="text-red-400 border-red-400 hover:bg-red-400/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Withdrawal Methods */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Withdrawal Methods Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add New Withdrawal Method */}
          <div className="bg-gray-700 p-4 rounded-lg space-y-4">
            <h3 className="text-white font-medium">Add New Withdrawal Method</h3>
            
            <div>
              <Label htmlFor="withdrawal-name" className="text-gray-300">Method Name</Label>
              <Input
                id="withdrawal-name"
                value={newWithdrawalMethod.name}
                onChange={(e) => setNewWithdrawalMethod(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., PayPal, Bank Transfer"
                className="bg-gray-600 border-gray-500 text-white"
              />
            </div>

            <div>
              <Label className="text-gray-300">Required Fields</Label>
              {newWithdrawalMethod.fields.map((field, index) => (
                <div key={index} className="flex space-x-2 mt-2">
                  <Input
                    value={field}
                    onChange={(e) => updateWithdrawalField(index, e.target.value)}
                    placeholder="Field name (e.g., Email Address)"
                    className="bg-gray-600 border-gray-500 text-white"
                  />
                  {newWithdrawalMethod.fields.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeWithdrawalField(index)}
                      className="text-red-400 border-red-400 hover:bg-red-400/20"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={addWithdrawalField}
                className="mt-2 text-blue-400 border-blue-400 hover:bg-blue-400/20"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Field
              </Button>
            </div>

            <Button onClick={saveWithdrawalMethod} className="bg-green-600 hover:bg-green-700">
              <Save className="w-4 h-4 mr-2" />
              Save Withdrawal Method
            </Button>
          </div>

          {/* Existing Withdrawal Methods */}
          <div className="space-y-2">
            <h3 className="text-white font-medium">Existing Withdrawal Methods</h3>
            {withdrawalMethods.map((method) => (
              <div key={method.id} className="flex items-center justify-between bg-gray-700 p-3 rounded-lg">
                <div>
                  <span className="text-white font-medium">{method.name}</span>
                  <div className="text-gray-400 text-sm">
                    Fields: {method.fields.join(', ')}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={method.isActive ? "default" : "secondary"}>
                    {method.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleWithdrawalMethodStatus(method.id)}
                    className="text-blue-400 border-blue-400 hover:bg-blue-400/20"
                  >
                    {method.isActive ? 'Disable' : 'Enable'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteWithdrawalMethod(method.id)}
                    className="text-red-400 border-red-400 hover:bg-red-400/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDepositMethods;
