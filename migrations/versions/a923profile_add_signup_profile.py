"""회원가입 닉네임, 생년월일, 성별 추가."""

from alembic import op
import sqlalchemy as sa


revision = 'a923profile'
down_revision = 'ddd225a4836c'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('user') as batch_op:
        batch_op.add_column(
            sa.Column('nickname', sa.String(20), nullable=True)
        )
        batch_op.add_column(
            sa.Column('birth_date', sa.Date(), nullable=True)
        )
        batch_op.add_column(
            sa.Column('gender', sa.String(10), nullable=True)
        )

        batch_op.create_unique_constraint(
            'uq_user_nickname',
            ['nickname']
        )


def downgrade():
    with op.batch_alter_table('user') as batch_op:
        batch_op.drop_constraint(
            'uq_user_nickname',
            type_='unique'
        )

        batch_op.drop_column('gender')
        batch_op.drop_column('birth_date')
        batch_op.drop_column('nickname')