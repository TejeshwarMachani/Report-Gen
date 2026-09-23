import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { NavLink, useNavigate } from "react-router";
import {
  FileBarChart,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  UploadCloud,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import logo from "@/assets/logo.svg";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const org = useQuery(api.orgs.getOrCreate);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { to: "/upload", label: "Upload data", icon: UploadCloud, exact: false },
    { to: "/reports", label: "Reports", icon: FileBarChart, exact: false },
  ];

  const initials = (user?.name || user?.email || "U")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-[1440px] lg:gap-0">
        {/* Sidebar */}
        <aside className="no-print sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r bg-sidebar px-3 py-5 lg:flex">
          <NavLink to="/dashboard" className="mb-7 flex items-center gap-2.5 px-2">
            <img src={logo} alt="ReportGen" className="size-9 rounded-lg shadow-sm" />
            <div className="flex flex-col">
              <span className="font-display text-[15px] font-bold tracking-tight">ReportGen</span>
              <span className="text-[11px] text-muted-foreground">Business reporting</span>
            </div>
          </NavLink>

          <p className="eyebrow px-3 pb-2">Workspace</p>
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                className={({ isActive }) =>
                  `group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`
                }
              >
                <item.icon className="size-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto flex flex-col gap-3">
            <div className="flex items-center gap-2.5 rounded-xl border bg-card px-3 py-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <LifeBuoy className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold">{org?.name ?? "My workspace"}</p>
                <p className="text-[11px] text-muted-foreground">Free plan · CSV &amp; XLSX</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="no-print sticky top-0 z-10 flex h-14 items-center justify-between gap-3 border-b bg-background/80 px-4 backdrop-blur lg:px-8">
            <div className="flex items-center gap-2 lg:hidden">
              <img src={logo} alt="ReportGen" className="size-7 rounded-md" />
              <span className="font-display text-sm font-bold">ReportGen</span>
            </div>
            <div className="hidden items-center gap-2 text-sm text-muted-foreground lg:flex">
              {org?.name ?? "Workspace"}
            </div>
            <div className="flex items-center gap-1.5">
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full p-1 pr-3 transition-colors hover:bg-accent">
                    <Avatar className="size-8">
                      <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden text-sm font-medium sm:block">
                      {user?.name || user?.email || "You"}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    {user?.email || "Signed in"}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 size-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className="min-w-0 flex-1 px-4 pb-20 pt-8 lg:px-10">{children}</main>

          {/* Mobile nav */}
          <nav className="no-print fixed inset-x-0 bottom-0 z-20 flex border-t bg-background/95 backdrop-blur lg:hidden">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                className={({ isActive }) =>
                  `flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`
                }
              >
                <item.icon className="size-5" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
