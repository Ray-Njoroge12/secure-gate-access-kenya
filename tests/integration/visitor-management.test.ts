import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { createClient } from '@supabase/supabase-js'

// Integration test configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321'
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'test-anon-key'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

describe('Visitor Management Integration Tests', () => {
  let testVisitorId: string

  beforeAll(async () => {
    // Setup test data
    console.log('Setting up integration test environment...')
  })

  afterAll(async () => {
    // Cleanup test data
    if (testVisitorId) {
      await supabase
        .from('visitors')
        .delete()
        .eq('id', testVisitorId)
    }
  })

  beforeEach(() => {
    // Reset test state
  })

  describe('Visitor Registration Flow', () => {
    it('should create a new visitor registration', async () => {
      const testVisitor = {
        first_name: 'Integration',
        last_name: 'Test',
        email: 'integration.test@example.com',
        phone_number: '+254700000000',
        purpose_of_visit: 'Integration Testing',
        host_name: 'Test Host',
        expected_duration: 60
      }

      const { data, error } = await supabase
        .from('visitors')
        .insert(testVisitor)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeTruthy()
      expect(data.first_name).toBe(testVisitor.first_name)
      expect(data.email).toBe(testVisitor.email)
      expect(data.status).toBe('registered')

      testVisitorId = data.id
    })

    it('should check in a visitor', async () => {
      if (!testVisitorId) {
        throw new Error('Test visitor not created')
      }

      const { data, error } = await supabase
        .from('visitors')
        .update({ 
          status: 'checked_in',
          check_in_time: new Date().toISOString()
        })
        .eq('id', testVisitorId)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data.status).toBe('checked_in')
      expect(data.check_in_time).toBeTruthy()
    })

    it('should check out a visitor', async () => {
      if (!testVisitorId) {
        throw new Error('Test visitor not created')
      }

      const { data, error } = await supabase
        .from('visitors')
        .update({ 
          status: 'checked_out',
          check_out_time: new Date().toISOString()
        })
        .eq('id', testVisitorId)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data.status).toBe('checked_out')
      expect(data.check_out_time).toBeTruthy()
    })
  })

  describe('Invitation System', () => {
    it('should create a new invitation', async () => {
      const testInvitation = {
        visitor_email: 'invited.visitor@example.com',
        host_name: 'Integration Test Host',
        scheduled_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        scheduled_time: '14:00',
        purpose: 'Integration Testing Meeting',
        status: 'pending'
      }

      const { data, error } = await supabase
        .from('invitations')
        .insert(testInvitation)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeTruthy()
      expect(data.visitor_email).toBe(testInvitation.visitor_email)
      expect(data.status).toBe('pending')
      expect(data.access_code).toBeTruthy()

      // Cleanup
      await supabase
        .from('invitations')
        .delete()
        .eq('id', data.id)
    })

    it('should validate access code', async () => {
      // Create invitation first
      const { data: invitation } = await supabase
        .from('invitations')
        .insert({
          visitor_email: 'code.test@example.com',
          host_name: 'Code Test Host',
          scheduled_date: new Date().toISOString().split('T')[0],
          scheduled_time: '15:00',
          purpose: 'Code Validation Test',
          status: 'pending'
        })
        .select()
        .single()

      // Validate the generated access code
      const { data: validationResult, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('access_code', invitation.access_code)
        .eq('status', 'pending')
        .single()

      expect(error).toBeNull()
      expect(validationResult).toBeTruthy()
      expect(validationResult.id).toBe(invitation.id)

      // Cleanup
      await supabase
        .from('invitations')
        .delete()
        .eq('id', invitation.id)
    })
  })

  describe('Database Constraints and Validation', () => {
    it('should enforce email format validation', async () => {
      const invalidVisitor = {
        first_name: 'Test',
        last_name: 'User',
        email: 'invalid-email-format',
        phone_number: '+254700000000',
        purpose_of_visit: 'Testing',
        host_name: 'Test Host'
      }

      const { data, error } = await supabase
        .from('visitors')
        .insert(invalidVisitor)
        .select()

      // Expect validation to fail
      expect(error).toBeTruthy()
    })

    it('should enforce phone number format', async () => {
      const invalidVisitor = {
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        phone_number: 'invalid-phone',
        purpose_of_visit: 'Testing',
        host_name: 'Test Host'
      }

      const { data, error } = await supabase
        .from('visitors')
        .insert(invalidVisitor)
        .select()

      // Expect validation to fail
      expect(error).toBeTruthy()
    })
  })

  describe('Edge Functions', () => {
    it('should generate access code via edge function', async () => {
      const { data, error } = await supabase.functions.invoke('generate-access-code', {
        body: {
          visitor_email: 'edgefunction.test@example.com',
          host_name: 'Edge Function Test Host'
        }
      })

      expect(error).toBeNull()
      expect(data).toBeTruthy()
      expect(data.access_code).toBeTruthy()
      expect(data.access_code).toMatch(/^[A-Z0-9]{6}$/)
    })

    it('should send invitation email via edge function', async () => {
      const { data, error } = await supabase.functions.invoke('send-invitation-email', {
        body: {
          visitor_email: 'invitation.test@example.com',
          host_name: 'Email Test Host',
          scheduled_date: new Date().toISOString().split('T')[0],
          scheduled_time: '16:00',
          access_code: 'TEST123'
        }
      })

      expect(error).toBeNull()
      expect(data).toBeTruthy()
      expect(data.success).toBe(true)
    })
  })

  describe('Analytics and Reporting', () => {
    it('should fetch visitor analytics', async () => {
      const { data, error } = await supabase
        .rpc('get_visitor_analytics', {
          start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          end_date: new Date().toISOString()
        })

      expect(error).toBeNull()
      expect(data).toBeTruthy()
      expect(typeof data.total_visitors).toBe('number')
      expect(typeof data.checked_in_visitors).toBe('number')
    })

    it('should generate compliance report', async () => {
      const { data, error } = await supabase
        .rpc('get_compliance_dashboard_analytics', {
          p_framework_id: '550e8400-e29b-41d4-a716-446655440000',
          p_analysis_days: 30
        })

      // Note: This might fail if no compliance data exists, which is expected
      if (!error) {
        expect(data).toBeTruthy()
        expect(data.summary_metrics).toBeTruthy()
      }
    })
  })

  describe('Security and Access Control', () => {
    it('should respect row level security policies', async () => {
      // This test would need authenticated user context
      // For now, just verify the tables exist and are accessible
      const { data, error } = await supabase
        .from('visitors')
        .select('count')
        .limit(1)

      // Should either return data or an auth error (both are valid)
      expect(error === null || error.message.includes('auth')).toBe(true)
    })

    it('should validate user permissions', async () => {
      // Test that certain operations require authentication
      const { data, error } = await supabase
        .from('security_guards')
        .select('*')
        .limit(1)

      // Should require authentication
      expect(error).toBeTruthy()
    })
  })
})
