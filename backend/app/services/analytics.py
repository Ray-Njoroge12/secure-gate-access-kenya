from typing import List, Dict, Any, Optional
from datetime import datetime, UTC, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_, or_
from ..database import get_session
from ..models import AnalyticsEvent, PerformanceMetric, MLPrediction, Visitor, AccessCode, User
from ..config import get_settings
import json
import statistics
from collections import defaultdict

settings = get_settings()


class AnalyticsService:
    """Service for handling analytics data collection and analysis"""

    @staticmethod
    def track_event(
        event_type: str,
        event_data: Dict[str, Any],
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """Track an analytics event"""
        with get_session() as session:
            if session is not None:
                event = AnalyticsEvent(
                    event_type=event_type,
                    event_data=event_data,
                    user_id=user_id,
                    session_id=session_id,
                    ip_address=ip_address,
                    user_agent=user_agent,
                    metadata=metadata
                )
                session.add(event)
                session.flush()
                return event.id
        return ""

    @staticmethod
    def get_visitor_trends(days: int = 30) -> Dict[str, Any]:
        """Get visitor registration trends over time"""
        with get_session() as session:
            if session is None:
                return {"error": "Database not available"}

            # Calculate date range
            end_date = datetime.now(UTC)
            start_date = end_date - timedelta(days=days)

            # Query visitor registrations by day
            daily_visitors = session.query(
                func.date(Visitor.created_at).label('date'),
                func.count(Visitor.id).label('count')
            ).filter(
                Visitor.created_at >= start_date
            ).group_by(
                func.date(Visitor.created_at)
            ).order_by(
                func.date(Visitor.created_at)
            ).all()

            # Format results
            trends = []
            for row in daily_visitors:
                trends.append({
                    "date": row.date.isoformat(),
                    "visitors": row.count
                })

            # Calculate summary statistics
            total_visitors = sum(row.count for row in daily_visitors)
            avg_daily = total_visitors / max(days, len(trends))

            return {
                "trends": trends,
                "summary": {
                    "total_visitors": total_visitors,
                    "avg_daily": round(avg_daily, 2),
                    "period_days": days
                }
            }

    @staticmethod
    def get_security_metrics(days: int = 7) -> Dict[str, Any]:
        """Get security-related metrics"""
        with get_session() as session:
            if session is None:
                return {"error": "Database not available"}

            end_date = datetime.now(UTC)
            start_date = end_date - timedelta(days=days)

            # Count access code verifications by result
            verification_stats = session.query(
                AnalyticsEvent.event_data['result'].label('result'),
                func.count(AnalyticsEvent.id).label('count')
            ).filter(
                and_(
                    AnalyticsEvent.event_type == 'access_code_verification',
                    AnalyticsEvent.timestamp >= start_date
                )
            ).group_by(
                AnalyticsEvent.event_data['result']
            ).all()

            # Get failed login attempts
            failed_logins = session.query(
                func.count(AnalyticsEvent.id)
            ).filter(
                and_(
                    AnalyticsEvent.event_type == 'login_attempt',
                    AnalyticsEvent.event_data['success'].as_boolean() == False,
                    AnalyticsEvent.timestamp >= start_date
                )
            ).scalar() or 0

            # Format results
            verification_breakdown = {}
            for row in verification_stats:
                verification_breakdown[row.result] = row.count

            return {
                "verification_breakdown": verification_breakdown,
                "failed_logins": failed_logins,
                "period_days": days
            }

    @staticmethod
    def get_performance_metrics(hours: int = 24) -> Dict[str, Any]:
        """Get system performance metrics"""
        with get_session() as session:
            if session is None:
                return {"error": "Database not available"}

            end_date = datetime.now(UTC)
            start_date = end_date - timedelta(hours=hours)

            # Query performance metrics
            metrics = session.query(
                PerformanceMetric.metric_type,
                func.avg(PerformanceMetric.metric_value).label('avg_value'),
                func.min(PerformanceMetric.metric_value).label('min_value'),
                func.max(PerformanceMetric.metric_value).label('max_value')
            ).filter(
                PerformanceMetric.recorded_at >= start_date
            ).group_by(
                PerformanceMetric.metric_type
            ).all()

            # Format results
            performance_data = {}
            for row in metrics:
                performance_data[row.metric_type] = {
                    "average": round(float(row.avg_value), 2),
                    "minimum": round(float(row.min_value), 2),
                    "maximum": round(float(row.max_value), 2)
                }

            return {
                "metrics": performance_data,
                "period_hours": hours
            }

    @staticmethod
    def predict_visitor_load(date: datetime, days_ahead: int = 7) -> Dict[str, Any]:
        """Predict visitor load for future dates"""
        with get_session() as session:
            if session is None:
                return {"error": "Database not available"}

            # Get historical data for the same day of week
            target_day = date.weekday()

            # Query historical visitor data for similar days
            historical_data = session.query(
                func.date(Visitor.created_at).label('date'),
                func.count(Visitor.id).label('count')
            ).filter(
                func.extract('dow', Visitor.created_at) == target_day
            ).group_by(
                func.date(Visitor.created_at)
            ).order_by(
                func.date(Visitor.created_at).desc()
            ).limit(10).all()

            if not historical_data:
                return {"error": "Insufficient historical data"}

            # Calculate average and trend
            visitor_counts = [row.count for row in historical_data]
            avg_visitors = statistics.mean(visitor_counts)
            std_dev = statistics.stdev(visitor_counts) if len(visitor_counts) > 1 else 0

            # Simple prediction based on moving average
            prediction = avg_visitors

            return {
                "predicted_date": date.isoformat(),
                "predicted_visitors": round(prediction),
                "confidence_interval": {
                    "lower": round(max(0, prediction - std_dev)),
                    "upper": round(prediction + std_dev)
                },
                "historical_avg": round(avg_visitors, 2),
                "data_points": len(visitor_counts)
            }


class PredictiveAnalytics:
    """Service for predictive analytics and ML insights"""

    @staticmethod
    def identify_security_risks() -> Dict[str, Any]:
        """Identify potential security risks based on patterns"""
        with get_session() as session:
            if session is None:
                return {"error": "Database not available"}

            # Analyze failed access code verifications
            recent_failures = session.query(
                AnalyticsEvent.ip_address,
                func.count(AnalyticsEvent.id).label('failure_count')
            ).filter(
                and_(
                    AnalyticsEvent.event_type == 'access_code_verification',
                    AnalyticsEvent.event_data['result'].astext == 'invalid_pin',
                    AnalyticsEvent.timestamp >= datetime.now(UTC) - timedelta(hours=24)
                )
            ).group_by(
                AnalyticsEvent.ip_address
            ).having(
                func.count(AnalyticsEvent.id) >= 3
            ).all()

            # Identify suspicious patterns
            risks = []
            for row in recent_failures:
                risks.append({
                    "ip_address": row.ip_address,
                    "failure_count": row.failure_count,
                    "risk_level": "high" if row.failure_count >= 5 else "medium"
                })

            return {
                "suspicious_ips": risks,
                "total_risks": len(risks)
            }

    @staticmethod
    def optimize_guard_scheduling() -> Dict[str, Any]:
        """Optimize guard scheduling based on visitor patterns"""
        with get_session() as session:
            if session is None:
                return {"error": "Database not available"}

            # Analyze visitor patterns by hour
            hourly_patterns = session.query(
                func.extract('hour', Visitor.created_at).label('hour'),
                func.count(Visitor.id).label('visitor_count')
            ).group_by(
                func.extract('hour', Visitor.created_at)
            ).order_by(
                func.extract('hour', Visitor.created_at)
            ).all()

            # Find peak hours
            peak_hours = []
            for row in hourly_patterns:
                if row.visitor_count > statistics.mean([r.visitor_count for r in hourly_patterns]):
                    peak_hours.append(int(row.hour))

            return {
                "hourly_patterns": [{"hour": int(row.hour), "visitors": row.visitor_count} for row in hourly_patterns],
                "peak_hours": peak_hours,
                "recommended_guards": max(1, len(peak_hours) // 3)
            }


class BIReporting:
    """Business Intelligence reporting service"""

    @staticmethod
    def generate_compliance_report(period_days: int = 30) -> Dict[str, Any]:
        """Generate compliance report"""
        with get_session() as session:
            if session is None:
                return {"error": "Database not available"}

            end_date = datetime.now(UTC)
            start_date = end_date - timedelta(days=period_days)

            # Get visitor statistics
            total_visitors = session.query(func.count(Visitor.id)).filter(
                Visitor.created_at >= start_date
            ).scalar() or 0

            # Get access code statistics
            total_codes = session.query(func.count(AccessCode.id)).filter(
                AccessCode.created_at >= start_date
            ).scalar() or 0

            used_codes = session.query(func.count(AccessCode.id)).filter(
                and_(
                    AccessCode.created_at >= start_date,
                    AccessCode.used_at.isnot(None)
                )
            ).scalar() or 0

            # Calculate compliance metrics
            usage_rate = (used_codes / total_codes * 100) if total_codes > 0 else 0

            return {
                "period_days": period_days,
                "visitor_stats": {
                    "total_visitors": total_visitors,
                    "avg_daily": round(total_visitors / period_days, 2)
                },
                "access_code_stats": {
                    "total_generated": total_codes,
                    "total_used": used_codes,
                    "usage_rate": round(usage_rate, 2)
                },
                "compliance_score": round(usage_rate * 0.8 + 20, 2),  # Weighted score
                "generated_at": datetime.now(UTC).isoformat()
            }

    @staticmethod
    def create_executive_dashboard() -> Dict[str, Any]:
        """Create high-level executive dashboard data"""
        with get_session() as session:
            if session is None:
                return {"error": "Database not available"}

            # Get today's stats
            today = datetime.now(UTC).date()
            today_start = datetime.combine(today, datetime.min.time(), tzinfo=UTC)

            today_visitors = session.query(func.count(Visitor.id)).filter(
                Visitor.created_at >= today_start
            ).scalar() or 0

            # Get this week's stats
            week_start = today - timedelta(days=today.weekday())
            week_start = datetime.combine(week_start, datetime.min.time(), tzinfo=UTC)

            week_visitors = session.query(func.count(Visitor.id)).filter(
                Visitor.created_at >= week_start
            ).scalar() or 0

            # Get active access codes
            active_codes = session.query(func.count(AccessCode.id)).filter(
                and_(
                    AccessCode.expires_at > datetime.now(UTC),
                    AccessCode.used_at.is_(None)
                )
            ).scalar() or 0

            return {
                "today_visitors": today_visitors,
                "week_visitors": week_visitors,
                "active_codes": active_codes,
                "system_health": "operational",
                "last_updated": datetime.now(UTC).isoformat()
            }
