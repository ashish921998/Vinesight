"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Plus, 
  Calculator, 
  Camera, 
  Droplets, 
  SprayCan,
  Grape,
  IndianRupee,
  FileText
} from "lucide-react";

const quickActions = [
  {
    title: "Add Record",
    subtitle: "Log farm activity",
    href: "/journal",
    icon: Plus,
    color: "bg-green-100 text-green-700",
    bgGradient: "from-green-50 to-green-100"
  },
  {
    title: "Calculator",
    subtitle: "Water & nutrients",
    href: "/calculators", 
    icon: Calculator,
    color: "bg-green-100 text-green-700",
    bgGradient: "from-green-50 to-green-100"
  },
  {
    title: "Irrigation",
    subtitle: "Water schedule",
    href: "/journal?tab=irrigation",
    icon: Droplets,
    color: "bg-green-100 text-green-700",
    bgGradient: "from-green-50 to-green-100"
  },
  {
    title: "Spray Log",
    subtitle: "Pest & disease",
    href: "/journal?tab=spray",
    icon: SprayCan,
    color: "bg-green-100 text-green-700",
    bgGradient: "from-green-50 to-green-100"
  },
  {
    title: "Harvest",
    subtitle: "Record yield",
    href: "/journal?tab=harvest",
    icon: Grape,
    color: "bg-green-100 text-green-700",
    bgGradient: "from-green-50 to-green-100"
  },
  {
    title: "Expenses",
    subtitle: "Track costs",
    href: "/journal?tab=expense",
    icon: IndianRupee,
    color: "bg-green-100 text-green-700",
    bgGradient: "from-green-50 to-green-100"
  }
];

export function QuickActions() {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 px-1">
        Quick Actions
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.title}
              href={action.href}
              className="block"
            >
              <Card className={`
                border-0 shadow-sm hover:shadow-md transition-all duration-200 
                active:scale-95 touch-manipulation
                bg-gradient-to-br ${action.bgGradient}
                hover:scale-105
              `}>
                <CardContent className="p-4 text-center">
                  <div className={`
                    inline-flex items-center justify-center 
                    w-12 h-12 rounded-full mb-3
                    ${action.color}
                  `}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-medium text-sm text-gray-900 mb-1">
                    {action.title}
                  </h3>
                  <p className="text-xs text-gray-600 leading-tight">
                    {action.subtitle}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}