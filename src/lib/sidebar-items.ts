// List of all sidebar items with keys, labels, and icons
import {
  LayoutDashboardIcon,
  ShoppingCartIcon,
  DollarSignIcon,
  ShoppingBagIcon,
  BoxesIcon,
  PackageIcon,
  UsersIcon,
  Undo2Icon,
  CreditCardIcon,
  SettingsIcon,
} from "lucide-react";

export const SIDEBAR_ITEMS = [
  { key: "dashboard", label: "Dashboard", path: "/admin", icon: LayoutDashboardIcon },
  { key: "pos", label: "POS", path: "/admin/pos", icon: ShoppingCartIcon },
  { key: "cashier", label: "Cashier", path: "/admin/cashier", icon: DollarSignIcon },
  { key: "products", label: "Products", path: "/admin/products", icon: ShoppingBagIcon },
  { key: "inventory", label: "Inventory", path: "/admin/inventory", icon: BoxesIcon },
  { key: "inventory-intake", label: "Inventory Intake", path: "/admin/inventory/intake", icon: PackageIcon },
  { key: "orders", label: "Orders", path: "/admin/orders", icon: ShoppingBagIcon },
  { key: "customers", label: "Customers", path: "/admin/customers", icon: UsersIcon },
  { key: "employees", label: "Employees", path: "/admin/employees", icon: UsersIcon },
  { key: "user-roles", label: "User Roles", path: "/admin/user-roles", icon: UsersIcon },
  { key: "returns", label: "Returns", path: "/admin/returns", icon: Undo2Icon },
  { key: "checkout", label: "Checkout", path: "/admin/checkout", icon: CreditCardIcon },
  { key: "stripe-settings", label: "Payment Settings", path: "/admin/settings/stripe", icon: SettingsIcon },
  { key: "audit-log", label: "Audit Log", path: "/admin/audit-log", icon: BoxesIcon },
];
