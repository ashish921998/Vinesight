import { NextRequest, NextResponse } from 'next/server'
import { globalRateLimiter, generateCSRFToken } from './validation'

export interface SecurityCheckResult {
  allowed: boolean
  error?: string
  status?: number
}

export class SecurityService {
  /**
   * Comprehensive security check for API routes
   */
  static checkAPIRequest(request: NextRequest, options: {
    requireAuth?: boolean
    allowedMethods?: string[]
    maxPayloadSize?: number
    requireCSRF?: boolean
  } = {}): SecurityCheckResult {
    
    const { 
      requireAuth = false, 
      allowedMethods = ['GET', 'POST', 'PUT', 'DELETE'],
      maxPayloadSize = 10000, // 10KB
      requireCSRF = false 
    } = options
    
    // Method validation
    if (!allowedMethods.includes(request.method)) {
      return { 
        allowed: false, 
        error: 'Method not allowed', 
        status: 405 
      }
    }

    // Rate limiting with IP detection
    const clientIP = this.getClientIP(request)
    const authHeader = request.headers.get('authorization')
    const isAuthenticated = !!authHeader
    
    const rateLimitResult = globalRateLimiter.checkLimit(`api-${clientIP}`, isAuthenticated)
    if (!rateLimitResult.allowed) {
      return { 
        allowed: false, 
        error: rateLimitResult.reason || 'Rate limit exceeded', 
        status: 429 
      }
    }

    // Authentication check
    if (requireAuth && !isAuthenticated) {
      return { 
        allowed: false, 
        error: 'Authentication required', 
        status: 401 
      }
    }

    // Content-Type validation for POST/PUT requests
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      const contentType = request.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        return { 
          allowed: false, 
          error: 'Invalid content type. Expected application/json', 
          status: 400 
        }
      }
    }

    // CSRF protection check
    if (requireCSRF && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
      const csrfToken = request.headers.get('x-csrf-token')
      const sessionCSRF = request.headers.get('x-session-csrf')
      
      if (!csrfToken || !sessionCSRF || csrfToken !== sessionCSRF) {
        return { 
          allowed: false, 
          error: 'CSRF token validation failed', 
          status: 403 
        }
      }
    }

    // Additional security headers check
    const userAgent = request.headers.get('user-agent')
    if (!userAgent || userAgent.length < 10) {
      // Potential bot/malicious request
      return { 
        allowed: false, 
        error: 'Invalid request', 
        status: 400 
      }
    }

    return { allowed: true }
  }

  /**
   * Validate JSON payload with security checks
   */
  static async validatePayload(request: NextRequest, maxSize: number = 10000): Promise<{
    success: boolean
    data?: any
    error?: string
    status?: number
  }> {
    try {
      // Read the body
      const text = await request.text()
      
      // Check payload size
      if (text.length > maxSize) {
        return { 
          success: false, 
          error: 'Payload too large', 
          status: 413 
        }
      }

      // Check for common attack patterns
      if (this.containsSuspiciousContent(text)) {
        return { 
          success: false, 
          error: 'Suspicious content detected', 
          status: 400 
        }
      }

      // Parse JSON
      const data = JSON.parse(text)
      
      // Check for prototype pollution attempts
      if (this.hasPrototypePollution(data)) {
        return { 
          success: false, 
          error: 'Invalid payload structure', 
          status: 400 
        }
      }

      return { success: true, data }
    } catch (error) {
      return { 
        success: false, 
        error: 'Invalid JSON payload', 
        status: 400 
      }
    }
  }

  /**
   * Get client IP address from various headers
   */
  static getClientIP(request: NextRequest): string {
    const forwardedFor = request.headers.get('x-forwarded-for')
    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim()
    }
    
    return request.headers.get('x-real-ip') || 
           'anonymous'
  }

  /**
   * Check for suspicious content patterns
   */
  private static containsSuspiciousContent(text: string): boolean {
    const suspiciousPatterns = [
      /\b(eval|setTimeout|setInterval)\s*\(/i,
      /<script[\s\S]*?>/i,
      /javascript:/i,
      /data:text\/html/i,
      /(union|select|insert|update|delete|drop)\s+/i,
      /(\$\{|\$\(|\{\{)/,  // Template injection patterns
      /__proto__|constructor\.prototype|prototype\.constructor/i
    ]
    
    return suspiciousPatterns.some(pattern => pattern.test(text))
  }

  /**
   * Check for prototype pollution attempts
   */
  private static hasPrototypePollution(obj: any): boolean {
    if (!obj || typeof obj !== 'object') return false
    
    const dangerousKeys = ['__proto__', 'constructor', 'prototype']
    const keys = Object.keys(obj)
    
    if (keys.some(key => dangerousKeys.includes(key.toLowerCase()))) {
      return true
    }
    
    // Recursively check nested objects
    return keys.some(key => this.hasPrototypePollution(obj[key]))
  }

  /**
   * Generate secure response headers
   */
  static getSecureHeaders(): Record<string, string> {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Cache-Control': 'no-store, must-revalidate',
      'Pragma': 'no-cache'
    }
  }

  /**
   * Create a secure error response
   */
  static createErrorResponse(message: string, status: number = 400): NextResponse {
    const headers = this.getSecureHeaders()
    return NextResponse.json(
      { error: message, timestamp: new Date().toISOString() },
      { status, headers }
    )
  }

  /**
   * Create a secure success response
   */
  static createSuccessResponse(data: any, status: number = 200): NextResponse {
    const headers = this.getSecureHeaders()
    return NextResponse.json(data, { status, headers })
  }
}