import json
import unittest
from datetime import datetime, timedelta
from unittest.mock import Mock, patch

import requests
from sqlalchemy import select

from odysay import create_app, db
from odysay.models import (User, Uploadmd, TripLocationmd, Post, Review, TravelTalk,
                           Comment, TravelTalkComment, Inquiry, ContentTranslation, ContentModeration)
from odysay.services.translation import SOURCES, TranslationFailure, store_translation


class TranslationTests(unittest.TestCase):
    def setUp(self):
        self.app = create_app({'TESTING': True, 'SECRET_KEY': 'translation-tests',
            'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:', 'ADMIN_USER_ID': 1,
            'GEMINI_FREE_TIER_CONFIRMED': True, 'GEMINI_TRANSLATION_ENABLED': True,
            'GEMINI_TRANSLATION_MODEL': 'gemini-3.6-flash', 'GEMINI_API_KEY': 'test-not-real',
            'GEMINI_TRANSLATION_INTERVAL': 0})
        self.generate = Mock(side_effect=lambda values: {key: 'EN: ' + value for key, value in values.items()})
        self.app.extensions['gemini_translator'].translate = self.generate
        with self.app.app_context():
            db.create_all()
            db.session.add_all([User(id=i, username=f'user{i}', email=f'{i}@example.invalid', password_hash='unused') for i in (1,2,3)])
            values = dict(country='대한민국', region='서울', place='궁궐', category='관광지', intro='좋은 곳', reason='소개', user_id=2)
            db.session.add(Uploadmd(id=1, **values)); db.session.flush()
            db.session.add_all([TripLocationmd(id=1, place_id=1, **values),
                Post(id=1, title='제목', content='내용', category='여행 팁', user_id=2),
                Review(id=1, place_id=1, rating=5, content='리뷰', user_id=2),
                TravelTalk(id=1, place_id=1, title='여행톡', content='이야기', user_id=2),
                Comment(id=1, post_id=1, author='user2', content='댓글', user_id=2),
                TravelTalkComment(id=1, travel_talk_id=1, content='답글', user_id=2),
                Inquiry(id=1, title='문의 제목', content='비공개 내용', answer='답변', user_id=2)])
            db.session.commit()
        self.generate.reset_mock()
        self.public = self.app.test_client()
        self.owner = self.client(2)
        self.other = self.client(3)
        self.admin = self.client(1)

    def client(self, user_id):
        client = self.app.test_client()
        with client.session_transaction() as session:
            session['user_id'] = user_id
        return client

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def row(self, kind):
        return db.session.scalar(select(ContentTranslation).where(ContentTranslation.content_type == kind))

    def test_all_content_kinds_persist_english_without_replacing_originals(self):
        with self.app.app_context():
            self.assertEqual(ContentTranslation.query.count(), 7)
            for kind, (model, fields) in SOURCES.items():
                item = db.session.get(model, 1)
                row = self.row(kind)
                self.assertEqual(row.status, 'ready')
                for field in fields:
                    if getattr(item, field):
                        self.assertEqual(row.english[field], 'EN: ' + getattr(item, field))
            self.assertEqual(db.session.get(Uploadmd, 1).intro, '좋은 곳')
            self.assertEqual(db.session.get(TripLocationmd, 1).intro, '좋은 곳')

    def test_edit_only_changed_fields_and_non_content_writes_do_not_generate(self):
        with self.app.app_context():
            post = db.session.get(Post, 1)
            post.likes = 12
            db.session.commit()
            self.generate.assert_not_called()
            post.title = '수정한 제목'
            db.session.commit()
            self.generate.assert_called_once_with({'title': '수정한 제목'})
            self.assertEqual(self.row('post').english['content'], 'EN: 내용')

    def test_failure_preserves_originals_and_hides_stale_english(self):
        self.generate.side_effect = TranslationFailure('rate_limited', 3600)
        with self.app.app_context():
            post = db.session.get(Post, 1)
            post.title = '새로운 제목'
            db.session.commit()
            self.assertEqual(post.title, '새로운 제목')
            self.assertNotIn('title', self.row('post').english)
            self.assertEqual(self.row('post').english['content'], 'EN: 내용')
            store_translation(db.session, post)
            db.session.commit()
            self.assertEqual(self.generate.call_count, 1)

    def test_get_and_language_switch_reads_never_generate(self):
        for _ in range(3):
            for client in (self.public, self.owner):
                data = client.get('/api/translations?refs=place:1,post:1,review:1,talk:1,comment:1,talk_comment:1').json
                self.assertEqual(data['post:1']['fields']['title'], 'EN: 제목')
                self.assertNotIn('test-not-real', str(data))
        self.generate.assert_not_called()

    def test_private_and_hidden_content_cannot_leak(self):
        for client in (self.public, self.other):
            self.assertEqual(client.get('/api/translations?refs=inquiry:1').json, {})
        for client in (self.owner, self.admin):
            self.assertEqual(client.get('/api/translations?refs=inquiry:1').json['inquiry:1']['fields']['content'], 'EN: 비공개 내용')
        with self.app.app_context():
            db.session.add(ContentModeration(content_type='place', content_id=1, is_hidden=True, changed_by=1, reason='test'))
            db.session.commit()
        self.assertEqual(self.public.get('/api/translations?refs=place:1,review:1,talk:1,talk_comment:1').json, {})

    def test_retry_is_explicit_authenticated_and_csrf_protected(self):
        path = '/api/translations/post/1/retry'
        self.assertEqual(self.owner.post(path).status_code, 400)
        self.app.config['WTF_CSRF_ENABLED'] = False
        self.assertEqual(self.public.post(path).status_code, 401)
        self.assertEqual(self.other.post(path).status_code, 403)
        with self.app.app_context():
            row = self.row('post'); row.english = {'content': row.english['content']}; db.session.commit()
        self.assertEqual(self.owner.post(path).status_code, 200)
        self.generate.assert_called_once_with({'title': '제목'})

    def test_existing_routes_create_and_update_using_the_same_hook(self):
        self.app.config['WTF_CSRF_ENABLED'] = False
        response = self.owner.post('/homepage/trip_location/feature/review/1', json={'rating': 4, 'content': '새 리뷰'})
        self.assertEqual(response.status_code, 200)
        self.generate.assert_called_once_with({'content': '새 리뷰'})
        review_id = response.json['review']['id']
        self.generate.reset_mock()
        response = self.owner.post(f'/homepage/trip_location/feature/review/edit/{review_id}', json={'rating': 3, 'content': '수정 리뷰'})
        self.assertEqual(response.status_code, 200)
        self.generate.assert_called_once_with({'content': '수정 리뷰'})

    def test_backfill_only_missing_fields_and_disabled_gate(self):
        with self.app.app_context():
            row = self.row('post'); row.english = {'title': 'Manually corrected title'}; db.session.commit()
        result = self.app.test_cli_runner().invoke(args=['translate-missing', '--limit', '1'])
        self.assertEqual(result.exit_code, 0, result.output)
        self.generate.assert_called_once_with({'content': '내용'})
        self.generate.reset_mock()
        result = self.app.test_cli_runner().invoke(args=['translate-missing'])
        self.assertEqual(result.exit_code, 0, result.output)
        self.generate.assert_not_called()
        self.app.config['GEMINI_FREE_TIER_CONFIRMED'] = False
        result = self.app.test_cli_runner().invoke(args=['translate-missing'])
        self.assertNotEqual(result.exit_code, 0)
        self.generate.assert_not_called()

    def test_provider_request_has_no_paid_features_and_stops_on_quota(self):
        from odysay.services.translation import GeminiTranslator
        provider = GeminiTranslator()
        with self.app.app_context(), patch('odysay.services.translation.requests.post') as post:
            post.return_value = Mock(status_code=200, json=lambda: {'candidates': [{'finishReason': 'STOP', 'content': {'parts': [{'text': json.dumps({'title': 'Hello'})}]}}]})
            self.assertEqual(provider.translate({'title':'안녕'}), {'title': 'Hello'})
            self.assertNotIn('tools', post.call_args.kwargs['json'])
            self.assertNotIn('test-not-real', post.call_args.args[0])
            post.return_value = Mock(status_code=429)
            with self.assertRaises(TranslationFailure): provider.translate({'title':'다음'})
            with self.assertRaises(TranslationFailure): provider.translate({'title':'다음'})
            self.assertEqual(post.call_count, 2)
            self.app.config['GEMINI_FREE_TIER_CONFIRMED'] = False
            with self.assertRaises(TranslationFailure): GeminiTranslator().translate({'title':'안녕'})
            self.assertEqual(post.call_count, 2)

    def test_rolled_back_original_never_calls_gemini(self):
        with self.app.app_context():
            db.session.add(Post(title='저장 취소', content='내용', category='여행 팁', user_id=2))
            db.session.flush()
            self.generate.assert_not_called()
            db.session.rollback()
            self.generate.assert_not_called()
            self.assertEqual(Post.query.count(), 1)

    def test_provider_or_translation_db_failure_does_not_undo_original(self):
        self.generate.side_effect = RuntimeError('test-only unexpected failure')
        with self.app.app_context():
            post = db.session.get(Post, 1)
            post.content = '반드시 보존할 원문'
            db.session.commit()
            self.assertEqual(db.session.get(Post, 1).content, '반드시 보존할 원문')
            self.assertEqual(self.row('post').status, 'pending')


if __name__ == '__main__':
    unittest.main()
