from odysay import db


class User(db.model):
    id = db.column(db.Integer,primary_key=True)
    username = db.Column(db.string(50), unique=True, nullable=False)
    email = db.Column(db.string(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)