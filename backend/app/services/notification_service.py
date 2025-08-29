"""
Notification Service for Security Guard Operations
Handles real-time alerts, push notifications, and multi-channel communication.
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from sqlalchemy import func, and_, or_, desc
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models import (
    Profile, AccessCode, Invitation, AnalyticsEvent,
    SecurityIncident, VisitorLog, NotificationLog
)


logger = logging.getLogger(__name__)


class NotificationType(Enum):
    ALERT = "alert"
    INCIDENT = "incident"
    SYSTEM = "system"
    SECURITY = "security"
    MAINTENANCE = "maintenance"


class NotificationChannel(Enum):
    IN_APP = "in_app"
    EMAIL = "email"
    SMS = "sms"
    PUSH = "push"
    WEBHOOK = "webhook"


class NotificationPriority(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


@dataclass
class NotificationMessage:
    id: Optional[int]
    type: NotificationType
    priority: NotificationPriority
    title: str
    message: str
    recipient_id: str
    recipient_email: Optional[str]
    channels: List[NotificationChannel]
    data: Optional[Dict[str, Any]]
    scheduled_for: Optional[datetime]
    expires_at: Optional[datetime]
    created_at: datetime
    sent_at: Optional[datetime]
    read_at: Optional[datetime]
    status: str


@dataclass
class NotificationResult:
    success: bool
    channel: NotificationChannel
    message_id: Optional[str]
    error: Optional[str]
    sent_at: datetime


class NotificationService:
    """Service for handling multi-channel notifications"""

    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.notification_queue: asyncio.Queue = asyncio.Queue()
        self.worker_task: Optional[asyncio.Task] = None
        self.smtp_server = "smtp.gmail.com"  # Configure as needed
        self.smtp_port = 587
        self.smtp_username = None  # Set from environment
        self.smtp_password = None  # Set from environment

    async def start_notification_worker(self):
        """Start the notification processing worker"""
        if self.worker_task and not self.worker_task.done():
            return

        self.worker_task = asyncio.create_task(self._notification_worker())
        self.logger.info("Notification worker started")

    async def stop_notification_worker(self):
        """Stop the notification processing worker"""
        if self.worker_task:
            self.worker_task.cancel()
            try:
                await self.worker_task
            except asyncio.CancelledError:
                pass
        self.logger.info("Notification worker stopped")

    async def _notification_worker(self):
        """Background worker for processing notifications"""
        while True:
            try:
                notification_data = await self.notification_queue.get()
                await self._process_notification(notification_data)
                self.notification_queue.task_done()
            except Exception as e:
                self.logger.error(f"Error in notification worker: {e}")
                await asyncio.sleep(1)

    async def _process_notification(self, notification_data: Dict[str, Any]):
        """Process a single notification"""
        try:
            notification_id = notification_data.get('id')
            channels = notification_data.get('channels', [])

            results = []
            for channel in channels:
                try:
                    channel_enum = NotificationChannel(channel)
                    result = await self._send_to_channel(notification_id, channel_enum)
                    results.append(result)
                except Exception as e:
                    self.logger.error(f"Failed to send notification {notification_id} via {channel}: {e}")
                    results.append(NotificationResult(
                        success=False,
                        channel=NotificationChannel(channel),
                        message_id=None,
                        error=str(e),
                        sent_at=datetime.utcnow()
                    ))

            # Update notification status
            await self._update_notification_status(notification_id, results)

        except Exception as e:
            self.logger.error(f"Failed to process notification: {e}")

    async def send_notification(self, notification_type: NotificationType,
                               priority: NotificationPriority, title: str,
                               message: str, recipient_id: str,
                               channels: List[NotificationChannel],
                               data: Optional[Dict[str, Any]] = None,
                               scheduled_for: Optional[datetime] = None,
                               expires_at: Optional[datetime] = None) -> Optional[int]:
        """Send a notification to a recipient"""

        try:
            async with get_db() as db:
                # Get recipient email
                recipient_result = await db.execute(
                    Profile.__table__.select().where(Profile.id == recipient_id)
                )
                recipient = recipient_result.first()
                recipient_email = recipient.email if recipient else None

                # Create notification record
                notification = NotificationLog(
                    type=notification_type.value,
                    priority=priority.value,
                    title=title,
                    message=message,
                    recipient_id=recipient_id,
                    recipient_email=recipient_email,
                    channels=json.dumps([channel.value for channel in channels]),
                    data=json.dumps(data or {}),
                    scheduled_for=scheduled_for,
                    expires_at=expires_at,
                    status="pending",
                    created_at=datetime.utcnow()
                )

                db.add(notification)
                await db.commit()
                await db.refresh(notification)

                # Queue for processing if not scheduled
                if not scheduled_for or scheduled_for <= datetime.utcnow():
                    await self.notification_queue.put({
                        'id': notification.id,
                        'channels': [channel.value for channel in channels],
                        'title': title,
                        'message': message,
                        'recipient_email': recipient_email,
                        'data': data
                    })

                self.logger.info(f"Notification queued: {title} to {recipient_id}")
                return notification.id

        except Exception as e:
            self.logger.error(f"Failed to send notification: {e}")
            return None

    async def send_bulk_notification(self, notification_type: NotificationType,
                                    priority: NotificationPriority, title: str,
                                    message: str, recipient_ids: List[str],
                                    channels: List[NotificationChannel],
                                    data: Optional[Dict[str, Any]] = None) -> List[int]:
        """Send notification to multiple recipients"""

        notification_ids = []
        for recipient_id in recipient_ids:
            notification_id = await self.send_notification(
                notification_type=notification_type,
                priority=priority,
                title=title,
                message=message,
                recipient_id=recipient_id,
                channels=channels,
                data=data
            )
            if notification_id:
                notification_ids.append(notification_id)

        return notification_ids

    async def send_alert_notification(self, title: str, message: str,
                                     severity: str, recipient_ids: List[str],
                                     incident_data: Optional[Dict[str, Any]] = None):
        """Send security alert notification"""

        priority = NotificationPriority.HIGH
        if severity == "critical":
            priority = NotificationPriority.URGENT
        elif severity == "low":
            priority = NotificationPriority.LOW

        await self.send_bulk_notification(
            notification_type=NotificationType.ALERT,
            priority=priority,
            title=title,
            message=message,
            recipient_ids=recipient_ids,
            channels=[NotificationChannel.IN_APP, NotificationChannel.EMAIL],
            data={
                "alert_severity": severity,
                "incident_data": incident_data
            }
        )

    async def _send_to_channel(self, notification_id: int,
                              channel: NotificationChannel) -> NotificationResult:
        """Send notification via specific channel"""

        try:
            async with get_db() as db:
                notification = await db.get(NotificationLog, notification_id)
                if not notification:
                    return NotificationResult(
                        success=False,
                        channel=channel,
                        message_id=None,
                        error="Notification not found",
                        sent_at=datetime.utcnow()
                    )

                if channel == NotificationChannel.EMAIL:
                    return await self._send_email(notification)
                elif channel == NotificationChannel.SMS:
                    return await self._send_sms(notification)
                elif channel == NotificationChannel.PUSH:
                    return await self._send_push(notification)
                elif channel == NotificationChannel.WEBHOOK:
                    return await self._send_webhook(notification)
                else:
                    # In-app notifications are handled by the real-time service
                    return NotificationResult(
                        success=True,
                        channel=channel,
                        message_id=str(notification_id),
                        error=None,
                        sent_at=datetime.utcnow()
                    )

        except Exception as e:
            return NotificationResult(
                success=False,
                channel=channel,
                message_id=None,
                error=str(e),
                sent_at=datetime.utcnow()
            )

    async def _send_email(self, notification) -> NotificationResult:
        """Send email notification"""

        try:
            if not notification.recipient_email or not self.smtp_username:
                return NotificationResult(
                    success=False,
                    channel=NotificationChannel.EMAIL,
                    message_id=None,
                    error="Email configuration missing",
                    sent_at=datetime.utcnow()
                )

            # Create message
            msg = MIMEMultipart()
            msg['From'] = self.smtp_username
            msg['To'] = notification.recipient_email
            msg['Subject'] = f"SecureGate Alert: {notification.title}"

            # Add body
            body = f"""
{notification.message}

Priority: {notification.priority.upper()}
Time: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}

This is an automated notification from SecureGate Kenya.
Please do not reply to this email.
            """
            msg.attach(MIMEText(body, 'plain'))

            # Send email
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.smtp_username, self.smtp_password)
            text = msg.as_string()
            server.sendmail(self.smtp_username, notification.recipient_email, text)
            server.quit()

            return NotificationResult(
                success=True,
                channel=NotificationChannel.EMAIL,
                message_id=f"email_{notification.id}_{datetime.utcnow().timestamp()}",
                error=None,
                sent_at=datetime.utcnow()
            )

        except Exception as e:
            return NotificationResult(
                success=False,
                channel=NotificationChannel.EMAIL,
                message_id=None,
                error=str(e),
                sent_at=datetime.utcnow()
            )

    async def _send_sms(self, notification) -> NotificationResult:
        """Send SMS notification (placeholder for SMS service integration)"""

        # This would integrate with an SMS service like Twilio, Africa's Talking, etc.
        # For now, just log that SMS would be sent

        self.logger.info(f"SMS notification would be sent to {notification.recipient_id}: {notification.title}")

        return NotificationResult(
            success=True,
            channel=NotificationChannel.SMS,
            message_id=f"sms_{notification.id}_{datetime.utcnow().timestamp()}",
            error=None,
            sent_at=datetime.utcnow()
        )

    async def _send_push(self, notification) -> NotificationResult:
        """Send push notification (placeholder for push service integration)"""

        # This would integrate with FCM, APNs, or similar push services
        # For now, just log that push notification would be sent

        self.logger.info(f"Push notification would be sent to {notification.recipient_id}: {notification.title}")

        return NotificationResult(
            success=True,
            channel=NotificationChannel.PUSH,
            message_id=f"push_{notification.id}_{datetime.utcnow().timestamp()}",
            error=None,
            sent_at=datetime.utcnow()
        )

    async def _send_webhook(self, notification) -> NotificationResult:
        """Send webhook notification (placeholder for webhook integration)"""

        # This would send HTTP POST to configured webhook URLs
        # For now, just log that webhook would be sent

        self.logger.info(f"Webhook notification would be sent: {notification.title}")

        return NotificationResult(
            success=True,
            channel=NotificationChannel.WEBHOOK,
            message_id=f"webhook_{notification.id}_{datetime.utcnow().timestamp()}",
            error=None,
            sent_at=datetime.utcnow()
        )

    async def _update_notification_status(self, notification_id: int,
                                        results: List[NotificationResult]):
        """Update notification status based on send results"""

        try:
            async with get_db() as db:
                notification = await db.get(NotificationLog, notification_id)
                if not notification:
                    return

                # Check if any channel succeeded
                any_success = any(result.success for result in results)

                if any_success:
                    notification.status = "sent"
                    notification.sent_at = datetime.utcnow()
                else:
                    notification.status = "failed"

                # Store results in notification data
                current_data = json.loads(notification.data) if notification.data else {}
                current_data['send_results'] = [
                    {
                        'channel': result.channel.value,
                        'success': result.success,
                        'message_id': result.message_id,
                        'error': result.error,
                        'sent_at': result.sent_at.isoformat()
                    }
                    for result in results
                ]
                notification.data = json.dumps(current_data)

                await db.commit()

        except Exception as e:
            self.logger.error(f"Failed to update notification status: {e}")

    async def mark_as_read(self, notification_id: int, user_id: str) -> bool:
        """Mark notification as read"""

        try:
            async with get_db() as db:
                notification = await db.get(NotificationLog, notification_id)
                if not notification or notification.recipient_id != user_id:
                    return False

                notification.read_at = datetime.utcnow()
                await db.commit()

                return True

        except Exception as e:
            self.logger.error(f"Failed to mark notification as read: {e}")
            return False

    async def get_user_notifications(self, user_id: str, limit: int = 50,
                                    unread_only: bool = False) -> List[NotificationMessage]:
        """Get notifications for a user"""

        try:
            async with get_db() as db:
                query = NotificationLog.__table__.select().where(
                    NotificationLog.recipient_id == user_id
                )

                if unread_only:
                    query = query.where(NotificationLog.read_at.is_(None))

                query = query.order_by(desc(NotificationLog.created_at)).limit(limit)

                result = await db.execute(query)
                notifications = []

                for row in result.fetchall():
                    notifications.append(NotificationMessage(
                        id=row.id,
                        type=NotificationType(row.type),
                        priority=NotificationPriority(row.priority),
                        title=row.title,
                        message=row.message,
                        recipient_id=row.recipient_id,
                        recipient_email=row.recipient_email,
                        channels=[NotificationChannel(channel) for channel in json.loads(row.channels)],
                        data=json.loads(row.data) if row.data else {},
                        scheduled_for=row.scheduled_for,
                        expires_at=row.expires_at,
                        created_at=row.created_at,
                        sent_at=row.sent_at,
                        read_at=row.read_at,
                        status=row.status
                    ))

                return notifications

        except Exception as e:
            self.logger.error(f"Failed to get user notifications: {e}")
            return []

    async def get_notification_statistics(self, days: int = 7) -> Dict[str, Any]:
        """Get notification statistics"""

        try:
            start_date = datetime.utcnow() - timedelta(days=days)

            async with get_db() as db:
                # Total notifications
                total_notifications = await db.execute(
                    func.count(NotificationLog.id).filter(
                        NotificationLog.created_at >= start_date
                    )
                )

                # Notifications by type
                type_counts = await db.execute(
                    NotificationLog.__table__.select()
                    .with_only_columns([
                        NotificationLog.type,
                        func.count(NotificationLog.id).label('count')
                    ])
                    .where(NotificationLog.created_at >= start_date)
                    .group_by(NotificationLog.type)
                )

                # Notifications by status
                status_counts = await db.execute(
                    NotificationLog.__table__.select()
                    .with_only_columns([
                        NotificationLog.status,
                        func.count(NotificationLog.id).label('count')
                    ])
                    .where(NotificationLog.created_at >= start_date)
                    .group_by(NotificationLog.status)
                )

                return {
                    "period_days": days,
                    "total_notifications": total_notifications.scalar(),
                    "by_type": {row.type: row.count for row in type_counts.fetchall()},
                    "by_status": {row.status: row.count for row in status_counts.fetchall()},
                    "generated_at": datetime.utcnow().isoformat()
                }

        except Exception as e:
            self.logger.error(f"Failed to get notification statistics: {e}")
            return {
                "error": str(e),
                "generated_at": datetime.utcnow().isoformat()
            }

    def configure_email(self, smtp_server: str, smtp_port: int,
                       username: str, password: str):
        """Configure email settings"""
        self.smtp_server = smtp_server
        self.smtp_port = smtp_port
        self.smtp_username = username
        self.smtp_password = password


# Global service instance
notification_service = NotificationService()
