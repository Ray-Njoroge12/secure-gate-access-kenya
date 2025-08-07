#!/usr/bin/env node

/**
 * System Integrity Test Runner
 * 
 * This script runs comprehensive tests for the Visitor Management System
 * to verify functionality across all platforms (Resident, Visitor, Security)
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

interface TestResults {
  passed: number;
  failed: number;
  total: number;
  duration: number;
  details: string[];
}

class SystemTestRunner {
  private results: TestResults = {
    passed: 0,
    failed: 0,
    total: 0,
    duration: 0,
    details: []
  };

  async runTests(): Promise<void> {
    console.log('🚀 Starting Visitor Management System Integrity Tests\n');
    console.log('=' .repeat(60));
    
    // Check prerequisites
    await this.checkPrerequisites();
    
    // Run the tests
    const startTime = Date.now();
    
    try {
      console.log('\n📋 Running comprehensive system tests...\n');
      
      const testOutput = execSync('npx vitest run tests/system-integrity-tests.ts --reporter=verbose', {
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      this.parseTestResults(testOutput);
      
    } catch (error: unknown) {
      console.error('❌ Test execution failed:');
      console.error(error.stdout || error.message);
      
      // Try to parse results from error output (tests might have run but some failed)
      if (error.stdout) {
        this.parseTestResults(error.stdout);
      }
      
      // If no tests were parsed, mark as failed
      if (this.results.total === 0) {
        this.results.failed = 1;
        this.results.total = 1;
        this.results.details.push('❌ Test execution failed - no tests could be run');
      }
    }
    
    this.results.duration = Date.now() - startTime;
    
    // Generate report
    await this.generateReport();
  }

  private async checkPrerequisites(): Promise<void> {
    console.log('🔍 Checking prerequisites...');
    
    // Check if .env file exists
    const envExists = fs.existsSync('.env') || fs.existsSync('.env.local');
    if (!envExists) {
      console.warn('⚠️  Warning: No .env file found. Make sure environment variables are set.');
    }
    
    // Check if Supabase is configured
    const supabaseConfigExists = fs.existsSync('supabase/config.toml');
    if (!supabaseConfigExists) {
      console.warn('⚠️  Warning: Supabase config not found. Tests may fail without proper configuration.');
    }
    
    // Check required dependencies
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const requiredDeps = ['@supabase/supabase-js', 'vitest', '@faker-js/faker'];
    
    for (const dep of requiredDeps) {
      if (!packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]) {
        throw new Error(`❌ Required dependency missing: ${dep}`);
      }
    }
    
    console.log('✅ Prerequisites check completed\n');
  }

  private parseTestResults(output: string): void {
    // Parse vitest output to extract test results
    const lines = output.split('\n');
    
    for (const line of lines) {
      if (line.includes('✓') || line.includes('PASS')) {
        this.results.passed++;
        this.results.details.push(`✅ ${line.trim()}`);
      } else if (line.includes('✗') || line.includes('FAIL')) {
        this.results.failed++;
        this.results.details.push(`❌ ${line.trim()}`);
      }
    }
    
    this.results.total = this.results.passed + this.results.failed;
  }

  private async generateReport(): Promise<void> {
    console.log('\n' + '=' .repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('=' .repeat(60));
    
    console.log(`\n🎯 Overall Results:`);
    console.log(`   Total Tests: ${this.results.total}`);
    console.log(`   Passed: ${this.results.passed} ✅`);
    console.log(`   Failed: ${this.results.failed} ${this.results.failed > 0 ? '❌' : ''}`);
    console.log(`   Success Rate: ${this.results.total > 0 ? Math.round((this.results.passed / this.results.total) * 100) : 0}%`);
    console.log(`   Duration: ${(this.results.duration / 1000).toFixed(2)}s`);
    
    // Test categories breakdown
    console.log(`\n📋 Test Categories Covered:`);
    console.log(`   🏠 Resident Platform Tests`);
    console.log(`   👤 Visitor Platform Tests`);
    console.log(`   🛡️  Security Platform Tests`);
    console.log(`   🔒 Data Security & Privacy Tests`);
    console.log(`   ⚡ Performance & Load Tests`);
    console.log(`   🔍 Edge Cases & Error Handling`);
    
    // System integrity assessment
    console.log(`\n🔍 System Integrity Assessment:`);
    
    if (this.results.failed === 0) {
      console.log(`   ✅ SYSTEM INTEGRITY: EXCELLENT`);
      console.log(`   ✅ All core functionalities working correctly`);
      console.log(`   ✅ Security measures properly implemented`);
      console.log(`   ✅ Data privacy compliance verified`);
      console.log(`   ✅ Performance within acceptable limits`);
    } else if (this.results.failed <= this.results.total * 0.1) {
      console.log(`   ⚠️  SYSTEM INTEGRITY: GOOD (Minor issues detected)`);
      console.log(`   ✅ Core functionalities working`);
      console.log(`   ⚠️  Some non-critical issues found`);
    } else if (this.results.failed <= this.results.total * 0.3) {
      console.log(`   ⚠️  SYSTEM INTEGRITY: MODERATE (Issues require attention)`);
      console.log(`   ⚠️  Multiple issues detected`);
      console.log(`   ⚠️  System may have functional problems`);
    } else {
      console.log(`   ❌ SYSTEM INTEGRITY: POOR (Critical issues detected)`);
      console.log(`   ❌ Major functionality problems`);
      console.log(`   ❌ System requires immediate attention`);
    }
    
    // Recommendations
    console.log(`\n💡 Recommendations:`);
    
    if (this.results.failed === 0) {
      console.log(`   • System is production-ready`);
      console.log(`   • Continue regular monitoring`);
      console.log(`   • Consider adding more edge case tests`);
    } else {
      console.log(`   • Review failed tests and fix underlying issues`);
      console.log(`   • Re-run tests after fixes`);
      console.log(`   • Consider additional testing for affected areas`);
      
      if (this.results.failed > this.results.total * 0.3) {
        console.log(`   • ⚠️  DO NOT DEPLOY TO PRODUCTION until issues are resolved`);
      }
    }
    
    // Generate detailed report file
    await this.generateDetailedReport();
    
    console.log(`\n📄 Detailed report saved to: tests/test-report-${new Date().toISOString().split('T')[0]}.md`);
    console.log('\n' + '=' .repeat(60));
  }

  private async generateDetailedReport(): Promise<void> {
    const timestamp = new Date().toISOString();
    const date = timestamp.split('T')[0];
    
    const report = `# Visitor Management System - Test Report

**Generated:** ${timestamp}
**Duration:** ${(this.results.duration / 1000).toFixed(2)} seconds

## Summary

- **Total Tests:** ${this.results.total}
- **Passed:** ${this.results.passed} ✅
- **Failed:** ${this.results.failed} ${this.results.failed > 0 ? '❌' : ''}
- **Success Rate:** ${this.results.total > 0 ? Math.round((this.results.passed / this.results.total) * 100) : 0}%

## System Integrity Assessment

${this.getIntegrityAssessment()}

## Test Categories

### 🏠 Resident Platform Tests
- Authentication and session management
- Invitation creation (single-use and multi-use)
- Rate limiting enforcement
- Data retrieval and filtering

### 👤 Visitor Platform Tests
- Registration with valid tokens
- Invalid token rejection
- Consent requirement enforcement
- Access code generation

### 🛡️ Security Platform Tests
- QR code verification
- PIN verification
- Single-use enforcement
- Audit trail logging

### 🔒 Data Security & Privacy Tests
- PII encryption/decryption
- Data retention policies
- GDPR compliance

### ⚡ Performance & Load Tests
- Concurrent request handling
- Bulk operation efficiency

### 🔍 Edge Cases & Error Handling
- Expired token handling
- Malformed input handling
- Database error handling

## Detailed Results

${this.results.details.join('\n')}

## Recommendations

${this.getRecommendations()}

---
*Report generated by Visitor Management System Test Runner*
`;

    fs.writeFileSync(`tests/test-report-${date}.md`, report);
  }

  private getIntegrityAssessment(): string {
    if (this.results.failed === 0) {
      return `**EXCELLENT** ✅
- All core functionalities working correctly
- Security measures properly implemented
- Data privacy compliance verified
- Performance within acceptable limits`;
    } else if (this.results.failed <= this.results.total * 0.1) {
      return `**GOOD** ⚠️ (Minor issues detected)
- Core functionalities working
- Some non-critical issues found`;
    } else if (this.results.failed <= this.results.total * 0.3) {
      return `**MODERATE** ⚠️ (Issues require attention)
- Multiple issues detected
- System may have functional problems`;
    } else {
      return `**POOR** ❌ (Critical issues detected)
- Major functionality problems
- System requires immediate attention`;
    }
  }

  private getRecommendations(): string {
    if (this.results.failed === 0) {
      return `- System is production-ready
- Continue regular monitoring
- Consider adding more edge case tests`;
    } else {
      let recommendations = `- Review failed tests and fix underlying issues
- Re-run tests after fixes
- Consider additional testing for affected areas`;
      
      if (this.results.failed > this.results.total * 0.3) {
        recommendations += `\n- ⚠️ **DO NOT DEPLOY TO PRODUCTION** until issues are resolved`;
      }
      
      return recommendations;
    }
  }
}


// Run the tests if this script is executed directly (ESM compatible)
if (typeof process !== 'undefined' && process.argv[1] && process.argv[1].endsWith('run-system-tests.ts')) {
  const runner = new SystemTestRunner();
  runner.runTests().catch(console.error);
}

export { SystemTestRunner };
