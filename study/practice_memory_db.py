"""Run from repository root: .venv/Scripts/python.exe study/practice_memory_db.py"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from odysay import create_app, db
from odysay.models import User, Uploadmd, TripLocationmd, Comment

app = create_app({'TESTING': True, 'SECRET_KEY': 'study-only-not-production',
                  'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:'})
with app.app_context():
    # Only this process's memory DB is created. No production upgrade or network request.
    db.create_all()
    owner = User(username='learner', email='learner@example.invalid', password_hash='not-a-login-password')
    other = User(username='other', email='other@example.invalid', password_hash='not-a-login-password')
    db.session.add_all([owner, other])
    db.session.flush()
    print('1. flush assigned user IDs:', owner.id, other.id)
    for user, title in [(owner, 'My first place'), (other, 'Another user place')]:
        values = dict(country='Korea', region='Seoul', place=title, category='study',
                      intro='A learning example', reason='Practice', user_id=user.id)
        upload = Uploadmd(**values)
        db.session.add(upload)
        db.session.flush()
        db.session.add(TripLocationmd(place_id=upload.id, **values))
    db.session.commit()
    mine = TripLocationmd.query.filter_by(user_id=owner.id).all()
    assert len(mine) == 1
    print('2. total places:', TripLocationmd.query.count(), '/ mine:', len(mine))
    note = Comment(content='Test comment', author='Learner', user_id=owner.id, travel_place_id=mine[0].id)
    db.session.add(note)
    db.session.commit()
    assert len(mine[0].comments) == 1
    print('3. relationship: place.comments contains', len(mine[0].comments), 'comment')
    mine[0].intro = 'Unsaved edit'
    db.session.flush()
    db.session.rollback()
    assert mine[0].intro == 'A learning example'
    print('4. rollback restored intro:', mine[0].intro)
    client = app.test_client()
    response = client.get('/homepage/mypage/places')
    assert response.status_code == 302
    print('5. anonymous GET:', response.status_code)
    # Set the session only to isolate page rendering, not to test password validation.
    with client.session_transaction() as session:
        session['user_id'] = owner.id
    response = client.get('/homepage/mypage/places')
    assert response.status_code == 200
    assert 'My first place' in response.text and 'Another user place' not in response.text
    assert 'css/trip_list.css' in response.text
    print('6. signed-in GET:', response.status_code, '/ only owner card rendered')
    print('PASS: original DB unchanged; memory data disappears when this process ends.')
