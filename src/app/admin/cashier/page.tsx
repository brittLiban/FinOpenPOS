"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { EllipsisVerticalIcon, Loader2Icon } from "lucide-react";
import { formatDate } from "@/lib/utils";

type TransactionType = "income" | "expense";

interface Transaction {
  id: number;
  description: string;
  category: string;
  type: TransactionType;
  created_at: string;
  amount: number;
  status: string;
}

export default function CashierPage() {
  // ...existing code...
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  // Get unique categories from transactions
  const categoryOptions = Array.from(new Set(transactions.map(t => t.category).filter(Boolean)));
  const [loading, setLoading] = useState(true);
  const [delId, setDelId] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  // Advanced filter toggle
  const [showFilters, setShowFilters] = useState(false);
  // Filters for all fields
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterId, setFilterId] = useState("");
  const [filterDescription, setFilterDescription] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterMinAmount, setFilterMinAmount] = useState("");
  const [filterMaxAmount, setFilterMaxAmount] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await fetch("/api/transactions");
        const data = await res.json();
        setTransactions(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  const filtered = transactions
    .filter((t) => (filterType ? t.type === filterType : true))
    .filter((t) => (filterStatus ? t.status === filterStatus : true))
    .filter((t) => (filterId ? t.id === Number(filterId) : true))
    .filter((t) => (filterDescription ? t.description.toLowerCase().includes(filterDescription.toLowerCase()) : true))
    .filter((t) => (filterCategory ? t.category.toLowerCase().includes(filterCategory.toLowerCase()) : true))
    .filter((t) => (filterMinAmount ? t.amount >= Number(filterMinAmount) : true))
    .filter((t) => (filterMaxAmount ? t.amount <= Number(filterMaxAmount) : true))
    .filter((t) => {
      if (filterStartDate && filterEndDate) {
        const d = new Date(t.created_at);
        return d >= new Date(filterStartDate) && d <= new Date(filterEndDate);
      } else if (filterStartDate) {
        return new Date(t.created_at) >= new Date(filterStartDate);
      } else if (filterEndDate) {
        return new Date(t.created_at) <= new Date(filterEndDate);
      }
      return true;
    })
    .sort((a, b) => b.id - a.id);

  const confirmDelete = useCallback(async () => {
    if (delId == null) return;
    await fetch(`/api/transactions/${delId}`, { method: "DELETE" });
    setTransactions((prev) => prev.filter((t) => t.id !== delId));
    setConfirmOpen(false);
  }, [delId]);

  if (loading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <Loader2Icon className="animate-spin h-12 w-12" />
      </div>
    );
  }

  return (
    <>
      <Card className="p-6 space-y-6">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle>Cashier Transactions</CardTitle>
            <CardDescription>View and manage transactions</CardDescription>
          </div>
          <Button
            variant={showFilters ? "default" : "outline"}
            className="transition-all"
            onClick={() => setShowFilters((v) => !v)}
          >
            {showFilters ? "Hide Advanced Filters" : "Advanced Filters"}
          </Button>
        </CardHeader>
        <CardContent>
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6 p-4 rounded-lg bg-muted/50 border border-muted-foreground/10 shadow-sm animate-fade-in">
              <Input
                placeholder="Transaction ID"
                value={filterId}
                onChange={(e) => setFilterId(e.target.value.replace(/[^0-9]/g, ""))}
                className="w-full"
                type="number"
                min={0}
              />
              <Input
                placeholder="Description"
                value={filterDescription}
                onChange={(e) => setFilterDescription(e.target.value)}
                className="w-full"
              />
              <Select
                value={filterCategory || "__all__"}
                onValueChange={(v) => setFilterCategory(v === "__all__" ? "" : v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Categories</SelectItem>
                  {categoryOptions.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterType || "__all__"} onValueChange={(v) => setFilterType(v === "__all__" ? "" : v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Types</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Min Amount"
                value={filterMinAmount}
                onChange={(e) => setFilterMinAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                className="w-full"
                type="number"
                min={0}
              />
              <Input
                placeholder="Max Amount"
                value={filterMaxAmount}
                onChange={(e) => setFilterMaxAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                className="w-full"
                type="number"
                min={0}
              />
              <Select value={filterStatus || "__all__"} onValueChange={(v) => setFilterStatus(v === "__all__" ? "" : v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2 items-center w-full">
                <label className="text-xs text-muted-foreground">From</label>
                <Input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="w-full"
                />
                <label className="text-xs text-muted-foreground">To</label>
                <Input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          )}
          <Table className="rounded-lg overflow-x-auto shadow-sm border border-muted-foreground/10">
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>{t.id}</TableCell>
                  <TableCell>{t.description}</TableCell>
                  <TableCell>{t.category}</TableCell>
                  <TableCell>
                    <Badge variant={t.type}>{t.type}</Badge>
                  </TableCell>
                  <TableCell>{formatDate(t.created_at)}</TableCell>
                  <TableCell>${t.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={t.status === "completed" ? "default" : "secondary"}
                    >
                      {t.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost">
                          <EllipsisVerticalIcon />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setDelId(t.id);
                            setConfirmOpen(true);
                          }}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Transaction?</DialogTitle>
            <DialogDescription>
              This action can’t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
