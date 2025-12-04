'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sprout, Menu, X, Calculator, BookOpen, ArrowRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { LoginButton } from '@/components/auth/LoginButton'
import { useRouter } from 'next/navigation'

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const router = useRouter()

  type NavItem = { name: string; href: string; icon?: LucideIcon }
  const navigation: NavItem[] = [
    { name: 'Features', href: '#features', icon: Calculator },
    { name: 'About', href: '#about', icon: BookOpen }
  ]

  const scrollToSection = (href: string) => {
    if (href.startsWith('#')) {
      const element = document.querySelector(href)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    } else {
      router.push(href)
    }
    setIsMobileMenuOpen(false)
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Sprout className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-primary">
              VineSight
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Button
                key={item.name}
                variant="ghost"
                onClick={() => scrollToSection(item.href)}
                className="text-muted-foreground hover:text-foreground font-medium"
              >
                {item.icon && <item.icon className="h-4 w-4 mr-2" />}
                {item.name}
              </Button>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <LoginButton className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg font-medium transition-all transform hover:scale-105">
              Sign In
            </LoginButton>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-background border-t border-border">
          <div className="px-4 py-6 space-y-4">
            {navigation.map((item) => (
              <Button
                key={item.name}
                variant="ghost"
                onClick={() => scrollToSection(item.href)}
                className="w-full justify-start px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-accent font-medium"
              >
                {item.icon && <item.icon className="h-5 w-5 mr-3" />}
                {item.name}
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
            ))}

            <div className="pt-4 border-t border-border">
              <LoginButton className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-lg font-medium">
                Sign In to Get Started
              </LoginButton>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
