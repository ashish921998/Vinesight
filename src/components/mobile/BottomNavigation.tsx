"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Sprout, 
  Calculator, 
  Settings,
  Plus,
  X,
  FileText,
  Droplets
} from "lucide-react";

const navigationItems = [
  { 
    name: "Dashboard", 
    href: "/", 
    icon: Home,
    color: "text-green-600"
  },
  { 
    name: "Farms", 
    href: "/farms", 
    icon: Sprout,
    color: "text-green-600" 
  },
  { 
    name: "Calculator", 
    href: "/calculators", 
    icon: Calculator,
    color: "text-green-600"
  },
  { 
    name: "Settings", 
    href: "/settings", 
    icon: Settings,
    color: "text-gray-600"
  },
];

const quickAddItems = [
  {
    name: "Add Farm",
    href: "/farms",
    icon: Sprout,
    color: "bg-green-100 text-green-700"
  },
  {
    name: "Add Farm Logs",
    href: "/journal",
    icon: FileText,
    color: "bg-blue-100 text-blue-700"
  }
];

export function BottomNavigation() {
  const pathname = usePathname();
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  return (
    <>
      {/* Quick Add Overlay */}
      {showQuickAdd && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50"
          onClick={() => setShowQuickAdd(false)}
        >
          <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2">
            <div className="bg-white rounded-2xl shadow-xl p-4 min-w-72">
              <h3 className="text-lg font-semibold text-center mb-4">Quick Add</h3>
              <div className="space-y-3">
                {quickAddItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setShowQuickAdd(false)}
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors touch-manipulation active:scale-95"
                    >
                      <div className={`p-2 rounded-full ${item.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {item.name}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-bottom">
        <div className="relative flex justify-around items-center px-2 py-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex flex-col items-center justify-center
                  px-2 py-2 min-w-0 flex-1
                  transition-all duration-200
                  touch-manipulation
                  active:scale-95
                  ${isActive 
                    ? 'text-primary' 
                    : 'text-gray-400 hover:text-gray-600'
                  }
                `}
              >
                <div className={`
                  p-2 rounded-xl transition-all duration-200
                  ${isActive 
                    ? 'bg-green-100 text-green-600' 
                    : 'text-gray-400'
                  }
                `}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className={`
                  text-xs font-medium mt-1 truncate
                  ${isActive ? 'text-green-600' : 'text-gray-400'}
                `}>
                  {item.name}
                </span>
              </Link>
            );
          })}
          
          {/* Floating Add Button */}
          <button
            onClick={() => setShowQuickAdd(!showQuickAdd)}
            className="
              absolute -top-6 left-1/2 transform -translate-x-1/2
              bg-green-500 hover:bg-green-600
              text-white
              w-14 h-14 rounded-full
              shadow-lg hover:shadow-xl
              flex items-center justify-center
              transition-all duration-200
              touch-manipulation
              active:scale-95
              z-10
            "
          >
            {showQuickAdd ? (
              <X className="h-6 w-6" />
            ) : (
              <Plus className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>
    </>
  );
}