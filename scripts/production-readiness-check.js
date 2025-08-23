#!/usr/bin/env node

/**
 * Production Readiness Check Script
 * Validates that the Secure-Gate Kenya system is ready for production deployment
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ProductionReadinessChecker {
  constructor() {
    this.checks = [];
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      details: []
    };
  }

  log(level, message, details = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      details
    };
    
    console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`);
    if (details) {
      console.log(`  Details: ${JSON.stringify(details, null, 2)}`);
    }
    
    this.results.details.push(logEntry);
  }

  async runCheck(name, checkFunction) {
    try {
      this.log('info', `Running check: ${name}`);
      const result = await checkFunction();
      
      if (result.passed) {
        this.results.passed++;
        this.log('success', `✅ ${name} - PASSED`, result.details);
      } else {
        this.results.failed++;
        this.log('error', `❌ ${name} - FAILED`, result.details);
      }
      
      if (result.warnings) {
        this.results.warnings++;
        this.log('warning', `⚠️  ${name} - WARNING`, result.warnings);
      }
      
    } catch (error) {
      this.results.failed++;
      this.log('error', `❌ ${name} - ERROR`, error.message);
    }
  }

  // Check 1: Build System Validation
  async checkBuildSystem() {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const viteConfigPath = path.join(process.cwd(), 'vite.config.ts');
    
    if (!fs.existsSync(packageJsonPath) || !fs.existsSync(viteConfigPath)) {
      return { passed: false, details: 'Missing build configuration files' };
    }
    
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const requiredScripts = ['build', 'dev', 'test', 'deploy:production'];
    const missingScripts = requiredScripts.filter(script => !packageJson.scripts[script]);
    
    if (missingScripts.length > 0) {
      return { passed: false, details: `Missing scripts: ${missingScripts.join(', ')}` };
    }
    
    return { passed: true, details: 'Build system properly configured' };
  }

  // Check 2: Performance Optimization Validation
  async checkPerformanceOptimization() {
    const distPath = path.join(process.cwd(), 'dist');
    
    if (!fs.existsSync(distPath)) {
      return { passed: false, details: 'No build output found. Run npm run build first.' };
    }
    
    const assetFiles = fs.readdirSync(path.join(distPath, 'assets')).filter(f => f.endsWith('.js'));
    const indexFile = assetFiles.find(f => f.startsWith('index-'));
    
    if (!indexFile) {
      return { passed: false, details: 'Main bundle file not found' };
    }
    
    const indexPath = path.join(distPath, 'assets', indexFile);
    const stats = fs.statSync(indexPath);
    const sizeKB = Math.round(stats.size / 1024);
    
    if (sizeKB > 200) {
      return { 
        passed: false, 
        details: `Main bundle too large: ${sizeKB}KB (target: <200KB)` 
      };
    }
    
    return { 
      passed: true, 
      details: `Main bundle optimized: ${sizeKB}KB`,
      warnings: sizeKB > 150 ? `Bundle size approaching limit: ${sizeKB}KB` : null
    };
  }

  // Check 3: Security Configuration
  async checkSecurityConfiguration() {
    const checks = [];
    
    // Check for environment variables
    const requiredEnvVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missingEnvVars.length > 0) {
      checks.push(`Missing environment variables: ${missingEnvVars.join(', ')}`);
    }
    
    // Check for security headers configuration
    const vercelConfigPath = path.join(process.cwd(), 'vercel.json');
    if (fs.existsSync(vercelConfigPath)) {
      const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
      if (!vercelConfig.headers) {
        checks.push('Security headers not configured in vercel.json');
      }
    }
    
    if (checks.length > 0) {
      return { passed: false, details: checks.join('; ') };
    }
    
    return { passed: true, details: 'Security configuration validated' };
  }

  // Check 4: Testing Coverage
  async checkTestingCoverage() {
    const testFiles = [
      'tests/infrastructure',
      'tests/performance',
      'tests/ai',
      'tests/documentation',
      'tests/final'
    ];
    
    const missingTestDirs = testFiles.filter(dir => 
      !fs.existsSync(path.join(process.cwd(), dir))
    );
    
    if (missingTestDirs.length > 0) {
      return { 
        passed: false, 
        details: `Missing test directories: ${missingTestDirs.join(', ')}` 
      };
    }
    
    return { passed: true, details: 'Testing infrastructure complete' };
  }

  // Check 5: Documentation Completeness
  async checkDocumentationCompleteness() {
    const requiredDocs = [
      'README.md',
      'PERFORMANCE_OPTIMIZATION_ACHIEVEMENT.md',
      'PERFORMANCE_OPTIMIZATION_SUCCESS_REPORT.md',
      'DEPLOYMENT_GUIDE.md'
    ];
    
    const missingDocs = requiredDocs.filter(doc => 
      !fs.existsSync(path.join(process.cwd(), doc))
    );
    
    if (missingDocs.length > 0) {
      return { 
        passed: false, 
        details: `Missing documentation: ${missingDocs.join(', ')}` 
      };
    }
    
    return { passed: true, details: 'Documentation complete' };
  }

  // Check 6: CI/CD Pipeline
  async checkCICDPipeline() {
    const githubWorkflowPath = path.join(process.cwd(), '.github/workflows');
    
    if (!fs.existsSync(githubWorkflowPath)) {
      return { 
        passed: false, 
        details: 'GitHub Actions workflow directory not found' 
      };
    }
    
    const workflowFiles = fs.readdirSync(githubWorkflowPath).filter(f => f.endsWith('.yml'));
    
    if (workflowFiles.length === 0) {
      return { 
        passed: false, 
        details: 'No CI/CD workflow files found' 
      };
    }
    
    return { 
      passed: true, 
      details: `CI/CD pipeline configured with ${workflowFiles.length} workflow(s)` 
    };
  }

  // Check 7: System Architecture Validation
  async checkSystemArchitecture() {
    const srcPath = path.join(process.cwd(), 'src');
    const requiredDirectories = [
      'components',
      'pages',
      'utils',
      'hooks',
      'context'
    ];
    
    const missingDirs = requiredDirectories.filter(dir => 
      !fs.existsSync(path.join(srcPath, dir))
    );
    
    if (missingDirs.length > 0) {
      return { 
        passed: false, 
        details: `Missing architecture directories: ${missingDirs.join(', ')}` 
      };
    }
    
    // Check for optimization utilities
    const optimizationUtils = [
      'utils/performanceOptimizations.ts',
      'utils/cssOptimizations.ts',
      'utils/assetOptimizer.ts',
      'utils/runtimeOptimizations.ts'
    ];
    
    const missingUtils = optimizationUtils.filter(util => 
      !fs.existsSync(path.join(srcPath, util))
    );
    
    if (missingUtils.length > 0) {
      return { 
        passed: false, 
        details: `Missing optimization utilities: ${missingUtils.join(', ')}` 
      };
    }
    
    return { passed: true, details: 'System architecture validated' };
  }

  // Generate final report
  generateReport() {
    const totalChecks = this.results.passed + this.results.failed;
    const successRate = Math.round((this.results.passed / totalChecks) * 100);
    
    console.log('\n' + '='.repeat(80));
    console.log('🏆 PRODUCTION READINESS REPORT');
    console.log('='.repeat(80));
    console.log(`Total Checks: ${totalChecks}`);
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`⚠️  Warnings: ${this.results.warnings}`);
    console.log(`Success Rate: ${successRate}%`);
    console.log('='.repeat(80));
    
    if (this.results.failed === 0 && successRate >= 95) {
      console.log('🎉 SYSTEM 100% PRODUCTION READY! 🚀');
      console.log('✅ All critical checks passed');
      console.log('✅ Performance optimizations complete');
      console.log('✅ Security validations passed');
      console.log('✅ Ready for production deployment');
      
      process.exit(0);
    } else {
      console.log('⚠️  SYSTEM NOT READY FOR PRODUCTION');
      console.log(`❌ ${this.results.failed} critical issues need to be resolved`);
      
      if (this.results.warnings > 0) {
        console.log(`⚠️  ${this.results.warnings} warnings should be addressed`);
      }
      
      process.exit(1);
    }
  }

  // Run all production readiness checks
  async runAllChecks() {
    console.log('🔍 Starting Production Readiness Validation...\n');
    
    await this.runCheck('Build System', () => this.checkBuildSystem());
    await this.runCheck('Performance Optimization', () => this.checkPerformanceOptimization());
    await this.runCheck('Security Configuration', () => this.checkSecurityConfiguration());
    await this.runCheck('Testing Coverage', () => this.checkTestingCoverage());
    await this.runCheck('Documentation', () => this.checkDocumentationCompleteness());
    await this.runCheck('CI/CD Pipeline', () => this.checkCICDPipeline());
    await this.runCheck('System Architecture', () => this.checkSystemArchitecture());
    
    this.generateReport();
  }
}

// Run the production readiness check
const checker = new ProductionReadinessChecker();
checker.runAllChecks().catch(error => {
  console.error('Production readiness check failed:', error);
  process.exit(1);
});
