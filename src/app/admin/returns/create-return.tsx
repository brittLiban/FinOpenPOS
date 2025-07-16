"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function CreateReturn({ onReturnCreated }: { onReturnCreated?: () => void }) {
  const [orderId, setOrderId] = useState("");
  const [productName, setProductName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/returns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: orderId, product_name: productName, quantity, reason }),
    });
    setLoading(false);
    if (res.ok) {
      setOrderId("");
      setProductName("");
      setQuantity(1);
      setReason("");
      if (onReturnCreated) onReturnCreated();
      alert("Return processed!");
    } else {
      alert("Failed to process return");
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Process Return</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-2">
          <Input placeholder="Order ID" value={orderId} onChange={e => setOrderId(e.target.value)} required />
          <Input placeholder="Product Name" value={productName} onChange={e => setProductName(e.target.value)} required />
          <Input type="number" min={1} placeholder="Quantity" value={quantity} onChange={e => setQuantity(Number(e.target.value))} required />
          <Input placeholder="Reason" value={reason} onChange={e => setReason(e.target.value)} required />
          <Button type="submit" disabled={loading}>{loading ? "Processing..." : "Submit Return"}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
