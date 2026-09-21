from flask_wtf import FlaskForm
from wtforms.fields.simple import StringField, PasswordField, EmailField, SubmitField
from wtforms.validators import Email, DataRequired, Length, EqualTo

from odysay.models import User


class UserCreateForm(FlaskForm):
    username = StringField('사용자 이름', validators=[DataRequired(), Length(min=3, max=20)])
    password1 = PasswordField('비밀번호', validators=[DataRequired(), EqualTo('password2',message='비밀번호가 일치하지 않습니다.')])
    password2 = PasswordField('비밀번호 확인', validators=[DataRequired()])
    email = EmailField('이메일', validators=[DataRequired(), Email()])
    submit = SubmitField('회원가입')