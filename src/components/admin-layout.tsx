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
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  SearchIcon
} from "lucide-react";
import { SIDEBAR_ITEMS } from "@/lib/sidebar-items";

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
  "/admin/employees": "Employees",
};


export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/admin";
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string>("");
  const [roleId, setRoleId] = useState<number | null>(null);
  const [sidebarPerms, setSidebarPerms] = useState<{ [itemKey: string]: boolean }>({});
  const router = useRouter();

  // Track when sidebarPerms are loaded
  const [permsLoaded, setPermsLoaded] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user);
      if (data.user) {
        // Use the same RPC as user roles management page
        const { data: rolesData, error } = await supabase.rpc('get_users_with_roles');
        if (!error && Array.isArray(rolesData)) {
          const userRow = rolesData.find((u: any) => u.user_id === data.user.id);
          setRole(userRow?.role_names || 'No role assigned');
          setRoleId(userRow?.role_id || null);
        } else {
          setRole('No role assigned');
          setRoleId(null);
        }
      } else {
        setRole('No role assigned');
        setRoleId(null);
      }
    });
  }, []);

  // Fetch sidebar permissions for this role
  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    (async () => {
      // 1. Fetch per-user permissions
      const { data: userPerms } = await supabase
        .from("sidebar_permissions")
        .select("item_key, enabled")
        .eq("user_id", user.id);

      // 2. Fetch per-role permissions if needed
      let rolePerms: any[] = [];
      if (roleId) {
        const { data: rolePermsData } = await supabase
          .from("sidebar_permissions")
          .select("item_key, enabled")
          .eq("role_id", roleId);
        rolePerms = rolePermsData || [];
      }

      const perms: { [itemKey: string]: boolean } = {};
      SIDEBAR_ITEMS.forEach(item => {
        if (item.key === 'checkout') {
          perms[item.key] = true; // Always show checkout
          return;
        }
        // Per-user override takes precedence
        const userFound = userPerms?.find((row: any) => row.item_key === item.key);
        if (userFound) {
          perms[item.key] = userFound.enabled;
        } else {
          // Fallback to role-based
          const roleFound = rolePerms?.find((row: any) => row.item_key === item.key);
          if (role === 'admin') {
            perms[item.key] = roleFound ? roleFound.enabled : true;
          } else {
            perms[item.key] = roleFound ? roleFound.enabled : false;
          }
        }
      });
      setSidebarPerms(perms);
      setPermsLoaded(true);
    })();
  }, [user, roleId, role]);

  // Redirect from /admin if user does not have Dashboard access
  useEffect(() => {
    if (!permsLoaded) return;
    if (pathname === "/admin" && sidebarPerms["dashboard"] === false) {
      // Find first allowed sidebar item
      const firstAllowed = SIDEBAR_ITEMS.find(item => sidebarPerms[item.key]);
      if (firstAllowed && firstAllowed.path !== "/admin") {
        router.replace(firstAllowed.path);
      }
    }
  }, [pathname, sidebarPerms, permsLoaded, router]);

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4">
        <Link
          href="/admin"
          className="flex items-center gap-2 text-lg font-semibold"
        >
          <Image src="/next.svg" alt="Store Logo" width={32} height={32} className="h-8 w-8" />
          <span className="sr-only">Admin Panel</span>
        </Link>
        <div className="flex flex-col items-start justify-center min-w-[180px]">
          <span className="text-lg font-bold leading-tight">{process.env.NEXT_PUBLIC_BUSINESS_NAME || "FinOpenPOS"}</span>
          <span className="text-xs text-muted-foreground">{pageNames[pathname] || "Dashboard"}</span>
        </div>
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
            {user && (
              <div className="px-4 py-2 text-xs text-muted-foreground">
                <div><b>Email:</b> {user.email}</div>
                <div><b>Role:</b> {role || 'No role assigned'}</div>
              </div>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>Support</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={async () => {
                const supabase = createClient();
                await supabase.auth.signOut();
                router.push("/login");
              }}
            >
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <aside className="fixed mt-[56px] inset-y-0 left-0 z-10 hidden sm:flex group w-14 hover:w-48 transition-all duration-200 flex-col border-r bg-background">
          <nav className="flex flex-col gap-2 px-2 sm:py-5">
            <TooltipProvider>
              {SIDEBAR_ITEMS.filter(item => sidebarPerms[item.key] !== false).map(item => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.key}
                    href={item.path}
                    className={`flex items-center h-10 px-3 rounded-lg overflow-hidden whitespace-nowrap ${pathname === item.path
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground"
                    } transition-colors hover:text-foreground`}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span className="font-medium ml-3 opacity-0 group-hover:opacity-100 group-hover:ml-3 transition-all duration-200 hidden sm:inline">{item.label}</span>
                  </Link>
                );
              })}
            </TooltipProvider>
          </nav>
        </aside>
        <main className="flex-1 p-4 sm:px-6 sm:py-0">{children}</main>
      </div>
    </div>
  );
}
