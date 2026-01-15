"""merge heads

Revision ID: 32706033288b
Revises: 2e28fad97467, 5b1a06f2a6f8
Create Date: 2026-01-13 14:57:15.689020

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '32706033288b'
down_revision: Union[str, Sequence[str], None] = ('2e28fad97467', '5b1a06f2a6f8')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
