"""Gera as páginas das lições (uma por lição, nos três idiomas) a partir das lições do app.

Páginas: licoes/index.html          índice do curso em português
         licoes/<lição>/index.html  uma página por lição
         es/licoes/... e en/licoes/...  o mesmo em espanhol e inglês

Uso:  python ferramentas/gerar_licoes.py              (gera as páginas e atualiza o sitemap.xml)
      python ferramentas/gerar_licoes.py --verificar  (só confere se estão atualizadas)

Por quê: no app as lições ficam numa aba, num endereço só. Com uma página por lição, cada uma
pode aparecer no Google para a pergunta que responde ("o que é bisonoro", "ritmos de tango"...).

De onde vem o conteúdo: js/licoes.js (português) e js/licoes-traducao.js (espanhol e inglês),
os mesmos textos que o app mostra. Não edite as páginas geradas: mude as lições e rode o script.
Os textos fixos das páginas (menus, botões, títulos) ficam em TEXTOS, logo abaixo.
"""
import html, json, re, sys, unicodedata
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
SITE = 'https://bandoly.app/'
PASTA = 'licoes'
LANGS = {'pt': 'pt-BR', 'es': 'es', 'en': 'en'}
LOCALES = {'pt': 'pt_BR', 'es': 'es_ES', 'en': 'en_GB'}
BANDEIRAS = {'pt': ('Português', 'br.svg'), 'es': ('Español', 'es.png'), 'en': ('English', 'gb.svg')}
IMAGEM = {'pt': 'compartilhar.png', 'es': 'compartilhar-es.png', 'en': 'compartilhar-en.png'}
CABECALHO = '<!-- Gerado por ferramentas/gerar_licoes.py a partir de js/licoes.js e js/licoes-traducao.js. Não edite à mão. -->\n'

TEXTOS = {
'pt': dict(
    marca='Aprenda Bandoneon', marca_aria='BanDoly - Aprenda Bandoneon (início)', nav_aria='Seções do app',
    abrir_app='Abrir o app', inicio='Início', curso='Curso de bandoneon grátis',
    indice_titulo='Curso de bandoneon grátis: {n} lições | BanDoly',
    indice_desc='Curso de bandoneon grátis em {n} lições curtas, com quiz: história, sistema bisonoro, fole, leitura, ritmos do tango e acordes. Pratique no teclado do app.',
    indice_intro='Onze lições curtas para aprender o bandoneon do zero: a história do instrumento, o sistema bisonoro, o fole, a leitura nas duas claves, os ritmos do tango e os acordes. Cada lição termina com um quiz, e você pratica tudo no teclado do app, com som de bandoneon de verdade.',
    licao_titulo='{t} | Curso de bandoneon grátis - BanDoly', licao_n='Lição {i} de {n}',
    verifique='Verifique o que aprendeu', certo='Correto!', errado='Ainda não, tente outra opção.',
    anterior='← Anterior', proxima='Próxima →', todas='Todas as lições',
    exercicio='Esta lição tem um exercício no teclado: toque três notas abrindo e três fechando no mesmo botão.',
    fazer_exercicio='Fazer o exercício no app',
    pratique='Pratique no teclado do BanDoly: som real de bandoneon, desafios e melodias guiadas. Grátis e sem cadastro.',
    abrir_licao='Abrir esta lição no app', rodape='BanDoly: aprenda a tocar bandoneon online e grátis',
    nivel='Iniciante', tipo='Lição',
    aviso_forte='O BanDoly é um site para aprendizado e nunca substituirá os conselhos e as orientações de um professor.',
    aviso_resto='Use o app como apoio aos estudos e, sempre que puder, aprenda com um professor de bandoneon: ele corrige a postura, o fole e o dedilhado, coisas que um app não consegue ver.'),
'es': dict(
    marca='Aprende Bandoneón', marca_aria='BanDoly - Aprende Bandoneón (inicio)', nav_aria='Secciones de la app',
    abrir_app='Abrir la app', inicio='Inicio', curso='Curso de bandoneón gratis',
    indice_titulo='Curso de bandoneón gratis: {n} lecciones | BanDoly',
    indice_desc='Curso de bandoneón gratis en {n} lecciones cortas, con cuestionario: historia, sistema bisonoro, fuelle, lectura, ritmos de tango y acordes. Practica en el teclado de la app.',
    indice_intro='Once lecciones cortas para aprender el bandoneón desde cero: la historia del instrumento, el sistema bisonoro, el fuelle, la lectura en las dos claves, los ritmos del tango y los acordes. Cada lección termina con un cuestionario, y practicas todo en el teclado de la app, con sonido de bandoneón real.',
    licao_titulo='{t} | Curso de bandoneón gratis - BanDoly', licao_n='Lección {i} de {n}',
    verifique='Comprueba lo que aprendiste', certo='¡Correcto!', errado='Todavía no, prueba otra opción.',
    anterior='← Anterior', proxima='Siguiente →', todas='Todas las lecciones',
    exercicio='Esta lección tiene un ejercicio en el teclado: toca tres notas abriendo y tres cerrando en el mismo botón.',
    fazer_exercicio='Hacer el ejercicio en la app',
    pratique='Practica en el teclado de BanDoly: sonido real de bandoneón, desafíos y melodías guiadas. Gratis y sin registro.',
    abrir_licao='Abrir esta lección en la app', rodape='BanDoly: aprende a tocar el bandoneón online y gratis',
    nivel='Principiante', tipo='Lección',
    aviso_forte='BanDoly es un sitio para aprender y nunca reemplazará los consejos y la orientación de un profesor.',
    aviso_resto='Usa la app como apoyo para tus estudios y, siempre que puedas, aprende con un profesor de bandoneón: él corrige la postura, el fuelle y la digitación, cosas que una app no puede ver.'),
'en': dict(
    marca='Learn Bandoneon', marca_aria='BanDoly - Learn Bandoneon (home)', nav_aria='App sections',
    abrir_app='Open the app', inicio='Home', curso='Free bandoneon course',
    indice_titulo='Free bandoneon course: {n} lessons | BanDoly',
    indice_desc='Free bandoneon course in {n} short lessons with quizzes: history, the bisonoric system, bellows, reading, tango rhythms and chords. Practice on the app keyboard.',
    indice_intro='Eleven short lessons to learn the bandoneon from scratch: the history of the instrument, the bisonoric system, the bellows, reading in both clefs, tango rhythms and chords. Each lesson ends with a quiz, and you practice everything on the app keyboard, with real bandoneon sound.',
    licao_titulo='{t} | Free bandoneon course - BanDoly', licao_n='Lesson {i} of {n}',
    verifique='Check what you learned', certo='Correct!', errado='Not yet, try another option.',
    anterior='← Previous', proxima='Next →', todas='All lessons',
    exercicio='This lesson has a keyboard exercise: play three notes opening and three closing on the same button.',
    fazer_exercicio='Do the exercise in the app',
    pratique='Practice on the BanDoly keyboard: real bandoneon sound, challenges and guided melodies. Free, no sign-up.',
    abrir_licao='Open this lesson in the app', rodape='BanDoly: learn to play the bandoneon online, free',
    nivel='Beginner', tipo='Lesson',
    aviso_forte='BanDoly is a learning site and will never replace the advice and guidance of a teacher.',
    aviso_resto='Use the app to support your studies and, whenever you can, learn with a bandoneon teacher: they correct your posture, bellows and fingering, things an app cannot see.'),
}

def aviso(T):
    """Aviso destacado: o site é para aprendizado e não substitui um professor."""
    return ('<aside class="aviso" role="note"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18h.01"/></svg>'
            f'<p><strong>{html.escape(T["aviso_forte"])}</strong> {html.escape(T["aviso_resto"])}</p></aside>')


STR = r"""('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")"""


def js_str(lit):
    return re.sub(r'\\(.)', lambda m: {'n': '\n', 't': '\t'}.get(m.group(1), m.group(1)), lit[1:-1])


def ler_licoes(trecho):
    """Lê uma lista de lições ({title, html, quiz}) escrita em JS."""
    licoes = []
    for bloco in re.split(r'\n\{\s*title:', trecho)[1:]:
        titulo = js_str(re.match(r'\s*' + STR, bloco).group(1))
        corpo = re.search(r'html:\s*`(.*?)`', bloco, re.S).group(1)
        quiz = []
        for q in re.finditer(r'\{\s*q:\s*' + STR + r'\s*,\s*o:\s*\[(.*?)\]\s*(?:,\s*a:\s*(\d+))?\s*\}', bloco, re.S):
            quiz.append({'q': js_str(q.group(1)), 'o': [js_str(o) for o in re.findall(STR, q.group(2))],
                         'a': int(q.group(3)) if q.group(3) else None})
        licoes.append({'titulo': titulo, 'html': corpo, 'quiz': quiz})
    return licoes


def carregar():
    pt = (RAIZ / 'js' / 'licoes.js').read_text(encoding='utf-8')
    pt = pt[pt.index('const LESSONS = ['):pt.index('\n];')]
    tr = (RAIZ / 'js' / 'licoes-traducao.js').read_text(encoding='utf-8')
    es = tr[tr.index('\nes: ['):tr.index('\nen: [')]
    en = tr[tr.index('\nen: ['):]
    todas = {'pt': ler_licoes(pt), 'es': ler_licoes(es), 'en': ler_licoes(en)}
    n = len(todas['pt'])
    for cod, lista in todas.items():
        if len(lista) != n: sys.exit(f'{cod}: {len(lista)} lições, esperava {n}')
        for i, l in enumerate(lista):
            if len(l['quiz']) != len(todas['pt'][i]['quiz']): sys.exit(f'{cod}: lição {i+1} com quiz diferente do português')
            for q, qpt in zip(l['quiz'], todas['pt'][i]['quiz']): q['a'] = qpt['a']  # a resposta certa vem do português
    return todas


def sem_numero(titulo):
    return re.sub(r'^\d+\.\s*', '', titulo)


def slug(titulo):
    s = unicodedata.normalize('NFD', sem_numero(titulo).lower())
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')


def texto_puro(h):
    h = re.sub(r'<(?:br|/?p|/?li|/?ul|/?ol|/?h\d|/?div)\b[^>]*>', ' ', h)  # blocos viram espaço
    h = re.sub(r'<[^>]+>', '', h)                                          # negrito, itálico etc. somem
    return re.sub(r'\s+', ' ', html.unescape(h)).strip()


def resumo(h, limite=155):
    """Começo do texto da lição, cortado numa palavra, para a descrição no Google."""
    t = texto_puro(h)
    if len(t) <= limite: return t
    return t[:limite].rsplit(' ', 1)[0].rstrip(',;:') + '…'


def url(cod, *partes):
    return SITE + ('' if cod == 'pt' else cod + '/') + ''.join(p + '/' for p in partes)


def prefixo(cod, prof):
    """Caminho relativo até a raiz do site, a partir de uma página prof pastas abaixo da pasta do idioma."""
    return '../' * (prof + (0 if cod == 'pt' else 1))


def adaptar_html(h, cod, i, T):
    """Ajusta o HTML da lição do app para a página: links para as abas e o exercício no teclado."""
    app = '../../'  # a página da lição fica em <idioma>/licoes/<lição>/
    h = re.sub(r'<a href="#" data-go="(\w+)">', lambda m: f'<a href="{app}#{m.group(1)}" data-local>', h)
    exercicio = (f'<div class="notice">{html.escape(T["exercicio"])} '
                 f'<a href="{app}#licao-{i+1}" data-local>{html.escape(T["fazer_exercicio"])}</a></div>')
    h = re.sub(r'<div id="lessonKbd"></div>', exercicio, h)
    return h.strip()


def bandeiras(caminhos, cod, raiz):
    """Links para a mesma página nos três idiomas. caminhos: {idioma: caminho a partir da raiz do site}."""
    links = []
    for c, (nome, img) in BANDEIRAS.items():
        destino = raiz + caminhos[c]
        on = ' class="on"' if c == cod else ''
        links.append(f'<a href="{destino}" data-local{on} hreflang="{LANGS[c]}" title="{nome}" aria-label="{nome}">'
                     f'<img src="{raiz}icones/bandeiras/{img}" alt="" width="30" height="20"></a>')
    return f'<div class="langs" role="group" aria-label="Idioma / Language" translate="no">{"".join(links)}</div>'


def pagina(cod, prof, titulo, descricao, urls, corpo, dados, tipo_og='article'):
    """Monta a página. urls: {idioma: endereço completo}; prof: pastas abaixo da pasta do idioma."""
    T, raiz = TEXTOS[cod], prefixo(cod, prof)
    app = '../' * prof
    caminhos = {c: u[len(SITE):] for c, u in urls.items()}
    alternativos = ''.join(f'<link rel="alternate" hreflang="{LANGS[c]}" href="{u}">\n' for c, u in urls.items())
    alternativos += f'<link rel="alternate" hreflang="x-default" href="{urls["pt"]}">\n'
    outros = ''.join(f'<meta property="og:locale:alternate" content="{LOCALES[c]}">\n' for c in LANGS if c != cod)
    e = html.escape
    return f'''<!DOCTYPE html>
{CABECALHO}<html lang="{LANGS[cod]}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{e(titulo)}</title>
<meta name="description" content="{e(descricao)}">
<meta name="theme-color" content="#0e2847">
<link rel="canonical" href="{urls[cod]}">
{alternativos}<meta property="og:type" content="{tipo_og}">
<meta property="og:site_name" content="BanDoly">
<meta property="og:url" content="{urls[cod]}">
<meta property="og:title" content="{e(titulo)}">
<meta property="og:description" content="{e(descricao)}">
<meta property="og:image" content="{SITE}icones/{IMAGEM[cod]}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="{LOCALES[cod]}">
{outros}<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">
{json.dumps(dados, ensure_ascii=False, indent=2)}
</script>
<link rel="icon" href="{raiz}favicon.ico" sizes="48x48">
<link rel="icon" href="{raiz}icones/icone-192.png" type="image/png" sizes="192x192">
<link rel="apple-touch-icon" href="{raiz}icones/icone-192.png">
<link rel="stylesheet" href="{raiz}css/app.css">
<!-- contagem de visitas: GoatCounter, sem cookies e sem dados pessoais (painel: bandoly.goatcounter.com) -->
<script data-goatcounter="https://bandoly.goatcounter.com/count" async src="https://gc.zgo.at/count.js"></script>
</head>
<body>
<header>
  <a class="brand" href="{app}" data-local aria-label="{e(T['marca_aria'])}">
    <img src="{raiz}icones/logo-cabecalho.png" alt="" width="44" height="44">
    <span class="brand-text"><span class="brand-name" translate="no">Ban<b>Doly</b></span><span class="brand-sub">{e(T['marca'])}</span></span>
  </a>
  <nav aria-label="{e(T['nav_aria'])}"><a class="btn" href="{app}" data-local>{e(T['abrir_app'])}</a></nav>
  {bandeiras(caminhos, cod, raiz)}
</header>
<main class="pagina">
{corpo}
</main>
<footer class="rodape"><a href="{app}" data-local>{e(T['rodape'])}</a></footer>
<!-- aberto direto do computador (sem servidor), as pastas precisam do index.html no fim -->
<script>if(location.protocol==='file:') document.querySelectorAll('a[href$="/"]').forEach(a=>a.setAttribute('href', a.getAttribute('href')+'index.html'));</script>
</body>
</html>
'''


QUIZ_JS = '''<script>
// Quiz: as opções certas têm data-certa; a resposta aparece embaixo da pergunta
document.querySelectorAll('.licao-quiz .q').forEach(q => q.addEventListener('click', e => {
  const b = e.target.closest('button'); if(!b) return;
  const certa = b.hasAttribute('data-certa');
  b.classList.add(certa ? 'right' : 'wrong');
  q.querySelector('.fb').textContent = certa ? q.dataset.certo : q.dataset.errado;
}));
</script>'''


def migalhas(cod, itens):
    return {'@type': 'BreadcrumbList', 'itemListElement': [
        {'@type': 'ListItem', 'position': k + 1, 'name': nome, 'item': u} for k, (nome, u) in enumerate(itens)]}


def gerar_todas():
    todas = carregar()
    n = len(todas['pt'])
    slugs = {c: [slug(l['titulo']) for l in todas[c]] for c in LANGS}
    paginas = {}
    for cod, lista in todas.items():
        T, e = TEXTOS[cod], html.escape
        base = '' if cod == 'pt' else cod + '/'
        curso = {'@type': 'Course', 'name': T['curso'], 'url': url(cod, PASTA), 'inLanguage': LANGS[cod],
                 'provider': {'@type': 'Organization', 'name': 'BanDoly', 'url': SITE}}
        # ---------- índice ----------
        itens = ''.join(
            f'    <li><a href="{slugs[cod][i]}/" data-local>{e(sem_numero(l["titulo"]))}</a><span class="muted">{e(resumo(l["html"], 120))}</span></li>\n'
            for i, l in enumerate(lista))
        corpo = f'''  <div class="card">
    <p class="muted licao-kicker"><a href="../" data-local>{e(T['inicio'])}</a> › {e(T['curso'])}</p>
    <h1>{e(T['curso'])}</h1>
    <p>{e(T['indice_intro'])}</p>
    {aviso(T)}
    <ol class="licoes-indice">
{itens}    </ol>
    <div class="row"><a class="btn" href="../#licao-1" data-local>{e(T['abrir_app'])}</a></div>
  </div>'''
        dados = {'@context': 'https://schema.org', '@graph': [
            dict(curso, description=T['indice_desc'].format(n=n),
                 hasPart=[{'@type': 'LearningResource', 'name': sem_numero(l['titulo']), 'url': url(cod, PASTA, slugs[cod][i])}
                          for i, l in enumerate(lista)]),
            migalhas(cod, [(T['inicio'], url(cod)), (T['curso'], url(cod, PASTA))])]}
        urls = {c: url(c, PASTA) for c in LANGS}
        paginas[f'{base}{PASTA}/index.html'] = pagina(cod, 1, T['indice_titulo'].format(n=n), T['indice_desc'].format(n=n),
                                                       urls, corpo, dados, 'website')
        # ---------- uma página por lição ----------
        for i, l in enumerate(lista):
            nav = []
            if i > 0: nav.append(f'<a class="btn sec" href="../{slugs[cod][i-1]}/" data-local>{e(T["anterior"])}</a>')
            nav.append(f'<a class="btn sec" href="../" data-local>{e(T["todas"])}</a>')
            if i < n - 1: nav.append(f'<a class="btn" href="../{slugs[cod][i+1]}/" data-local>{e(T["proxima"])}</a>')
            perguntas = ''.join(
                f'      <div class="q" data-certo="{e(T["certo"])}" data-errado="{e(T["errado"])}"><div>{e(q["q"])}</div><div class="opts">'
                + ''.join(f'<button type="button" class="btn sec"{" data-certa" if k == q["a"] else ""}>{e(o)}</button>' for k, o in enumerate(q['o']))
                + '</div><div class="fb muted" aria-live="polite"></div></div>\n'
                for q in l['quiz'])
            corpo = f'''  <article class="card licao">
    <p class="muted licao-kicker"><a href="../../" data-local>{e(T['inicio'])}</a> › <a href="../" data-local>{e(T['curso'])}</a> › {e(T['licao_n'].format(i=i+1, n=n))}</p>
    <h1>{e(sem_numero(l['titulo']))}</h1>
    {adaptar_html(l['html'], cod, i, T)}
    <div class="licao-quiz">
      <h2>{e(T['verifique'])}</h2>
{perguntas}    </div>
    <div class="row licao-nav">{''.join(nav)}</div>
  </article>
  {aviso(T)}
  <div class="card licao-cta">
    <p>{e(T['pratique'])}</p>
    <a class="btn" href="../../#licao-{i+1}" data-local>{e(T['abrir_licao'])}</a>
  </div>
{QUIZ_JS}'''
            descricao = resumo(l['html'])
            dados = {'@context': 'https://schema.org', '@graph': [
                {'@type': 'LearningResource', 'name': sem_numero(l['titulo']), 'description': descricao,
                 'url': url(cod, PASTA, slugs[cod][i]), 'inLanguage': LANGS[cod], 'learningResourceType': T['tipo'],
                 'educationalLevel': T['nivel'], 'isAccessibleForFree': True, 'position': i + 1, 'isPartOf': curso},
                migalhas(cod, [(T['inicio'], url(cod)), (T['curso'], url(cod, PASTA)),
                               (sem_numero(l['titulo']), url(cod, PASTA, slugs[cod][i]))])]}
            urls = {c: url(c, PASTA, slugs[c][i]) for c in LANGS}
            paginas[f'{base}{PASTA}/{slugs[cod][i]}/index.html'] = pagina(
                cod, 2, T['licao_titulo'].format(t=sem_numero(l['titulo'])), descricao, urls, corpo, dados)
    return paginas


def sitemap_licoes(paginas):
    """Bloco do sitemap.xml com as páginas das lições (entre <!--licoes--> e <!--/licoes-->)."""
    todas = carregar()
    slugs = {c: [slug(l['titulo']) for l in todas[c]] for c in LANGS}
    grupos = [{c: url(c, PASTA) for c in LANGS}] + [{c: url(c, PASTA, slugs[c][i]) for c in LANGS} for i in range(len(todas['pt']))]
    out = []
    for g in grupos:
        alt = ''.join(f'    <xhtml:link rel="alternate" hreflang="{LANGS[c]}" href="{u}"/>\n' for c, u in g.items())
        alt += f'    <xhtml:link rel="alternate" hreflang="x-default" href="{g["pt"]}"/>\n'
        for u in g.values():
            out.append(f'  <url>\n    <loc>{u}</loc>\n{alt}  </url>\n')
    return '  <!--licoes-->\n' + ''.join(out) + '  <!--/licoes-->\n'


def sitemap_novo(paginas):
    s = (RAIZ / 'sitemap.xml').read_text(encoding='utf-8')
    bloco = sitemap_licoes(paginas)
    if '<!--licoes-->' in s:
        return re.sub(r'  <!--licoes-->\n.*?  <!--/licoes-->\n', lambda m: bloco, s, flags=re.S)
    return s.replace('</urlset>', bloco + '</urlset>')


def main():
    if hasattr(sys.stdout, 'reconfigure'): sys.stdout.reconfigure(encoding='utf-8')
    verificar = '--verificar' in sys.argv
    paginas = gerar_todas()
    arquivos = dict(paginas)
    arquivos['sitemap.xml'] = sitemap_novo(paginas)
    desatualizadas = []
    for caminho, conteudo in arquivos.items():
        destino = RAIZ / caminho
        if verificar:
            if not destino.exists() or destino.read_text(encoding='utf-8') != conteudo: desatualizadas.append(caminho)
            continue
        destino.parent.mkdir(parents=True, exist_ok=True)
        destino.write_bytes(conteudo.encode('utf-8'))  # bytes: mantém o \n no Windows (e funciona no Python 3.9)
    # páginas de lições que não existem mais (lição renomeada ou removida)
    esperadas = {RAIZ / c for c in paginas}
    for cod in LANGS:
        pasta = RAIZ / ('' if cod == 'pt' else cod) / PASTA
        for f in pasta.glob('*/index.html') if pasta.exists() else []:
            if f not in esperadas:
                if verificar: desatualizadas.append(str(f.relative_to(RAIZ)) + ' (sobrando)')
                else: f.unlink(); f.parent.rmdir()
    if verificar:
        if desatualizadas:
            print('Páginas das lições desatualizadas: ' + ', '.join(desatualizadas[:5]) + ('…' if len(desatualizadas) > 5 else '')
                  + '. Rode: python ferramentas/gerar_licoes.py')
            sys.exit(1)
    else:
        print(f'{len(paginas)} páginas de lições geradas e sitemap.xml atualizado')


if __name__ == '__main__':
    main()
