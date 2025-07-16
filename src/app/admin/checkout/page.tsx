"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Product = { id: number; name: string; price: number };
type CartItem = Product & { quantity: number };

export default function CheckoutPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetch("/api/products")
            .then((res) => res.json())
            .then(setProducts);
    }, []);

    const addToCart = (product: Product) => {
        setCart(prev =>
            prev.some(p => p.id === product.id)
                ? prev.map(p =>
                    p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p
                )
                : [
                    ...prev,
                    { ...product, quantity: 1, productId: String(product.id) }
                ]
        );
    };

    const updateQty = (id: number, qty: number) => {
        setCart((prev) =>
            prev.map((p) => (p.id === id ? { ...p, quantity: qty } : p))
        );
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
                    {products.map((product) => (
                        <div key={product.id} className="flex justify-between items-center">
                            <div>{product.name} - ${product.price.toFixed(2)}</div>
                            <Button onClick={() => addToCart(product)}>Add</Button>
                        </div>
                    ))}
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
                                {cart.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>{item.name}</TableCell>
                                        <TableCell>
                                            <input
                                                type="number"
                                                min={1}
                                                value={item.quantity}
                                                onChange={(e) =>
                                                    updateQty(item.id, Number(e.target.value))
                                                }
                                                className="w-16 border rounded px-2"
                                            />
                                        </TableCell>
                                        <TableCell>${item.price.toFixed(2)}</TableCell>
                                        <TableCell>
                                            ${(item.price * item.quantity).toFixed(2)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <div className="text-right mt-4 font-bold">
                            Total: ${total.toFixed(2)}
                        </div>
                        <div className="text-right mt-4">
                            <Button onClick={handleCheckout} disabled={loading}>
                                {loading ? "Redirecting..." : "Pay with Card"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
