"""Lista os textos da interface que precisam de tradução e confere o dicionário.

Uso:  python ferramentas/extrair_textos.py          (mostra os textos sem tradução)
      python ferramentas/extrair_textos.py --todos  (mostra todos os textos encontrados)

Percorre o index.html e o doly-costa/index.html (textos e atributos title/aria-label/alt/placeholder) e os
arquivos js/*.js (textos entre aspas e templates). Em templates, cada ${...} vira {}
e as tags HTML separam os pedaços, do mesmo jeito que o navegador mostra o texto.
As lições têm tradução própria (js/licoes-traducao.js) e ficam de fora.
"""
import json, re, sys
from html.parser import HTMLParser
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
ATRIBUTOS = ('title', 'aria-label', 'alt', 'placeholder')
IGNORAR_JS = {'i18n.js', 'i18n-textos.js', 'licoes-traducao.js', 'base.js', 'teoria-textos.js'}
norm = lambda s: re.sub(r'\s+', ' ', s).strip()


# Coisas que aparecem no código mas não são texto da interface
NAO_E_TEXTO = [re.compile(p) for p in (
    r'[#>\[\]]', r'^\.', r'^[a-z-]+ (ok|bad)$',            # seletores e classes CSS
    r'^[A-Z]+$', r'^Key[A-Z]$', r'^Space$', r'^NFD$',       # códigos de tecla e afins
    r'^hsl\(', r'^META-INF', r'^[\w.]+/[\w.+-]+',           # cores, caminhos, tipos de arquivo
    r'^(título|title):', r'^mão: \{\}$', r'^(direita|esquerda): ',                     # texto-fonte das melodias
    r'^([A-G]|Do|Re|Mi|Fa|Sol|La|Si|Dó|Ré|Fá|Lá)[#♯♭b]?$', r'^CDEFGAB$',  # nomes de notas
    r'^\{\} cents$', r'^\{\} \{\}\{\} oitava\(s\)$',
    r'^\d00 \d+px', r'Nunito', r'^Arrow(Left|Right)$', r'^AbortError$',   # fontes do canvas e nomes de teclas/erros
    r'^translate', r'^cubic-bezier', r'^\(prefers-', r'^IntersectionObserver$', r'^\(hover:', r'^(Digit\d|Minus|Equal|Bracket(Left|Right)|Semicolon|Quote|Backslash|Comma|Period|Slash|Num|Arrow(Up|Down|Left|Right)|Escape|Delete|Backspace)$', r'^(https?://|mailto:|&body=)', r'^\{\}/issues/', r'^mailto:\{\}', r'^\{\}: \{\}×\{\}$', r'^-?\d+px( -?\d+%?(px)?)*$',                         # valores de CSS usados no código
)]
# Iguais em todos os idiomas: nomes próprios, símbolos e exemplos de notas do formato de texto
IGUAIS = {'T T S T T T S', 'T S T T S T T', 'S T T T S T T', 'T T T S T T S', 'T+S', 'Ban', 'Doly', '×', '‹', '›', 'WhatsApp', 'E-mail', 'Idioma / Language', 'Português', 'Español', 'English', 'Rheinische 142', 'Bandoneon V2.5', 'm7', 'm6', '442 Hz',
          'bpm: 80', 'metronome per-minute',
          # vídeos do Doly (translate="no"): nomes de músicas e de canais do YouTube
          'Cena de Campanha', 'Sarau do Solar', 'Pampa Pietá', 'De Catres e Corredores', 'Edgar Paiva',
          'Museu WK - Acordeões e Bandoneões', 'Almir Sampaio Barbosa', 'Adriano Lima Gaúcho',
          'Adiós Nonino', 'Quejas de Bandoneón', 'Oblivion', 'Tangos Ontem, Hoje e Sempre', 'Lucca Mello',
          'bruniinhars', 'Camila García', 'Rodrigo Faller',
          '(display-mode: standalone)', 'MacIntel',  # código do convite para instalar (init.js)
          'RepeTCHÊ', 'Muy bueno!', 'La Cumparsita', 'Tico-tico no fubá'}  # nome do jogo e a fala do gaúcho: iguais em todos os idiomas
NAO_E_TEXTO.append(re.compile(r'^[A-Za-zÀ-ÿ]{1,3}[#♯♭b]?\d'))  # Sol4, Bb5, Dó4:4, Mi4:8t…
# Formas "cruas" de frases que o dicionário cobre com outra chave (montadas em partes no código)
COBERTOS = {'Opção {}: {}{}{}', 'Prepare-se…', 'Não entendi:', 'Direção: Abrindo (trocar)',
            'Abrindo: {}/3 · Fechando: {}/3 {} {}', 'dia{} seguido{}', 'Notas:', '{}{} · {} BPM'}


def parece_texto(s):
    if s in COBERTOS or s in IGUAIS or any(p.search(s) for p in NAO_E_TEXTO): return False
    """Descarta código: precisa ter letras e não pode ser um identificador/classe/seletor."""
    if not re.search(r'[A-Za-zÀ-ÿ]', s): return False
    if re.fullmatch(r'[#.\[\]=:\w/-]+', s) and not re.search(r'[À-ÿ]', s) and not s[:1].isupper(): return False
    if re.search(r'[{};]\s*$|^\s*(const|let|function|return)\b|=>|\$\(|getElementById', s): return False
    return True


class Html(HTMLParser):
    def __init__(self):
        super().__init__(); self.out = []; self.skip = 0
    def handle_starttag(self, tag, attrs):
        if tag in ('script', 'style'): self.skip += 1
        for k, v in attrs:
            if k in ATRIBUTOS and v and parece_texto(v): self.out.append(norm(v))
    def handle_endtag(self, tag):
        if tag in ('script', 'style'): self.skip -= 1
    def handle_data(self, d):
        if not self.skip and parece_texto(norm(d)): self.out.append(norm(d))


def textos_html(html):
    p = Html(); p.feed(html); return p.out


def literais_js(src):
    """Strings '...', "..." e `...` (com ${...} trocado por {})."""
    out, i, n = [], 0, len(src)
    while i < n:
        c = src[i]
        if src.startswith('//', i): i = src.find('\n', i); i = n if i < 0 else i; continue
        if src.startswith('/*', i): i = src.find('*/', i) + 2; continue
        if c in '\'"`':
            j, buf, depth = i + 1, [], 0
            while j < n:
                if src[j] == '\\': buf.append(src[j:j+2]); j += 2; continue
                if c == '`' and src.startswith('${', j):
                    depth, k = 1, j + 2
                    while depth and k < n:
                        if src[k] == '{': depth += 1
                        elif src[k] == '}': depth -= 1
                        k += 1
                    buf.append('{}'); j = k; continue
                if src[j] == c: break
                buf.append(src[j]); j += 1
            out.append(''.join(buf)); i = j + 1; continue
        i += 1
    return out


def textos_js(src):
    res = []
    for lit in literais_js(src):
        lit = lit.replace('\\n', '\n').replace("\\'", "'").replace('\\"', '"')
        if '<' in lit and '>' in lit:
            res += [norm(t) for t in re.split(r'<[^>]*>', lit)]  # tags separam os pedaços
        else:
            res.append(norm(lit))
    ignorado = lambda t: t in COBERTOS or t in IGUAIS or any(p.search(t) for p in NAO_E_TEXTO)
    return [t for t in res if not ignorado(t) and parece_texto(t.replace('{}', '')) and t.replace('{}', '').strip(' ·:.,()–-')]


def coletar():
    vistos = {}
    for pag in ('index.html', 'doly-costa/index.html', 'perguntas-frequentes/index.html'):
        for t in textos_html((RAIZ / pag).read_text(encoding='utf-8')):
            vistos.setdefault(t, pag)
    for f in sorted((RAIZ / 'js').glob('*.js')):
        if f.name in IGNORAR_JS: continue
        src = f.read_text(encoding='utf-8')
        if f.name == 'licoes.js': src = src[src.index('let curLesson'):]  # pula o conteúdo das lições
        for t in textos_js(src): vistos.setdefault(t, f.name)
    return vistos


if __name__ == '__main__':
    if hasattr(sys.stdout, 'reconfigure'): sys.stdout.reconfigure(encoding='utf-8')
    vistos = coletar()
    dic = RAIZ / 'js' / 'i18n-textos.js'
    chaves = set()
    if dic.exists():
        chaves = set(re.findall(r"^\s*(?:'((?:[^'\\]|\\.)*)'|\"((?:[^\"\\]|\\.)*)\")\s*:", dic.read_text(encoding='utf-8'), re.M))
        chaves = {(a or b).replace("\\'", "'").replace('\\"', '"') for a, b in chaves}
    faltam = [(t, f) for t, f in vistos.items() if t not in chaves]
    for t, f in (vistos.items() if '--todos' in sys.argv else faltam):
        print(f'{f:16} {t}')
    print(f'\n{len(vistos)} textos, {len(faltam)} sem tradução.')
