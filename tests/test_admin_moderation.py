import re
import unittest
from odysay import create_app, db
from odysay.models import (User, Uploadmd, TripLocationmd, Post, Comment, Review,
                          TravelTalk, TravelTalkComment, Bookmark, ContentModeration, ModerationLog)

class AdminModerationTests(unittest.TestCase):
    def setUp(self):
        self.app = create_app({'TESTING': True, 'SECRET_KEY':'test-admin-secret',
            'SQLALCHEMY_DATABASE_URI':'sqlite:///:memory:', 'ADMIN_USER_ID':1})
        with self.app.app_context():
            db.create_all()
            db.session.add_all([User(id=i, username=f'user{i}', email=f'user{i}@example.invalid', password_hash='unused') for i in (1,2,3)])
            values=dict(country='Korea',region='Seoul',place='Seed place',category='test',intro='intro',reason='reason',user_id=2,latitude=37,longitude=127)
            db.session.add(Uploadmd(id=1,**values));db.session.flush()
            db.session.add(TripLocationmd(id=1,place_id=1,**values))
            db.session.add(Post(id=1,title='Seed post',content='post body',category='free',user_id=2))
            db.session.flush()
            db.session.add_all([Comment(id=1,content='Seed comment',author='user2',user_id=2,post_id=1),Review(id=1,content='Seed review',rating=4,user_id=2,place_id=1),TravelTalk(id=1,title='Seed talk',content='talk body',user_id=2,place_id=1),Bookmark(user_id=3,place_id=1)])
            db.session.flush()
            db.session.add(TravelTalkComment(id=1,content='Seed reply',user_id=2,travel_talk_id=1))
            db.session.commit()
        self.admin=self.client(1);self.owner=self.client(2);self.other=self.client(3);self.public=self.app.test_client()

    def client(self, uid):
        client=self.app.test_client()
        with client.session_transaction() as session:session['user_id']=uid
        return client

    def token(self,client,path='/admin/place/1/edit'):
        response=client.get(path)
        self.assertEqual(response.status_code,200)
        return re.search(r'name="csrf_token" value="([^"]+)"',response.text).group(1)

    def action(self,kind,action,client=None,**extra):
        client=client or self.admin
        token=self.token(self.admin,f'/admin/{kind}/1/edit')
        return client.post(f'/admin/{kind}/1/{action}',data={'csrf_token':token,'moderation_reason':'test reason',**extra})

    def test_authorization_and_csrf(self):
        for client in (self.public,self.owner,self.other):
            self.assertEqual(client.get('/admin/').status_code,403)
            self.assertEqual(client.get('/admin/logs').status_code,403)
        self.assertEqual(self.admin.post('/admin/place/1/hide',data={'moderation_reason':'test'}).status_code,400)
        self.app.config['WTF_CSRF_ENABLED']=False
        for client in (self.public,self.owner,self.other):
            for action in ('hide','restore','edit'):
                self.assertEqual(client.post('/admin/place/1/'+action,data={'moderation_reason':'test'}).status_code,403)
        self.app.config['ADMIN_USER_ID']=''
        self.assertEqual(self.admin.get('/admin/').status_code,403)

    def test_hide_restore_parent_and_children(self):
        self.assertEqual(self.action('review','hide').status_code,302)
        self.assertEqual(self.action('place','hide').status_code,302)
        for client in (self.public,self.owner,self.admin):
            for path in ['/homepage/trip_location/1','/homepage/trip_location/feature/review/1','/homepage/trip_location/feature/travel-talk/comment/1']:
                self.assertEqual(client.get(path).status_code,404,path)
            self.assertEqual(client.get('/first/places').json,[])
            self.assertEqual(client.get('/trip-list/places').json,[])
            self.assertNotIn('Seed place',client.get('/homepage/community/api/places').text)
        self.assertEqual(self.admin.get('/admin/?kind=place&status=hidden').status_code,200)
        self.assertEqual(self.action('place','restore').status_code,302)
        self.assertEqual(self.public.get('/homepage/trip_location/1').status_code,200)
        self.assertNotIn('Seed review',self.public.get('/homepage/trip_location/feature/review/1').text)
        self.assertEqual(self.action('review','restore').status_code,302)
        self.assertIn('Seed review',self.public.get('/homepage/trip_location/feature/review/1').text)
        with self.app.app_context():
            self.assertEqual(TripLocationmd.query.count(),1)
            self.assertEqual(Review.query.count(),1)
            self.assertEqual(TravelTalkComment.query.count(),1)
            self.assertEqual(Bookmark.query.count(),1)
            self.assertEqual(ModerationLog.query.count(),4)

    def test_all_content_kinds_and_logs(self):
        for kind in ('place','post','review','comment','talk','talk_comment'):
            self.assertEqual(self.admin.get('/admin/?kind='+kind).status_code,200)
            self.assertEqual(self.action(kind,'hide').status_code,302)
            self.assertEqual(self.action(kind,'hide').status_code,302) # idempotent
            self.assertEqual(self.action(kind,'restore').status_code,302)
        with self.app.app_context():self.assertEqual(ModerationLog.query.count(),12)
        self.assertEqual(self.admin.get('/admin/logs').status_code,200)

    def test_post_comment_visibility_and_mutations(self):
        self.action('post','hide')
        self.assertEqual(self.public.get('/homepage/community/detail/post/1').status_code,404)
        self.app.config['WTF_CSRF_ENABLED']=False
        for path in ['/homepage/community/detail/api/comment/post/1','/homepage/community/detail/api/like/post/1']:
            self.assertEqual(self.owner.post(path,json={'content':'new'}).status_code,404)
        self.assertEqual(self.owner.post('/homepage/community/detail/api/comment/1',json={'content':'changed'}).status_code,404)
        self.action('post','restore')
        self.action('comment','hide')
        self.assertNotIn('Seed comment',self.public.get('/homepage/community/detail/post/1').text)
        self.action('comment','restore')
        self.assertIn('Seed comment',self.public.get('/homepage/community/detail/post/1').text)

    def test_edit_validation_sync_and_audit(self):
        data=dict(place='Edited place',country='Korea',region='Busan',category='test',intro='new intro',reason='new reason',latitude='35',longitude='129',moderation_reason='correct details',user_id='1')
        data['csrf_token']=self.token(self.admin)
        self.assertEqual(self.admin.post('/admin/place/1/edit',data=data).status_code,302)
        with self.app.app_context():
            place=db.session.get(TripLocationmd,1);upload=db.session.get(Uploadmd,1)
            self.assertEqual(place.user_id,2)
            self.assertEqual(place.place,upload.place)
            self.assertEqual(place.region,'Busan')
            log=ModerationLog.query.one()
            self.assertIn('Seed place',log.before_data);self.assertIn('Edited place',log.after_data)
        data['latitude']='nan'
        self.assertEqual(self.admin.post('/admin/place/1/edit',data=data).status_code,400)
        data['latitude']='35';data['photos']='../../secret'
        self.assertEqual(self.admin.post('/admin/place/1/edit',data=data).status_code,400)
        with self.app.app_context():self.assertEqual(ModerationLog.query.count(),1)

    def test_edit_each_kind_and_protect_hidden_children(self):
        self.app.config['WTF_CSRF_ENABLED']=False
        for kind, fields in [
            ('post', {'title':'Edited post','category':'free','content':'new post','photos':''}),
            ('review', {'rating':'5','content':'new review'}),
            ('comment', {'content':'new comment'}),
            ('talk', {'title':'Edited talk','content':'new talk'}),
            ('talk_comment', {'content':'new reply'}),
        ]:
            response=self.admin.post(f'/admin/{kind}/1/edit',data={**fields,'moderation_reason':'correction','user_id':'1'})
            self.assertEqual(response.status_code,302,kind)
        self.action('comment','hide')
        response=self.owner.post('/homepage/community/detail/api/post/delete/post/1')
        self.assertEqual(response.status_code,409)
        self.action('talk_comment','hide')
        self.assertEqual(self.owner.post('/homepage/trip_location/feature/travel-talk/delete/1').status_code,409)
        self.assertEqual(self.owner.post('/homepage/community/detail/api/post/delete/place/1').status_code,409)
        with self.app.app_context():
            self.assertEqual(ModerationLog.query.count(),7)
            self.assertEqual(db.session.get(Comment,1).user_id,2)
            self.assertEqual(db.session.get(TravelTalkComment,1).content,'new reply')

    def test_inactive_admin_and_blank_reason(self):
        self.assertEqual(self.action('place','hide',moderation_reason='').status_code,400)
        with self.app.app_context():
            db.session.get(User,1).is_active=False;db.session.commit()
        self.assertEqual(self.admin.get('/admin/').status_code,403)

if __name__=='__main__':unittest.main()
