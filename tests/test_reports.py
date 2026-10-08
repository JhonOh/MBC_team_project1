from test_admin_moderation import AdminModerationTests
from odysay import db
from odysay.models import ContentReport, Post


class ReportTests(AdminModerationTests):
    def test_report_flow(self):
        self.app.config['WTF_CSRF_ENABLED'] = False
        for kind in ('post', 'place', 'review', 'talk', 'talk_comment', 'comment'):
            path = f'/api/reports/{kind}/1'
            self.assertEqual(self.public.post(path, json={'reason': 'spam'}).status_code, 401)
            self.assertEqual(self.other.post(path, json={'reason': 'spam'}).status_code, 201)
            self.assertEqual(self.other.post(path, json={'reason': 'spam'}).status_code, 200)
        with self.app.app_context():
            self.assertEqual(ContentReport.query.count(), 6)
        self.assertEqual(self.other.get('/admin/reports').status_code, 403)
        self.assertIn('spam', self.admin.get('/admin/reports').text)
        self.assertEqual(self.other.post('/admin/reports/1/resolve', data={'status': 'resolved', 'resolution': 'done'}).status_code, 403)
        self.assertEqual(self.admin.post('/admin/reports/1/resolve', data={'status': 'resolved', 'resolution': 'done'}).status_code, 302)
        self.assertEqual(self.admin.post('/admin/reports/1/resolve', data={'status': 'dismissed', 'resolution': 'overwrite'}).status_code, 302)
        with self.app.app_context():
            report = db.session.get(ContentReport, 1)
            self.assertEqual(report.status, 'resolved')
            self.assertEqual(report.resolved_by, 1)
            self.assertEqual(report.resolution, 'done')
            db.session.delete(db.session.get(Post, 1))
            db.session.commit()
        self.assertIn('post body', self.admin.get('/admin/reports?status=resolved').text)

    def test_report_validation_and_csrf(self):
        path = '/api/reports/post/1'
        self.assertEqual(self.other.post(path, json={'reason': 'spam'}).status_code, 400)
        import re
        response = self.other.get('/homepage/community/detail/post/1')
        token = re.search(r'name="csrf-token" content="([^"]+)"', response.text).group(1)
        self.assertEqual(self.other.post(path, json={'reason': 'spam'}, headers={'X-CSRFToken': token}).status_code, 201)
        self.app.config['WTF_CSRF_ENABLED'] = False
        for data in ({}, [], {'reason': ' '}, {'reason': 5}, {'reason': 'a' * 501}):
            self.assertEqual(self.other.post(path, json=data).status_code, 400)
        self.assertEqual(self.other.post('/api/reports/post/999', json={'reason': 'spam'}).status_code, 404)
        self.assertEqual(self.other.post('/api/reports/invalid/1', json={'reason': 'spam'}).status_code, 404)
        self.action('post', 'hide')
        self.assertEqual(self.other.post(path, json={'reason': 'spam'}).status_code, 404)
