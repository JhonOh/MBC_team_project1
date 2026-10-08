const countries = [
    '가나',
    '가봉',
    '가이아나',
    '감비아',
    '과테말라',
    '그레나다',
    '그리스',
    '기니',
    '기니비사우',
    '나미비아',
    '나우루',
    '나이지리아',
    '남수단',
    '남아프리카공화국',
    '네덜란드',
    '네팔',
    '노르웨이',
    '뉴질랜드',
    '니제르',
    '니카라과',
    '대한민국',
    '덴마크',
    '도미니카공화국',
    '도미니카연방',
    '독일',
    '동티모르',
    '라오스',
    '라이베리아',
    '라트비아',
    '러시아',
    '레바논',
    '레소토',
    '루마니아',
    '룩셈부르크',
    '르완다',
    '리비아',
    '리투아니아',
    '리히텐슈타인',
    '마다가스카르',
    '마셜제도',
    '말라위',
    '말레이시아',
    '말리',
    '멕시코',
    '모나코',
    '모로코',
    '모리셔스',
    '모리타니',
    '모잠비크',
    '몬테네그로',
    '몰도바',
    '몰디브',
    '몰타',
    '몽골',
    '미국',
    '미얀마',
    '미크로네시아연방',
    '바누아투',
    '바레인',
    '바베이도스',
    '바하마',
    '바티칸 시국',
    '방글라데시',
    '베냉',
    '베네수엘라',
    '베트남',
    '벨기에',
    '벨라루스',
    '벨리즈',
    '보스니아 헤르체고비나',
    '보츠와나',
    '볼리비아',
    '부룬디',
    '부르키나파소',
    '부탄',
    '북마케도니아',
    '북한',
    '불가리아',
    '브라질',
    '브루나이',
    '사모아',
    '사우디아라비아',
    '산마리노',
    '상투메 프린시페',
    '세네갈',
    '세르비아',
    '세이셸',
    '세인트루시아',
    '세인트빈센트 그레나딘',
    '세인트키츠 네비스',
    '소말리아',
    '솔로몬제도',
    '수단',
    '수리남',
    '스리랑카',
    '스웨덴',
    '스위스',
    '스페인',
    '슬로바키아',
    '슬로베니아',
    '시리아',
    '시에라리온',
    '싱가포르',
    '아랍에미리트',
    '아르메니아',
    '아르헨티나',
    '아이슬란드',
    '아이티',
    '아일랜드',
    '아제르바이잔',
    '아프가니스탄',
    '안도라',
    '알바니아',
    '알제리',
    '앙골라',
    '앤티가 바부다',
    '에리트레아',
    '에스토니아',
    '에콰도르',
    '에스와티니',
    '에티오피아',
    '엘살바도르',
    '영국',
    '예멘',
    '오만',
    '오스트레일리아',
    '오스트리아',
    '온두라스',
    '요르단',
    '우간다',
    '우루과이',
    '우즈베키스탄',
    '우크라이나',
    '이라크',
    '이란',
    '이스라엘',
    '이집트',
    '이탈리아',
    '인도',
    '인도네시아',
    '일본',
    '자메이카',
    '잠비아',
    '적도 기니',
    '조지아',
    '중앙아프리카공화국',
    '중국',
    '지부티',
    '짐바브웨',
    '차드',
    '체코',
    '칠레',
    '카메룬',
    '카보베르데',
    '카자흐스탄',
    '카타르',
    '캄보디아',
    '캐나다',
    '케냐',
    '코모로',
    '코스타리카',
    '코트디부아르',
    '콜롬비아',
    '콩고공화국',
    '콩고민주공화국',
    '쿠바',
    '쿠웨이트',
    '크로아티아',
    '키르기스스탄',
    '키리바시',
    '키프로스',
    '타지키스탄',
    '탄자니아',
    '태국',
    '토고',
    '통가',
    '투르크메니스탄',
    '투발루',
    '튀니지',
    '튀르키예',
    '트리니다드 토바고',
    '파나마',
    '파라과이',
    '파키스탄',
    '파푸아뉴기니',
    '팔라우',
    '팔레스타인',
    '페루',
    '포르투갈',
    '폴란드',
    '프랑스',
    '피지',
    '핀란드',
    '필리핀',
    '헝가리'
]

/*
 * One canonical country catalog for every country picker.
 * `countries` above remains available for older code, while the API below
 * adds ISO metadata, English display names and cross-language lookup.
 */
const COUNTRY_CODE_LIST = `
GH GA GY GM GT GD GR GN GW NA NR NG SS ZA NL NP NO NZ NE NI KR DK DO DM
DE TL LA LR LV RU LB LS RO LU RW LY LT LI MG MH MW MY ML MX MC MA MU MR MZ
ME MD MV MT MN US MM FM VU BH BB BS VA BD BJ VE VN BE BY BZ BA BW BO BI BF
BT MK KP BG BR BN WS SA SM ST SN RS SC LC VC KN SO SB SD SR LK SE CH ES SK
SI SY SL SG AE AM AR IS HT IE AZ AF AD AL DZ AO AG ER EE EC SZ ET SV GB YE
OM AU AT HN JO UG UY UZ UA IQ IR IL EG IT IN ID JP JM ZM GQ GE CF CN DJ ZW
TD CZ CL CM CV KZ QA KH CA KE KM CR CI CO CG CD CU KW HR KG KI CY TJ TZ TH
TG TO TM TV TN TR TT PA PY PK PG PW PS PE PT PL FR FJ FI PH HU
`.trim().split(/\s+/);

const countryCodeByKorean = Object.freeze(Object.fromEntries(
    countries.map((name, index) => [name, COUNTRY_CODE_LIST[index]])
));

const CONTINENT_CODES = Object.freeze({
    asia: new Set(`KR NP TL LA LB MY MV MN MM BH BD VN BT BN SA LK SG AE AM AZ AF YE OM JO UZ IQ IR IL IN ID JP GE CN KZ QA KH KW KG TJ TH TR TM PK PH KP SY PS`.split(' ')),
    europe: new Set(`GR NL NO DK DE LV RU RO LU LT LI MC ME MD MT VA BE BY BA MK BG SM RS SE CH ES SK SI IS IE AL EE GB AT UA IT CZ HR CY PT PL FR FI HU AD`.split(' ')),
    america: new Set(`GY GT GD NI DO DM MX US BB BS VE BZ BO BR LC VC KN SR AR HT AG EC SV HN UY JM CA CR CO CU TT PA PY PE CL`.split(' ')),
    oceania: new Set(`NR NZ MH FM VU WS SB KI TO TV PG PW FJ AU`.split(' ')),
    africa: new Set(`GH GA GM GN GW NA NG SS ZA NE LR LS RW LY MG MW ML MA MU MR MZ BJ BW BI BF ST SN SC SO SD SL DZ AO SZ ET ER UG EG ZM GQ CF DJ ZW TD CM CV KE KM CI CG CD TZ TG TN`.split(' '))
});

const COUNTRY_ALIASES = Object.freeze({
    '대한민국': ['한국', 'South Korea', 'Republic of Korea', 'Korea, South', 'ROK'],
    '북한': ['North Korea', 'Democratic People’s Republic of Korea', 'DPRK'],
    '미국': ['United States', 'United States of America', 'USA', 'US', 'America'],
    '영국': ['United Kingdom', 'UK', 'Great Britain', 'Britain'],
    '오스트레일리아': ['호주', 'Australia'],
    '체코': ['Czechia', 'Czech Republic'],
    '튀르키예': ['Turkey', 'Türkiye'],
    '코트디부아르': ["Côte d’Ivoire", "Cote d'Ivoire", 'Ivory Coast'],
    '콩고공화국': ['Republic of the Congo', 'Congo Republic', 'Congo-Brazzaville'],
    '콩고민주공화국': ['Democratic Republic of the Congo', 'DR Congo', 'DRC', 'Congo-Kinshasa'],
    '도미니카공화국': ['Dominican Republic', '도미니카 공화국'],
    '도미니카연방': ['Dominica', '도미니카 연방'],
    '마셜제도': ['Marshall Islands', '마셜 제도'],
    '미크로네시아연방': ['Micronesia', 'Federated States of Micronesia', '미크로네시아'],
    '솔로몬제도': ['Solomon Islands', '솔로몬 제도'],
    '바티칸 시국': ['Vatican City', 'Holy See', 'Vatican'],
    '팔레스타인': ['Palestine', 'Palestinian Territories'],
    '동티모르': ['Timor-Leste', 'East Timor'],
    '북마케도니아': ['North Macedonia', 'Macedonia'],
    '에스와티니': ['Eswatini', 'Swaziland'],
    '카보베르데': ['Cabo Verde', 'Cape Verde'],
    '라오스': ['Laos', "Lao People's Democratic Republic"],
    '몰도바': ['Moldova', 'Republic of Moldova'],
    '브루나이': ['Brunei', 'Brunei Darussalam'],
    '볼리비아': ['Bolivia', 'Plurinational State of Bolivia'],
    '시리아': ['Syria', 'Syrian Arab Republic'],
    '러시아': ['Russia', 'Russian Federation'],
    '대만': ['Taiwan']
});

function normalizeCountryKey(value) {
    return String(value || '')
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase('en-US')
        .replace(/[\s\-_.(),'’]/g, '');
}

function getChosung(value) {
    const cho = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
    return [...String(value || '')].map((char) => {
        const code = char.charCodeAt(0) - 44032;
        return code >= 0 && code <= 11171 ? cho[Math.floor(code / 588)] : char;
    }).join('');
}

function getEnglishCountryName(code, fallback) {
    try {
        return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) || fallback;
    } catch (_) {
        return fallback;
    }
}

function getContinent(code) {
    return Object.keys(CONTINENT_CODES).find((continent) => CONTINENT_CODES[continent].has(code)) || 'other';
}

function flagFromCode(code) {
    if (!/^[A-Z]{2}$/.test(code || '')) return '🌐';
    return [...code].map((letter) => String.fromCodePoint(letter.charCodeAt(0) + 127397)).join('');
}

const countryCatalog = Object.freeze(countries.map((ko) => {
    const code = countryCodeByKorean[ko];
    const en = getEnglishCountryName(code, ko);
    const aliases = Object.freeze(COUNTRY_ALIASES[ko] || []);
    return Object.freeze({
        ko,
        en,
        code,
        continent: getContinent(code),
        aliases,
        flag: flagFromCode(code)
    });
}));

const countryByKorean = new Map(countryCatalog.map((country) => [country.ko, country]));
const countryAliasIndex = new Map();

countryCatalog.forEach((country) => {
    [country.ko, country.en, ...country.aliases].forEach((name) => {
        countryAliasIndex.set(normalizeCountryKey(name), country.ko);
    });
});

function canonicalizeCountry(value) {
    return countryAliasIndex.get(normalizeCountryKey(value)) || null;
}

function getCountry(value) {
    const canonical = canonicalizeCountry(value) || value;
    return countryByKorean.get(canonical) || null;
}

function countrySearchScore(country, query, queryInitials) {
    const normalizedQuery = normalizeCountryKey(query);
    const terms = [country.ko, country.en, ...country.aliases].map(normalizeCountryKey);
    const isInitialSearch = /^[ㄱ-ㅎ]+$/.test(String(query || '').trim());
    if (terms.some((term) => term === normalizedQuery)) return 0;
    if (terms.some((term) => term.startsWith(normalizedQuery))) return 1;
    if (isInitialSearch && getChosung(country.ko).startsWith(queryInitials)) return 2;
    return 3;
}

function searchCountries(query = '') {
    const normalizedQuery = normalizeCountryKey(query);
    const queryInitials = getChosung(query).trim();
    const isInitialSearch = /^[ㄱ-ㅎ]+$/.test(String(query || '').trim());

    const matches = countryCatalog.filter((country) => {
        if (!normalizedQuery) return true;
        const terms = [country.ko, country.en, ...country.aliases].map(normalizeCountryKey);
        return terms.some((term) => term.includes(normalizedQuery)) ||
            (isInitialSearch && getChosung(country.ko).includes(queryInitials));
    });

    return matches.sort((a, b) => {
        const scoreDifference = countrySearchScore(a, query, queryInitials) - countrySearchScore(b, query, queryInitials);
        return scoreDifference || a.ko.localeCompare(b.ko, 'ko-KR');
    });
}

window.OdysayCountries = Object.freeze({
    all: countryCatalog,
    canonicalize: canonicalizeCountry,
    get: getCountry,
    search: searchCountries,
    displayName(value, language = 'ko') {
        const country = getCountry(value);
        if (!country) return value || '';
        return language === 'en' ? country.en : country.ko;
    },
    flag(value) {
        return getCountry(value)?.flag || '🌐';
    },
    getChosung,
    normalize: normalizeCountryKey
});
