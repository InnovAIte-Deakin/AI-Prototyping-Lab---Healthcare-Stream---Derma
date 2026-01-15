"""add_doctor_change_log_table_s2_4

Revision ID: b91f4c3a7d82
Revises: 36795edd63cd
Create Date: 2026-01-15 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b91f4c3a7d82'
down_revision: Union[str, Sequence[str], None] = '36795edd63cd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create doctor_change_logs table for S2-4 Safe Doctor Switch."""
    op.create_table('doctor_change_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('patient_id', sa.Integer(), nullable=False),
        sa.Column('old_doctor_id', sa.Integer(), nullable=True),
        sa.Column('new_doctor_id', sa.Integer(), nullable=False),
        sa.Column('changed_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.Column('reason', sa.String(), nullable=True),
        sa.ForeignKeyConstraint(['new_doctor_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['old_doctor_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['patient_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_doctor_change_logs_id'), 'doctor_change_logs', ['id'], unique=False)


def downgrade() -> None:
    """Remove doctor_change_logs table."""
    op.drop_index(op.f('ix_doctor_change_logs_id'), table_name='doctor_change_logs')
    op.drop_table('doctor_change_logs')
