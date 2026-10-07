import contextlib
import io
from pathlib import Path
import sqlite3
import tempfile
import unittest
from unittest.mock import patch

from sqlalchemy.schema import CreateTable, CreateIndex
import update_database as updater


class DatabaseUpdateTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.path = Path(self.temp.name) / 'test.db'
        self.metadata = updater.load_metadata()
        with contextlib.closing(sqlite3.connect(self.path, isolation_level=None)) as connection:
            for table in self.metadata.sorted_tables:
                connection.execute(str(CreateTable(table).compile(dialect=updater.DIALECT)))
                for index in table.indexes:
                    connection.execute(str(CreateIndex(index).compile(dialect=updater.DIALECT)))
            connection.execute("INSERT INTO user(id,username,email,password_hash,is_active) VALUES(1,'fixture','fixture@example.test','test-only',1)")
            connection.execute('CREATE TABLE alembic_version(version_num VARCHAR(32))')
            connection.execute("INSERT INTO alembic_version VALUES('unchanged')")

    def run_update(self, apply=False):
        with contextlib.redirect_stdout(io.StringIO()):
            return updater.run(self.path, apply, self.metadata)

    def make_older(self):
        with contextlib.closing(sqlite3.connect(self.path, isolation_level=None)) as connection:
            connection.execute('ALTER TABLE user DROP COLUMN created_at')
            connection.execute('ALTER TABLE posts DROP COLUMN travel_tags')
            connection.execute('ALTER TABLE trip_locationmd DROP COLUMN travel_tags')
            connection.execute('DROP TABLE inquiries')

    def test_check_is_read_only(self):
        self.make_older()
        before = self.path.read_bytes()
        self.assertEqual(self.run_update(), 0)
        self.assertEqual(before, self.path.read_bytes())
        self.assertEqual(len(list(self.path.parent.glob('*backup*'))), 0)

    def test_upgrade_backup_and_repeat(self):
        self.make_older()
        self.assertEqual(self.run_update(True), 0)
        backups = list(self.path.parent.glob('*backup*'))
        self.assertEqual(len(backups), 1)
        with contextlib.closing(sqlite3.connect(backups[0])) as connection:
            self.assertNotIn('created_at', [r[1] for r in connection.execute('PRAGMA table_info(user)')])
            self.assertEqual(connection.execute('SELECT username FROM user').fetchone()[0], 'fixture')
        with contextlib.closing(sqlite3.connect(self.path, isolation_level=None)) as connection:
            self.assertIsNone(connection.execute('SELECT created_at FROM user').fetchone()[0])
            self.assertEqual(connection.execute('SELECT version_num FROM alembic_version').fetchone()[0], 'unchanged')
        self.assertEqual(self.run_update(True), 0)
        self.assertEqual(len(list(self.path.parent.glob('*backup*'))), 1)

    def test_conflict_prevents_all_changes(self):
        self.make_older()
        with contextlib.closing(sqlite3.connect(self.path, isolation_level=None)) as connection:
            connection.execute('ALTER TABLE posts DROP COLUMN title')
        before = self.path.read_bytes()
        self.assertEqual(self.run_update(True), 2)
        self.assertEqual(before, self.path.read_bytes())

    def test_failure_rolls_back_ddl(self):
        self.make_older()
        real = updater.inspect_plan

        def broken(connection, metadata):
            actions, errors = real(connection, metadata)
            actions.append(('intentional failure', 'INVALID SQL'))
            return actions, errors

        with patch.object(updater, 'inspect_plan', broken):
            with self.assertRaises(sqlite3.Error):
                self.run_update(True)
        with contextlib.closing(sqlite3.connect(self.path, isolation_level=None)) as connection:
            self.assertNotIn('created_at', [r[1] for r in connection.execute('PRAGMA table_info(user)')])
            self.assertIsNone(connection.execute("SELECT name FROM sqlite_master WHERE name='inquiries'").fetchone())

    def test_missing_database_not_created(self):
        missing = self.path.parent / 'missing.db'
        with self.assertRaises(ValueError):
            updater.run(missing, True, self.metadata)
        self.assertFalse(missing.exists())

    def test_type_conflict(self):
        with contextlib.closing(sqlite3.connect(self.path, isolation_level=None)) as connection:
            connection.execute('ALTER TABLE posts DROP COLUMN travel_tags')
            connection.execute('ALTER TABLE posts ADD COLUMN travel_tags INTEGER')
        self.assertEqual(self.run_update(), 2)


if __name__ == '__main__':
    unittest.main()
