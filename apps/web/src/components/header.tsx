'use client';

import { Bell, Search, ChevronDown, Building2, Menu } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  userName: string;
  userRole: string;
  onMenuToggle?: () => void;
}

export function Header({ userName, userRole, onMenuToggle }: HeaderProps) {
 const { user, setActiveOrganization } = useAuthStore();
 const router = useRouter();
 const [showOrgMenu, setShowOrgMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fetch user's organizations (for switcher)
  const { data: orgs } = useQuery({
    queryKey: ['my-organizations'],
    queryFn: () => api.get('/auth/me').then((r: any) => r.data?.organizations || []),
    enabled: !!user,
  });

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowOrgMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="h-14 border-b bg-card flex items-center justify-between gap-2 px-3 md:px-6">
      <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
        <Button variant="ghost" size="icon" className="md:hidden shrink-0" onClick={onMenuToggle}>
          <Menu className="h-5 w-5" />
        </Button>
        <div className="relative hidden sm:block w-40 md:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar..." className="pl-8" />
        </div>
      </div>
      <div className="flex items-center gap-1 md:gap-4">
        {/* Organization Switcher */}
        <div className="relative" ref={menuRef}>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1 md:gap-2"
            onClick={() => setShowOrgMenu(!showOrgMenu)}
          >
            <Building2 className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline max-w-[120px] truncate">{user?.organizationName || 'Empresa'}</span>
            <ChevronDown className="h-3 w-3 hidden sm:block" />
          </Button>
          {showOrgMenu && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-card border rounded-lg shadow-lg z-50 py-1">
              {(orgs || []).map((org: any) => (
                <button
                  key={org.id}
                  className={`w-full px-4 py-2 text-sm text-left hover:bg-muted transition-colors ${
                    org.id === user?.organizationId ? 'bg-primary/10 text-primary' : ''
                  }`}
                  onClick={() => {
                    setActiveOrganization(org.id);
                    setShowOrgMenu(false);
                    router.refresh();
                  }}
                >
                  <p className="font-medium">{org.name}</p>
                  <p className="text-xs text-muted-foreground">{org.slug}</p>
                </button>
              ))}
              {(!orgs || orgs.length === 0) && (
                <p className="px-4 py-2 text-sm text-muted-foreground">Nenhuma organização</p>
              )}
            </div>
          )}
        </div>

        <Button variant="ghost" size="icon">
          <Bell className="h-4 w-4" />
        </Button>
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium truncate max-w-[100px] md:max-w-[160px]">{userName}</p>
          <p className="text-xs text-muted-foreground truncate">{userRole}</p>
        </div>
      </div>
    </header>
  );
}
