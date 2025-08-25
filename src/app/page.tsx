"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sprout, Calculator, FileText, Settings, Activity, Users, Bug, TrendingUp } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { LoginButton } from "@/components/auth/LoginButton";
import { useTranslation } from "react-i18next";

export default function Home() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  
  const features = [
    {
      title: t('home.features.farmManagement.title'),
      description: t('home.features.farmManagement.description'),
      icon: Sprout,
      href: "/farms"
    },
    {
      title: t('home.features.calculators.title'),
      description: t('home.features.calculators.description'),
      icon: Calculator,
      href: "/calculators"
    },
    {
      title: t('home.features.diseasePredict.title'),
      description: t('home.features.diseasePredict.description'),
      icon: Bug,
      href: "/disease-prediction"
    },
    {
      title: t('home.features.yieldPredict.title'),
      description: t('home.features.yieldPredict.description'),
      icon: TrendingUp,
      href: "/yield-prediction"
    },
    {
      title: t('home.features.journal.title'),
      description: t('home.features.journal.description'),
      icon: FileText,
      href: "/journal"
    },
    {
      title: t('home.features.analytics.title'),
      description: t('home.features.analytics.description'),
      icon: Activity,
      href: "/analytics"
    },
    {
      title: t('home.features.reminders.title'),
      description: t('home.features.reminders.description'),
      icon: Users,
      href: "/reminders"
    },
    {
      title: t('home.features.settings.title'),
      description: t('home.features.settings.description'),
      icon: Settings,
      href: "/settings"
    }
  ];

  return (
    <div className="container mx-auto">
      <header className="text-center mb-8 sm:mb-12 px-2">
        <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-3 sm:mb-4">
          🍇 {t('home.title')}
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto px-2">
          {t('home.subtitle')}
        </p>
        <p className="text-sm text-muted-foreground mt-2 px-2">
          {t('home.description')}
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 px-2">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card key={feature.title} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3 sm:pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
                  <CardTitle className="text-base sm:text-lg leading-tight">{feature.title}</CardTitle>
                </div>
                <CardDescription className="text-sm leading-relaxed">{feature.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button 
                  variant="outline" 
                  className="w-full h-10 sm:h-11 text-sm sm:text-base"
                  onClick={() => window.location.href = feature.href}
                >
                  {t('common.buttons.openModule')}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 sm:mt-12 text-center px-2">
        <Card className="max-w-md mx-auto">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">
              {user ? t('home.gettingStarted.title') : t('home.joinToday.title')}
            </CardTitle>
            <CardDescription className="text-sm">
              {user 
                ? t('home.gettingStarted.description')
                : t('home.joinToday.description')
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? (
              <Button disabled className="w-full h-11">
                {t('common.loading')}
              </Button>
            ) : user ? (
              <Button 
                className="w-full h-11"
                onClick={() => window.location.href = "/farms"}
              >
                {t('home.gettingStarted.button')}
              </Button>
            ) : (
              <LoginButton className="w-full h-11">
                {t('home.joinToday.button')}
              </LoginButton>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
