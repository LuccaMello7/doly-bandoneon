"""Gera as páginas em espanhol (es/...) e inglês (en/...) a partir das páginas em português.

Páginas: index.html (o app) -> es/index.html e en/index.html
         doly-costa/index.html (a história de Doly Costa) -> es/doly-costa/ e en/doly-costa/
         perguntas-frequentes/index.html -> es/perguntas-frequentes/ e en/perguntas-frequentes/

Uso:  python ferramentas/gerar_idiomas.py              (gera todas as páginas)
      python ferramentas/gerar_idiomas.py --verificar  (só confere se estão atualizadas)

Por quê: o Google lê o HTML como ele vem do servidor. Com cada idioma no seu endereço
(bandoly.app/, /es/ e /en/) e o texto já traduzido no arquivo, cada página aparece nas
buscas no seu idioma. O app continua igual: o que o código escreve depois é traduzido na
tela por js/i18n.js, como antes.

Como funciona: cada texto e cada atributo title/aria-label/alt/placeholder da página é
trocado pela tradução do dicionário js/i18n-textos.js (a mesma regra do i18n.js: o texto
com os espaços normalizados é a chave). No <head> também são traduzidos o título, a
descrição e as prévias de link, e os caminhos ganham "../" (as páginas ficam numa pasta).
Links marcados com data-local apontam para a página do mesmo idioma e ficam como estão; o
bloco entre <!--bandeiras--> e <!--/bandeiras--> é refeito com os links de cada idioma.

Sempre que mudar uma página em português ou o dicionário, rode este script. Os testes avisam se esquecer.
"""
import html, re, sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
SITE = 'https://bandoly.app/'
IDIOMAS = {  # código: (coluna no dicionário, lang do HTML, og:locale)
    'es': (0, 'es', 'es_ES'),
    'en': (1, 'en', 'en_GB'),
}
LOCALES = {'pt': 'pt_BR', 'es': 'es_ES', 'en': 'en_GB'}
ATRIBUTOS = ('title', 'aria-label', 'alt', 'placeholder')
META_TRADUZIR = ('description', 'og:title', 'og:description', 'og:image:alt')
NAO_TRADUZIR = ('script', 'style', 'textarea', 'code')
VAZIAS = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr'}
PAGINAS = ('index.html', 'doly-costa/index.html', 'perguntas-frequentes/index.html', 'privacidade/index.html', 'termos/index.html', 'professores/index.html')  # páginas em português, a partir da raiz
BANDEIRAS = {'pt': ('Português', 'br.svg', 'pt-BR'), 'es': ('Español', 'es.png', 'es'), 'en': ('English', 'gb.svg', 'en')}
CABECALHO = '<!-- Gerado por ferramentas/gerar_idiomas.py a partir de {}. Não edite à mão: mude a página em português ou o dicionário e rode o script. -->\n'

STR = r"""('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")"""
norm = lambda s: re.sub(r'\s+', ' ', s).strip()


def js_str(lit):
    """Converte um literal de string JS ('...' ou "...") em texto."""
    return re.sub(r'\\(.)', lambda m: {'n': '\n', 't': '\t'}.get(m.group(1), m.group(1)), lit[1:-1])


def carregar_dicionario():
    src = (RAIZ / 'js' / 'i18n-textos.js').read_text(encoding='utf-8')
    dic = {}
    for m in re.finditer(r'^\s*' + STR + r'\s*:\s*\[\s*' + STR + r'\s*,\s*' + STR + r'\s*\]', src, re.M):
        pt, es, en = (js_str(g) for g in m.groups())
        if '{}' not in pt:
            dic[pt] = (es, en)
    return dic


def traduzir(texto, dic, col, obrigatorio=False):
    chave = norm(html.unescape(texto))
    if chave in dic:
        return dic[chave][col]
    if obrigatorio:
        sys.exit(f'Falta tradução no dicionário (js/i18n-textos.js) para: {chave!r}')
    return None


def traduzir_corpo(pagina, dic, col):
    """Troca textos e atributos pelo dicionário, respeitando <script>, <style> e translate="no"."""
    partes = re.split(r'(<!--.*?-->|<[^>]+>)', pagina, flags=re.S)
    pilha = []  # (tag, sem_traducao)
    out = []
    for p in partes:
        if p.startswith('<!--') or p.startswith('<!'):
            out.append(p); continue
        if p.startswith('</'):
            tag = p[2:].split('>')[0].strip().lower()
            while pilha:
                if pilha.pop()[0] == tag: break
            out.append(p); continue
        if p.startswith('<'):
            tag = re.match(r'<\s*([\w-]+)', p).group(1).lower()
            pai = pilha[-1][1] if pilha else False
            sem = pai or tag in NAO_TRADUZIR or 'translate="no"' in p
            if not sem:
                for a in ATRIBUTOS:
                    def troca(m):
                        tr = traduzir(m.group(2), dic, col)
                        return m.group(1) + (html.escape(tr) if tr is not None else m.group(2)) + '"'
                    p = re.sub(r'(\s' + a + r'=")([^"]*)"', troca, p)
            if tag not in VAZIAS and not p.endswith('/>'):
                pilha.append((tag, sem))
            out.append(p); continue
        # texto
        if (pilha and pilha[-1][1]) or not re.search(r'[A-Za-zÀ-ÿ]', p):
            out.append(p); continue
        tr = traduzir(p, dic, col)
        if tr is None:
            out.append(p); continue
        ini, fim = re.match(r'^\s*', p).group(0), re.search(r'\s*$', p).group(0)
        out.append(ini + html.escape(tr, quote=False) + fim)
    return ''.join(out)


def bandeiras(cod, sub):
    """Links para a mesma página nos três idiomas, relativos à página em cod (ex.: /es/doly-costa/)."""
    raiz = '../' * (sub.count('/') + (cod != 'pt'))
    links = []
    for l, (nome, img, hl) in BANDEIRAS.items():
        href = './' if l == cod else raiz + ('' if l == 'pt' else l + '/') + sub
        on = ' class="on"' if l == cod else ''
        links.append(f'<a href="{href}" data-local{on} hreflang="{hl}" title="{nome}" aria-label="{nome}">'
                     f'{l.upper()}</a>')
    return ('<!--bandeiras--><div class="langs" role="group" aria-label="Idioma / Language" translate="no">'
            + ''.join(links) + '</div><!--/bandeiras-->')


def ajustar_cabeca(pagina, dic, cod, sub):
    col, lang_html, locale = IDIOMAS[cod]
    url = SITE + cod + '/' + sub
    pagina = pagina.replace('<html lang="pt-BR">', f'<html lang="{lang_html}" data-idioma="{cod}">', 1)
    # descrição e prévias de link
    def meta(m):
        tr = traduzir(m.group(3), dic, col, obrigatorio=True)
        return f'{m.group(1)}{m.group(2)}{html.escape(tr)}"'
    for nome in META_TRADUZIR:
        pagina = re.sub(r'(<meta (?:name|property)="' + re.escape(nome) + r'")( content=")([^"]*)"', meta, pagina)
    pagina = pagina.replace(f'<link rel="canonical" href="{SITE}{sub}">', f'<link rel="canonical" href="{url}">')
    pagina = pagina.replace(f'<meta property="og:url" content="{SITE}{sub}">', f'<meta property="og:url" content="{url}">')
    pagina = pagina.replace('icones/compartilhar.png"', f'icones/compartilhar-{cod}.png"')
    # og:locale: o desta página primeiro, os outros como alternativos
    outros = [l for k, l in LOCALES.items() if k != cod]
    pagina = re.sub(r'<meta property="og:locale" content="[^"]*">\n(<meta property="og:locale:alternate" content="[^"]*">\n)*',
                    f'<meta property="og:locale" content="{locale}">\n' +
                    ''.join(f'<meta property="og:locale:alternate" content="{l}">\n' for l in outros), pagina)
    # caminhos relativos: a página fica uma pasta abaixo (menos os links data-local)
    def caminho(m):
        v = m.group(2)
        if re.match(r'(https?:|#|data:|mailto:|/)', v): return m.group(0)
        return f'{m.group(1)}../{v}"'
    def tag(m):
        t = m.group(0)
        return t if ' data-local' in t else re.sub(r'(\s(?:src|href)=")([^"]*)"', caminho, t)
    pagina = re.sub(r'<[a-z][^>]*>', tag, pagina)
    pagina = re.sub(r'<!--bandeiras-->.*?<!--/bandeiras-->', lambda m: bandeiras(cod, sub), pagina, flags=re.S)
    return pagina.replace('<!DOCTYPE html>\n', '<!DOCTYPE html>\n' + CABECALHO.format(sub + 'index.html'), 1)


def gerar(cod, dic, origem):
    pagina = (RAIZ / origem).read_text(encoding='utf-8')
    corpo = traduzir_corpo(pagina, dic, IDIOMAS[cod][0])
    return ajustar_cabeca(corpo, dic, cod, origem[:-len('index.html')])


def main():
    if hasattr(sys.stdout, 'reconfigure'): sys.stdout.reconfigure(encoding='utf-8')
    verificar = '--verificar' in sys.argv
    dic = carregar_dicionario()
    desatualizadas = []
    for cod in IDIOMAS:
        for origem in PAGINAS:
            destino = RAIZ / cod / origem
            novo = gerar(cod, dic, origem)
            if verificar:
                if not destino.exists() or destino.read_text(encoding='utf-8') != novo:
                    desatualizadas.append(f'{cod}/{origem}')
            else:
                destino.parent.mkdir(parents=True, exist_ok=True)
                destino.write_bytes(novo.encode('utf-8'))  # bytes: mantém o \n também no Windows (e no Python 3.9)
                print(f'{cod}/{origem} gerado')
    if desatualizadas:
        print('Desatualizado: ' + ', '.join(desatualizadas) + '. Rode: python ferramentas/gerar_idiomas.py')
        sys.exit(1)


if __name__ == '__main__':
    main()
