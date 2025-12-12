'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sprout, Menu, X, Calculator, BookOpen, ArrowRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { LoginButton } from '@/components/auth/LoginButton'
import { useRouter } from 'next/navigation'
import posthog from 'posthog-js'

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const router = useRouter()

  type NavItem = { name: string; href: string; icon?: LucideIcon }
  const navigation: NavItem[] = [
    { name: 'Features', href: '#features', icon: Calculator },
    { name: 'About', href: '#about', icon: BookOpen }
  ]

  const scrollToSection = (href: string, name: string) => {
    posthog.capture('navbar_link_clicked', { href: href, section_name: name })
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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <Sprout className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              VineSight
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={() => scrollToSection(item.href, item.name)}
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors flex items-center gap-2"
              >
                {item.icon && <item.icon className="h-4 w-4" />}
                {item.name}
              </button>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <LoginButton className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-2 rounded-lg font-medium transition-all transform hover:scale-105">
              Sign In
            </LoginButton>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                posthog.capture('mobile_menu_toggled', { open: !isMobileMenuOpen })
                setIsMobileMenuOpen(!isMobileMenuOpen)
              }}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-4 py-6 space-y-4">
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={() => scrollToSection(item.href, item.name)}
                className="block w-full text-left px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg font-medium transition-colors flex items-center gap-3"
              >
                {item.icon && <item.icon className="h-5 w-5" />}
                {item.name}
                <ArrowRight className="h-4 w-4 ml-auto" />
              </button>
            ))}

            <div className="pt-4 border-t border-gray-200">
              <LoginButton className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-3 rounded-lg font-medium">
                Sign In to Get Started
              </LoginButton>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
