"use client";
import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";


interface OrderItem {
  product_id: number;
  quantity: number;
  price: number;
  product: { name: string; price: number };
}

export default ReturnsPage;

interface Order {
  id: number;
  customer_id: number;
  total_amount: number;
  status: string;
  created_at: string;
  order_items: OrderItem[];
}

function ReturnsPage() {
  const [search, setSearch] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [returnItems, setReturnItems] = useState<{ [productId: number]: { quantity: number; reason: string } }>({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSearch = async () => {
    setLoading(true);
    setError("");
    setOrder(null);
    setSuccess("");
    let res;
    if (/^\d+$/.test(search)) {
      // Search by order ID
      res = await fetch(`/api/orders/${search}`);
    } else {
      // Search by email
      res = await fetch(`/api/orders?email=${encodeURIComponent(search)}`);
    }
    if (res.ok) {
      const data = await res.json();
      setOrder(Array.isArray(data) ? data[0] : data);
      setReturnItems({});
    } else {
      setError("Order not found");
    }
    setLoading(false);
  };

  const handleReturnChange = (productId: number, field: "quantity" | "reason", value: string | number) => {
    setReturnItems((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value,
      },
    }));
  };

  const handleSubmitReturn = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    const items = Object.entries(returnItems).filter(([, v]) => v.quantity && v.reason);
    if (!order || items.length === 0) {
      setError("Select at least one item and provide a reason.");
      setLoading(false);
      return;
    }
    for (const [productId, { quantity, reason }] of items) {
      const res = await fetch("/api/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: order.id,
          product_id: productId,
          quantity,
          reason,
        }),
      });
      if (!res.ok) {
        let msg = "Failed to process return for some items.";
        try {
          const err = await res.json();
          if (err && err.error) {
            if (
              err.error.includes("Stripe refund failed") &&
              err.details &&
              typeof err.details === "string" &&
              err.details.includes("already been refunded")
            ) {
              msg = "This order has already been refunded by Stripe.";
            } else {
              msg = err.error + (err.details ? ": " + JSON.stringify(err.details) : "");
            }
          }
        } catch {}
        setError(msg);
        setLoading(false);
        return;
      }
    }
    setSuccess("Return processed!");
    setOrder(null);
    setReturnItems({});
    setLoading(false);
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Find Order for Return</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-2">
            <Input
              placeholder="Order ID or Customer Email"
              value={search}
              onChange={e => setSearch(e.target.value)}
              disabled={loading}
            />
            <Button onClick={handleSearch} disabled={loading || !search}>
              {loading ? "Searching..." : "Search"}
            </Button>
          </div>
          {error && <div className="text-red-500 mb-2">{error}</div>}
          {success && <div className="text-green-600 mb-2">{success}</div>}
          {order && (
            <div>
              <div className="mb-2">Order #{order.id} | Status: {order.status} | Total: ${order.total_amount}</div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Ordered Qty</TableHead>
                    <TableHead>Return Qty</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.order_items.map((item) => (
                    <TableRow key={item.product_id}>
                      <TableCell>{item.product?.name || item.product_id}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={1}
                          max={item.quantity}
                          value={returnItems[item.product_id]?.quantity || ""}
                          onChange={e => handleReturnChange(item.product_id, "quantity", Number(e.target.value))}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder="Reason"
                          value={returnItems[item.product_id]?.reason || ""}
                          onChange={e => handleReturnChange(item.product_id, "reason", e.target.value)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Button className="mt-2" onClick={handleSubmitReturn} disabled={loading}>
                {loading ? "Processing..." : "Submit Return"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
