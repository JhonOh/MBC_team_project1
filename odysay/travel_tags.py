TRAVEL_TAG_CHOICES = (
    ('nature', '자연'),
    ('food', '미식'),
    ('culture', '문화'),
    ('relaxation', '휴양'),
    ('activity', '액티비티'),
    ('shopping', '쇼핑'),
)

TRAVEL_TAG_LABELS = dict(TRAVEL_TAG_CHOICES)

MAX_TRAVEL_TAGS = 3


def validate_travel_tags(values):
    """입력 태그를 검증하고 중복을 제거합니다."""
    if not isinstance(values, (list, tuple)):
        raise ValueError('여행 태그는 목록으로 전달해야 합니다.')

    selected = []

    for value in values:
        if not isinstance(value, str):
            raise ValueError('올바르지 않은 여행 태그입니다.')

        if value not in TRAVEL_TAG_LABELS:
            raise ValueError('허용되지 않은 여행 태그입니다.')

        if value not in selected:
            selected.append(value)

    if len(selected) > MAX_TRAVEL_TAGS:
        raise ValueError('여행 태그는 최대 3개까지 선택할 수 있습니다.')

    return selected