"use client";
interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  in_stock: number;
  category: string;
  low_stock_threshold: number;
  archived?: boolean;
}

// Product interface must be declared before any usage

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { ArchiveIcon, Undo2Icon } from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  SearchIcon,
  FilterIcon,
  FilePenIcon,
  TrashIcon,
  EyeIcon,
  PlusIcon,
  LoaderIcon,
  Loader2Icon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { useRef } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


export default function Products() {

  const [products, setProducts] = useState<Product[]>([]);

  // Archive dialog state
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
  const [productToArchive, setProductToArchive] = useState<Product | null>(null);

  // Archive handler
  const handleArchiveProduct = useCallback(async (archive: boolean) => {
    if (!productToArchive) return;
    try {
      const response = await fetch(`/api/products/${productToArchive.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: archive }),
      });
      if (response.ok) {
        const updated = await response.json();
        setProducts(products.map((p) => (p.id === updated.id ? updated : p)));
        setIsArchiveDialogOpen(false);
        setProductToArchive(null);
      } else {
        console.error("Failed to archive product");
      }
    } catch (error) {
      console.error("Error archiving product:", error);
    }
  }, [productToArchive, products]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    category: "all",
    inStock: "all",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productPrice, setProductPrice] = useState(0);
  const [productInStock, setProductInStock] = useState(0);
  const [productCategory, setProductCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [productBarcode, setProductBarcode] = useState("");
  const [productImage, setProductImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Barcode scanning logic
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
          setProductBarcode(result.getText());
          setIsScanning(false);
          codeReader.reset();
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setProductImage(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  const [categories, setCategories] = useState(() => ["electronics", "clothing", "books", "home"]);
  const [newCategory, setNewCategory] = useState("");
  const [isEditProductDialogOpen, setIsEditProductDialogOpen] = useState(false);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [productLowStockThreshold, setProductLowStockThreshold] = useState(5); // default 5


  const resetSelectedProduct = () => {
    setSelectedProductId(null);
    setProductName("");
    setProductDescription("");
    setProductPrice(0);
    setProductInStock(0);
    setProductCategory("");
    setProductLowStockThreshold(5);
  };

  const handleAddProduct = useCallback(async () => {
    try {
      const categoryToUse = productCategory === "custom" ? customCategory : productCategory;
      if (!categoryToUse) {
        alert("Please select or enter a category.");
        return;
      }
      const newProduct = {
        name: productName,
        description: productDescription,
        price: productPrice,
        in_stock: productInStock,
        category: categoryToUse,
        low_stock_threshold: productLowStockThreshold,
        barcode: productBarcode,
        image: productImage,
      };
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newProduct),
      });

      if (response.ok) {
        const addedProduct = await response.json();
        setProducts([...products, addedProduct]);
        setIsAddProductDialogOpen(false);
        resetSelectedProduct();
      } else {
        console.error("Failed to add product");
      }
    } catch (error) {
      console.error("Error adding product:", error);
    }
  }, [productName, productDescription, productPrice, productInStock, productCategory, customCategory, productLowStockThreshold, products]);

  const handleEditProduct = useCallback(async () => {
    if (!selectedProductId) return;
    try {
      const updatedProduct = {
        id: selectedProductId,
        name: productName,
        description: productDescription,
        price: productPrice,
        in_stock: productInStock,
        category: productCategory,
        low_stock_threshold: productLowStockThreshold,
        barcode: productBarcode,
        image: productImage,
      };
      const response = await fetch(`/api/products/${selectedProductId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedProduct),
      });

      if (response.ok) {
        const updatedProductFromServer = await response.json();
        setProducts(
          products.map((p) => (p.id === updatedProductFromServer.id ? updatedProductFromServer : p))
        );
        setIsEditProductDialogOpen(false);
        resetSelectedProduct();
      } else {
        console.error("Failed to update product");
      }
    } catch (error) {
      console.error("Error updating product:", error);
    }
  }, [selectedProductId, productName, productDescription, productPrice, productInStock, productCategory, productLowStockThreshold, products]);

  const handleDeleteProduct = useCallback(async () => {
    if (!productToDelete) return;
    try {
      const response = await fetch(`/api/products/${productToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setProducts(products.filter((p) => p.id !== productToDelete.id));
        setIsDeleteConfirmationOpen(false);
        setProductToDelete(null);
      } else {
        console.error("Failed to delete product");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  }, [productToDelete, products]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/products");
        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (filters.category !== "all" && product.category !== filters.category) {
        return false;
      }
      if (
        filters.inStock !== "all" &&
        filters.inStock === "in-stock" &&
        product.in_stock === 0
      ) {
        return false;
      }
      return product.name.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [products, filters.category, filters.inStock, searchTerm]);

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(
    indexOfFirstProduct,
    indexOfLastProduct
  );

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterChange = (type: "category" | "inStock", value: string) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [type]: value,
    }));
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <Loader2Icon className="mx-auto h-12 w-12 animate-spin" />
      </div>
    );
  }

  return (
    <>
      {products.filter(p => !p.archived && p.in_stock <= p.low_stock_threshold).length > 0 && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>⚠️ Low Stock Alert</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {products
                .filter(p => !p.archived && p.in_stock <= p.low_stock_threshold)
                .map(p => (
                  <li key={p.id} className="flex justify-between">
                    <span>{p.name}</span>
                    <span className="font-medium text-destructive">
                      {p.in_stock}/{p.low_stock_threshold}
                    </span>
                  </li>
                ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card className="flex flex-col gap-6 p-6">
        <CardHeader className="p-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="pr-8"
                />
                <SearchIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1">
                    <FilterIcon className="w-4 h-4" />
                    <span>Filters</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={filters.category === "all"}
                    onCheckedChange={() =>
                      handleFilterChange("category", "all")
                    }
                  >
                    All Categories
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={filters.category === "electronics"}
                    onCheckedChange={() =>
                      handleFilterChange("category", "electronics")
                    }
                  >
                    Electronics
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={filters.category === "home"}
                    onCheckedChange={() =>
                      handleFilterChange("category", "home")
                    }
                  >
                    Home
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={filters.category === "health"}
                    onCheckedChange={() =>
                      handleFilterChange("category", "health")
                    }
                  >
                    Health
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={filters.inStock === "all"}
                    onCheckedChange={() => handleFilterChange("inStock", "all")}
                  >
                    All Stock
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={filters.inStock === "in-stock"}
                    onCheckedChange={() =>
                      handleFilterChange("inStock", "in-stock")
                    }
                  >
                    In Stock
                  </DropdownMenuCheckboxItem>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="low_stock_threshold" className="text-right">
                      Low Stock Threshold
                    </Label>
                    <Input
                      id="low_stock_threshold"
                      type="number"
                      value={productLowStockThreshold}
                      onChange={(e) => setProductLowStockThreshold(+e.target.value)}
                      className="col-span-3"
                    />
                  </div>

                  <DropdownMenuCheckboxItem
                    checked={filters.inStock === "out-of-stock"}
                    onCheckedChange={() =>
                      handleFilterChange("inStock", "out-of-stock")
                    }
                  >
                    Out of Stock
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Button size="sm" onClick={() => setIsAddProductDialogOpen(true)}>
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentProducts.map((product) => (
                  <TableRow key={product.id} className={product.archived ? "opacity-50" : ""}>
                    <TableCell className="font-medium">
                      {product.name}
                    </TableCell>
                    <TableCell>{product.description}</TableCell>
                    <TableCell>${product.price.toFixed(2)}</TableCell>
                    <TableCell>{product.in_stock}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setSelectedProductId(product.id);
                            setProductName(product.name);
                            setProductDescription(product.description);
                            setProductPrice(product.price);
                            setProductInStock(product.in_stock);
                            setProductCategory(product.category);
                            setIsEditProductDialogOpen(true);
                            setProductLowStockThreshold(product.low_stock_threshold);
                          }}
                          disabled={product.archived}
                        >
                          <FilePenIcon className="w-4 h-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setProductToDelete(product);
                            setIsDeleteConfirmationOpen(true);
                          }}
                          disabled={product.archived}
                        >
                          <TrashIcon className="w-4 h-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setProductToArchive(product);
                            setIsArchiveDialogOpen(true);
                          }}
                        >
                          {product.archived ? (
                            <Undo2Icon className="w-4 h-4 text-green-600" />
                          ) : (
                            <ArchiveIcon className="w-4 h-4 text-muted-foreground" />
                          )}
                          <span className="sr-only">{product.archived ? "Unarchive" : "Archive"}</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
      <Dialog
        open={isArchiveDialogOpen}
        onOpenChange={setIsArchiveDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{productToArchive?.archived ? "Unarchive Product" : "Archive Product"}</DialogTitle>
            <DialogDescription>
              {productToArchive?.archived
                ? "Unarchiving will make this product active and visible again."
                : "Archiving will hide this product from normal view, but it will not be deleted. You can unarchive it later."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsArchiveDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => handleArchiveProduct(!(productToArchive?.archived))}
            >
              {productToArchive?.archived ? "Unarchive" : "Archive"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={isArchiveDialogOpen}
        onOpenChange={setIsArchiveDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{productToArchive?.archived ? "Unarchive Product" : "Archive Product"}</DialogTitle>
            <DialogDescription>
              {productToArchive?.archived
                ? "Unarchiving will make this product active and visible again."
                : "Archiving will hide this product from normal view, but it will not be deleted. You can unarchive it later."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsArchiveDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => handleArchiveProduct(!(productToArchive?.archived))}
            >
              {productToArchive?.archived ? "Unarchive" : "Archive"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter></CardFooter>
      </Card>
      <Dialog
        open={isAddProductDialogOpen || isEditProductDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddProductDialogOpen(false);
            setIsEditProductDialogOpen(false);
            resetSelectedProduct();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isAddProductDialogOpen ? "Add New Product" : "Edit Product"}
            </DialogTitle>
            <DialogDescription>
              {isAddProductDialogOpen
                ? "Enter the details of the new product."
                : "Edit the details of the product."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="barcode" className="text-right">
                Barcode <span className="text-xs text-muted-foreground">(optional)</span>
              </Label>
              <div className="col-span-3 flex gap-2 items-center">
                <Input
                  id="barcode"
                  value={productBarcode}
                  onChange={e => setProductBarcode(e.target.value)}
                  className="flex-1"
                  placeholder="Scan or enter barcode"
                />
                <Button type="button" variant="outline" onClick={handleStartScan} disabled={isScanning}>
                  {isScanning ? "Scanning..." : "Scan"}
                </Button>
              </div>
            </div>
            {isScanning && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Camera</Label>
                <div className="col-span-3">
                  <video ref={videoRef} style={{ width: 300, height: 200 }} autoPlay muted />
                  <Button type="button" variant="outline" onClick={handleStopScan} className="mt-2">Stop</Button>
                </div>
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="image" className="text-right">
                Product Image <span className="text-xs text-muted-foreground">(optional)</span>
              </Label>
              <div className="col-span-3 flex flex-col gap-2">
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                {productImage && (
                  <img src={productImage} alt="Preview" className="h-24 object-contain border rounded" />
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Input
                id="description"
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                Price
              </Label>
              <Input
                id="price"
                type="number"
                value={productPrice}
                onChange={(e) => setProductPrice(Number(e.target.value))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="in_stock" className="text-right">
                In Stock
              </Label>
              <Input
                id="in_stock"
                type="number"
                value={productInStock}
                onChange={(e) => setProductInStock(Number(e.target.value))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <div className="col-span-3">
                <Select
                  value={productCategory}
                  onValueChange={(value) => {
                    setProductCategory(value);
                    if (value !== "custom") setCustomCategory("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(new Set([...categories, ...products.map(p => p.category).filter(Boolean)]))
                      .map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</SelectItem>
                    ))}
                    <SelectItem value="custom">Add new category...</SelectItem>
                  </SelectContent>
                </Select>
                {productCategory === "custom" && (
                  <div className="flex gap-2 mt-2">
                    <Input
                      className=""
                      placeholder="Enter new category"
                      value={customCategory}
                      onChange={e => setCustomCategory(e.target.value)}
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        const val = customCategory.trim();
                        if (val && !categories.includes(val)) {
                          setCategories([...categories, val]);
                          setProductCategory(val);
                          setCustomCategory("");
                        }
                      }}
                      variant="outline"
                    >
                      Add Category
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="low_stock_threshold" className="text-sm font-medium">
                Low Stock Threshold
              </label>
              <Input
                id="low_stock_threshold"
                name="low_stock_threshold"
                type="number"
                value={productLowStockThreshold}
                onChange={(e) => setProductLowStockThreshold(Number(e.target.value))}
              />
            </div>

          </div>
          <DialogFooter>
            <Button
              onClick={
                isAddProductDialogOpen ? handleAddProduct : handleEditProduct
              }
            >
              {isAddProductDialogOpen ? "Add Product" : "Update Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={isDeleteConfirmationOpen}
        onOpenChange={setIsDeleteConfirmationOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this product? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteConfirmationOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteProduct}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
