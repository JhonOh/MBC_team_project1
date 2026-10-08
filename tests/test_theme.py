"""Theme wiring regression tests. Uses an isolated in-memory database only."""
import re
import unittest
from jinja2 import meta
import test_admin_moderation as fixtures
from odysay import db
from odysay.models import Inquiry


class ThemeTemplateTests(unittest.TestCase):
    def setUp(self):
        self.fixture = fixtures.AdminModerationTests()
        self.fixture.setUp()
        self.app = self.fixture.app
        with self.app.app_context():
            db.session.add(Inquiry(id=1, user_id=2, title='Theme inquiry', content='Test content'))
            db.session.commit()

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.engine.dispose()

    def test_all_template_dependencies_exist(self):
        environment = self.app.jinja_env
        for name in environment.list_templates():
            source = environment.loader.get_source(environment, name)[0]
            tree = environment.parse(source)
            for dependency in meta.find_referenced_templates(tree):
                if dependency:
                    with self.subTest(template=name, dependency=dependency):
                        environment.get_template(dependency)

    def test_every_page_has_one_theme_loader_and_one_toggle(self):
        public = self.fixture.public
        owner = self.fixture.owner
        admin = self.fixture.admin
        pages = [
            (public, '/first/map'), (public, '/homepage'),
            (public, '/homepage/trip_list'),
            (public, '/homepage/community/all'),
            (public, '/homepage/community/review'),
            (public, '/homepage/community/tip'),
            (public, '/homepage/community/free'),
            (public, '/homepage/community/detail/post/1'),
            (public, '/homepage/community/detail/place/1'),
            (public, '/homepage/trip_location/1'),
            (public, '/auth/signup/'),
            (public, '/homepage/search?q=Seed'),
            (owner, '/homepage/upload/'),
            (owner, '/homepage/trip_location/1/edit'),
            (owner, '/homepage/community/postwrite/'),
            (owner, '/homepage/mypage'),
            (owner, '/homepage/mypage/settings'),
            (owner, '/homepage/profile_edit'),
            (owner, '/homepage/mypage/places'),
            (owner, '/homepage/mypage/bookmarks'),
            (owner, '/homepage/inquiries/'),
            (owner, '/homepage/inquiries/new'),
            (owner, '/homepage/inquiries/1'),
            (admin, '/admin/'), (admin, '/admin/logs'),
            (admin, '/admin/place/1/edit'),
        ]
        for client, path in pages:
            with self.subTest(path=path):
                response = client.get(path)
                self.assertEqual(response.status_code, 200)
                html = response.get_data(as_text=True)
                self.assertEqual(html.count('js/theme.js'), 1)
                self.assertEqual(html.count('css/theme.css'), 1)
                self.assertEqual(len(re.findall(r'\sdata-theme-toggle(?:\s|>)', html)), 1)
                self.assertLess(html.index('js/theme.js'), html.index('</head>'))


if __name__ == '__main__':
    unittest.main()
