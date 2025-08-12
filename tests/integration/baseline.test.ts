import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { 
  validateTestEnvironment, 
  validateTestClients, 
  supabaseAdmin, 
  cleanupTestData,
  assertSuccess 
} from '../utils/supabase-helpers';

// Test data tracking
const testEntities: { [table: string]: string[] } = {
  residents: [],
  communities: []
};

describe('Phase 0 - Harness Baseline Tests', () => {
  
  beforeAll(async () => {
    console.log('🔧 Phase 0 - Validating test harness...');
    
    // Validate environment and clients
    validateTestEnvironment();
    validateTestClients();
    
    console.log('✅ Test harness validation completed');
  });

  afterAll(async () => {
    console.log('🧹 Phase 0 - Cleaning up test data...');
    await cleanupTestData(testEntities);
  });

  describe('Environment & Client Validation', () => {
    
    it('should have valid Supabase connection', async () => {
      const result = await supabaseAdmin.from('communities').select('count', { count: 'exact', head: true });
      
      expect(result.error).toBeNull();
      expect(result.count).toBeGreaterThanOrEqual(0);
      
      console.log(`📊 Communities table accessible, count: ${result.count}`);
    });

    it('should confirm real query builder methods exist', () => {
      const builder = supabaseAdmin.from('communities');
      
      // These should all be functions, not mocked
      expect(typeof builder.select).toBe('function');
      expect(typeof builder.insert).toBe('function');
      
      // Test chained builder (eq, order) by creating a sample query
      const query = builder.select('*');
      expect(typeof query.eq).toBe('function');
      expect(typeof query.order).toBe('function');
      
      console.log('✅ Query builder methods confirmed real (not mocked)');
    });
  });

  describe('Basic CRUD Operations', () => {
    
    it('should create a test community', async () => {
      const communityData = {
        name: `Test Community ${Date.now()}`,
        address: '123 Test Street',
        phone: '+254700000000'
      };

      const result = await supabaseAdmin
        .from('communities')
        .insert(communityData)
        .select()
        .single();

      assertSuccess(result, 'Community creation');
      
      expect(result.data).toBeDefined();
      expect(result.data.id).toBeDefined();
      expect(result.data.name).toBe(communityData.name);
      
      // Track for cleanup
      testEntities.communities.push(result.data.id);
      
      console.log(`✅ Created community: ${result.data.id}`);
    });

    it('should create a test resident', async () => {
      // Ensure we have a community to link to
      expect(testEntities.communities.length).toBeGreaterThan(0);
      const communityId = testEntities.communities[0];

      const residentData = {
        email: `test-resident-${Date.now()}@example.com`,
        phone_encrypted: Buffer.from('+254700123456'),
        unit_number: 'A101',
        community_id: communityId
      };

      const result = await supabaseAdmin
        .from('residents')
        .insert(residentData)
        .select()
        .single();

      assertSuccess(result, 'Resident creation');
      
      expect(result.data).toBeDefined();
      expect(result.data.id).toBeDefined();
      expect(result.data.email).toBe(residentData.email);
      expect(result.data.community_id).toBe(communityId);
      
      // Track for cleanup
      testEntities.residents.push(result.data.id);
      
      console.log(`✅ Created resident: ${result.data.id}`);
    });

    it('should query existing data with filtering', async () => {
      // Ensure we have test data
      expect(testEntities.residents.length).toBeGreaterThan(0);
      const residentId = testEntities.residents[0];

      const result = await supabaseAdmin
        .from('residents')
        .select('*')
        .eq('id', residentId)
        .single();

      assertSuccess(result, 'Resident query with filter');
      
      expect(result.data.id).toBe(residentId);
      
      console.log(`✅ Successfully queried resident: ${residentId}`);
    });
  });

  describe('Error Handling', () => {
    
    it('should handle invalid table gracefully', async () => {
      const result = await supabaseAdmin
        .from('nonexistent_table')
        .select('*');

      expect(result.error).toBeDefined();
      expect(result.data).toBeNull();
      
      console.log(`✅ Invalid table error handled: ${result.error?.code || 'unknown'}`);
    });

    it('should handle foreign key constraint violations', async () => {
      const residentData = {
        email: `invalid-resident-${Date.now()}@example.com`,
        phone_encrypted: Buffer.from('+254700999999'),
        unit_number: 'INVALID',
        community_id: '00000000-0000-0000-0000-000000000000' // Invalid UUID
      };

      const result = await supabaseAdmin
        .from('residents')
        .insert(residentData)
        .select()
        .single();

      expect(result.error).toBeDefined();
      expect(result.data).toBeNull();
      
      console.log(`✅ Foreign key constraint error handled: ${result.error?.code || 'unknown'}`);
    });
  });
});
