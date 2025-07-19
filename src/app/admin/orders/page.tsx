
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { format } from 'date-fns';
import {
  Card,
  CardHeader,
  CardTitle,
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type Order = {
  id: number;
  customer_name: string;
  customer_email: string;
  payment_method_name: string;
  total_amount: number;
  status: string;
  created_at: string;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  // Filters
  const [id, setId] = useState("");
  const [customer, setCustomer] = useState("");
  const [email, setEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [status, setStatus] = useState("");
  const [minTotal, setMinTotal] = useState("");
  const [maxTotal, setMaxTotal] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  // Advanced filter toggle
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetch("/api/orders")
      .then((res) => res.json())
      .then((data) => setOrders(data))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return orders
      .filter((o) => (id ? o.id === Number(id) : true))
      .filter((o) => (customer ? o.customer_name.toLowerCase().includes(customer.toLowerCase()) : true))
      .filter((o) => (email ? o.customer_email.toLowerCase().includes(email.toLowerCase()) : true))
      .filter((o) => (paymentMethod ? o.payment_method_name.toLowerCase().includes(paymentMethod.toLowerCase()) : true))
      .filter((o) => (status && status !== "all" ? o.status === status : true))
      .filter((o) => (minTotal ? o.total_amount >= Number(minTotal) : true))
      .filter((o) => (maxTotal ? o.total_amount <= Number(maxTotal) : true))
      .filter((o) => {
        if (startDate && endDate) {
          const orderDate = new Date(o.created_at);
          return orderDate >= new Date(startDate) && orderDate <= new Date(endDate);
        } else if (startDate) {
          return new Date(o.created_at) >= new Date(startDate);
        } else if (endDate) {
          return new Date(o.created_at) <= new Date(endDate);
        }
        return true;
      });
  }, [orders, id, customer, email, paymentMethod, status, minTotal, maxTotal, startDate, endDate]);

  if (loading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <span className="animate-spin h-12 w-12 border-4 border-blue-500 rounded-full border-t-transparent"></span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-6">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle>Orders</CardTitle>
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
                placeholder="Order ID"
                value={id}
                onChange={(e) => setId(e.target.value.replace(/[^0-9]/g, ""))}
                className="w-full"
                type="number"
                min={0}
              />
              <Input
                placeholder="Customer Name"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                className="w-full"
              />
              <Input
                placeholder="Customer Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full"
              />
              <Input
                placeholder="Payment Method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full"
              />
              <Input
                placeholder="Min Total"
                value={minTotal}
                onChange={(e) => setMinTotal(e.target.value.replace(/[^0-9.]/g, ""))}
                className="w-full"
                type="number"
                min={0}
              />
              <Input
                placeholder="Max Total"
                value={maxTotal}
                onChange={(e) => setMaxTotal(e.target.value.replace(/[^0-9.]/g, ""))}
                className="w-full"
                type="number"
                min={0}
              />
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2 items-center w-full">
                <label className="text-xs text-muted-foreground">From</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full"
                />
                <label className="text-xs text-muted-foreground">To</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          )}
          <Table className="rounded-lg overflow-x-auto shadow-sm border border-muted-foreground/10">
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No orders found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>{order.id}</TableCell>
                    <TableCell>{order.customer_name}</TableCell>
                    <TableCell>{order.customer_email}</TableCell>
                    <TableCell>{order.payment_method_name}</TableCell>
                    <TableCell>${order.total_amount.toFixed(2)}</TableCell>
                    <TableCell>{order.status}</TableCell>
                    <TableCell>{format(new Date(order.created_at), 'yyyy-MM-dd HH:mm')}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
