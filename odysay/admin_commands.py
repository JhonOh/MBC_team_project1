"""Explicit, additive setup for locally managed SQLite databases."""
import sqlite3
from datetime import datetime
from pathlib import Path

import click
from flask import current_app
from flask.cli import with_appcontext

from . import db
from .models import ContentModeration, ModerationLog, User


@click.command('admin-init-db')
@with_appcontext
def init_db():
    """Back up SQLite and create only the two administrator tables."""
    if db.engine.dialect.name != 'sqlite' or db.engine.url.database == ':memory:':
        raise click.ClickException('이 명령은 파일 기반 SQLite용입니다.')
    source = Path(db.engine.url.database).resolve()
    if not source.is_file():
        raise click.ClickException('기존 DB 파일을 먼저 준비하세요.')
    destination = Path(current_app.instance_path) / 'admin-backups'
    destination.mkdir(parents=True, exist_ok=True)
    backup = destination / (datetime.now().strftime('%Y%m%d-%H%M%S-%f') + '.db')
    with sqlite3.connect(source.as_uri() + '?mode=ro', uri=True) as src, sqlite3.connect(backup) as dst:
        src.backup(dst)
    with db.engine.begin() as connection:
        ContentModeration.__table__.create(connection, checkfirst=True)
        ModerationLog.__table__.create(connection, checkfirst=True)
    click.echo(f'관리 테이블 준비 완료. 백업: {backup}')


@click.command('admin-check')
@with_appcontext
def check_admin():
    """Validate the configured administrator without printing credentials."""
    try:
        user_id = int(current_app.config.get('ADMIN_USER_ID') or 0)
    except (TypeError, ValueError):
        raise click.ClickException('ADMIN_USER_ID는 회원 ID 숫자 하나여야 합니다.')
    if user_id <= 0:
        raise click.ClickException('관리자가 아직 지정되지 않았습니다.')
    user = db.session.get(User, user_id)
    if not user or not user.is_active:
        raise click.ClickException('활성 상태의 기존 회원을 지정하세요.')
    if current_app.config.get('SECRET_KEY') in ('dev', '', None):
        raise click.ClickException('관리자 사용 전 SECRET_KEY를 안전한 값으로 설정하세요.')
    click.echo(f'관리자 확인: {user.username} (ID {user.id})')


def register_commands(app):
    app.cli.add_command(init_db)
    app.cli.add_command(check_admin)
