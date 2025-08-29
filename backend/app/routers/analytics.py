from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_, or_
from datetime import datetime, timedelta, UTC
from typing import List, Optional
from pydantic import BaseModel
from ..database import get_session
from ..models import User, Profile, Visitor, AccessCode
from ..dependencies import UserWithProfile, get_current_user_with_profile, require_guard_minimum
from ..config import get_settings
from ..services.analytics import AnalyticsService, PredictiveAnalytics, BIReporting

router = APIRouter(prefix="/analytics", tags=["analytics"])
settings = get_settings()


class AnalyticsSummary(BaseModel):
    totalInvitations: int
    activeInvitations: int
    completedVisits: int
    averageVisitDuration: str
    weeklyGrowth: float
    monthlyGrowth: float
    peakHours: List[dict]
    popularPurposes: List[dict]
    securityIncidents: int


class TimeBasedData(BaseModel):
    date: str
    invitations: int
    visits: int
    incidents: int


class DashboardAnalytics(BaseModel):
    summary: AnalyticsSummary
    timeBasedData: List[TimeBasedData]


@router.get("/dashboard", response_model=DashboardAnalytics)
async def get_dashboard_analytics(
    period: str = Query("week", description="Time period: week, month, quarter"),
    current_user: UserWithProfile = Depends(get_current_user_with_profile),
    session: Session = Depends(get_session)
):
    """Get comprehensive dashboard analytics"""

    # Role-based access control - all authenticated users can view analytics
    # but data scope may vary based on role

    now = datetime.now(UTC)
    if period == 'week':
        start_date = now - timedelta(days=7)
    elif period == 'month':
        start_date = now - timedelta(days=30)
    elif period == 'quarter':
        start_date = now - timedelta(days=90)
    else:
        start_date = now - timedelta(days=7)

    # Get visitor and access code statistics
    total_visitors = session.query(func.count(Visitor.id)).filter(
        Visitor.created_at >= start_date
    ).scalar() or 0

    active_codes = session.query(func.count(AccessCode.id)).filter(
        and_(
            AccessCode.created_at >= start_date,
            AccessCode.expires_at > now
        )
    ).scalar() or 0

    used_codes = session.query(func.count(AccessCode.id)).filter(
        and_(
            AccessCode.created_at >= start_date,
            AccessCode.used_at.isnot(None)
        )
    ).scalar() or 0

    # Generate time-based data (last 7 days)
    time_based_data = []
    for i in range(7):
        date = (now - timedelta(days=i)).date()
        day_start = datetime.combine(date, datetime.min.time(), tzinfo=UTC)
        day_end = datetime.combine(date, datetime.max.time(), tzinfo=UTC)

        day_visitors = session.query(func.count(Visitor.id)).filter(
            and_(Visitor.created_at >= day_start, Visitor.created_at <= day_end)
        ).scalar() or 0

        day_used_codes = session.query(func.count(AccessCode.id)).filter(
            and_(
                AccessCode.used_at.isnot(None),
                AccessCode.used_at >= day_start,
                AccessCode.used_at <= day_end
            )
        ).scalar() or 0

        time_based_data.append({
            "date": date.isoformat(),
            "invitations": day_visitors,
            "visits": day_used_codes,
            "incidents": 0  # Placeholder for security incidents
        })

    # Mock data for peak hours and popular purposes (would be calculated from real data)
    peak_hours = [
        {"hour": 9, "count": 12},
        {"hour": 10, "count": 15},
        {"hour": 14, "count": 10},
        {"hour": 16, "count": 8},
        {"hour": 17, "count": 6}
    ]

    popular_purposes = [
        {"purpose": "Social Visit", "count": 25},
        {"purpose": "Business Meeting", "count": 18},
        {"purpose": "Maintenance", "count": 12},
        {"purpose": "Delivery", "count": 8},
        {"purpose": "Other", "count": 5}
    ]

    summary = AnalyticsSummary(
        totalInvitations=total_visitors,
        activeInvitations=active_codes,
        completedVisits=used_codes,
        averageVisitDuration="2.5 hours",
        weeklyGrowth=12.5,
        monthlyGrowth=8.3,
        peakHours=peak_hours,
        popularPurposes=popular_purposes,
        securityIncidents=2
    )

    return DashboardAnalytics(
        summary=summary,
        timeBasedData=time_based_data[::-1]  # Reverse to show chronological order
    )


@router.get("/visitors")
async def get_visitors_analytics(
    start_date: Optional[str] = None,
    current_user: UserWithProfile = Depends(get_current_user_with_profile),
    session: Session = Depends(get_session)
):
    """Get visitor analytics data"""
    # Implementation would go here
    return {"message": "Visitors analytics endpoint - TODO"}


@router.get("/access-codes")
async def get_access_codes_analytics(
    start_date: Optional[str] = None,
    current_user: UserWithProfile = Depends(get_current_user_with_profile),
    session: Session = Depends(get_session)
):
    """Get access codes analytics data"""
    # Implementation would go here
    return {"message": "Access codes analytics endpoint - TODO"}


@router.get("/security-incidents")
async def get_security_incidents_analytics(
    start_date: Optional[str] = None,
    current_user: UserWithProfile = Depends(get_current_user_with_profile),
    session: Session = Depends(get_session)
):
    """Get security incidents analytics data"""
    # Implementation would go here
    return {"message": "Security incidents analytics endpoint - TODO"}


@router.get("/visitor-trends")
async def get_visitor_trends(
    days: int = Query(30, description="Number of days to analyze"),
    current_user: UserWithProfile = Depends(get_current_user_with_profile),
    session: Session = Depends(get_session)
):
    """Get visitor trends and patterns"""
    analytics_service = AnalyticsService(session)
    return await analytics_service.get_visitor_trends(days)


@router.get("/security-metrics")
async def get_security_metrics(
    days: int = Query(30, description="Number of days to analyze"),
    current_user: UserWithProfile = Depends(get_current_user_with_profile),
    session: Session = Depends(get_session)
):
    """Get security metrics and incident analysis"""
    analytics_service = AnalyticsService(session)
    return await analytics_service.get_security_metrics(days)


@router.get("/performance-metrics")
async def get_performance_metrics(
    days: int = Query(30, description="Number of days to analyze"),
    current_user: UserWithProfile = Depends(get_current_user_with_profile),
    session: Session = Depends(get_session)
):
    """Get system performance metrics"""
    analytics_service = AnalyticsService(session)
    return await analytics_service.get_performance_metrics(days)


@router.get("/predict/visitor-load")
async def predict_visitor_load(
    days_ahead: int = Query(7, description="Number of days to predict"),
    current_user: UserWithProfile = Depends(get_current_user_with_profile),
    session: Session = Depends(get_session)
):
    """Predict visitor load for upcoming days"""
    predictive_analytics = PredictiveAnalytics(session)
    return await predictive_analytics.predict_visitor_load(days_ahead)


@router.get("/predict/security-risks")
async def identify_security_risks(
    days: int = Query(30, description="Number of days to analyze"),
    current_user: UserWithProfile = Depends(get_current_user_with_profile),
    session: Session = Depends(get_session)
):
    """Identify potential security risks"""
    predictive_analytics = PredictiveAnalytics(session)
    return await predictive_analytics.identify_security_risks(days)


@router.get("/predict/guard-scheduling")
async def optimize_guard_scheduling(
    days: int = Query(7, description="Number of days to optimize"),
    current_user: UserWithProfile = Depends(get_current_user_with_profile),
    session: Session = Depends(get_session)
):
    """Optimize guard scheduling based on predicted patterns"""
    predictive_analytics = PredictiveAnalytics(session)
    return await predictive_analytics.optimize_guard_scheduling(days)


@router.get("/reports/compliance")
async def generate_compliance_report(
    report_type: str = Query("monthly", description="Report type: daily, weekly, monthly, quarterly"),
    current_user: UserWithProfile = Depends(get_current_user_with_profile),
    session: Session = Depends(get_session)
):
    """Generate compliance report"""
    bi_reporting = BIReporting(session)
    return await bi_reporting.generate_compliance_report(report_type)


@router.get("/reports/executive-dashboard")
async def create_executive_dashboard(
    current_user: UserWithProfile = Depends(get_current_user_with_profile),
    session: Session = Depends(get_session)
):
    """Create executive dashboard with key metrics"""
    bi_reporting = BIReporting(session)
    return await bi_reporting.create_executive_dashboard()


@router.post("/events/track")
async def track_analytics_event(
    event_type: str = Query(..., description="Type of event to track"),
    event_data: dict = None,
    current_user: UserWithProfile = Depends(get_current_user_with_profile),
    session: Session = Depends(get_session)
):
    """Track analytics event"""
    analytics_service = AnalyticsService(session)
    return await analytics_service.track_event(
        event_type=event_type,
        user_id=current_user.user.id,
        event_data=event_data or {}
    )
