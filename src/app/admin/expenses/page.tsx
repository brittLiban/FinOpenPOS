"use client";
import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  PlusIcon,
  EditIcon,
  TrashIcon,
  DollarSignIcon,
  CalendarIcon,
  TrendingUpIcon,
  AlertCircleIcon,
  CreditCardIcon,
} from "lucide-react";

interface Expense {
  id: number;
  name: string;
  description: string;
  amount: number;
  category: string;
  type: 'recurring' | 'one-time';
  frequency?: string;
  recurring_day?: number;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
  created_at: string;
}

interface ExpenseTransaction {
  id: number;
  expense_id: number;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference_number?: string;
  notes?: string;
}

const EXPENSE_CATEGORIES = [
  'rent',
  'utilities',
  'supplies',
  'marketing',
  'payroll',
  'insurance',
  'software',
  'equipment',
  'maintenance',
  'travel',
  'professional_services',
  'misc'
];

const PAYMENT_METHODS = [
  'cash',
  'debit_card',
  'credit_card',
  'bank_transfer',
  'check',
  'online_payment'
];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseTransactions, setExpenseTransactions] = useState<ExpenseTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [selectedExpenseId, setSelectedExpenseId] = useState<number | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: '',
    category: '',
    type: 'one-time' as 'recurring' | 'one-time',
    frequency: '',
    recurring_day: '',
    start_date: '',
    end_date: ''
  });

  const [transactionData, setTransactionData] = useState({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: '',
    reference_number: '',
    notes: ''
  });

  useEffect(() => {
    fetchExpenses();
    fetchExpenseTransactions();
  }, []);

  const fetchExpenses = async () => {
    try {
      const response = await fetch('/api/expenses');
      if (response.ok) {
        const data = await response.json();
        setExpenses(data.expenses || []);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
      console.log('Failed to fetch expenses');
    }
  };

  const fetchExpenseTransactions = async () => {
    try {
      const response = await fetch('/api/expenses/transactions');
      if (response.ok) {
        const data = await response.json();
        setExpenseTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error('Error fetching expense transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingExpense ? `/api/expenses/${editingExpense.id}` : '/api/expenses';
      const method = editingExpense ? 'PUT' : 'POST';
      
      // Prepare form data, filtering out empty date strings
      const expenseData = {
        ...formData,
        amount: parseFloat(formData.amount),
        recurring_day: formData.recurring_day ? parseInt(formData.recurring_day) : null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null
      };
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseData),
      });

      if (response.ok) {
        console.log(editingExpense ? 'Expense updated!' : 'Expense added!');
        setShowAddExpense(false);
        setEditingExpense(null);
        resetForm();
        fetchExpenses();
      } else {
        const error = await response.json();
        console.log(error.error || 'Failed to save expense');
      }
    } catch (error) {
      console.error('Error saving expense:', error);
      console.log('Failed to save expense');
    }
  };

  const handleSubmitTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedExpenseId) return;

    try {
      const response = await fetch('/api/expenses/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...transactionData,
          expense_id: selectedExpenseId,
          amount: parseFloat(transactionData.amount),
        }),
      });

      if (response.ok) {
        console.log('Payment recorded!');
        setShowAddTransaction(false);
        setSelectedExpenseId(null);
        resetTransactionForm();
        fetchExpenseTransactions();
      } else {
        const error = await response.json();
        console.log(error.error || 'Failed to record payment');
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      console.log('Failed to record payment');
    }
  };

  const handleDeleteExpense = async (id: number) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    try {
      const response = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      if (response.ok) {
        console.log('Expense deleted!');
        fetchExpenses();
      } else {
        console.log('Failed to delete expense');
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      console.log('Failed to delete expense');
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      name: expense.name,
      description: expense.description || '',
      amount: expense.amount.toString(),
      category: expense.category,
      type: expense.type,
      frequency: expense.frequency || '',
      recurring_day: expense.recurring_day?.toString() || '',
      start_date: expense.start_date || '',
      end_date: expense.end_date || ''
    });
    setShowAddExpense(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      amount: '',
      category: '',
      type: 'one-time',
      frequency: '',
      recurring_day: '',
      start_date: '',
      end_date: ''
    });
  };

  const resetTransactionForm = () => {
    setTransactionData({
      amount: '',
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: '',
      reference_number: '',
      notes: ''
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatCategory = (category: string) => {
    return category.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getTotalMonthlyExpenses = () => {
    return expenses
      .filter(expense => expense.type === 'recurring' && expense.is_active)
      .reduce((sum, expense) => {
        if (expense.frequency === 'monthly') return sum + expense.amount;
        if (expense.frequency === 'quarterly') return sum + (expense.amount / 3);
        if (expense.frequency === 'yearly') return sum + (expense.amount / 12);
        return sum;
      }, 0);
  };

  const getThisMonthTransactions = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return expenseTransactions.filter(transaction => {
      const transactionDate = new Date(transaction.payment_date);
      return transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear;
    }).reduce((sum, transaction) => sum + transaction.amount, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading expenses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expense Management</h1>
          <p className="text-muted-foreground">Track your business expenses and financial health</p>
        </div>
        <Button onClick={() => setShowAddExpense(true)}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Expense
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Recurring</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(getTotalMonthlyExpenses())}</div>
            <p className="text-xs text-muted-foreground">
              Estimated monthly expenses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month Paid</CardTitle>
            <CreditCardIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(getThisMonthTransactions())}</div>
            <p className="text-xs text-muted-foreground">
              Actual expenses paid
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Expenses</CardTitle>
            <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expenses.filter(e => e.is_active).length}</div>
            <p className="text-xs text-muted-foreground">
              {expenses.filter(e => e.type === 'recurring' && e.is_active).length} recurring
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <AlertCircleIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(expenses.map(e => e.category)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              Different expense types
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{expense.name}</div>
                      {expense.description && (
                        <div className="text-sm text-muted-foreground">{expense.description}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{formatCategory(expense.category)}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={expense.type === 'recurring' ? 'default' : 'secondary'}>
                      {expense.type === 'recurring' ? `${expense.frequency}` : 'One-time'}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(expense.amount)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={expense.is_active ? 'default' : 'destructive'}>
                      {expense.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedExpenseId(expense.id);
                          setTransactionData(prev => ({ ...prev, amount: expense.amount.toString() }));
                          setShowAddTransaction(true);
                        }}
                      >
                        <DollarSignIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditExpense(expense)}
                      >
                        <EditIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteExpense(expense.id)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Expense Dialog */}
      <Dialog open={showAddExpense} onOpenChange={setShowAddExpense}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>{editingExpense ? 'Edit Expense' : 'Add New Expense'}</DialogTitle>
            <DialogDescription>
              {editingExpense ? 'Update expense details.' : 'Add a new expense to track your business costs.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitExpense}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {formatCategory(category)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">Type</Label>
                <Select value={formData.type} onValueChange={(value: 'recurring' | 'one-time') => setFormData(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one-time">One-time</SelectItem>
                    <SelectItem value="recurring">Recurring</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.type === 'recurring' && (
                <>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="frequency" className="text-right">Frequency</Label>
                    <Select value={formData.frequency} onValueChange={(value) => setFormData(prev => ({ ...prev, frequency: value }))}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="recurring_day" className="text-right">Day of Month</Label>
                    <Input
                      id="recurring_day"
                      type="number"
                      min="1"
                      max="31"
                      value={formData.recurring_day}
                      onChange={(e) => setFormData(prev => ({ ...prev, recurring_day: e.target.value }))}
                      className="col-span-3"
                      placeholder="Day (1-31)"
                    />
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setShowAddExpense(false);
                setEditingExpense(null);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button type="submit">
                {editingExpense ? 'Update Expense' : 'Add Expense'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Payment Transaction Dialog */}
      <Dialog open={showAddTransaction} onOpenChange={setShowAddTransaction}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record a payment for this expense.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitTransaction}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="payment_amount" className="text-right">Amount</Label>
                <Input
                  id="payment_amount"
                  type="number"
                  step="0.01"
                  value={transactionData.amount}
                  onChange={(e) => setTransactionData(prev => ({ ...prev, amount: e.target.value }))}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="payment_date" className="text-right">Date</Label>
                <Input
                  id="payment_date"
                  type="date"
                  value={transactionData.payment_date}
                  onChange={(e) => setTransactionData(prev => ({ ...prev, payment_date: e.target.value }))}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="payment_method" className="text-right">Method</Label>
                <Select value={transactionData.payment_method} onValueChange={(value) => setTransactionData(prev => ({ ...prev, payment_method: value }))}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((method) => (
                      <SelectItem key={method} value={method}>
                        {formatCategory(method)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="reference_number" className="text-right">Reference</Label>
                <Input
                  id="reference_number"
                  value={transactionData.reference_number}
                  onChange={(e) => setTransactionData(prev => ({ ...prev, reference_number: e.target.value }))}
                  className="col-span-3"
                  placeholder="Invoice #, Check #, etc."
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="notes" className="text-right">Notes</Label>
                <Input
                  id="notes"
                  value={transactionData.notes}
                  onChange={(e) => setTransactionData(prev => ({ ...prev, notes: e.target.value }))}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setShowAddTransaction(false);
                setSelectedExpenseId(null);
                resetTransactionForm();
              }}>
                Cancel
              </Button>
              <Button type="submit">Record Payment</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
