"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  IndianRupee, 
  Receipt,
  TrendingUp,
  Truck,
  Users,
  Zap,
  Wrench,
  SprayCan,
  Calculator,
  PieChart
} from 'lucide-react';
import { SupabaseService } from '@/lib/supabase-service';
import type { Farm } from '@/lib/supabase';

interface ExpenseFormProps {
  selectedFarm: Farm;
  onRecordAdded: () => void;
  onCancel: () => void;
}

export function ExpenseForm({ selectedFarm, onRecordAdded, onCancel }: ExpenseFormProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: "",
    subcategory: "",
    description: "",
    amount: "",
    quantity: "",
    unit: "",
    unit_cost: "",
    vendor: "",
    payment_method: "",
    invoice_number: "",
    gst_amount: "",
    total_amount: "",
    area_applicable: selectedFarm.area.toString(),
    growth_stage: "",
    notes: "",
    // Additional fields
    is_recurring: false,
    is_tax_deductible: true,
    receipt_available: false
  });

  const [loading, setLoading] = useState(false);

  const expenseCategories = [
    {
      category: "Seeds & Planting",
      subcategories: ["Grape Plants", "Rootstock", "Grafting Material", "Planting Labor"]
    },
    {
      category: "Fertilizers & Nutrients",
      subcategories: ["Chemical Fertilizers", "Organic Manure", "Micronutrients", "Soil Amendments", "Fertigation"]
    },
    {
      category: "Pesticides & Chemicals",
      subcategories: ["Fungicides", "Insecticides", "Herbicides", "Growth Regulators", "Adjuvants"]
    },
    {
      category: "Irrigation",
      subcategories: ["Drip System", "Pipes & Fittings", "Pumps", "Water Charges", "System Maintenance"]
    },
    {
      category: "Labor",
      subcategories: ["Pruning", "Harvesting", "Spraying", "General Farm Work", "Skilled Labor", "Seasonal Labor"]
    },
    {
      category: "Machinery & Equipment",
      subcategories: ["Tractors", "Sprayers", "Tools", "Maintenance", "Fuel & Oil", "Spare Parts"]
    },
    {
      category: "Infrastructure",
      subcategories: ["Trellising", "Shade Nets", "Storage", "Fencing", "Farm Buildings", "Roads"]
    },
    {
      category: "Transportation",
      subcategories: ["Harvest Transport", "Input Transport", "Vehicle Expenses", "Logistics"]
    },
    {
      category: "Utilities",
      subcategories: ["Electricity", "Water", "Phone/Internet", "Insurance"]
    },
    {
      category: "Professional Services",
      subcategories: ["Consultancy", "Soil Testing", "Legal", "Accounting", "Certification"]
    },
    {
      category: "Marketing & Sales",
      subcategories: ["Packaging", "Marketing", "Commission", "Market Fees", "Export Costs"]
    },
    {
      category: "Administrative",
      subcategories: ["Office Supplies", "Documentation", "Licenses", "Permits", "Bank Charges"]
    }
  ];

  const paymentMethods = [
    "Cash", "Bank Transfer", "Cheque", "UPI", "Credit Card", "Debit Card", "Online Payment", "Credit Account"
  ];

  const units = [
    "kg", "tons", "liters", "packets", "bags", "bottles", "pieces", "hours", "days", "acres", "hectares", "units"
  ];

  const growthStages = [
    'Dormant', 'Bud Break', 'Flowering', 'Fruit Set', 'Veraison', 'Harvest', 'Post Harvest'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const totalAmount = formData.total_amount ? 
        parseFloat(formData.total_amount) : 
        (parseFloat(formData.amount) + parseFloat(formData.gst_amount || "0"));

      await SupabaseService.addExpenseRecord({
        farm_id: selectedFarm.id!,
        date: formData.date,
        category: formData.category,
        description: formData.description,
        amount: totalAmount,
        vendor: formData.vendor,
        notes: formData.notes
      });

      onRecordAdded();
    } catch (error) {
      console.error('Error adding expense record:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-calculate total amount
    if (field === 'amount' || field === 'gst_amount') {
      const amount = field === 'amount' ? parseFloat(value as string) || 0 : parseFloat(formData.amount) || 0;
      const gst = field === 'gst_amount' ? parseFloat(value as string) || 0 : parseFloat(formData.gst_amount) || 0;
      setFormData(prev => ({
        ...prev,
        total_amount: (amount + gst).toString()
      }));
    }

    // Auto-calculate unit cost
    if ((field === 'amount' || field === 'quantity') && formData.quantity && formData.amount) {
      const amount = field === 'amount' ? parseFloat(value as string) || 0 : parseFloat(formData.amount) || 0;
      const quantity = field === 'quantity' ? parseFloat(value as string) || 1 : parseFloat(formData.quantity) || 1;
      if (quantity > 0) {
        setFormData(prev => ({
          ...prev,
          unit_cost: (amount / quantity).toFixed(2)
        }));
      }
    }
  };

  const getSubcategories = () => {
    const category = expenseCategories.find(cat => cat.category === formData.category);
    return category ? category.subcategories : [];
  };

  const calculateCostPerHectare = () => {
    const amount = parseFloat(formData.total_amount || formData.amount) || 0;
    const area = parseFloat(formData.area_applicable) || 1;
    return amount / area;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Fertilizers & Nutrients": return <SprayCan className="h-4 w-4" />;
      case "Labor": return <Users className="h-4 w-4" />;
      case "Machinery & Equipment": return <Wrench className="h-4 w-4" />;
      case "Transportation": return <Truck className="h-4 w-4" />;
      case "Utilities": return <Zap className="h-4 w-4" />;
      default: return <Receipt className="h-4 w-4" />;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Expense Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IndianRupee className="h-5 w-5" />
            Expense Details
          </CardTitle>
          <CardDescription>Record farm expense and cost information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                required
              >
                <option value="">Select category</option>
                {expenseCategories.map(cat => (
                  <option key={cat.category} value={cat.category}>
                    {cat.category}
                  </option>
                ))}
              </select>
            </div>
            {formData.category && (
              <div>
                <Label htmlFor="subcategory">Subcategory</Label>
                <select
                  id="subcategory"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.subcategory}
                  onChange={(e) => handleInputChange('subcategory', e.target.value)}
                >
                  <option value="">Select subcategory</option>
                  {getSubcategories().map(sub => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="Detailed description of the expense"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* Cost Information */}
      <Card className="border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-green-600" />
            Cost Information
          </CardTitle>
          <CardDescription>Detailed cost breakdown and calculations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="amount">Base Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="e.g., 5000"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="gst_amount">GST Amount (₹)</Label>
              <Input
                id="gst_amount"
                type="number"
                step="0.01"
                placeholder="e.g., 900"
                value={formData.gst_amount}
                onChange={(e) => handleInputChange('gst_amount', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="total_amount">Total Amount (₹)</Label>
              <Input
                id="total_amount"
                type="number"
                step="0.01"
                value={formData.total_amount}
                onChange={(e) => handleInputChange('total_amount', e.target.value)}
                className="font-semibold"
                readOnly={!!(formData.amount && formData.gst_amount)}
              />
            </div>
            <div>
              <Label htmlFor="area_applicable">Applicable Area (ha)</Label>
              <Input
                id="area_applicable"
                type="number"
                step="0.1"
                value={formData.area_applicable}
                onChange={(e) => handleInputChange('area_applicable', e.target.value)}
              />
            </div>
          </div>

          {/* Quantity and Unit Cost */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                placeholder="e.g., 100"
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="unit">Unit</Label>
              <select
                id="unit"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.unit}
                onChange={(e) => handleInputChange('unit', e.target.value)}
              >
                <option value="">Select unit</option>
                {units.map(unit => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="unit_cost">Unit Cost (₹)</Label>
              <Input
                id="unit_cost"
                type="number"
                step="0.01"
                value={formData.unit_cost}
                onChange={(e) => handleInputChange('unit_cost', e.target.value)}
                className={formData.quantity && formData.amount ? "bg-muted" : ""}
                readOnly={!!(formData.quantity && formData.amount)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vendor and Payment Information */}
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-blue-600" />
            Vendor & Payment Details
          </CardTitle>
          <CardDescription>Supplier and payment information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="vendor">Vendor/Supplier</Label>
              <Input
                id="vendor"
                placeholder="e.g., ABC Agro Suppliers"
                value={formData.vendor}
                onChange={(e) => handleInputChange('vendor', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="payment_method">Payment Method</Label>
              <select
                id="payment_method"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.payment_method}
                onChange={(e) => handleInputChange('payment_method', e.target.value)}
              >
                <option value="">Select payment method</option>
                {paymentMethods.map(method => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="invoice_number">Invoice/Bill Number</Label>
              <Input
                id="invoice_number"
                placeholder="e.g., INV-2024-001"
                value={formData.invoice_number}
                onChange={(e) => handleInputChange('invoice_number', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="growth_stage">Growth Stage</Label>
              <select
                id="growth_stage"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.growth_stage}
                onChange={(e) => handleInputChange('growth_stage', e.target.value)}
              >
                <option value="">Select growth stage</option>
                {growthStages.map(stage => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Checkboxes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.is_recurring}
                onChange={(e) => handleInputChange('is_recurring', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">Recurring Expense</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.is_tax_deductible}
                onChange={(e) => handleInputChange('is_tax_deductible', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">Tax Deductible</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.receipt_available}
                onChange={(e) => handleInputChange('receipt_available', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">Receipt Available</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Cost Analysis */}
      {(formData.total_amount || formData.amount) && formData.area_applicable && (
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-purple-600" />
              Cost Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center p-4 bg-white rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  ₹{calculateCostPerHectare().toFixed(0)}
                </div>
                <div className="text-sm text-green-700">Cost per Hectare</div>
              </div>
              {formData.category && (
                <div className="text-center p-4 bg-white rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    {getCategoryIcon(formData.category)}
                    <span className="ml-2 font-semibold">{formData.category}</span>
                  </div>
                  <Badge variant="outline">
                    {formData.subcategory || 'General'}
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      <div>
        <Label htmlFor="notes">Notes & Additional Information</Label>
        <Input
          id="notes"
          placeholder="Additional notes, terms & conditions, or observations"
          value={formData.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? 'Adding Expense...' : 'Add Expense Record'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}