"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  Sprout, 
  Calculator, 
  FileText, 
  Settings, 
  Activity, 
  Users, 
  Menu,
  X,
  Home,
  Download,
  CloudSun,
  BarChart3,
  TrendingUp
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { LoginButton } from "./auth/LoginButton";
import { UserMenu } from "./auth/UserMenu";
import { LanguageSwitcher } from "./ui/language-switcher";
import { useTranslation } from "react-i18next";

export const getNavigation = (t: any) => [
  { name: t('navigation.dashboard'), href: '/', icon: Home },
  { name: t('navigation.farmManagement'), href: '/farms', icon: Sprout },
  { name: t('navigation.calculators'), href: '/calculators', icon: Calculator },
  { name: t('navigation.journal'), href: '/journal', icon: FileText },
  { name: t('navigation.export'), href: '/export', icon: Download },
  { name: t('navigation.analytics'), href: '/analytics', icon: Activity },
  { name: t('navigation.weather'), href: '/weather', icon: CloudSun },
  { name: t('navigation.reminders'), href: '/reminders', icon: Users },
  { name: t('navigation.reports'), href: '/reports', icon: BarChart3 },
  { name: 'Farm Efficiency', href: '/performance', icon: TrendingUp },
  { name: t('navigation.settings'), href: '/settings', icon: Settings },
];

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  
  const navigation = getNavigation(t);

  return (
    <>
      {/* Mobile menu backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center">
            <Link href="/" className="flex items-center gap-2">
              <Sprout className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-primary">VineSight</span>
            </Link>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={`
                            group flex gap-x-3 rounded-md p-3 text-sm leading-6 font-semibold
                            ${isActive 
                              ? 'bg-gray-50 text-primary' 
                              : 'text-gray-700 hover:text-primary hover:bg-gray-50'
                            }
                          `}
                        >
                          <Icon
                            className={`h-6 w-6 shrink-0 ${isActive ? 'text-primary' : 'text-gray-400 group-hover:text-primary'}`}
                            aria-hidden="true"
                          />
                          {item.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
            </ul>
          </nav>
          <div className="border-t border-gray-200 pt-4 space-y-3">
            <div className="px-2">
              <LanguageSwitcher />
            </div>
            {loading ? (
              <div className="px-2 py-3">Loading...</div>
            ) : user ? (
              <UserMenu />
            ) : (
              <LoginButton className="w-full" />
            )}
          </div>
        </div>
      </div>

      {/* Mobile sidebar */}
      <div className={`
        fixed inset-0 z-50 lg:hidden
        ${isMobileMenuOpen ? 'flex' : 'hidden'}
      `}>
        <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white shadow-xl">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(false)}
              className="h-12 w-12 text-white hover:bg-gray-600 rounded-full"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
          <div className="flex grow flex-col gap-y-5 overflow-y-auto px-6 pb-4 pt-16">
            <div className="flex h-16 shrink-0 items-center">
              <Link href="/" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                <Sprout className="h-8 w-8 text-primary" />
                <span className="text-xl font-bold text-primary">VineSight</span>
              </Link>
            </div>
            <nav className="flex flex-1 flex-col">
              <ul role="list" className="flex flex-1 flex-col gap-y-7">
                <li>
                  <ul role="list" className="-mx-2 space-y-1">
                    {navigation.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;
                      return (
                        <li key={item.name}>
                          <Link
                            href={item.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`
                              group flex gap-x-3 rounded-md p-3 text-sm leading-6 font-semibold
                              ${isActive 
                                ? 'bg-gray-50 text-primary' 
                                : 'text-gray-700 hover:text-primary hover:bg-gray-50'
                              }
                            `}
                          >
                            <Icon
                              className={`h-6 w-6 shrink-0 ${isActive ? 'text-primary' : 'text-gray-400 group-hover:text-primary'}`}
                              aria-hidden="true"
                            />
                            {item.name}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              </ul>
            </nav>
            <div className="border-t border-gray-200 pt-4 space-y-3">
              <div className="px-2">
                <LanguageSwitcher />
              </div>
              {loading ? (
                <div className="px-2 py-3">Loading...</div>
              ) : user ? (
                <UserMenu />
              ) : (
                <LoginButton className="w-full" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between bg-white px-3 border-b border-gray-100 shadow-sm lg:hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsMobileMenuOpen(true)}
          className="h-12 w-12 rounded-lg hover:bg-gray-100 touch-target flex-shrink-0 p-0"
        >
          <Menu className="h-6 w-6 text-gray-700" />
        </Button>
        <div className="flex-1 min-w-0 px-2">
          <Link href="/" className="flex items-center gap-2 justify-center">
            <Sprout className="h-6 w-6 text-green-600 flex-shrink-0" />
            <span className="text-lg font-bold text-gray-900 truncate">VineSight</span>
          </Link>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {loading ? (
            <div className="text-xs text-gray-500">Loading...</div>
          ) : user ? (
            <UserMenu />
          ) : (
            <LoginButton className="text-xs px-3 py-2 whitespace-nowrap h-10" />
          )}
        </div>
      </div>
    </>
  );
}