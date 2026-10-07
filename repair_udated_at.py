import sqlite3
from datetime import datetime
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "odysay.db"

TABLES = (
    "travel_talks",
    "posts",
    "reviews",
    "travel_talk_comments",
    "comment",
)


def main():
    if not DB_PATH.is_file():
        raise FileNotFoundError(f"DB 파일을 찾을 수 없습니다: {DB_PATH}")

    backup_path = DB_PATH.with_name(
        f"odysay_backup_{datetime.now():%Y%m%d_%H%M%S_%f}.db"
    )

    # 기존 DB만 열기: 경로가 잘못되어 빈 DB가 만들어지는 것을 방지
    connection = sqlite3.connect(DB_PATH.as_uri() + "?mode=rw", uri=True)

    try:
        # SQLite 백업 기능으로 현재 데이터 보관
        with sqlite3.connect(backup_path) as backup:
            connection.backup(backup)

        print(f"백업 완료: {backup_path}")

        connection.execute("BEGIN IMMEDIATE")

        # 변경 전에 필요한 테이블이 모두 있는지 확인
        existing_tables = {
            row[0]
            for row in connection.execute(
                "SELECT name FROM sqlite_master WHERE type = 'table'"
            )
        }

        missing_tables = set(TABLES) - existing_tables
        if missing_tables:
            raise RuntimeError(
                f"필요한 테이블이 없습니다: {sorted(missing_tables)}"
            )

        for table in TABLES:
            columns = {
                row[1]
                for row in connection.execute(
                    f'PRAGMA table_info("{table}")'
                )
            }

            if "updated_at" in columns:
                print(f"유지: {table}.updated_at 이미 존재")
                continue

            connection.execute(
                f'ALTER TABLE "{table}" ADD COLUMN updated_at DATETIME'
            )
            print(f"추가: {table}.updated_at")

        connection.commit()
        print("완료: 모든 변경 사항을 저장했습니다.")

    except Exception:
        connection.rollback()
        raise

    finally:
        connection.close()


if __name__ == "__main__":
    main()