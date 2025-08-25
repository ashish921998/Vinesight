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
    <div className="container mx-auto px-4 py-8">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold text-primary mb-4">
          🍇 {t('home.title')}
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {t('home.subtitle')}
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          {t('home.description')}
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card key={feature.title} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Icon className="h-6 w-6 text-primary" />
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </div>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.location.href = feature.href}
                >
                  {t('common.buttons.openModule')}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-12 text-center">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-lg">
              {user ? t('home.gettingStarted.title') : t('home.joinToday.title')}
            </CardTitle>
            <CardDescription>
              {user 
                ? t('home.gettingStarted.description')
                : t('home.joinToday.description')
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Button disabled className="w-full">
                {t('common.loading')}
              </Button>
            ) : user ? (
              <Button 
                className="w-full"
                onClick={() => window.location.href = "/farms"}
              >
                {t('home.gettingStarted.button')}
              </Button>
            ) : (
              <LoginButton className="w-full">
                {t('home.joinToday.button')}
              </LoginButton>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
