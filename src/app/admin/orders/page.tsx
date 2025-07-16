"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import {
  Loader2Icon,
  SearchIcon,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Order = {
  id: number;
  customer_name?: string;
  customer_email?: string;
  payment_method_name?: string;
  total_amount: number;
  status: string;
  created_at: string;
};

type OrderDetail = Order & {
  order_items: {
    product_id: number;
    quantity: number;
    price: number;
    product: { name: string };
  }[];
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("__all__");
  const [filterPayment, setFilterPayment] = useState("__all__");
  const [filterStatus, setFilterStatus] = useState("__all__");

  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [receiptLoading, setReceiptLoading] = useState(false);

  useEffect(() => {
    fetch("/api/orders")
      .then((res) => res.json())
      .then((data) => {
        setOrders(data);
        setLoading(false);
      })
      .catch((e) => setError(e.message));
  }, []);

  const uniqueCustomers = useMemo(
    () =>
      [...new Set(orders.map((o) => o.customer_name).filter(Boolean))] as string[],
    [orders]
  );
  const uniquePayments = useMemo(
    () =>
      [...new Set(orders.map((o) => o.payment_method_name).filter(Boolean))] as string[],
    [orders]
  );

  const tableFiltered = useMemo(() => {
    return orders
      .filter((o) => {
        const s = searchTerm.toLowerCase();
        return (
          (!searchTerm ||
            (o.customer_name?.toLowerCase().includes(s) ?? false) ||
            o.id.toString().includes(s)) &&
          (filterCustomer === "__all__" ||
            o.customer_name === filterCustomer) &&
          (filterPayment === "__all__" ||
            o.payment_method_name === filterPayment) &&
          (filterStatus === "__all__" || o.status === filterStatus)
        );
      })
      .sort((a, b) => b.id - a.id);
  }, [orders, searchTerm, filterCustomer, filterPayment, filterStatus]);

const openReceipt = (id: number) => {
  setReceiptLoading(true);
  fetch(`/api/orders/${id}`)
    .then(res => res.json())
    .then((data: OrderDetail) => {
      console.log("📦 Order Detail Response:", data); // 👈 This line
      setSelectedOrder(data);
      setReceiptLoading(false);
    })
    .catch((err) => {
      console.error("❌ Failed to fetch receipt", err);
      setSelectedOrder(null);
      setReceiptLoading(false);
    });
};

  if (loading)
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <Loader2Icon className="h-12 w-12 animate-spin" />
      </div>
    );
  if (error) return <p className="text-red-500 p-4">{error}</p>;

  return (
    <>
      <Card className="flex flex-col gap-6 p-6">
        <CardHeader className="p-0 flex flex-col md:flex-row justify-between gap-4">
          <div className="relative w-full md:w-1/3">
            <Input
              placeholder="Search…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <SearchIcon className="absolute right-2 top-2 h-4 w-4" />
          </div>
          <div className="flex flex-wrap gap-2 w-full md:w-2/3 items-center">
            <Select value={filterCustomer} onValueChange={setFilterCustomer}>
              <SelectTrigger>
                <SelectValue placeholder="Customer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All</SelectItem>
                {uniqueCustomers.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterPayment} onValueChange={setFilterPayment}>
              <SelectTrigger>
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All</SelectItem>
                {uniquePayments.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableFiltered.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>{o.id}</TableCell>
                  <TableCell>{o.customer_name}</TableCell>
                  <TableCell>{o.customer_email}</TableCell>
                  <TableCell>{o.payment_method_name}</TableCell>
                  <TableCell>${o.total_amount.toFixed(2)}</TableCell>
                  <TableCell>{o.status}</TableCell>
                  <TableCell>
                    {new Date(o.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Button size="sm" onClick={() => openReceipt(o.id)}>
                      View Receipt
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={!!selectedOrder}
        onOpenChange={(open) => !open && setSelectedOrder(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Receipt — Order #{selectedOrder?.id}</DialogTitle>
            <DialogDescription>
              {selectedOrder?.customer_name} (
              {selectedOrder?.customer_email})
            </DialogDescription>
          </DialogHeader>
          {receiptLoading ? (
            <div className="p-4 text-center">
              <Loader2Icon className="h-8 w-8 animate-spin" />
            </div>
          ) : selectedOrder ? (
            <div className="space-y-4">
              <p>
                <strong>Status:</strong> {selectedOrder.status}
              </p>
              <p>
                <strong>Payment:</strong>{" "}
                {selectedOrder.payment_method_name}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {new Date(selectedOrder.created_at).toLocaleString()}
              </p>
              <p>
                <strong>Total:</strong> $
                {selectedOrder?.total_amount?.toFixed(2) ?? "0.00"}
              </p>
              <hr />
              <div>
                <strong>Items:</strong>
                {selectedOrder.order_items.length ? (
                  selectedOrder.order_items.map((item) => (
                    <div
                      key={item.product_id}
                      className="flex justify-between"
                    >
                      <span>
                        {item.product.name} × {item.quantity}
                      </span>
                      <span>
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p>No items found.</p>
                )}
              </div>
            </div>
          ) : (
            <p>Error loading receipt</p>
          )}
          <DialogFooter>
            <Button onClick={() => setSelectedOrder(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
