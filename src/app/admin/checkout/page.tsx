
"use client";

import { useEffect, useState, useRef } from "react";
import { fetchTaxRate } from "@/lib/fetch-tax-rate";
import { BrowserMultiFormatReader } from "@zxing/browser";
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
  barcode?: string;
  archived?: boolean;
};
type CartItem = Product & { quantity: number };

function CheckoutPage() {
  // Tax rate state
  const [taxRate, setTaxRate] = useState<number>(0);
  // Fetch tax rate on mount
  useEffect(() => {
    fetchTaxRate().then(setTaxRate);
  }, []);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  // For OOS confirmation
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  // Barcode scan state
  const [barcode, setBarcode] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const codeReaderRef = useRef<any>(null);

  // Barcode scan logic
  const handleStartScan = async () => {
    setIsScanning(true);
    try {
      const codeReader = new BrowserMultiFormatReader();
      codeReaderRef.current = codeReader;
      const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices();
      if (videoInputDevices.length === 0) {
        alert("No camera found");
        setIsScanning(false);
        return;
      }
      const selectedDeviceId = videoInputDevices[0].deviceId;
      codeReader.decodeFromVideoDevice(selectedDeviceId, videoRef.current!, (result, err) => {
        if (result) {
          setBarcode(result.getText());
          setIsScanning(false);
          // Clean up scanner after successful scan
          if (codeReaderRef.current) {
            codeReaderRef.current = null;
          }
        }
      });
    } catch (err) {
      alert("Barcode scan failed");
      setIsScanning(false);
    }
  };

  const handleStopScan = () => {
    if (codeReaderRef.current) {
      // Stop the scanner
      codeReaderRef.current = null;
    }
    setIsScanning(false);
  };


  // Add to cart by barcode, or prompt to add new product if not found
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [newProductPrice, setNewProductPrice] = useState(0);
  const [newProductStock, setNewProductStock] = useState(1);
  const [addProductLoading, setAddProductLoading] = useState(false);

  useEffect(() => {
    if (barcode) {
      const found = products.find((p: Product) => p.barcode === barcode);
      if (found) {
        addToCart(found);
        setBarcode("");
      } else {
        setShowAddProduct(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barcode, products]);

  const handleAddNewProduct = async () => {
    setAddProductLoading(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProductName,
          price: newProductPrice,
          in_stock: newProductStock,
          barcode,
        }),
      });
      if (res.ok) {
        const added = await res.json();
        setProducts([...products, added]);
        addToCart(added);
        setShowAddProduct(false);
        setBarcode("");
        setNewProductName("");
        setNewProductPrice(0);
        setNewProductStock(1);
      } else {
        alert("Failed to add product");
      }
    } catch (e) {
      alert("Error adding product");
    }
    setAddProductLoading(false);
  };

  useEffect(() => {
    fetch("/api/products")
      .then(res => res.json())
      .then(data => {
        // Ensure we have an array, fallback to empty array if not
        if (Array.isArray(data)) {
          setProducts(data);
        } else {
          console.error('Products API did not return an array:', data);
          setProducts([]);
        }
      })
      .catch(error => {
        console.error('Failed to fetch products:', error);
        setProducts([]);
      });
  }, []);

  const getCartQty = (id: number) => cart.find(p => p.id === id)?.quantity ?? 0;

  function addToCart(product: Product, force = false) {
    setCart(prev => {
      const existing = prev.find(p => p.id === product.id);
      const newQty = (existing?.quantity ?? 0) + 1;
      // Won't add unless forced
      if (!force && existing && newQty > product.in_stock) {
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

  const [discountPercent, setDiscountPercent] = useState(0);
  const subtotal = cart.reduce((sum, p) => sum + p.price * p.quantity, 0);
  const discount = Math.max(0, Math.min(100, discountPercent)) * subtotal / 100;
  const taxable = Math.max(0, subtotal - discount);
  const taxAmount = taxRate > 0 ? (taxable * taxRate / 100) : 0;
  const total = Math.max(0, taxable + taxAmount);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cart, discountPercent }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        alert(`Checkout Error: ${data.error || 'Unknown error'}`);
        setLoading(false);
        return;
      }
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Error: No checkout URL received');
        setLoading(false);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout process');
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Add Product Dialog */}
      <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block mb-1 font-medium">Barcode</label>
              <input className="border rounded px-2 py-1 w-full" value={barcode} disabled title="Barcode" placeholder="Barcode" />
            </div>
            <div>
              <label className="block mb-1 font-medium">Name</label>
              <input className="border rounded px-2 py-1 w-full" value={newProductName} onChange={e => setNewProductName(e.target.value)} title="Product Name" placeholder="Product Name" />
            </div>
            <div>
              <label className="block mb-1 font-medium">Price</label>
              <input type="number" className="border rounded px-2 py-1 w-full" value={newProductPrice} onChange={e => setNewProductPrice(Number(e.target.value))} min={0} title="Price" placeholder="Price" />
            </div>
            <div>
              <label className="block mb-1 font-medium">Stock</label>
              <input type="number" className="border rounded px-2 py-1 w-full" value={newProductStock} onChange={e => setNewProductStock(Number(e.target.value))} min={1} title="Stock" placeholder="Stock" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddProduct(false); setBarcode(""); }}>Cancel</Button>
            <Button onClick={handleAddNewProduct} disabled={addProductLoading}>
              {addProductLoading ? "Adding..." : "Add Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Scan or Enter Barcode</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 items-center">
            <label htmlFor="barcode-input" className="sr-only">Barcode</label>
            <input
              id="barcode-input"
              type="text"
              value={barcode}
              onChange={e => setBarcode(e.target.value)}
              placeholder="Scan or enter barcode"
              className="border rounded px-2 py-1 flex-1"
            />
            <Button type="button" variant="outline" onClick={handleStartScan} disabled={isScanning}>
              {isScanning ? "Scanning..." : "Scan"}
            </Button>
          </div>
          {isScanning && (
            <div className="mt-2">
              <video ref={videoRef} className="w-[300px] h-[200px]" autoPlay muted />
              <Button type="button" variant="outline" onClick={handleStopScan} className="mt-2">Stop</Button>
            </div>
          )}
        </CardContent>
      </Card>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Products</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {products && products.length > 0 ? (
            products.filter((p: Product) => p && !p.archived).map((p: Product) => {
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
              </div>              );
            })
          ) : (
            <div className="col-span-2 text-center text-gray-500 py-8">
              No products available. Please add some products first.
            </div>
          )}
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
                    <label htmlFor={`qty-${item.id}`} className="sr-only">Quantity</label>
                    <input
                      id={`qty-${item.id}`}
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
                      placeholder="Qty"
                      title="Quantity"
                    />
                    </TableCell>
                    <TableCell>${item.price.toFixed(2)}</TableCell>
                    <TableCell>${(item.price * item.quantity).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex flex-col items-end gap-2 mt-4">
              <div className="flex items-center gap-4">
                <label className="mr-2 font-medium">Discount (%):</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={discountPercent}
                  onChange={e => setDiscountPercent(Number(e.target.value))}
                  className="border rounded px-2 py-1 w-24 text-right"
                  placeholder="0"
                  title="Discount percentage"
                />
              </div>
              <div className="text-sm text-muted-foreground">Subtotal: ${subtotal.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">Discount: -${discount.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">Tax Rate: {taxRate.toFixed(2)}%</div>
              <div className="text-sm text-muted-foreground">Tax: ${taxAmount.toFixed(2)}</div>
              <div className="font-bold">Total: ${total.toFixed(2)}</div>
            </div>
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

export default CheckoutPage;
