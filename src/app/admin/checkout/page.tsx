"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardHeader, CardTitle
} from "@/components/ui/card";
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";

type Product = {
  id: number;
  name: string;
  price: number;
  in_stock: number;
};
type CartItem = Product & { quantity: number };

export default function CheckoutPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  // For OOS confirmation
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetch("/api/products")
      .then(res => res.json())
      .then(setProducts);
  }, []);

  const getCartQty = (id: number) => cart.find(p => p.id === id)?.quantity ?? 0;

  function addToCart(product: Product, force = false) {
    setCart(prev => {
      const existing = prev.find(p => p.id === product.id);
      const newQty = (existing?.quantity ?? 0) + 1;

      if (!force && newQty > product.in_stock) {
        // Won't add unless forced
        return prev;
      }
      return existing
        ? prev.map(p => p.id === product.id ? { ...p, quantity: newQty } : p)
        : [...prev, { ...product, quantity: 1 }];
    });
  }

  const handleOOSClick = (p: Product) => {
    setSelectedProduct(p);
    setConfirmOpen(true);
  };

  const confirmAdd = () => {
    if (selectedProduct) addToCart(selectedProduct, true);
    setConfirmOpen(false);
  };

  const total = cart.reduce((sum, p) => sum + p.price * p.quantity, 0);

  const handleCheckout = async () => {
    setLoading(true);
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: cart }),
    });
    const { url } = await res.json();
    window.location.href = url;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Products</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {products.filter(p => !p.archived).map(p => {
            const cartQty = getCartQty(p.id);
            const isOut = cartQty >= p.in_stock;

            return (
              <div key={p.id} className="flex justify-between items-center">
                <div>
                  {p.name} – ${p.price.toFixed(2)}{" "}
                  <span className="text-sm text-muted-foreground">
                    ({p.in_stock} in stock)
                  </span>
                </div>
                {isOut || p.in_stock === 0 ? (
                  <Button variant="destructive" onClick={() => handleOOSClick(p)}>
                    Out of Stock
                  </Button>
                ) : (
                  <Button onClick={() => addToCart(p)}>Add</Button>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {cart.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Cart</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cart.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>
                      <input
                        type="number"
                        min={1}
                        max={item.in_stock}
                        value={item.quantity}
                        onChange={e => {
                          const qty = Number(e.target.value);
                          if (qty <= item.in_stock) {
                            setCart(prev =>
                              prev.map(p => p.id === item.id ? { ...p, quantity: qty } : p)
                            );
                          } else {
                            alert("Exceeds stock!");
                          }
                        }}
                        className="w-16 border rounded px-2"
                      />
                    </TableCell>
                    <TableCell>${item.price.toFixed(2)}</TableCell>
                    <TableCell>${(item.price * item.quantity).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="text-right mt-4 font-bold">Total: ${total.toFixed(2)}</div>
            <div className="text-right mt-4">
              <Button onClick={handleCheckout} disabled={loading}>
                {loading ? "Redirecting..." : "Pay with Card"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Modal */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Out of Stock Confirmation</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <p>
              "{selectedProduct?.name}" appears to be out of stock. Are you sure
              you'd like to add it to the cart anyway?
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmAdd}>
              Add Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
