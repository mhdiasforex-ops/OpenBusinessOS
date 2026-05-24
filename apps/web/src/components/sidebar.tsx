'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { LayoutDashboard, DollarSign, Users, Package, Zap, BarChart3, Settings, Rocket, FileText, Landmark, Megaphone, LogOut, Shield, Bot, MessageSquare, ShoppingCart, Calendar, UserCheck, FileSignature, Truck, LayoutTemplate, CreditCard, ShieldCheck, MessageCircle } from 'lucide-react';

const iconMap: Record<string, React.ComponentType<any>> = {
 LayoutDashboard, DollarSign, Users, Package, Zap, BarChart3, Settings, Rocket, FileText, Landmark, Megaphone, Shield, Bot, MessageSquare, ShoppingCart, Calendar, UserCheck, FileSignature, Truck, LayoutTemplate, CreditCard, ShieldCheck, MessageCircle,
};

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

interface SidebarProps {
  items: NavItem[];
  organizationName: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ items, organizationName, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuthStore();

  const content = (
    <>
      <div className="flex items-center justify-between p-4 border-b md:p-6">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold truncate">{organizationName}</h2>
          <p className="text-xs text-muted-foreground">OpenBusinessOS</p>
        </div>
      </div>
      <nav className="flex-1 p-2 space-y-1 md:p-4 overflow-y-auto">
        {items.map((item) => {
          const Icon = iconMap[item.icon] || LayoutDashboard;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href as any}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t">
        <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors" onClick={() => { logout(); router.push('/login'); }}>
          <LogOut className="h-4 w-4 shrink-0" />
          Sair
        </button>
      </div>
    </>
  );

  return (
    <>
      <aside className="hidden md:flex w-64 border-r bg-card flex-col">
        {content}
      </aside>

      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={onClose} />
          <aside className="fixed inset-y-0 left-0 w-64 bg-card border-r flex flex-col z-50 animate-in slide-in-from-left">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
