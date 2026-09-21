from odysay import db


class User(db.Model):
<<<<<<< HEAD
    id = db.Column(db.Integer,primary_key=True)
=======
    id = db.Column(db.Integer, primary_key=True)
>>>>>>> bb936679cc1811d879f19ae6d02c23497539274e
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)