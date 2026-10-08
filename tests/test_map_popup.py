import unittest
import test_admin_moderation as fixtures
from odysay import db
from odysay.models import TripLocationmd
from odysay.models import Bookmark


class MapPopupTests(unittest.TestCase):
    def setUp(self):
        self.fixture = fixtures.AdminModerationTests()
        self.fixture.setUp()
        self.app = self.fixture.app

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.engine.dispose()

    def test_map_api_returns_first_registered_photo(self):
        with self.app.app_context():
            db.session.get(TripLocationmd, 1).photos = ' , cover.jpg, second.jpg'
            db.session.commit()
        place = self.fixture.public.get('/homepage/api/places').get_json()[0]
        self.assertEqual(place['photo_url'], '/static/uploads/cover.jpg')
        self.assertEqual(place['title'], 'Seed place')
        self.assertEqual(place['intro'], 'intro')
        self.assertEqual(place['detail_url'], '/homepage/trip_location/1')
        listed = self.fixture.public.get('/trip-list/places').get_json()[0]
        self.assertEqual(listed['photo_url'], place['photo_url'])
        self.assertEqual(listed['description'], 'intro')

    def test_map_and_list_show_same_current_bookmark_count(self):
        for expected in (1, 0):
            for endpoint in ('/homepage/api/places', '/trip-list/places'):
                with self.subTest(endpoint=endpoint, expected=expected):
                    self.assertEqual(self.fixture.public.get(endpoint).get_json()[0]['like_count'], expected)
            with self.app.app_context():
                Bookmark.query.filter_by(place_id=1).delete()
                db.session.commit()

    def test_map_api_handles_missing_photos(self):
        for photos in (None, '', ' , '):
            with self.subTest(photos=photos):
                with self.app.app_context():
                    db.session.get(TripLocationmd, 1).photos = photos
                    db.session.commit()
                place = self.fixture.public.get('/homepage/api/places').get_json()[0]
                self.assertIsNone(place['photo_url'])

    def test_guest_detail_gate_remains_and_member_link_is_not_intercepted(self):
        guest = self.fixture.public.get('/first/map').get_data(as_text=True)
        member = self.fixture.owner.get('/first/map').get_data(as_text=True)
        self.assertIn("link.addEventListener('click'", guest)
        self.assertNotIn("link.addEventListener('click'", member)
        self.assertIn('js/map_place_popup.js', guest)
        self.assertIn('css/map_place_popup.css', guest)
