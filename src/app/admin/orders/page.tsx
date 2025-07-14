"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Card, CardContent, CardHeader, CardFooter,
} from "@/components/ui/card";
import {
  Loader2Icon, PlusCircle, Trash2, SearchIcon, FilePenIcon,
} from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import Link from "next/link";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type Order = {
  id: number;
  customer_id: number;
  payment_method_id?: number;
  total_amount: number;
  status: "completed" | "pending" | "cancelled";
  created_at: string;
  customer: { name: string };
  payment_method?: { name: string };
};


type Product = { id: number; name: string; price: number };

type ProductSelection = { productId: number; quantity: number; price: number };

/* -------------------------------------------------------------------------- */

export default function OrdersPage() {
  /* ----------------------------- table states ----------------------------- */
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  /* ---------------------------- dialog states ----------------------------- */
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  /* form fields */
  const [customerId, setCustomerId] = useState("");
  const [paymentId, setPaymentId] = useState("");
  const [status, setStatus] = useState<"pending" | "completed" | "cancelled">("pending");
  const [productSelections, setProductSelections] = useState<ProductSelection[]>([]);

  /* reference data */
  const [customers, setCustomers] = useState<{ id: number; name: string }[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  /* ------------------------------ side-effects ---------------------------- */
  useEffect(() => {
    (async () => {
      const res = await fetch("/api/orders"); setOrders(await res.json());
      const c = await fetch("/api/customers"); setCustomers(await c.json());
      const p = await fetch("/api/products"); setProducts(await p.json());
      setLoading(false);
    })().catch(e => setError(e.message));
  }, []);

  /* -------------------------- derived / memoised -------------------------- */
  const tableFiltered = useMemo(() => {
    return (Array.isArray(orders) ? orders : []).filter(o =>
      o.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.id.toString().includes(searchTerm)
    );
  }, [orders, searchTerm]);

  const total = useMemo(() => productSelections.reduce((sum, sel) => {
    const prod = products.find(p => p.id === sel.productId);
    return sum + (prod ? prod.price * sel.quantity : 0);
  }, 0), [productSelections, products]);

  /* ----------------------------- helpers ---------------------------------- */
  const resetForm = () => {
    setCustomerId("");
    setPaymentId("");
    setStatus("pending");
    setProductSelections([]);
    setEditingId(null);
  };

  /* ---------------------------- CRUD handlers ----------------------------- */
  const submitOrder = async () => {
    const payload = {
      customer_id: Number(customerId),
      payment_method_id: Number(paymentId),
      status,
      total_amount: total,
      products: productSelections.map(sel => {
        const prod = products.find(p => p.id === sel.productId)!;
        return { id: prod.id, quantity: sel.quantity, price: prod.price };
      }),
    };

    const method = editingId ? "PUT" : "POST";
    const url = editingId ? `/api/orders/${editingId}` : "/api/orders";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) { alert("Server error"); return; }

    const saved: Order = await res.json();
    setOrders(prev =>
      editingId
        ? prev.map(o => (o.id === saved.id ? saved : o))
        : [...prev, saved]
    );
    setShowCreate(false); setShowEdit(false); resetForm();
  };

  const deleteOrder = async (id: number) => {
    if (!confirm("Delete order?")) return;
    await fetch(`/api/orders/${id}`, { method: "DELETE" });
    setOrders(prev => prev.filter(o => o.id !== id));
  };

  /* -------------------------------------------------------------------------- */
  /* UI                                                                         */
  /* -------------------------------------------------------------------------- */

  if (loading) return <div className="h-[80vh] flex items-center justify-center">
    <Loader2Icon className="h-12 w-12 animate-spin" />
  </div>;
  if (error) return <p className="text-red-500 p-4">{error}</p>;

  /*****************************************************************
 * 1️⃣  When the Edit button is pressed, pull the full order
 *     (including order_items.price) and pre-populate state.
 *****************************************************************/
const openEditor = async (orderId: number) => {
  // ↓ fetch the richer payload we exposed in GET /api/orders/[orderId]
  const res = await fetch(`/api/orders/${orderId}`);
  if (!res.ok) {
    alert("Could not load order details");
    return;
  }
  const order = await res.json() as Order & {
    order_items: { product_id: number; quantity: number; price: number; product: { name: string } }[];
  };

  /* --- populate all form fields --- */
  setEditingId(order.id);
  setCustomerId(order.customer_id.toString());
  setPaymentId(order.payment_method_id?.toString() || "");
  setStatus(order.status as any);

  /* --- preload product rows with saved qty & price --- */
  setProductSelections(
    order.order_items.map(item => ({
      productId: item.product_id,
      quantity: item.quantity,
      price: item.price           // ✅ original price
    }))
  );

  setShowEdit(true);
};


  return (
    <Card className="flex flex-col gap-6 p-6">
      {/* ---------- header / search ---------- */}
      <CardHeader className="p-0 flex justify-between">
        <div className="relative">
          <Input placeholder="Search…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          <SearchIcon className="absolute right-2 top-2 h-4 w-4" />
        </div>
        <Button onClick={() => { resetForm(); setShowCreate(true); }}>
          <PlusCircle className="w-4 h-4 mr-2" /> Create Order
        </Button>
      </CardHeader>

      {/* ---------- table ---------- */}
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead><TableHead>Customer</TableHead><TableHead>Payment</TableHead>
              <TableHead>Total</TableHead><TableHead>Status</TableHead>
              <TableHead>Date</TableHead><TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableFiltered.map(o => (
              <TableRow key={o.id}>
                <TableCell>{o.id}</TableCell>
                <TableCell>{o.customer.name}</TableCell>
                <TableCell>{o.payment_method?.name || "—"}</TableCell>
                <TableCell>${o.total_amount.toFixed(2)}</TableCell>
                <TableCell>{o.status}</TableCell>
                <TableCell>{o.created_at}</TableCell>
                <TableCell className="flex gap-2">
                  <Button size="icon" variant="ghost"
                    onClick={() => {
                      setEditingId(o.id); setCustomerId(o.customer_id.toString());
                      setPaymentId(o.payment_method_id?.toString() || "");
                      setStatus(o.status as any);    // you would fetch order items here
                      setShowEdit(true);
                    }}>
                    <FilePenIcon className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => deleteOrder(o.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      {/* ---------- dialog create / edit ---------- */}
      <Dialog open={showCreate || showEdit} onOpenChange={(open) => { if (!open) { setShowCreate(false); setShowEdit(false); resetForm(); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? "Edit" : "Create"} Order</DialogTitle></DialogHeader>

          {/* Customer */}
          <Label className="mt-2">Customer</Label>
          <Select value={customerId} onValueChange={setCustomerId}>
            <SelectTrigger><SelectValue placeholder="Choose customer" /></SelectTrigger>
            <SelectContent>
              {customers.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>

          {/* Payment */}
          <Label className="mt-2">Payment method</Label>
          <Select value={paymentId} onValueChange={setPaymentId}>
            <SelectTrigger><SelectValue placeholder="Choose…" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Cash</SelectItem>
              <SelectItem value="2">Visa</SelectItem>
              <SelectItem value="3">Mastercard</SelectItem>
              <SelectItem value="4">Check</SelectItem>
            </SelectContent>
          </Select>

          {/* Product dropdown */}
          <Label className="mt-2">Add product</Label>
          <Select onValueChange={(val) => {
            const prod = products.find(p => p.id.toString() === val);
            if (!prod) return;
            if (!productSelections.find(p => p.productId === prod.id)) {
              setProductSelections([...productSelections, { productId: prod.id, quantity: 1 }]);
            }
          }}>
            <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
            <SelectContent>
              {products.map(p => (
                <SelectItem key={p.id} value={p.id.toString()}>
                  {p.name} – ${p.price}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Selected products list */}
          <div className="mt-2 space-y-1">
            {productSelections.map(sel => {
              const prod = products.find(p => p.id === sel.productId)!;
              return (
                <div key={sel.productId} className="flex items-center gap-2">
                  <span className="flex-1">{prod.name}</span>
                  <Input type="number" min={1} value={sel.quantity}
                    onChange={e => {
                      const qty = Math.max(1, parseInt(e.target.value) || 1);
                      setProductSelections(ps => ps.map(p => p.productId === sel.productId ? { ...p, quantity: qty } : p));
                    }} className="w-16" />
                  <span>${(prod.price * sel.quantity).toFixed(2)}</span>
                  <Button size="icon" variant="ghost"
                    onClick={() => setProductSelections(ps => ps.filter(p => p.productId !== sel.productId))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>

          {/* Status */}
          <Label className="mt-2">Status</Label>
          <Select value={status} onValueChange={val => setStatus(val as any)}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          {/* Total */}
          <Label className="mt-2">Total</Label>
          <Input readOnly value={total.toFixed(2)} />

          <DialogFooter className="pt-4">
            <Button variant="secondary" onClick={() => { setShowCreate(false); setShowEdit(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={submitOrder}>{editingId ? "Update" : "Create"} Order</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
