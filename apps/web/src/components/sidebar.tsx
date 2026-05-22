'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { LayoutDashboard, DollarSign, Users, Package, Zap, BarChart3, Settings, Rocket, FileText, Landmark, Megaphone, LogOut } from 'lucide-react';

const iconMap: Record<string, React.ComponentType<any>> = {
 LayoutDashboard, DollarSign, Users, Package, Zap, BarChart3, Settings, Rocket, FileText, Landmark, Megaphone,
};

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

interface SidebarProps {
  items: NavItem[];
  organizationName: string;
}

export function Sidebar({ items, organizationName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuthStore();

  return (
    <aside className="w-64 border-r bg-card flex flex-col">
      <div className="p-6 border-b">
        <h2 className="text-lg font-semibold truncate">{organizationName}</h2>
        <p className="text-xs text-muted-foreground">OpenBusinessOS</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {items.map((item) => {
          const Icon = iconMap[item.icon] || LayoutDashboard;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href as any}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t">
    <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors" onClick={() => { logout(); router.push('/login'); }}>
        <LogOut className="h-4 w-4" />
        Sair
      </button>
      </div>
    </aside>
  );
}
