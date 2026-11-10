"""Gera as páginas de teoria musical (uma por tópico, nos três idiomas) a partir da aba Teoria do app.

Páginas: teoria/index.html           índice em português
         teoria/<tópico>/index.html  uma página por tópico
         es/teoria/... e en/teoria/... o mesmo em espanhol e inglês

Uso:  python ferramentas/gerar_teoria.py              (gera as páginas e atualiza o sitemap.xml)
      python ferramentas/gerar_teoria.py --verificar  (só confere se estão atualizadas)

Por quê: no app a teoria é montada pelo JavaScript; com páginas próprias, cada tópico pode aparecer no
Google para a pergunta que responde ("clave de sol", "figuras musicais", "escala maior"...).

De onde vem o conteúdo: js/teoria-textos.js (o texto de cada tópico nos três idiomas), os títulos de
js/teoria.js e as traduções dos títulos no dicionário js/i18n-textos.js. O modelo da página é o mesmo
das lições (ferramentas/gerar_licoes.py).
"""
import html, re, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import gerar_licoes as gl
import gerar_idiomas as gi

RAIZ = gl.RAIZ
PASTA = 'teoria'
LANGS = gl.LANGS
COL = {'es': 0, 'en': 1}
gl.CABECALHO = '<!-- Gerado por ferramentas/gerar_teoria.py a partir de js/teoria.js e js/teoria-textos.js. Não edite à mão. -->\n'

TEXTOS = {
'pt': dict(titulo='Teoria musical para bandoneon', indice_titulo='Teoria musical para bandoneon: notas, pauta, ritmo e acordes | BanDoly',
    indice_desc='Teoria musical do básico, com som, para quem toca bandoneon: notas e oitavas, pauta e claves, sustenido e bemol, figuras, compasso, escalas e acordes.',
    intro='Sete tópicos curtos com o básico para ler partitura e entender os exercícios. No app, cada tópico tem som: a pauta toca a nota em que você clica, as figuras tocam no tempo e as escalas e os acordes soam no bandoneon.',
    topico='{t} | Teoria musical - BanDoly', n='Tópico {i} de {n}', todos='Todos os tópicos', anterior='Anterior', proximo='Próximo',
    pratique='No app, este tópico tem som e um teste rápido. Grátis e sem cadastro.', abrir='Abrir este tópico no app', tipo='Artigo'),
'es': dict(titulo='Teoría musical para bandoneón', indice_titulo='Teoría musical para bandoneón: notas, pentagrama, ritmo y acordes | BanDoly',
    indice_desc='Teoría musical básica, con sonido, para quien toca el bandoneón: notas y octavas, pentagrama y claves, sostenido y bemol, figuras, compás, escalas y acordes.',
    intro='Siete temas cortos con lo básico para leer partitura y entender los ejercicios. En la app, cada tema tiene sonido: el pentagrama toca la nota que eliges, las figuras suenan a tiempo y las escalas y los acordes suenan en el bandoneón.',
    topico='{t} | Teoría musical - BanDoly', n='Tema {i} de {n}', todos='Todos los temas', anterior='Anterior', proximo='Siguiente',
    pratique='En la app, este tema tiene sonido y una prueba rápida. Gratis y sin registro.', abrir='Abrir este tema en la app', tipo='Artículo'),
'en': dict(titulo='Music theory for bandoneon', indice_titulo='Music theory for bandoneon: notes, staff, rhythm and chords | BanDoly',
    indice_desc='Beginner music theory, with sound, for bandoneon players: notes and octaves, the staff and clefs, sharps and flats, note values, time signatures, scales and chords.',
    intro='Seven short topics with the basics for reading music and understanding the exercises. In the app, every topic has sound: the staff plays the note you tap, note values play in time and scales and chords sound on the bandoneon.',
    topico='{t} | Music theory - BanDoly', n='Topic {i} of {n}', todos='All topics', anterior='Previous', proximo='Next',
    pratique='In the app, this topic has sound and a quick check. Free, no sign-up.', abrir='Open this topic in the app', tipo='Article'),
}
for cod, T in TEXTOS.items():  # menus, aviso e rodapé iguais aos das lições
    T.update({k: v for k, v in gl.TEXTOS[cod].items() if k not in T})


def carregar():
    js = (RAIZ / 'js' / 'teoria.js').read_text(encoding='utf-8')
    topicos = re.findall(r"\{id:'(\w+)', titulo:'([^']+)'", js[js.index('const TEORIA = ['):])
    tx = (RAIZ / 'js' / 'teoria-textos.js').read_text(encoding='utf-8')
    dic = gi.carregar_dicionario()
    lista = []
    for tid, titulo in topicos:
        bloco = tx[tx.index(f'\n{tid}: {{'):]
        textos = {c: gl.js_str(re.search(c + r':(' + gl.STR + r')', bloco).group(1)) for c in LANGS}
        if titulo not in dic: sys.exit(f'Falta tradução do título "{titulo}" em js/i18n-textos.js')
        titulos = {'pt': titulo, 'es': dic[titulo][0], 'en': dic[titulo][1]}
        lista.append({'id': tid, 'titulos': titulos, 'textos': textos})
    return lista


def gerar_todas():
    lista = carregar(); n = len(lista); e = html.escape
    slugs = {c: [gl.slug(t['titulos'][c]) for t in lista] for c in LANGS}
    paginas = {}
    for cod in LANGS:
        T, base = TEXTOS[cod], ('' if cod == 'pt' else cod + '/')
        itens = ''.join(f'    <li><a href="{slugs[cod][i]}/" data-local>{e(t["titulos"][cod])}</a><span class="muted">{e(gl.resumo(t["textos"][cod], 120))}</span></li>\n'
                        for i, t in enumerate(lista))
        corpo = f'''  <div class="card">
    <p class="muted licao-kicker"><a href="../" data-local>{e(T['inicio'])}</a> › {e(T['titulo'])}</p>
    <h1>{e(T['titulo'])}</h1>
    <p>{e(T['intro'])}</p>
    <ol class="licoes-indice">
{itens}    </ol>
    <div class="row"><a class="btn" href="../#teoria" data-local>{e(T['abrir_app'])}</a></div>
  </div>'''
        dados = {'@context': 'https://schema.org', '@graph': [
            {'@type': 'CollectionPage', 'name': T['titulo'], 'url': gl.url(cod, PASTA), 'inLanguage': LANGS[cod], 'description': T['indice_desc'],
             'hasPart': [{'@type': 'Article', 'name': t['titulos'][cod], 'url': gl.url(cod, PASTA, slugs[cod][i])} for i, t in enumerate(lista)]},
            gl.migalhas(cod, [(T['inicio'], gl.url(cod)), (T['titulo'], gl.url(cod, PASTA))])]}
        paginas[f'{base}{PASTA}/index.html'] = gl.pagina(cod, 1, T['indice_titulo'], T['indice_desc'], {c: gl.url(c, PASTA) for c in LANGS}, corpo, dados, 'website')
        for i, t in enumerate(lista):
            nav = []
            if i > 0: nav.append(f'<a class="btn sec" href="../{slugs[cod][i-1]}/" data-local><svg class="seta-v" aria-hidden="true" viewBox="0 0 24 24"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>{e(T["anterior"])}</a>')
            nav.append(f'<a class="btn sec" href="../" data-local>{e(T["todos"])}</a>')
            if i < n - 1: nav.append(f'<a class="btn" href="../{slugs[cod][i+1]}/" data-local>{e(T["proximo"])}<svg class="seta-i" aria-hidden="true" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>')
            corpo = f'''  <article class="card licao">
    <p class="muted licao-kicker"><a href="../../" data-local>{e(T['inicio'])}</a> › <a href="../" data-local>{e(T['titulo'])}</a> › {e(T['n'].format(i=i+1, n=n))}</p>
    <h1>{e(t['titulos'][cod])}</h1>
    {t['textos'][cod]}
    <div class="row licao-nav">{''.join(nav)}</div>
  </article>
  <div class="card licao-cta">
    <p>{e(T['pratique'])}</p>
    <a class="btn" href="../../#teoria-{i+1}" data-local>{e(T['abrir'])}</a>
  </div>'''
            descricao = gl.resumo(t['textos'][cod])
            dados = {'@context': 'https://schema.org', '@graph': [
                {'@type': 'Article', 'headline': t['titulos'][cod], 'description': descricao, 'url': gl.url(cod, PASTA, slugs[cod][i]),
                 'inLanguage': LANGS[cod], 'isAccessibleForFree': True, 'publisher': {'@type': 'Organization', 'name': 'BanDoly', 'url': gl.SITE}},
                gl.migalhas(cod, [(T['inicio'], gl.url(cod)), (T['titulo'], gl.url(cod, PASTA)), (t['titulos'][cod], gl.url(cod, PASTA, slugs[cod][i]))])]}
            paginas[f'{base}{PASTA}/{slugs[cod][i]}/index.html'] = gl.pagina(cod, 2, T['topico'].format(t=t['titulos'][cod]), descricao,
                                                                             {c: gl.url(c, PASTA, slugs[c][i]) for c in LANGS}, corpo, dados)
    return paginas, lista, slugs


def sitemap_novo(lista, slugs):
    grupos = [{c: gl.url(c, PASTA) for c in LANGS}] + [{c: gl.url(c, PASTA, slugs[c][i]) for c in LANGS} for i in range(len(lista))]
    out = []
    for g in grupos:
        alt = ''.join(f'    <xhtml:link rel="alternate" hreflang="{LANGS[c]}" href="{u}"/>\n' for c, u in g.items())
        alt += f'    <xhtml:link rel="alternate" hreflang="x-default" href="{g["pt"]}"/>\n'
        for u in g.values(): out.append(f'  <url>\n    <loc>{u}</loc>\n{alt}  </url>\n')
    bloco = '  <!--teoria-->\n' + ''.join(out) + '  <!--/teoria-->\n'
    s = (RAIZ / 'sitemap.xml').read_text(encoding='utf-8')
    if '<!--teoria-->' in s: return re.sub(r'  <!--teoria-->\n.*?  <!--/teoria-->\n', lambda m: bloco, s, flags=re.S)
    return s.replace('</urlset>', bloco + '</urlset>')


def main():
    if hasattr(sys.stdout, 'reconfigure'): sys.stdout.reconfigure(encoding='utf-8')
    verificar = '--verificar' in sys.argv
    paginas, lista, slugs = gerar_todas()
    arquivos = dict(paginas); arquivos['sitemap.xml'] = sitemap_novo(lista, slugs)
    desatualizadas = []
    for caminho, conteudo in arquivos.items():
        destino = RAIZ / caminho
        if verificar:
            if not destino.exists() or destino.read_text(encoding='utf-8') != conteudo: desatualizadas.append(caminho)
            continue
        destino.parent.mkdir(parents=True, exist_ok=True)
        destino.write_bytes(conteudo.encode('utf-8'))
    if verificar:
        if desatualizadas:
            print('Páginas de teoria desatualizadas: ' + ', '.join(desatualizadas[:5]) + '. Rode: python ferramentas/gerar_teoria.py'); sys.exit(1)
    else:
        print(f'{len(paginas)} páginas de teoria geradas e sitemap.xml atualizado')


if __name__ == '__main__':
    main()
