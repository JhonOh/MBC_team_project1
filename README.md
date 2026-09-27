# Odysay 통합본 — 2026-09-23

## 통합 기준

- 화면·폼·회원가입·로그인·닉네임 확인·프로필 모델: `26.09.23.zip` 기준.
- API 제공자와 검색 순서: `26.09.23 디벨롭.zip`의 Gemini 명칭 교정 → 국내 카카오 장소 검색 → OpenStreetMap/Nominatim 대체 검색.
- 지도: 디벨롭의 Leaflet + OpenStreetMap. 일반 ZIP의 로그인 카드·별도 회원가입 화면·여행 둘러보기 버튼은 유지.
- 일반 ZIP의 여행지 등록 화면과 위치 선택 UX 유지. `/homepage/geocode`의 내부 제공자를 Geoapify에서 디벨롭의 검색 방식으로 교체. 디벨롭처럼 첫 성공 결과 1개를 반환하며, 지역/국가 단위 대체 위치는 선택 목록에 표시.
- Gemini·카카오 키는 서버의 `.env`에서 읽음. Geoapify·MapTiler는 더 이상 사용하지 않음.
- API 키 원문, 원본 DB, 가상환경, Git 이력, 사용자 업로드 파일은 배포 ZIP에 포함하지 않음. 원본 ZIP과 D: 프로젝트는 수정하지 않음.

## 처음 실행 — 새 폴더에 압축 해제

`config.py`와 `requirements.txt`가 있는 `odysay-integrated` 폴더에서 CMD로 실행하세요. 기존 프로젝트 위에 바로 덮어쓰지 마세요.

```bat
python -m venv .venv
.venv\Scripts\activate
python -m pip install -r requirements.txt
python setup_env.py
```

`setup_env.py`는 새 `.env`에 무작위 SECRET_KEY를 생성합니다. 기존 `.env`는 덮어쓰지 않습니다. `.env`를 메모장으로 열어 개인 키를 입력하세요.

```dotenv
SECRET_KEY=자동생성된_값_유지
GEMINI_API_KEY=본인의_Gemini_키
KAKAO_REST_API_KEY=본인의_카카오_REST_API_키
GEMINI_MODEL=gemini-3.6-flash
```

GEMINI_MODEL 기본값은 디벨롭 원본의 값입니다. 해당 모델의 실제 사용 가능 여부는 검증하지 않았으므로 본인 계정에서 사용할 수 있는 모델 ID로 바꾸세요. 키가 비어 있으면 해당 제공자를 건너뛰며 OpenStreetMap 검색을 시도합니다. 인터넷 연결이 없거나 검색이 모두 실패하면 위치 검색 오류를 안내하고 등록을 막습니다.

```bat
python -m flask --app odysay db upgrade
python -m flask --app odysay db check
python -m flask --app odysay run --debug
```

http://127.0.0.1:5000/ 에서 확인하세요. 이 통합본에는 migrations가 들어 있으므로 `db init`이나 초기 `db migrate`를 다시 실행하지 않습니다. debug 실행은 로컬 개발용입니다.

## 기존 데이터 사용

### 26.09.23.zip의 DB를 사용하려면

이 ZIP의 DB 복사본은 통합본 모델과 일치하고 revision `63ad418aa07f`임을 확인했습니다. 원본 DB의 레코드 수가 upgrade/check 전후 유지되는 것도 검사했습니다.

1. 서버를 종료하고 기존 DB 및 `odysay/static/uploads`를 별도로 백업합니다.
2. 아직 새 DB를 만들기 전인 새 통합 폴더에 일반 ZIP의 `odysay.db`를 복사합니다.
3. 이미지가 필요한 경우 일반 ZIP의 `odysay/static/uploads`도 같은 상대 위치로 복사합니다.
4. `db upgrade`, `db check` 후 실행합니다.

### 디벨롭 ZIP 또는 다른 DB를 사용하려면

디벨롭 DB에는 회원가입 프로필 컬럼과 정상적인 migration revision 이력이 부족합니다. 그대로 복사한 뒤 `db upgrade` 또는 임의 `db stamp head`를 실행하지 마세요. 데이터 보존이 필요하면 별도 스키마 이관이 필요합니다. 기본 실행 절차는 새 DB 생성 기준입니다.

## 통합하면서 수정한 연결 오류

- `/homepage/map`은 `/first/map`으로 redirect. 템플릿 이름에 endpoint를 전달하던 오류 제거.
- 별도 app.py는 앱 팩토리만 호출. `python -m odysay.app`으로도 실행 가능.
- 앱 시작 시 db.create_all() 제거. DB 구조는 migration으로 관리.
- 로그인 POST·가입 후 자동 로그인·닉네임 검사·닉네임/생년월일/성별 폼 유지. GET `/auth/login/`도 로그인 카드로 이동.
- 여행지 등록 완료 후 일반 ZIP과 같이 해당 상세 화면으로 이동. 지도 API에서도 저장된 좌표 조회 가능.
- 전역 CSRF 보호 및 업로드 폼 토큰 추가. 등록 오류 시 입력 화면을 유지하고 안내.
- 필수 값·문자 수·사진 수·확장자/기본 파일 시그니처·전체 요청 20MB 제한 추가. 파일명은 UUID 사용, DB 실패 시 저장 파일 정리.
- 지도 팝업은 textContent를 사용하고 0도 좌표도 포함.
- API 키 누락, AI 응답 형식 오류, 외부 타임아웃 처리. 예외에서 키가 노출되지 않도록 로그에는 오류 유형만 기록.
- 없는 settings.js 참조와 홈페이지의 잘못된 링크/스크립트 잔여 문자열 정리.

## migration 변경 설명

일반 ZIP의 초기 이력에는 travel_places 생성이 없는데 후속 revision은 그 테이블에 좌표를 추가하고 있었습니다. 그래서 기존 DB는 있어도 빈 DB의 upgrade는 실패하는 구조였습니다.

`63ad418aa07f_add_travel_place_coordinates.py`의 revision ID와 선행 ID는 유지하고, 테이블이 없는 경우에만 기본 테이블을 생성한 뒤 없는 좌표 컬럼을 추가하도록 보완했습니다. 이미 이 revision에 도달한 일반 ZIP DB는 다시 수정되지 않습니다. 기존 migration 파일의 본문을 보완한 것이므로 실제 main에 다른 이력이 있다면 파일과 revision을 비교해야 합니다. downgrade 경로는 이번 검증 범위가 아닙니다.

## 확인한 내용

- 통합 테스트 11개 성공: 페이지 렌더, 가입 프로필 저장/닉네임 확인/로그인, 위치 검색과 선택/사진 등록/상세/API, 오래된 위치 선택 거부, CSRF/잘못된 선택 거부, 이미지 위장 파일 거부, 0도 좌표, 외부 장애, AI→카카오 전달, 지역 단위 대체 검색, 신규 및 일반 ZIP DB migration.
- 실제 Flask·ORM·폼·SDK 사용. 외부 네트워크 응답만 테스트 대역으로 대체했고 실제 API 비용 발생 요청은 하지 않았음.
- 외부 JS 및 렌더된 인라인 JS 문법 10개 검사 통과. 검사한 주요 화면에서 로컬 정적 파일 누락 없음.
- 로컬 Python 의존성 `pip check` 통과. 깨끗한 가상환경에서 전체 버전 다운로드/설치는 별도 미검증.
- 원본에 포함된 하드코딩 제공자 키가 결과 코드에 남지 않았는지 검사.
- 브라우저에서 CDN 지도 타일을 포함한 실제 화면/실제 제공자 검색은 본인의 환경에서 확인 필요.

## 확인 순서

1. 지도 로그인 카드 → 별도 회원가입 → 닉네임 중복 확인 → 가입 완료/자동 로그인.
2. 로그아웃 → 로그인.
3. 여행 둘러보기 → 여행지 등록 → 나라/지역/장소 입력 → 위치 검색 → 결과 선택.
4. 소개·이유·카테고리·동의 입력 → 선택적으로 사진 첨부 → 등록 → 상세 화면.
5. 지도에서 마커 선택 → 상세보기.
6. 위치 검색 후 장소를 바꾸면 다시 검색해야 함. 지역 단위 결과는 정확한 건물 위치가 아니므로 안내를 확인하고 선택.

## Git에 올릴 때

`.env`, DB, 백업, 가상환경, 사용자 업로드는 `.gitignore`에서 제외합니다. migrations는 Git에 포함합니다. `.gitignore`는 이미 추적 중인 파일까지 제거하지는 않으므로 커밋 전에 실제 변경 파일을 확인하세요.

원본 파일에 실제 키로 보이는 문자열이 있었으므로 해당 제공자의 기존 키는 교체하고 새 값만 로컬 `.env`에 입력하는 것을 권장합니다.

마이페이지·설정 저장, 실제 여행지 목록 데이터 연동 등 원본에서 구현되지 않은 기능은 이번 API/폼 통합 범위에 새로 구현하지 않았습니다. 해당 화면의 렌더링 성공이 기능 완성을 뜻하지 않습니다.
