"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BoxesIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  Package2Icon,
  SearchIcon,
  LayoutDashboardIcon,
  DollarSignIcon,
  PackageIcon,
  CreditCardIcon,
  ShoppingCartIcon,
  UsersIcon,
  ShoppingBagIcon,
  Undo2Icon,
} from "lucide-react";

const pageNames: { [key: string]: string } = {
  "/admin": "Dashboard",
  "/admin/customers": "Customers",
  "/admin/products": "Products",
  "/admin/orders": "Orders",
  "/admin/pos": "Point of Sale",
  "/admin/cashier": "Cashier",
  "/admin/inventory": "Inventory",
  "/admin/checkout": "Checkout",
  "/admin/returns": "Returns",
};

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/admin";

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4">
        <Link
          href="/admin"
          className="flex items-center gap-2 text-lg font-semibold"
        >
          <Package2Icon className="h-6 w-6" />
          <span className="sr-only">Admin Panel</span>
        </Link>
        <h1 className="text-xl font-bold">{pageNames[pathname] || "Dashboard"}</h1>
        <div className="relative ml-auto flex-1 md:grow-0">
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="overflow-hidden rounded-full"
            >
              <Image
                src="/placeholder-user.jpg"
                width={36}
                height={36}
                alt="Avatar"
                className="overflow-hidden rounded-full"
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem>Support</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <aside className="fixed mt-[56px] inset-y-0 left-0 z-10 hidden sm:flex group w-14 hover:w-48 transition-all duration-200 flex-col border-r bg-background">
          <nav className="flex flex-col gap-2 px-2 sm:py-5">
            <TooltipProvider>
              {/* Dashboard */}
              <Link
                href="/admin"
                className={`flex items-center h-10 px-3 rounded-lg overflow-hidden whitespace-nowrap ${pathname === "/admin"
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground"
                } transition-colors hover:text-foreground`}
              >
                <LayoutDashboardIcon className="h-5 w-5 flex-shrink-0" />
                <span className="font-medium ml-3 opacity-0 group-hover:opacity-100 group-hover:ml-3 transition-all duration-200 hidden sm:inline">Dashboard</span>
              </Link>
              {/* POS */}
              <Link
                href="/admin/pos"
                className={`flex items-center h-10 px-3 rounded-lg overflow-hidden whitespace-nowrap ${pathname === "/admin/pos"
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground"
                } transition-colors hover:text-foreground`}
              >
                <ShoppingCartIcon className="h-5 w-5 flex-shrink-0" />
                <span className="font-medium ml-3 opacity-0 group-hover:opacity-100 group-hover:ml-3 transition-all duration-200 hidden sm:inline">POS</span>
              </Link>
              {/* Cashier */}
              <Link
                href="/admin/cashier"
                className={`flex items-center h-10 px-3 rounded-lg overflow-hidden whitespace-nowrap ${pathname === "/admin/cashier"
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground"
                } transition-colors hover:text-foreground`}
              >
                <DollarSignIcon className="h-5 w-5 flex-shrink-0" />
                <span className="font-medium ml-3 opacity-0 group-hover:opacity-100 group-hover:ml-3 transition-all duration-200 hidden sm:inline">Cashier</span>
              </Link>
              {/* Products */}
              <Link
                href="/admin/products"
                className={`flex items-center h-10 px-3 rounded-lg overflow-hidden whitespace-nowrap ${pathname === "/admin/products"
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground"
                } transition-colors hover:text-foreground`}
              >
                <ShoppingBagIcon className="h-5 w-5 flex-shrink-0" />
                <span className="font-medium ml-3 opacity-0 group-hover:opacity-100 group-hover:ml-3 transition-all duration-200 hidden sm:inline">Products</span>
              </Link>
              {/* Inventory */}
              <Link
                href="/admin/inventory"
                className={`flex items-center h-10 px-3 rounded-lg overflow-hidden whitespace-nowrap ${pathname === "/admin/inventory"
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground"
                } transition-colors hover:text-foreground`}
              >
                <BoxesIcon className="h-5 w-5 flex-shrink-0" />
                <span className="font-medium ml-3 opacity-0 group-hover:opacity-100 group-hover:ml-3 transition-all duration-200 hidden sm:inline">Inventory</span>
              </Link>
              {/* Orders */}
              <Link
                href="/admin/orders"
                className={`flex items-center h-10 px-3 rounded-lg overflow-hidden whitespace-nowrap ${pathname === "/admin/orders"
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground"
                } transition-colors hover:text-foreground`}
              >
                <ShoppingBagIcon className="h-5 w-5 flex-shrink-0" />
                <span className="font-medium ml-3 opacity-0 group-hover:opacity-100 group-hover:ml-3 transition-all duration-200 hidden sm:inline">Orders</span>
              </Link>
              {/* Customers */}
              <Link
                href="/admin/customers"
                className={`flex items-center h-10 px-3 rounded-lg overflow-hidden whitespace-nowrap ${pathname === "/admin/customers"
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground"
                } transition-colors hover:text-foreground`}
              >
                <UsersIcon className="h-5 w-5 flex-shrink-0" />
                <span className="font-medium ml-3 opacity-0 group-hover:opacity-100 group-hover:ml-3 transition-all duration-200 hidden sm:inline">Customers</span>
              </Link>
              {/* Returns */}
              <Link
                href="/admin/returns"
                className={`flex items-center h-10 px-3 rounded-lg overflow-hidden whitespace-nowrap ${pathname === "/admin/returns"
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground"
                } transition-colors hover:text-foreground`}
              >
                <Undo2Icon className="h-5 w-5 flex-shrink-0" />
                <span className="font-medium ml-3 opacity-0 group-hover:opacity-100 group-hover:ml-3 transition-all duration-200 hidden sm:inline">Returns</span>
              </Link>
              {/* Checkout */}
              <Link
                href="/admin/checkout"
                className={`flex items-center h-10 px-3 rounded-lg overflow-hidden whitespace-nowrap ${pathname === "/admin/checkout"
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground"
                } transition-colors hover:text-foreground`}
              >
                <CreditCardIcon className="h-5 w-5 flex-shrink-0" />
                <span className="font-medium ml-3 opacity-0 group-hover:opacity-100 group-hover:ml-3 transition-all duration-200 hidden sm:inline">Checkout</span>
              </Link>

            </TooltipProvider>
          </nav>
        </aside>
        <main className="flex-1 p-4 sm:px-6 sm:py-0">{children}</main>
      </div>
    </div>
  );
}
