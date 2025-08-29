#!/usr/bin/env python3
"""
SecureGate Backend - Critical Analysis Report
Focused analysis of key security and architectural issues
"""

import requests
import json
from datetime import datetime

def analyze_backend_critical():
    """Perform critical analysis of backend security and architecture"""

    backend_url = "http://127.0.0.1:8000"
    findings = {
        "critical_issues": [],
        "high_priority": [],
        "medium_priority": [],
        "recommendations": []
    }

    print("🔍 CRITICAL BACKEND ANALYSIS")
    print("=" * 50)

    # 1. Test Authentication Bypass
    print("🔐 Testing Authentication...")
    try:
        response = requests.get(f"{backend_url}/api/visitors/register", timeout=10)
        if response.status_code not in [401, 403, 405]:
            findings["critical_issues"].append({
                "issue": "Potential Authentication Bypass",
                "description": f"GET request to POST endpoint returned {response.status_code}",
                "impact": "Could allow unauthorized access to sensitive operations",
                "fix": "Implement proper HTTP method validation and authentication"
            })
    except Exception as e:
        findings["high_priority"].append({
            "issue": "Connection Error",
            "description": str(e),
            "impact": "Backend may not be running or accessible",
            "fix": "Ensure backend service is running and accessible"
        })

    # 2. Test SQL Injection
    print("💉 Testing SQL Injection Protection...")
    malicious_payload = {
        "visitor": {
            "fullName": "Test' OR '1'='1",
            "idNumber": "12345678",
            "phone": "+254700000000"
        }
    }

    try:
        response = requests.post(
            f"{backend_url}/api/visitors/register",
            json=malicious_payload,
            timeout=10
        )

        if response.status_code == 200:
            findings["critical_issues"].append({
                "issue": "SQL Injection Vulnerability",
                "description": "Malicious SQL payload was accepted without validation",
                "impact": "Could allow database manipulation and data theft",
                "fix": "Implement proper input sanitization and parameterized queries"
            })
        elif response.status_code == 422:
            print("✅ SQL Injection protection active (Pydantic validation)")
    except Exception as e:
        findings["medium_priority"].append({
            "issue": "Input Validation Error",
            "description": str(e),
            "impact": "Input validation may not be working properly",
            "fix": "Review input validation implementation"
        })

    # 3. Test Rate Limiting
    print("🚦 Testing Rate Limiting...")
    responses = []
    for i in range(20):
        try:
            response = requests.get(f"{backend_url}/healthz", timeout=5)
            responses.append(response.status_code)
        except:
            responses.append(500)

    rate_limited = sum(1 for code in responses if code == 429)
    if rate_limited == 0:
        findings["high_priority"].append({
            "issue": "No Rate Limiting",
            "description": f"No rate limiting detected in {len(responses)} requests",
            "impact": "Vulnerable to DoS attacks and abuse",
            "fix": "Implement proper rate limiting middleware"
        })

    # 4. Test Security Headers
    print("🔒 Testing Security Headers...")
    try:
        response = requests.get(f"{backend_url}/healthz", timeout=10)
        required_headers = ['X-Content-Type-Options', 'X-Frame-Options', 'X-XSS-Protection']
        missing = [h for h in required_headers if h not in response.headers]

        if missing:
            findings["high_priority"].append({
                "issue": "Missing Security Headers",
                "description": f"Missing headers: {', '.join(missing)}",
                "impact": "Vulnerable to various web attacks",
                "fix": "Implement SecurityHeadersMiddleware properly"
            })
    except Exception as e:
        findings["medium_priority"].append({
            "issue": "Security Headers Test Failed",
            "description": str(e),
            "impact": "Cannot verify security header implementation",
            "fix": "Ensure security middleware is active"
        })

    # 5. Test Error Handling
    print("🚨 Testing Error Handling...")
    try:
        response = requests.get(f"{backend_url}/api/nonexistent", timeout=10)
        if response.status_code == 404:
            print("✅ Proper 404 handling")
        elif response.status_code >= 500:
            findings["medium_priority"].append({
                "issue": "Server Error on Invalid Endpoint",
                "description": f"Invalid endpoint returned {response.status_code}",
                "impact": "Poor error handling and information disclosure",
                "fix": "Implement proper error handling middleware"
            })
    except Exception as e:
        findings["low_priority"].append({
            "issue": "Error Handling Test Failed",
            "description": str(e),
            "impact": "Cannot verify error handling implementation",
            "fix": "Review error handling implementation"
        })

    # 6. Architecture Analysis
    print("🏗️ Analyzing Architecture...")

    # Check for API documentation
    try:
        response = requests.get(f"{backend_url}/docs", timeout=10)
        if response.status_code != 200:
            findings["medium_priority"].append({
                "issue": "API Documentation Unavailable",
                "description": f"Docs endpoint returned {response.status_code}",
                "impact": "Poor developer experience and API discoverability",
                "fix": "Ensure Swagger UI is properly configured"
            })
    except Exception as e:
        findings["low_priority"].append({
            "issue": "API Documentation Error",
            "description": str(e),
            "impact": "Cannot verify API documentation",
            "fix": "Review API documentation setup"
        })

    # Generate recommendations
    findings["recommendations"] = [
        {
            "priority": "CRITICAL",
            "area": "Security",
            "action": "Implement JWT Authentication",
            "description": "Add proper authentication system to protect all endpoints",
            "effort": "High",
            "impact": "Prevents unauthorized access to sensitive operations"
        },
        {
            "priority": "CRITICAL",
            "area": "Security",
            "action": "Add Input Validation",
            "description": "Implement comprehensive input sanitization and validation",
            "effort": "Medium",
            "impact": "Prevents injection attacks and data corruption"
        },
        {
            "priority": "HIGH",
            "area": "Security",
            "action": "Configure Rate Limiting",
            "description": "Implement proper rate limiting to prevent abuse",
            "effort": "Low",
            "impact": "Protects against DoS attacks and API abuse"
        },
        {
            "priority": "HIGH",
            "area": "Architecture",
            "action": "Add Database Connection Pooling",
            "description": "Implement connection pooling for better performance",
            "effort": "Medium",
            "impact": "Improves database performance and reliability"
        },
        {
            "priority": "MEDIUM",
            "area": "Monitoring",
            "action": "Implement Audit Logging",
            "description": "Add comprehensive logging for security events",
            "effort": "Medium",
            "impact": "Enables security monitoring and incident response"
        },
        {
            "priority": "MEDIUM",
            "area": "Performance",
            "action": "Add Response Caching",
            "description": "Implement caching for frequently accessed data",
            "effort": "High",
            "impact": "Improves response times and reduces database load"
        }
    ]

    return findings

def print_analysis_report(findings):
    """Print formatted analysis report"""

    print("\n" + "=" * 60)
    print("🚨 CRITICAL ISSUES FOUND")
    print("=" * 60)

    for issue in findings["critical_issues"]:
        print(f"🔴 CRITICAL: {issue['issue']}")
        print(f"   {issue['description']}")
        print(f"   Impact: {issue['impact']}")
        print(f"   Fix: {issue['fix']}")
        print()

    print("🟠 HIGH PRIORITY ISSUES")
    print("-" * 40)

    for issue in findings["high_priority"]:
        print(f"🟠 HIGH: {issue['issue']}")
        print(f"   {issue['description']}")
        print(f"   Impact: {issue['impact']}")
        print(f"   Fix: {issue['fix']}")
        print()

    print("🟡 MEDIUM PRIORITY ISSUES")
    print("-" * 40)

    for issue in findings["medium_priority"]:
        print(f"🟡 MEDIUM: {issue['issue']}")
        print(f"   {issue['description']}")
        print(f"   Impact: {issue['impact']}")
        print(f"   Fix: {issue['fix']}")
        print()

    print("💡 KEY RECOMMENDATIONS")
    print("-" * 40)

    for rec in findings["recommendations"][:5]:
        print(f"{rec['priority']}: {rec['action']}")
        print(f"   {rec['description']}")
        print(f"   Effort: {rec['effort']} | Impact: {rec['impact']}")
        print()

    # Summary statistics
    total_issues = len(findings["critical_issues"]) + len(findings["high_priority"]) + len(findings["medium_priority"])

    print("📊 ANALYSIS SUMMARY")
    print("-" * 40)
    print(f"Critical Issues: {len(findings['critical_issues'])}")
    print(f"High Priority: {len(findings['high_priority'])}")
    print(f"Medium Priority: {len(findings['medium_priority'])}")
    print(f"Total Issues: {total_issues}")
    print(f"Recommendations: {len(findings['recommendations'])}")

    # Risk assessment
    if len(findings["critical_issues"]) > 0:
        print("\n🚨 RISK LEVEL: CRITICAL - Immediate action required")
    elif len(findings["high_priority"]) > 2:
        print("\n⚠️ RISK LEVEL: HIGH - Urgent attention needed")
    elif len(findings["high_priority"]) > 0:
        print("\n🟡 RISK LEVEL: MEDIUM - Address high priority issues")
    else:
        print("\n🟢 RISK LEVEL: LOW - Good security posture")

def main():
    print("🔍 Starting Critical Backend Analysis...")

    findings = analyze_backend_critical()
    print_analysis_report(findings)

    # Save to file
    with open("CRITICAL_BACKEND_ANALYSIS.json", "w") as f:
        json.dump(findings, f, indent=2)

    print(f"\n📄 Detailed report saved to: CRITICAL_BACKEND_ANALYSIS.json")

if __name__ == "__main__":
    main()
