// Pagination utilities and types
export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export class PaginationHelper {
  static getOffset(page: number, pageSize: number): number {
    return (page - 1) * pageSize;
  }

  static createResult<T>(
    data: T[],
    totalCount: number,
    params: PaginationParams
  ): PaginatedResult<T> {
    const totalPages = Math.ceil(totalCount / params.pageSize);
    
    return {
      data,
      totalCount,
      totalPages,
      currentPage: params.page,
      pageSize: params.pageSize,
      hasNextPage: params.page < totalPages,
      hasPrevPage: params.page > 1
    };
  }

  static validateParams(params: Partial<PaginationParams>): PaginationParams {
    return {
      page: Math.max(1, params.page || 1),
      pageSize: Math.min(100, Math.max(1, params.pageSize || 25)),
      sortBy: params.sortBy || 'created_at',
      sortOrder: params.sortOrder || 'desc'
    };
  }
}

// React hook for pagination
import { useState, useMemo } from 'react';

export function usePagination(initialParams?: Partial<PaginationParams>) {
  const [params, setParams] = useState<PaginationParams>(() => 
    PaginationHelper.validateParams(initialParams || {})
  );

  const updatePage = (page: number) => {
    setParams(prev => ({ ...prev, page: Math.max(1, page) }));
  };

  const updatePageSize = (pageSize: number) => {
    setParams(prev => ({ 
      ...prev, 
      pageSize: Math.min(100, Math.max(1, pageSize)),
      page: 1 // Reset to first page when page size changes
    }));
  };

  const updateSort = (sortBy: string, sortOrder?: 'asc' | 'desc') => {
    setParams(prev => ({
      ...prev,
      sortBy,
      sortOrder: sortOrder || (prev.sortBy === sortBy && prev.sortOrder === 'asc' ? 'desc' : 'asc'),
      page: 1 // Reset to first page when sort changes
    }));
  };

  const reset = () => {
    setParams(PaginationHelper.validateParams(initialParams || {}));
  };

  const queryString = useMemo(() => {
    const searchParams = new URLSearchParams();
    searchParams.set('page', params.page.toString());
    searchParams.set('pageSize', params.pageSize.toString());
    if (params.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);
    return searchParams.toString();
  }, [params]);

  return {
    params,
    queryString,
    updatePage,
    updatePageSize,
    updateSort,
    reset
  };
}

// Database query builders with pagination
export class PaginatedQueries {
  static async getFarms(
    supabase: any,
    params: PaginationParams,
    userId?: string
  ): Promise<PaginatedResult<any>> {
    let query = supabase.from('farms').select('*', { count: 'exact' });
    
    if (userId) {
      query = query.eq('user_id', userId);
    }

    // Add sorting
    query = query.order(params.sortBy || 'created_at', { 
      ascending: params.sortOrder === 'asc' 
    });

    // Add pagination
    const offset = PaginationHelper.getOffset(params.page, params.pageSize);
    query = query.range(offset, offset + params.pageSize - 1);

    const { data, count, error } = await query;

    if (error) throw error;

    return PaginationHelper.createResult(data || [], count || 0, params);
  }

  static async getIrrigationRecords(
    supabase: any,
    farmId: number,
    params: PaginationParams
  ): Promise<PaginatedResult<any>> {
    let query = supabase
      .from('irrigation_records')
      .select('*', { count: 'exact' })
      .eq('farm_id', farmId);

    // Add sorting
    query = query.order(params.sortBy || 'date', { 
      ascending: params.sortOrder === 'asc' 
    });

    // Add pagination
    const offset = PaginationHelper.getOffset(params.page, params.pageSize);
    query = query.range(offset, offset + params.pageSize - 1);

    const { data, count, error } = await query;

    if (error) throw error;

    return PaginationHelper.createResult(data || [], count || 0, params);
  }

  static async getSprayRecords(
    supabase: any,
    farmId: number,
    params: PaginationParams
  ): Promise<PaginatedResult<any>> {
    let query = supabase
      .from('spray_records')
      .select('*', { count: 'exact' })
      .eq('farm_id', farmId);

    query = query.order(params.sortBy || 'date', { 
      ascending: params.sortOrder === 'asc' 
    });

    const offset = PaginationHelper.getOffset(params.page, params.pageSize);
    query = query.range(offset, offset + params.pageSize - 1);

    const { data, count, error } = await query;

    if (error) throw error;

    return PaginationHelper.createResult(data || [], count || 0, params);
  }

  static async getHarvestRecords(
    supabase: any,
    farmId: number,
    params: PaginationParams
  ): Promise<PaginatedResult<any>> {
    let query = supabase
      .from('harvest_records')
      .select('*', { count: 'exact' })
      .eq('farm_id', farmId);

    query = query.order(params.sortBy || 'date', { 
      ascending: params.sortOrder === 'asc' 
    });

    const offset = PaginationHelper.getOffset(params.page, params.pageSize);
    query = query.range(offset, offset + params.pageSize - 1);

    const { data, count, error } = await query;

    if (error) throw error;

    return PaginationHelper.createResult(data || [], count || 0, params);
  }

  static async getTaskReminders(
    supabase: any,
    farmId: number,
    params: PaginationParams,
    filters?: {
      completed?: boolean;
      priority?: 'low' | 'medium' | 'high';
      type?: string;
    }
  ): Promise<PaginatedResult<any>> {
    let query = supabase
      .from('task_reminders')
      .select('*', { count: 'exact' })
      .eq('farm_id', farmId);

    // Apply filters
    if (filters?.completed !== undefined) {
      query = query.eq('completed', filters.completed);
    }
    if (filters?.priority) {
      query = query.eq('priority', filters.priority);
    }
    if (filters?.type) {
      query = query.eq('type', filters.type);
    }

    query = query.order(params.sortBy || 'due_date', { 
      ascending: params.sortOrder === 'asc' 
    });

    const offset = PaginationHelper.getOffset(params.page, params.pageSize);
    query = query.range(offset, offset + params.pageSize - 1);

    const { data, count, error } = await query;

    if (error) throw error;

    return PaginationHelper.createResult(data || [], count || 0, params);
  }
}