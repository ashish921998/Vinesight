"use client";

import { SEOSchema } from "@/components/SEOSchema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Scissors, 
  Droplets, 
  Bug, 
  Calendar, 
  BarChart3, 
  Smartphone,
  Leaf,
  Sun,
  CloudRain,
  Target
} from "lucide-react";

export default function VineyardManagement() {
  const managementAreas = [
    {
      icon: Scissors,
      title: "Pruning & Training",
      description: "Optimal vine structure for maximum yield",
      practices: [
        "Winter dormant pruning techniques",
        "Summer green pruning methods",
        "Trellis system selection and setup",
        "Canopy management strategies"
      ],
      season: "Winter/Summer",
      priority: "High"
    },
    {
      icon: Droplets,
      title: "Irrigation Management",
      description: "Precision water delivery systems",
      practices: [
        "Drip irrigation installation and maintenance",
        "Soil moisture monitoring",
        "Deficit irrigation scheduling",
        "Water quality testing and treatment"
      ],
      season: "Year-round",
      priority: "Critical"
    },
    {
      icon: Bug,
      title: "Pest & Disease Control",
      description: "Integrated protection strategies",
      practices: [
        "IPM (Integrated Pest Management) protocols",
        "Organic spray program development",
        "Beneficial insect habitat creation",
        "Disease-resistant variety selection"
      ],
      season: "Spring/Summer",
      priority: "High"
    },
    {
      icon: Leaf,
      title: "Soil & Nutrition",
      description: "Maintaining vineyard soil health",
      practices: [
        "Annual soil testing and analysis",
        "Organic matter incorporation",
        "Cover crop management",
        "Precision fertilizer application"
      ],
      season: "Fall/Spring",
      priority: "Medium"
    }
  ];

  const smartTechnologies = [
    {
      icon: Smartphone,
      title: "Mobile Farm Apps",
      description: "Real-time vineyard monitoring and management",
      features: ["Field data collection", "Task scheduling", "Weather integration", "Inventory tracking"]
    },
    {
      icon: BarChart3,
      title: "Data Analytics",
      description: "AI-powered insights for decision making",
      features: ["Yield prediction", "Disease forecasting", "Optimal harvest timing", "ROI analysis"]
    },
    {
      icon: Sun,
      title: "Weather Monitoring",
      description: "Micro-climate tracking systems",
      features: ["Frost protection alerts", "Irrigation scheduling", "Spray timing optimization", "Heat stress monitoring"]
    },
    {
      icon: Target,
      title: "Precision Agriculture",
      description: "Site-specific management zones",
      features: ["GPS-guided equipment", "Variable rate applications", "Yield mapping", "Soil zone management"]
    }
  ];

  const monthlyTasks = [
    { month: "January", tasks: ["Dormant pruning", "Equipment maintenance", "Soil preparation"] },
    { month: "February", tasks: ["Continue pruning", "Trellis repairs", "Planning next season"] },
    { month: "March", tasks: ["Bud break monitoring", "Spray program start", "Soil cultivation"] },
    { month: "April", tasks: ["Shoot positioning", "Pest monitoring", "Fertilizer application"] },
    { month: "May", tasks: ["Canopy management", "Disease prevention", "Irrigation setup"] },
    { month: "June", tasks: ["Flower/fruit monitoring", "Spray scheduling", "Canopy thinning"] },
    { month: "July", tasks: ["Veraison tracking", "Deficit irrigation", "Harvest preparation"] },
    { month: "August", tasks: ["Sugar testing", "Bird protection", "Equipment preparation"] },
    { month: "September", tasks: ["Harvest timing", "Quality monitoring", "Post-harvest care"] },
    { month: "October", tasks: ["Harvest completion", "Leaf analysis", "Cover crop planting"] },
    { month: "November", tasks: ["Vine protection", "Soil management", "Season review"] },
    { month: "December", tasks: ["Winter preparation", "Planning meetings", "Budget review"] }
  ];

  return (
    <>
      <SEOSchema 
        type="guide"
        title="Professional Vineyard Management Guide - Modern Wine Grape Growing Techniques"
        description="Complete vineyard management system covering pruning, irrigation, pest control, and smart farming technologies for commercial grape production."
        url="/vineyard-management"
        image="https://farmai.vercel.app/og-image.png"
        guideCategory="Vineyard Management"
      />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">
            Professional Vineyard Management
          </h1>
          <p className="text-xl text-muted-foreground mb-4 max-w-3xl mx-auto">
            Comprehensive guide to modern vineyard operations, smart farming technologies, 
            and best practices for premium wine grape production
          </p>
          <div className="flex flex-wrap justify-center gap-2 text-sm">
            <Badge variant="secondary">Commercial Viticulture</Badge>
            <Badge variant="secondary">Wine Grape Production</Badge>
            <Badge variant="secondary">Smart Farming</Badge>
            <Badge variant="secondary">Precision Agriculture</Badge>
          </div>
        </div>

        {/* Core Management Areas */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">Essential Management Areas</h2>
          <div className="grid lg:grid-cols-2 gap-8">
            {managementAreas.map((area) => {
              const Icon = area.icon;
              return (
                <Card key={area.title} className="h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">{area.title}</CardTitle>
                          <CardDescription>{area.description}</CardDescription>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={area.priority === 'Critical' ? 'destructive' : area.priority === 'High' ? 'default' : 'secondary'}>
                          {area.priority}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">{area.season}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {area.practices.map((practice, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-sm text-foreground">{practice}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Smart Technologies */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">Smart Vineyard Technologies</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {smartTechnologies.map((tech) => {
              const Icon = tech.icon;
              return (
                <Card key={tech.title} className="text-center">
                  <CardHeader>
                    <Icon className="h-10 w-10 text-primary mx-auto mb-3" />
                    <CardTitle className="text-lg">{tech.title}</CardTitle>
                    <CardDescription className="text-sm">{tech.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {tech.features.map((feature, index) => (
                        <li key={index}>• {feature}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Monthly Management Calendar */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="text-2xl">Vineyard Management Calendar</CardTitle>
            <CardDescription>
              Year-round task scheduling for optimal vineyard operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {monthlyTasks.map((item) => (
                <div key={item.month} className="p-4 bg-secondary/50 rounded-lg">
                  <h4 className="font-semibold text-primary mb-2">{item.month}</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {item.tasks.map((task, index) => (
                      <li key={index} className="flex items-start gap-1">
                        <span className="text-primary">•</span>
                        {task}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics to Track */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="text-2xl">Essential Vineyard Metrics</CardTitle>
            <CardDescription>
              Key performance indicators for successful vineyard management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold text-primary">Production Metrics</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Yield per acre (tons/acre)</li>
                  <li>• Clusters per vine</li>
                  <li>• Berry weight and size</li>
                  <li>• Harvest efficiency</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-primary">Quality Indicators</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Brix (sugar content)</li>
                  <li>• pH levels</li>
                  <li>• Titratable acidity</li>
                  <li>• Phenolic maturity</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-primary">Operational Metrics</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Labor hours per acre</li>
                  <li>• Input costs per ton</li>
                  <li>• Equipment utilization</li>
                  <li>• ROI per block</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <Card className="text-center bg-primary/5 border-primary/20">
          <CardContent className="pt-8 pb-8">
            <h2 className="text-2xl font-bold text-primary mb-4">
              Optimize Your Vineyard Operations
            </h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Use FarmAI's intelligent management tools to streamline your vineyard operations. 
              Get data-driven insights, automated scheduling, and precision agriculture recommendations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="h-12">
                Try FarmAI Dashboard
              </Button>
              <Button variant="outline" size="lg" className="h-12">
                View All Calculators
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}