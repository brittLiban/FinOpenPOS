"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Product { id: number; name: string; in_stock: number; archived?: boolean; }

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [qty, setQty] = useState<number>(1);

  useEffect(() => { fetch("/api/products").then(r => r.json()).then(setProducts); }, []);

  const chosen = useMemo(() => products.find(p => p.id === selectedId), [products, selectedId]);

  const restock = async () => {
    if (!selectedId || qty <= 0) return;
    const res = await fetch("/api/restocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: selectedId, quantity: qty })
    });
    if (!res.ok) { alert("RESTOCK ERROR"); return; }
    const updated = await res.json();
    setProducts(ps => ps.map(p => p.id === updated.id ? { ...p, in_stock: updated.in_stock } : p));
    setSelectedId(null); setQty(1);
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader><CardTitle>Restock Inventory</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {/* product picker */}
          <Combobox
            items={products.filter(p => !p.archived)}
            placeholder="Pick product…"
            onSelect={(id) => setSelectedId(Number(id))}
          />

          {/* qty input */}
          <Input
            type="number" min={1}
            value={qty} onChange={e => setQty(Number(e.target.value))}
            disabled={!chosen}
          />

          <Button onClick={restock} disabled={!chosen || qty <= 0}>Add Stock</Button>

          {/* quick stock table */}
          <Table>
            <TableHeader>
              <TableRow><TableHead>Product</TableHead><TableHead className="text-right">In Stock</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {products.filter(p => !p.archived).map(p => (
                <TableRow key={p.id}>
                  <TableCell>{p.name}</TableCell>
                  <TableCell className="text-right">{p.in_stock}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
