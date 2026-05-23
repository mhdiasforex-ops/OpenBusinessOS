'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useAuthStore } from '@/stores/auth-store';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { useEffect, useRef } from 'react';

const navItems = [
  { label: 'Painel', href: '/dashboard', icon: 'LayoutDashboard' },
  { label: 'Financeiro', href: '/financial', icon: 'DollarSign' },
  { label: 'Clientes', href: '/crm', icon: 'Users' },
  { label: 'Produtos', href: '/products', icon: 'Package' },
  { label: 'Automações', href: '/workflows', icon: 'Zap' },
  { label: 'Templates', href: '/templates', icon: 'FileCode' },
  { label: 'Analytics', href: '/analytics', icon: 'BarChart3' },
  { label: 'Configurações', href: '/settings', icon: 'Settings' },
  { label: 'DRE', href: '/financial/dre', icon: 'FileText' },
  { label: 'Conciliação', href: '/financial/conciliacao', icon: 'Landmark' },
 { label: 'Campanhas', href: '/crm/campanhas', icon: 'Megaphone' },
 { label: 'Fiscal', href: '/fiscal', icon: 'FileText' },
 { label: 'Omnichannel', href: '/omnichannel', icon: 'MessageSquare' },
 { label: 'AI Agent', href: '/ai-agent', icon: 'Bot' },
 { label: 'LGPD', href: '/lgpd', icon: 'Shield' },
 { label: 'Onboarding', href: '/onboarding', icon: 'Rocket' },
 { label: 'CMS', href: '/cms', icon: 'LayoutTemplate' },
 { label: 'RH', href: '/rh', icon: 'UserCheck' },
 { label: 'Contratos', href: '/contracts', icon: 'FileSignature' },
 { label: 'Fornecedores', href: '/suppliers', icon: 'Truck' },
 { label: 'Estoque', href: '/inventory', icon: 'Package' },
  { label: 'Vendas', href: '/sales', icon: 'ShoppingCart' },
  { label: 'Pagamentos', href: '/payments', icon: 'CreditCard' },
  { label: 'Compliance', href: '/compliance', icon: 'ShieldCheck' },
  { label: 'WhatsApp', href: '/whatsapp', icon: 'MessageCircle' },
  { label: 'Agendamentos', href: '/scheduler', icon: 'Calendar' },
  { label: 'Relatorios', href: '/reports', icon: 'BarChart3' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, setUser } = useAuthStore();
  const { data: session, status } = useSession();
  const router = useRouter();
  const populated = useRef(false);

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (session && !populated.current) {
      populated.current = true;
      setUser({
        id: (session.user as any).id,
        email: session.user.email!,
        name: session.user.name!,
        role: (session.user as any).role || '',
        organizationId: (session as any).organizationId,
        organizationName: (session as any).organizationName || '',
      });
    }
  }, [status, session, router, setUser]);

  if (status === 'loading') return null;
  if (status !== 'authenticated') return null;

  return (
    <div className="flex h-screen">
      <Sidebar items={navItems} organizationName={user?.organizationName || session ? ((session as any).organizationName || '') : ''} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header userName={user?.name || session?.user?.name || ''} userRole={user?.role || ''} />
        <main className="flex-1 overflow-y-auto p-6 bg-muted/50">{children}</main>
      </div>
    </div>
  );
}
