"""Enforce doctor profile required fields and add avatar.

Revision ID: 5b1a06f2a6f8
Revises: 0d38e3f02e34
Create Date: 2025-12-21 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5b1a06f2a6f8'
down_revision: Union[str, Sequence[str], None] = '0d38e3f02e34'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema to require complete doctor profiles."""
    placeholder_avatar = "https://placehold.co/128x128?text=Dr"
    placeholder_clinic = "Clinic not provided"
    placeholder_bio = "Doctor profile coming soon"

    op.add_column('doctor_profiles', sa.Column('avatar_url', sa.String(), nullable=True))

    # Backfill missing values so NOT NULL constraints succeed
    conn = op.get_bind()
    conn.execute(
        sa.text(
            """
            UPDATE doctor_profiles
            SET
                full_name = COALESCE(NULLIF(full_name, ''), 'Doctor'),
                clinic_name = COALESCE(NULLIF(clinic_name, ''), :clinic),
                bio = COALESCE(NULLIF(bio, ''), :bio),
                avatar_url = COALESCE(NULLIF(avatar_url, ''), :avatar)
            """
        ),
        {"clinic": placeholder_clinic, "bio": placeholder_bio, "avatar": placeholder_avatar},
    )

    op.alter_column('doctor_profiles', 'full_name', existing_type=sa.String(), nullable=False)
    op.alter_column('doctor_profiles', 'clinic_name', existing_type=sa.String(), nullable=False)
    op.alter_column('doctor_profiles', 'bio', existing_type=sa.Text(), nullable=False)
    op.alter_column(
        'doctor_profiles',
        'avatar_url',
        existing_type=sa.String(),
        nullable=False,
    )


def downgrade() -> None:
    """Revert doctor profile requirements."""
    op.alter_column('doctor_profiles', 'bio', existing_type=sa.Text(), nullable=True)
    op.alter_column('doctor_profiles', 'clinic_name', existing_type=sa.String(), nullable=True)
    op.alter_column('doctor_profiles', 'full_name', existing_type=sa.String(), nullable=False)
    op.drop_column('doctor_profiles', 'avatar_url')
