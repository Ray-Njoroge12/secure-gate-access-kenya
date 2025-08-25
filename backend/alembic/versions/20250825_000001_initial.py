from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from datetime import datetime

revision = "20250825_000001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "visitors",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("full_name_ct", sa.Text(), nullable=False),
        sa.Column("id_number_ct", sa.Text(), nullable=False),
        sa.Column("phone_ct", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, default=datetime.utcnow),
    )
    op.create_table(
        "access_codes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("visitor_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("visitors.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("pin_hash", sa.String(length=255), nullable=False),
        sa.Column("qr_token", sa.Text(), nullable=True),
        sa.Column("jti", sa.String(length=64), nullable=True),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column("used_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, default=datetime.utcnow),
    )
    op.create_index("ix_access_codes_jti", "access_codes", ["jti"], unique=False)
    op.create_index("ix_access_codes_visitor_id", "access_codes", ["visitor_id"], unique=False)


def downgrade():
    op.drop_index("ix_access_codes_visitor_id", table_name="access_codes")
    op.drop_index("ix_access_codes_jti", table_name="access_codes")
    op.drop_table("access_codes")
    op.drop_table("visitors")
