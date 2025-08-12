import { describe, it, expect, beforeAll } from 'vitest';
import { supabaseAdmin, supabaseClient } from '../utils/supabase-helpers';

describe('Debug - Client Inspection', () => {
  
  it('should inspect supabaseAdmin properties', () => {
    console.log('supabaseAdmin keys:', Object.keys(supabaseAdmin));
    console.log('supabaseAdmin type:', typeof supabaseAdmin);
    console.log('supabaseAdmin.from type:', typeof supabaseAdmin.from);
    console.log('supabaseAdmin.functions type:', typeof (supabaseAdmin as any).functions);
    console.log('supabaseAdmin.auth type:', typeof (supabaseAdmin as any).auth);
    
    // Check if it's mocked
    console.log('supabaseAdmin constructor:', supabaseAdmin.constructor.name);
  });

  it('should inspect query builder chain', () => {
    const builder = supabaseAdmin.from('communities');
    console.log('builder keys:', Object.keys(builder));
    console.log('builder.select type:', typeof builder.select);
    
    const query = builder.select('*');
    console.log('query keys:', Object.keys(query));
    console.log('query.eq type:', typeof (query as any).eq);
    console.log('query.order type:', typeof (query as any).order);
    console.log('query.limit type:', typeof (query as any).limit);
  });

  it('should test basic from operation', async () => {
    try {
      const result = await supabaseAdmin.from('communities').select('count', { count: 'exact', head: true });
      console.log('Query result:', result);
      expect(result).toBeDefined();
    } catch (err) {
      console.error('Query failed:', err);
      throw err;
    }
  });
});
