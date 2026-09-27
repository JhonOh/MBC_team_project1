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
from datetime import date
from wtforms import DateField, SelectField

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
    nickname = StringField(
        '닉네임',
        filters=[lambda value: value.strip() if value else value],
        validators=[
            DataRequired(),
            Length(min=2, max=20)
        ]
    )

    birth_date = DateField(
        '생년월일',
        validators=[DataRequired()]
    )

    gender = SelectField(
        '성별',
        choices=[
            ('', '선택하세요'),
            ('male', '남성'),
            ('female', '여성'),
        ],
        validators=[DataRequired()]
    )

    def validate_nickname(self, field):
        user = User.query.filter_by(nickname=field.data).first()

        if user:
            raise ValidationError('이미 사용 중인 닉네임입니다.')

    def validate_birth_date(self, field):
        if field.data > date.today():
            raise ValidationError('생년월일은 오늘 이후일 수 없습니다.')

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