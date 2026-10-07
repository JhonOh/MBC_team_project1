from pathlib import Path
import re, html
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, KeepTogether
from reportlab.lib.enums import TA_LEFT

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'output/pdf/odysay-study-guide.pdf'
pdfmetrics.registerFont(TTFont('Korean','C:/Windows/Fonts/malgun.ttf'))
pdfmetrics.registerFont(TTFont('KoreanBold','C:/Windows/Fonts/malgunbd.ttf'))
pdfmetrics.registerFontFamily('Korean',normal='Korean',bold='KoreanBold',italic='Korean',boldItalic='KoreanBold')
W,H=420,650
styles={
 'body':ParagraphStyle('body',fontName='Korean',fontSize=10.5,leading=17,spaceAfter=7,wordWrap='CJK',textColor=colors.HexColor('#27374b')),
 'h1':ParagraphStyle('h1',fontName='KoreanBold',fontSize=21,leading=29,spaceAfter=18,wordWrap='CJK',textColor=colors.HexColor('#173957'),keepWithNext=True),
 'h2':ParagraphStyle('h2',fontName='KoreanBold',fontSize=15,leading=22,spaceBefore=16,spaceAfter=10,wordWrap='CJK',textColor=colors.HexColor('#173957'),keepWithNext=True),
 'h3':ParagraphStyle('h3',fontName='KoreanBold',fontSize=12,leading=18,spaceBefore=10,spaceAfter=7,wordWrap='CJK',keepWithNext=True),
 'code':ParagraphStyle('code',fontName='Korean',fontSize=8,leading=12,spaceAfter=0,wordWrap='CJK',backColor=colors.HexColor('#f0f4f8'),borderPadding=4),
 'small':ParagraphStyle('small',fontName='Korean',fontSize=9,leading=14,spaceAfter=5,wordWrap='CJK',textColor=colors.HexColor('#53657a'))}
def inline(s):
 s=re.sub(r'\[([^\]]+)\]\([^)]+\)',r'\1',s)
 s=s.replace('—','-').replace('–','-').replace('└','+').replace('├','+').replace('──','--').replace('│','|').replace('↑','^')
 s=s.replace('- [ ]','[  ]')
 s=html.escape(s)
 s=re.sub(r'`([^`]+)`',r'<font color="#1d6281">\1</font>',s)
 s=re.sub(r'\*\*([^*]+)\*\*',r'<b>\1</b>',s)
 return s
story=[]
def para(s,style='body'):return Paragraph(inline(s),styles[style])
def codeblock(lines):
 story.append(Spacer(1,7))
 for line in lines:
  line=line.expandtabs(4)
  # Fit long code to phone-sized pages, preserving indentation on first segment.
  segments=[]; current=''
  for ch in line:
   if pdfmetrics.stringWidth(current+ch,'Korean',8)>340:
    segments.append(current);current='  '+ch
   else:current+=ch
  segments.append(current)
  for segment in segments:
   escaped=html.escape(segment).replace(' ','&#160;') or '&#160;'
   story.append(Paragraph(escaped,styles['code']))
 story.append(Spacer(1,9))
def markdown(text):
 lines=text.splitlines();i=0
 while i<len(lines):
  s=lines[i].strip()
  if s.startswith('```'):
   block=[];i+=1
   while i<len(lines) and not lines[i].strip().startswith('```'):
    block.append(lines[i]);i+=1
   codeblock(block)
  elif s.startswith('|'):
   rows=[]
   while i<len(lines) and lines[i].strip().startswith('|'):
    row=[c.strip() for c in lines[i].strip().strip('|').split('|')]
    if not all(re.fullmatch(r'[:\- ]+',c or '-') for c in row):rows.append(row)
    i+=1
   if rows:
    headers=rows[0]
    for row in rows[1:]:
     content=[]
     for k,v in zip(headers,row):
      if v:content.append(para('**'+k+'**: '+v,'small'))
     story.append(KeepTogether(content+[Spacer(1,7)]))
   continue
  elif '<summary>' in s:
   title=re.search(r'<summary>(.*?)</summary>',s).group(1)
   story.append(para('정답 / '+title,'h3'))
  elif s.startswith('</details>') or s.startswith('<details>'):pass
  elif s.startswith('# '):story.append(para(s[2:],'h1'))
  elif s.startswith('## '):story.append(para(s[3:],'h2'))
  elif s.startswith('### '):story.append(para(s[4:],'h3'))
  elif s:story.append(para(s))
  i+=1
story += [Spacer(1,55),para('ODYSAY / STUDY NOTES','small'),para('어딧세이 프로젝트\n학습과 복습','h1'),para('Flask · 데이터베이스 · 로그인 · API · CSS · Git','h2'),Spacer(1,20),para('현재 코드를 따라 읽고, 원리를 설명하고, 직접 실습하는 한국어 교재입니다.'),para('아이폰 열람용 / 2026-10-02','small'),Spacer(1,22)]
for idx,title in enumerate(['학습 교재','실습과 복습 - 정답 포함','실제 코드 지도','메모리 DB 실습 코드']):
 story.append(Paragraph(f'<link href="#part{idx}" color="#1d6281">{idx+1}. {title}</link>',styles['body']))
story += [Spacer(1,18),para('표는 작은 화면에서 읽기 쉬운 항목별 형식으로 변환했습니다. PC 전용 파일 링크는 위치 안내 텍스트로 바꾸었으며, 실습 코드는 PC에서 실행합니다. 원문에 접혀 있던 정답은 모두 펼쳤습니다.','small')]
for idx,name in enumerate(['01_학습교재.md','03_실습과복습.md','02_코드지도.md']):
 story.append(PageBreak());story.append(Paragraph(f'<a name="part{idx}"/>&#160;',styles['small']))
 markdown((ROOT/'study'/name).read_text(encoding='utf-8-sig'))
story.append(PageBreak());story.append(Paragraph('<a name="part3"/>&#160;',styles['small']));story.append(para('메모리 DB 실습 코드','h1'))
story.append(para('PC 프로젝트 폴더의 study/practice_memory_db.py와 같은 코드입니다. PDF에서 긴 줄은 지면에 맞게 나뉘므로 실행할 때는 원본 .py 파일을 사용하세요.'))
codeblock((ROOT/'study/practice_memory_db.py').read_text(encoding='utf-8-sig').splitlines())
def footer(c,doc):
 c.setStrokeColor(colors.HexColor('#d8e2eb'));c.line(30,34,W-30,34)
 c.setFont('Korean',8);c.setFillColor(colors.HexColor('#687c90'));c.drawString(30,21,'ODYSAY  |  학습과 복습');c.drawRightString(W-30,21,str(doc.page))
doc=SimpleDocTemplate(str(OUT),pagesize=(W,H),rightMargin=30,leftMargin=30,topMargin=32,bottomMargin=48,title='어딧세이 프로젝트 학습과 복습',author='ODYSAY Study Notes')
doc.build(story,onFirstPage=footer,onLaterPages=footer)
from pypdf import PdfReader
reader=PdfReader(OUT)
assert all(p.extract_text().strip() for p in reader.pages)
print('PDF:',OUT,'pages:',len(reader.pages),'bytes:',OUT.stat().st_size)

