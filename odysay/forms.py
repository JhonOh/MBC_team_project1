from flask_wtf import FlaskForm
from wtforms.fields.simple import (
    StringField,
    PasswordField,
    EmailField,
    SubmitField
)
from wtforms.validators import (
    Email,
    DataRequired,
    Length,
    EqualTo,
    ValidationError
)

from odysay.models import User


class UserCreateForm(FlaskForm):
    username = StringField(
        '사용자 이름',
        validators=[
            DataRequired(),
            Length(min=3, max=20)
        ]
    )

    password1 = PasswordField(
        '비밀번호',
        validators=[
            DataRequired(),
            EqualTo(
                'password2',
                message='비밀번호가 일치하지 않습니다.'
            )
        ]
    )

    password2 = PasswordField(
        '비밀번호 확인',
        validators=[DataRequired()]
    )

    email = EmailField(
        '이메일',
        validators=[
            DataRequired(),
            Email()
        ]
    )

    submit = SubmitField('회원가입')

    def validate_username(self, field):
        user = User.query.filter_by(
            username=field.data
        ).first()

        if user:
            raise ValidationError(
                '이미 존재하는 사용자입니다.'
            )

    def validate_email(self, field):
        user = User.query.filter_by(
            email=field.data
        ).first()

        if user:
            raise ValidationError(
                '이미 등록된 이메일입니다.'
            )


class LoginForm(FlaskForm):
    username = StringField(
        '사용자 이름',
        validators=[
            DataRequired(),
            Length(min=3, max=20)
        ]
    )

    password1 = PasswordField(
        '비밀번호',
        validators=[DataRequired()]
    )

    submit = SubmitField('로그인')