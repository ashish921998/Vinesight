"use client";

// Google Analytics 4 configuration
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-XXXXXXXXXX';

// Google Analytics pageview tracking
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_location: url,
    });
  }
};

// Google Analytics event tracking
export const event = (
  action: string,
  {
    event_category = 'general',
    event_label,
    value,
    ...customParameters
  }: {
    event_category?: string;
    event_label?: string;
    value?: number;
    [key: string]: any;
  } = {}
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category,
      event_label,
      value,
      ...customParameters,
    });
  }
};

// Specific farm-related events
export const trackFarmEvent = (eventName: string, farmData?: any) => {
  event(eventName, {
    event_category: 'farm_management',
    event_label: farmData?.farmType || 'unknown',
    custom_parameters: {
      farm_size: farmData?.size,
      crop_type: farmData?.cropType,
    }
  });
};

export const trackCalculatorUsage = (calculatorType: string, result?: any) => {
  event('calculator_used', {
    event_category: 'tools',
    event_label: calculatorType,
    custom_parameters: {
      calculator_type: calculatorType,
      has_result: !!result
    }
  });
};

export const trackAIInteraction = (interactionType: string, queryType?: string) => {
  event('ai_interaction', {
    event_category: 'ai_assistant',
    event_label: interactionType,
    custom_parameters: {
      query_type: queryType
    }
  });
};

export const trackUserJourney = (milestone: string, userType: 'authenticated' | 'guest') => {
  event('user_journey', {
    event_category: 'engagement',
    event_label: milestone,
    custom_parameters: {
      user_type: userType
    }
  });
};

// Enhanced ecommerce events for farming tools
export const trackToolUsage = (toolName: string, success: boolean = true) => {
  event('tool_engagement', {
    event_category: 'farming_tools',
    event_label: toolName,
    value: success ? 1 : 0,
    custom_parameters: {
      tool_name: toolName,
      success_status: success
    }
  });
};

// Declare gtag function for TypeScript
declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'consent',
      targetId: string,
      config?: any
    ) => void;
  }
}