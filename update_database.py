"""Existing SQLite databases only. Run --check before --apply; stop the server.

No Alembic files or revision records are read or changed. Unknown schema drift
is rejected rather than rebuilt. SQL is generated only from trusted models.
"""
import argparse
from contextlib import closing
from datetime import datetime
from pathlib import Path
import sqlite3
import sys

from sqlalchemy import UniqueConstraint
from sqlalchemy.dialects.sqlite import dialect
from sqlalchemy.engine import make_url
from sqlalchemy.schema import CreateIndex, CreateTable

ROOT = Path(__file__).resolve().parent
DIALECT = dialect()
NEW_TABLES = {
    'bookmarks', 'post_like', 'inquiries', 'content_moderation',
    'moderation_log', 'review_recommends', 'travel_talk_recommends',
}
ADD_COLUMNS = {
    'user': {'nickname', 'birth_date', 'gender', 'profile_image', 'is_active', 'created_at'},
    'uploadmd': {'latitude', 'longitude'},
    'trip_locationmd': {'latitude', 'longitude', 'updated_at', 'travel_tags'},
    'posts': {'photos', 'updated_at', 'travel_tags'},
    'reviews': {'updated_at'},
    'travel_talks': {'updated_at'},
    'travel_talk_comments': {'updated_at', 'parent_id'},
    'comment': {'updated_at'},
}


def quote(name):
    return '"' + name.replace('"', '""') + '"'


def connect(path, writable=False):
    return sqlite3.connect(path.as_uri() + ('?mode=rw' if writable else '?mode=ro'),
                           uri=True, timeout=5, isolation_level=None)


def load_metadata():
    # Import models without create_app(): no views, API clients or startup hooks.
    from odysay import db, models  # noqa: F401
    return db.metadata


def configured_path():
    import config
    url = make_url(config.SQLALCHEMY_DATABASE_URI)
    if url.get_backend_name() != 'sqlite' or not url.database or url.database == ':memory:':
        raise ValueError('파일 기반 SQLite 설정만 지원합니다.')
    path = Path(url.database)
    if not path.is_absolute():
        raise ValueError('상대 DB 경로는 지원하지 않습니다. 실제 DB 경로를 --database로 지정하세요.')
    return path.resolve()


def type_name(value):
    value = value.upper().replace(' ', '')
    if value.startswith(('VARCHAR', 'CHAR', 'TEXT')):
        return 'TEXT'
    if value in ('FLOAT', 'REAL', 'DOUBLE', 'DOUBLEPRECISION'):
        return 'REAL'
    return value


def inspect_plan(connection, metadata):
    actions, errors = [], []
    integrity = connection.execute('PRAGMA quick_check').fetchall()
    if integrity != [('ok',)]:
        return [], ['DB 무결성 검사 실패']
    if connection.execute('PRAGMA foreign_key_check').fetchone():
        errors.append('기존 외래키 연결 오류: 데이터 확인 필요')
    tables = {r[0] for r in connection.execute("SELECT name FROM sqlite_master WHERE type='table'")}
    # Guard against accidentally targeting an empty or unrelated database.
    for required in ('user', 'posts', 'trip_locationmd', 'uploadmd'):
        if required not in tables:
            errors.append(f'기존 프로젝트 필수 테이블 없음: {required}')
    for table in metadata.sorted_tables:
        name = table.name
        if name not in tables:
            if name not in NEW_TABLES:
                errors.append(f'자동 생성 대상이 아닌 테이블 없음: {name}')
                continue
            actions.append((f'테이블 생성: {name}', str(CreateTable(table).compile(dialect=DIALECT))))
            for index in table.indexes:
                actions.append((f'인덱스 생성: {index.name}', str(CreateIndex(index).compile(dialect=DIALECT))))
            continue
        columns = {r[1]: r for r in connection.execute(f'PRAGMA table_info({quote(name)})')}
        actual_pk = tuple(r[1] for r in sorted(columns.values(), key=lambda r: r[5]) if r[5])
        if actual_pk != tuple(c.name for c in table.primary_key):
            errors.append(f'기본키 불일치: {name}')
        for column in table.columns:
            if column.name in columns:
                row = columns[column.name]
                if type_name(row[2]) != type_name(str(column.type.compile(dialect=DIALECT))):
                    errors.append(f'컬럼 형식 불일치: {name}.{column.name}')
                if not column.primary_key and bool(row[3]) != (not column.nullable):
                    errors.append(f'NULL 허용 조건 불일치: {name}.{column.name}')
                continue
            if column.name not in ADD_COLUMNS.get(name, set()):
                errors.append(f'자동 추가 대상이 아닌 컬럼 없음: {name}.{column.name}')
                continue
            definition = f'{quote(column.name)} {column.type.compile(dialect=DIALECT)}'
            if name == 'user' and column.name == 'is_active':
                definition += ' NOT NULL DEFAULT 1'
            elif not column.nullable:
                errors.append(f'필수값을 추정할 수 없음: {name}.{column.name}')
                continue
            for fk in column.foreign_keys:
                definition += f' REFERENCES {quote(fk.column.table.name)} ({quote(fk.column.name)})'
            actions.append((f'컬럼 추가: {name}.{column.name}', f'ALTER TABLE {quote(name)} ADD COLUMN {definition}'))
        actual_fks = {(r[3], r[2], r[4], r[6].upper()) for r in connection.execute(f'PRAGMA foreign_key_list({quote(name)})')}
        for fk in table.foreign_keys:
            if fk.parent.name in columns:
                expected = (fk.parent.name, fk.column.table.name, fk.column.name, (fk.ondelete or 'NO ACTION').upper())
                if expected not in actual_fks:
                    errors.append(f'외래키 불일치: {name}.{fk.parent.name}')
        indexes = list(connection.execute(f'PRAGMA index_list({quote(name)})'))
        unique_sets = {
            tuple(r[2] for r in connection.execute(f'PRAGMA index_info({quote(index[1])})'))
            for index in indexes if index[2] and not index[4]
        }
        for constraint in table.constraints:
            if not isinstance(constraint, UniqueConstraint):
                continue
            fields = tuple(c.name for c in constraint.columns)
            if fields in unique_sets:
                continue
            if name == 'user' and fields == ('nickname',) and 'nickname' not in columns:
                actions.append(('닉네임 고유 인덱스 생성', 'CREATE UNIQUE INDEX "uq_update_user_nickname" ON "user" ("nickname")'))
            else:
                errors.append(f'고유 제약 누락: {name}({", ".join(fields)})')
        for index in table.indexes:
            if index.name not in {r[1] for r in indexes}:
                actions.append((f'인덱스 생성: {index.name}', str(CreateIndex(index).compile(dialect=DIALECT))))
    return actions, errors


def run(path, apply=False, metadata=None):
    path = Path(path).resolve()
    if not path.is_file():
        raise ValueError(f'DB 파일이 없습니다. 새 DB를 자동 생성하지 않습니다: {path}')
    metadata = metadata if metadata is not None else load_metadata()
    print(f'대상 DB: {path}')
    with closing(connect(path, apply)) as connection:
        connection.execute('PRAGMA foreign_keys=ON')
        connection.execute('BEGIN IMMEDIATE' if apply else 'BEGIN')
        try:
            actions, errors = inspect_plan(connection, metadata)
            for label, _ in actions:
                print(f'[예정] {label}')
            for error in errors:
                print(f'[중단] {error}')
            if errors:
                connection.rollback()
                print('변경하지 않았습니다. 출력 결과를 공유해 주세요.')
                return 2
            if not actions:
                connection.rollback()
                print('완료: 지원 대상 구조가 이미 적용되어 있습니다. 변경 없음.')
                return 0
            if not apply:
                connection.rollback()
                print('적용 가능: 서버와 Flask shell을 종료한 뒤 --apply를 실행하세요.')
                return 0
            # The writer lock prevents changes while a separate reader backs up.
            backup_path = path.with_name(f'{path.stem}_backup_update_{datetime.now():%Y%m%d_%H%M%S_%f}.db')
            with closing(connect(path)) as source, closing(sqlite3.connect(backup_path)) as target:
                source.backup(target)
                if target.execute('PRAGMA quick_check').fetchall() != [('ok',)]:
                    raise RuntimeError('백업 검증 실패')
            print(f'백업 완료: {backup_path}')
            for label, sql in actions:
                connection.execute(sql)
                print(f'[적용] {label}')
            remaining, errors = inspect_plan(connection, metadata)
            if remaining or errors:
                raise RuntimeError('적용 후 검증 실패: ' + '; '.join(errors))
            connection.commit()
            print('완료: 변경 저장 및 검증 성공. Alembic 버전 기록은 변경하지 않았습니다.')
            return 0
        except Exception:
            connection.rollback()
            raise


def main():
    parser = argparse.ArgumentParser(description='기존 어딧세이 SQLite DB 점검/업데이트')
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument('--check', action='store_true', help='읽기 전용 점검')
    mode.add_argument('--apply', action='store_true', help='백업 후 적용 (서버 종료 필수)')
    parser.add_argument('--database', type=Path, help='테스트 복사본 등 명시적인 DB 파일 경로')
    args = parser.parse_args()
    try:
        return run(args.database if args.database else configured_path(), args.apply)
    except Exception as error:
        print(f'실패: {error}', file=sys.stderr)
        print('적용 중 오류라면 이번 트랜잭션은 롤백됩니다. 무조건 반복 실행하지 마세요.', file=sys.stderr)
        return 1


if __name__ == '__main__':
    sys.exit(main())
