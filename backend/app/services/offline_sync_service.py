"""
Offline Sync Service for Security Guard Operations
Handles offline data synchronization, caching, and conflict resolution.
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from enum import Enum
import hashlib

from sqlalchemy import func, and_, or_, desc
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models import (
    Profile, AccessCode, Invitation, AnalyticsEvent,
    SecurityIncident, VisitorLog, OfflineSync
)


logger = logging.getLogger(__name__)


class SyncStatus(Enum):
    PENDING = "pending"
    SYNCING = "syncing"
    COMPLETED = "completed"
    FAILED = "failed"
    CONFLICT = "conflict"


class SyncOperation(Enum):
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"


@dataclass
class OfflineData:
    id: str
    operation: SyncOperation
    table_name: str
    data: Dict[str, Any]
    timestamp: datetime
    device_id: str
    version: int
    checksum: str


@dataclass
class SyncResult:
    success: bool
    synced_items: int
    failed_items: int
    conflicts: List[Dict[str, Any]]
    errors: List[str]


class OfflineSyncService:
    """Service for handling offline data synchronization"""

    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.sync_in_progress = False
        self.max_retry_attempts = 3
        self.sync_interval = 300  # 5 minutes

    async def start_sync_scheduler(self):
        """Start the automatic sync scheduler"""
        while True:
            try:
                if not self.sync_in_progress:
                    await self.perform_sync()
                await asyncio.sleep(self.sync_interval)
            except Exception as e:
                self.logger.error(f"Error in sync scheduler: {e}")
                await asyncio.sleep(self.sync_interval)

    async def perform_sync(self) -> SyncResult:
        """Perform synchronization of offline data"""
        if self.sync_in_progress:
            return SyncResult(False, 0, 0, [], ["Sync already in progress"])

        self.sync_in_progress = True

        try:
            async with get_db() as db:
                # Get pending sync items
                pending_items = await db.execute(
                    OfflineSync.__table__.select()
                    .where(OfflineSync.status == SyncStatus.PENDING.value)
                    .order_by(OfflineSync.created_at)
                )

                pending_rows = pending_items.fetchall()
                if not pending_rows:
                    self.sync_in_progress = False
                    return SyncResult(True, 0, 0, [], [])

                synced_count = 0
                failed_count = 0
                conflicts = []
                errors = []

                for row in pending_rows:
                    try:
                        success, conflict_data = await self._sync_single_item(db, row)
                        if success:
                            synced_count += 1
                        else:
                            failed_count += 1
                            if conflict_data:
                                conflicts.append(conflict_data)

                    except Exception as e:
                        failed_count += 1
                        errors.append(f"Failed to sync item {row.id}: {str(e)}")
                        await self._update_sync_status(db, row.id, SyncStatus.FAILED, str(e))

                self.sync_in_progress = False
                return SyncResult(
                    success=failed_count == 0,
                    synced_items=synced_count,
                    failed_items=failed_count,
                    conflicts=conflicts,
                    errors=errors
                )

        except Exception as e:
            self.sync_in_progress = False
            self.logger.error(f"Sync operation failed: {e}")
            return SyncResult(False, 0, 0, [], [str(e)])

    async def _sync_single_item(self, db: AsyncSession, sync_item) -> Tuple[bool, Optional[Dict[str, Any]]]:
        """Sync a single offline item"""
        try:
            data = json.loads(sync_item.data)
            operation = SyncOperation(sync_item.operation)

            if sync_item.table_name == "visitor_log":
                return await self._sync_visitor_log(db, operation, data, sync_item)
            elif sync_item.table_name == "security_incident":
                return await self._sync_security_incident(db, operation, data, sync_item)
            elif sync_item.table_name == "access_code":
                return await self._sync_access_code(db, operation, data, sync_item)
            else:
                # Generic sync for other tables
                return await self._sync_generic(db, sync_item.table_name, operation, data, sync_item)

        except Exception as e:
            self.logger.error(f"Error syncing item {sync_item.id}: {e}")
            return False, None

    async def _sync_visitor_log(self, db: AsyncSession, operation: SyncOperation,
                               data: Dict[str, Any], sync_item) -> Tuple[bool, Optional[Dict[str, Any]]]:
        """Sync visitor log entry"""
        try:
            if operation == SyncOperation.CREATE:
                # Check for existing entry to avoid duplicates
                existing = await db.execute(
                    VisitorLog.__table__.select().where(
                        and_(
                            VisitorLog.visitor_name == data.get('visitor_name'),
                            VisitorLog.expected_arrival == datetime.fromisoformat(data.get('expected_arrival')),
                            VisitorLog.created_at >= datetime.utcnow() - timedelta(hours=24)
                        )
                    )
                )

                if existing.first():
                    # Mark as completed (already exists)
                    await self._update_sync_status(db, sync_item.id, SyncStatus.COMPLETED)
                    return True, None

                # Create new visitor log
                visitor_log = VisitorLog(
                    visitor_name=data.get('visitor_name'),
                    visitor_phone=data.get('visitor_phone'),
                    visitor_email=data.get('visitor_email'),
                    expected_arrival=datetime.fromisoformat(data.get('expected_arrival')),
                    purpose=data.get('purpose'),
                    host_name=data.get('host_name'),
                    host_phone=data.get('host_phone'),
                    invitation_id=data.get('invitation_id'),
                    access_code=data.get('access_code'),
                    check_in_time=datetime.fromisoformat(data.get('check_in_time')) if data.get('check_in_time') else None,
                    check_out_time=datetime.fromisoformat(data.get('check_out_time')) if data.get('check_out_time') else None,
                    status=data.get('status', 'pending'),
                    notes=data.get('notes'),
                    created_at=datetime.fromisoformat(data.get('created_at')),
                    updated_at=datetime.utcnow()
                )

                db.add(visitor_log)
                await db.commit()

            elif operation == SyncOperation.UPDATE:
                # Update existing visitor log
                visitor_log = await db.get(VisitorLog, data.get('id'))
                if visitor_log:
                    for key, value in data.items():
                        if hasattr(visitor_log, key) and key not in ['id', 'created_at']:
                            if key in ['check_in_time', 'check_out_time', 'expected_arrival']:
                                setattr(visitor_log, key, datetime.fromisoformat(value) if value else None)
                            else:
                                setattr(visitor_log, key, value)

                    visitor_log.updated_at = datetime.utcnow()
                    await db.commit()

            await self._update_sync_status(db, sync_item.id, SyncStatus.COMPLETED)
            return True, None

        except Exception as e:
            await self._update_sync_status(db, sync_item.id, SyncStatus.FAILED, str(e))
            return False, {"item_id": sync_item.id, "error": str(e), "data": data}

    async def _sync_security_incident(self, db: AsyncSession, operation: SyncOperation,
                                     data: Dict[str, Any], sync_item) -> Tuple[bool, Optional[Dict[str, Any]]]:
        """Sync security incident"""
        try:
            if operation == SyncOperation.CREATE:
                incident = SecurityIncident(
                    incident_type=data.get('incident_type'),
                    severity=data.get('severity'),
                    description=data.get('description'),
                    location=data.get('location'),
                    reported_by=data.get('reported_by'),
                    status=data.get('status', 'reported'),
                    details=json.dumps(data.get('details', {})),
                    evidence_urls=json.dumps(data.get('evidence_urls', [])) if data.get('evidence_urls') else None,
                    resolution=data.get('resolution'),
                    resolved_at=datetime.fromisoformat(data.get('resolved_at')) if data.get('resolved_at') else None,
                    created_at=datetime.fromisoformat(data.get('created_at')),
                    updated_at=datetime.utcnow()
                )

                db.add(incident)
                await db.commit()

            await self._update_sync_status(db, sync_item.id, SyncStatus.COMPLETED)
            return True, None

        except Exception as e:
            await self._update_sync_status(db, sync_item.id, SyncStatus.FAILED, str(e))
            return False, {"item_id": sync_item.id, "error": str(e), "data": data}

    async def _sync_access_code(self, db: AsyncSession, operation: SyncOperation,
                               data: Dict[str, Any], sync_item) -> Tuple[bool, Optional[Dict[str, Any]]]:
        """Sync access code usage"""
        try:
            if operation == SyncOperation.UPDATE:
                # Update access code status
                access_code = await db.get(AccessCode, data.get('id'))
                if access_code:
                    access_code.used = data.get('used', False)
                    access_code.used_at = datetime.fromisoformat(data.get('used_at')) if data.get('used_at') else None
                    access_code.used_by = data.get('used_by')
                    access_code.updated_at = datetime.utcnow()
                    await db.commit()

            await self._update_sync_status(db, sync_item.id, SyncStatus.COMPLETED)
            return True, None

        except Exception as e:
            await self._update_sync_status(db, sync_item.id, SyncStatus.FAILED, str(e))
            return False, {"item_id": sync_item.id, "error": str(e), "data": data}

    async def _sync_generic(self, db: AsyncSession, table_name: str, operation: SyncOperation,
                           data: Dict[str, Any], sync_item) -> Tuple[bool, Optional[Dict[str, Any]]]:
        """Generic sync for unsupported tables"""
        # For now, just mark as completed
        await self._update_sync_status(db, sync_item.id, SyncStatus.COMPLETED)
        return True, None

    async def _update_sync_status(self, db: AsyncSession, sync_id: int,
                                 status: SyncStatus, error_message: Optional[str] = None):
        """Update sync item status"""
        try:
            sync_item = await db.get(OfflineSync, sync_id)
            if sync_item:
                sync_item.status = status.value
                sync_item.error_message = error_message
                sync_item.updated_at = datetime.utcnow()
                if status == SyncStatus.COMPLETED:
                    sync_item.completed_at = datetime.utcnow()
                await db.commit()
        except Exception as e:
            self.logger.error(f"Failed to update sync status: {e}")

    async def queue_offline_data(self, device_id: str, table_name: str,
                                operation: SyncOperation, data: Dict[str, Any]) -> int:
        """Queue offline data for synchronization"""
        try:
            async with get_db() as db:
                # Create checksum for data integrity
                data_str = json.dumps(data, sort_keys=True, default=str)
                checksum = hashlib.md5(data_str.encode()).hexdigest()

                sync_item = OfflineSync(
                    device_id=device_id,
                    table_name=table_name,
                    operation=operation.value,
                    data=data_str,
                    checksum=checksum,
                    status=SyncStatus.PENDING.value,
                    retry_count=0,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )

                db.add(sync_item)
                await db.commit()
                await db.refresh(sync_item)

                self.logger.info(f"Queued offline data: {table_name} - {operation.value} - Device: {device_id}")
                return sync_item.id

        except Exception as e:
            self.logger.error(f"Failed to queue offline data: {e}")
            return -1

    async def get_offline_data_for_device(self, device_id: str) -> List[OfflineData]:
        """Get offline data that needs to be synced to a device"""
        try:
            async with get_db() as db:
                # Get data created in the last 24 hours that should be available offline
                yesterday = datetime.utcnow() - timedelta(days=1)

                # Get active invitations
                invitations_query = Invitation.__table__.select().where(
                    and_(
                        Invitation.created_at >= yesterday,
                        Invitation.status.in_(['active', 'pending'])
                    )
                )

                # Get active access codes
                access_codes_query = AccessCode.__table__.select().where(
                    and_(
                        AccessCode.created_at >= yesterday,
                        AccessCode.expires_at > datetime.utcnow(),
                        AccessCode.used == False
                    )
                )

                invitations = await db.execute(invitations_query)
                access_codes = await db.execute(access_codes_query)

                offline_data = []

                # Convert invitations to offline data
                for inv in invitations.fetchall():
                    data = {
                        "id": inv.id,
                        "visitor_name": inv.visitor_name,
                        "visitor_phone": inv.visitor_phone,
                        "expected_arrival": inv.expected_arrival.isoformat() if inv.expected_arrival else None,
                        "access_code": inv.access_code,
                        "status": inv.status,
                        "created_at": inv.created_at.isoformat()
                    }

                    offline_data.append(OfflineData(
                        id=f"invitation_{inv.id}",
                        operation=SyncOperation.CREATE,
                        table_name="invitation",
                        data=data,
                        timestamp=inv.created_at,
                        device_id=device_id,
                        version=1,
                        checksum=hashlib.md5(json.dumps(data, sort_keys=True).encode()).hexdigest()
                    ))

                # Convert access codes to offline data
                for code in access_codes.fetchall():
                    data = {
                        "id": code.id,
                        "code": code.code,
                        "expires_at": code.expires_at.isoformat() if code.expires_at else None,
                        "invitation_id": code.invitation_id,
                        "created_at": code.created_at.isoformat()
                    }

                    offline_data.append(OfflineData(
                        id=f"access_code_{code.id}",
                        operation=SyncOperation.CREATE,
                        table_name="access_code",
                        data=data,
                        timestamp=code.created_at,
                        device_id=device_id,
                        version=1,
                        checksum=hashlib.md5(json.dumps(data, sort_keys=True).encode()).hexdigest()
                    ))

                return offline_data

        except Exception as e:
            self.logger.error(f"Failed to get offline data for device {device_id}: {e}")
            return []

    async def get_sync_status(self) -> Dict[str, Any]:
        """Get current sync status"""
        try:
            async with get_db() as db:
                # Count items by status
                status_counts = await db.execute(
                    OfflineSync.__table__.select()
                    .with_only_columns([
                        OfflineSync.status,
                        func.count(OfflineSync.id).label('count')
                    ])
                    .group_by(OfflineSync.status)
                )

                # Get recent sync activity
                recent_syncs = await db.execute(
                    OfflineSync.__table__.select()
                    .order_by(desc(OfflineSync.updated_at))
                    .limit(10)
                )

                status_summary = {row.status: row.count for row in status_counts.fetchall()}

                return {
                    "sync_in_progress": self.sync_in_progress,
                    "status_summary": status_summary,
                    "recent_activity": [
                        {
                            "id": row.id,
                            "device_id": row.device_id,
                            "table_name": row.table_name,
                            "operation": row.operation,
                            "status": row.status,
                            "updated_at": row.updated_at.isoformat()
                        }
                        for row in recent_syncs.fetchall()
                    ],
                    "last_updated": datetime.utcnow().isoformat()
                }

        except Exception as e:
            self.logger.error(f"Failed to get sync status: {e}")
            return {
                "error": str(e),
                "sync_in_progress": self.sync_in_progress,
                "last_updated": datetime.utcnow().isoformat()
            }

    async def retry_failed_syncs(self) -> SyncResult:
        """Retry failed sync operations"""
        try:
            async with get_db() as db:
                # Get failed items with retry count < max attempts
                failed_items = await db.execute(
                    OfflineSync.__table__.select()
                    .where(
                        and_(
                            OfflineSync.status == SyncStatus.FAILED.value,
                            OfflineSync.retry_count < self.max_retry_attempts
                        )
                    )
                )

                failed_rows = failed_items.fetchall()
                if not failed_rows:
                    return SyncResult(True, 0, 0, [], [])

                # Reset status to pending and increment retry count
                for row in failed_rows:
                    await db.execute(
                        OfflineSync.__table__.update()
                        .where(OfflineSync.id == row.id)
                        .values(
                            status=SyncStatus.PENDING.value,
                            retry_count=row.retry_count + 1,
                            updated_at=datetime.utcnow()
                        )
                    )

                await db.commit()

                # Perform sync
                return await self.perform_sync()

        except Exception as e:
            self.logger.error(f"Failed to retry syncs: {e}")
            return SyncResult(False, 0, 0, [], [str(e)])


# Global service instance
offline_sync_service = OfflineSyncService()
