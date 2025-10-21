'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  CreditCard, 
  Shield, 
  Users,
  CheckCircle,
  ArrowRight,
  Star,
  Zap,
  Globe,
  ShieldCheck
} from 'lucide-react';
import { businessConfigs } from '@/types/business';

export default function PlatformOverview() {
  const features = [
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Real-time Operations",
      description: "Monitor all business operations in real-time with live updates and notifications"
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: "Multi-tenant Architecture",
      description: "Support multiple businesses on a single platform with isolated data and configurations"
    },
    {
      icon: <ShieldCheck className="h-6 w-6" />,
      title: "Secure & Compliant",
      description: "Enterprise-grade security with compliance tracking for all business types"
    },
    {
      icon: <Star className="h-6 w-6" />,
      title: "Scalable Infrastructure",
      description: "Grow your business without limits with our cloud-based scalable infrastructure"
    }
  ];

  const stats = [
    { label: "Businesses Supported", value: "4+" },
    { label: "Modules Available", value: "20+" },
    { label: "Users Supported", value: "10K+" },
    { label: "Uptime", value: "99.9%" }
  ];

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Shiteni Multi-Vending Platform
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
          Transform any institution into a digital business with our comprehensive platform. 
          Manage hotels, online stores, pharmacy stores, and bus ticketing all in one place.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Badge variant="secondary" className="text-sm">
            <CheckCircle className="h-3 w-3 mr-1" />
            Multi-tenant
          </Badge>
          <Badge variant="secondary" className="text-sm">
            <CheckCircle className="h-3 w-3 mr-1" />
            Real-time
          </Badge>
          <Badge variant="secondary" className="text-sm">
            <CheckCircle className="h-3 w-3 mr-1" />
            Scalable
          </Badge>
          <Badge variant="secondary" className="text-sm">
            <CheckCircle className="h-3 w-3 mr-1" />
            Secure
          </Badge>
        </div>
      </div>

      {/* Business Types */}
      <div>
        <h2 className="text-2xl font-bold text-foreground text-center mb-8">
          Supported Business Types
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.values(businessConfigs).map((config) => (
            <Card key={config.type} className="text-center">
              <CardHeader>
                <div className={`mx-auto mb-4 ${config.color === 'primary' ? 'text-primary' : config.color === 'secondary' ? 'text-secondary' : 'text-accent'}`}>
                  {config.type === 'hotel' && <Building2 className="h-12 w-12" />}
                  {config.type === 'store' && <CreditCard className="h-12 w-12" />}
                  {config.type === 'pharmacy' && <Shield className="h-12 w-12" />}
                  {config.type === 'bus' && <Users className="h-12 w-12" />}
                </div>
                <CardTitle className="text-lg">{config.name}</CardTitle>
                <CardDescription>{config.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    {config.features.length} features • {config.modules.length} modules
                  </div>
                  <div className="flex flex-wrap gap-1 justify-center">
                    {config.features.slice(0, 2).map((feature, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Platform Features */}
      <div>
        <h2 className="text-2xl font-bold text-foreground text-center mb-8">
          Platform Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="text-primary">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Statistics */}
      <div>
        <h2 className="text-2xl font-bold text-foreground text-center mb-8">
          Platform Statistics
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="text-center">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-primary mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <Card className="text-center">
        <CardHeader>
          <CardTitle className="text-2xl">Ready to Transform Your Business?</CardTitle>
          <CardDescription className="text-lg">
            Join thousands of businesses already using Shiteni to manage their operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary/90 transition-colors">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
            <button className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors">
              Learn More
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
