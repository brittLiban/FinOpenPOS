"use client";
import { useState, useRef, useEffect } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function InventoryIntake() {
  const [barcode, setBarcode] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [foundProduct, setFoundProduct] = useState<any | null>(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [newProductPrice, setNewProductPrice] = useState(0);
  const [newProductStock, setNewProductStock] = useState(1);
  const [addProductLoading, setAddProductLoading] = useState(false);
  const [updateStockLoading, setUpdateStockLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    fetch("/api/products")
      .then(res => res.json())
      .then(setProducts);
  }, []);

  useEffect(() => {
    if (barcode) {
      const found = products.find((p) => p.barcode === barcode);
      setFoundProduct(found || null);
      if (!found) setShowAddProduct(true);
    }
  }, [barcode, products]);

  const handleStartScan = async () => {
    setIsScanning(true);
    try {
      const codeReader = new BrowserMultiFormatReader();
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
        }
      });
    } catch (err) {
      alert("Barcode scan failed");
      setIsScanning(false);
    }
  };

  const handleStopScan = () => {
    setIsScanning(false);
  };

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

  const handleUpdateStock = async (amount: number) => {
    if (!foundProduct) return;
    setUpdateStockLoading(true);
    try {
      const res = await fetch(`/api/products/${foundProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...foundProduct, in_stock: foundProduct.in_stock + amount }),
      });
      if (res.ok) {
        const updated = await res.json();
        setProducts(products.map(p => p.id === updated.id ? updated : p));
        setFoundProduct(updated);
        setBarcode("");
      } else {
        alert("Failed to update stock");
      }
    } catch (e) {
      alert("Error updating stock");
    }
    setUpdateStockLoading(false);
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Inventory Intake (Scan or Enter Barcode)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 items-center">
            <input
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
      {/* If product found, show update stock */}
      {foundProduct && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Product Found: {foundProduct.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div>Current Stock: {foundProduct.in_stock}</div>
            <div className="flex gap-2 mt-4">
              <Button onClick={() => handleUpdateStock(1)} disabled={updateStockLoading}>+1</Button>
              <Button onClick={() => handleUpdateStock(5)} disabled={updateStockLoading}>+5</Button>
              <Button onClick={() => handleUpdateStock(10)} disabled={updateStockLoading}>+10</Button>
            </div>
          </CardContent>
        </Card>
      )}
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
    </div>
  );
}
