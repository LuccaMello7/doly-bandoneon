"""Gera as páginas de teoria musical (uma por tópico, nos três idiomas) a partir da aba Teoria do app.

Páginas: teoria/index.html           índice em português
         teoria/<tópico>/index.html  uma página por tópico
         es/teoria/... e en/teoria/... o mesmo em espanhol e inglês

Uso:  python ferramentas/gerar_teoria.py              (gera as páginas e atualiza o sitemap.xml)
      python ferramentas/gerar_teoria.py --verificar  (só confere se estão atualizadas)

Por quê: no app a teoria é montada pelo JavaScript; com páginas próprias, cada tópico pode aparecer no
Google para a pergunta que responde ("clave de sol", "figuras musicais", "escala maior"...).

De onde vem o conteúdo: js/teoria-textos.js (os 3 módulos e, de cada um dos 16 tópicos, o título, o texto e o
quadro "Por que isso importa no bandoneon", nos três idiomas). Os tópicos que mudaram de nome guardam o endereço
antigo (slug_pt/es/en). O modelo da página é o mesmo das lições (ferramentas/gerar_licoes.py).
"""
import html, re, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import gerar_licoes as gl

RAIZ = gl.RAIZ
PASTA = 'teoria'
LANGS = gl.LANGS
COL = {'es': 0, 'en': 1}
gl.CABECALHO = '<!-- Gerado por ferramentas/gerar_teoria.py a partir de js/teoria.js e js/teoria-textos.js. Não edite à mão. -->\n'

TEXTOS = {
'pt': dict(titulo='Teoria musical para bandoneon', indice_titulo='Teoria musical para bandoneon: leitura, escalas e harmonia do tango | BanDoly',
    indice_desc='Teoria musical com som, para quem toca bandoneon: pauta, figuras, dinâmica, ritmo do tango, intervalos, escalas, armadura, acordes e cadências. 16 tópicos.',
    intro='Dezesseis tópicos em três módulos, da leitura da partitura à harmonia do tango. No app, cada tópico tem um laboratório com o teclado do bandoneon, em que dá para ouvir e ver cada ideia, e um teste que explica cada resposta.',
    topico='{t} | Teoria musical - BanDoly', n='Tópico {i} de {n}', todos='Todos os tópicos', anterior='Anterior', proximo='Próximo', band='Por que isso importa no bandoneon',
    pratique='No app, este tópico tem um laboratório com o teclado do bandoneon e um teste de cinco perguntas que explica cada resposta. Grátis e sem cadastro.', abrir='Abrir este tópico no app', tipo='Artigo'),
'es': dict(titulo='Teoría musical para bandoneón', indice_titulo='Teoría musical para bandoneón: lectura, escalas y armonía del tango | BanDoly',
    indice_desc='Teoría musical con sonido, para quien toca el bandoneón: pentagrama, figuras, dinámica, ritmo del tango, intervalos, escalas, armadura, acordes y cadencias. 16 temas.',
    intro='Dieciséis temas en tres módulos, de la lectura de la partitura a la armonía del tango. En la app, cada tema tiene un laboratorio con el teclado del bandoneón, donde podés escuchar y ver cada idea, y una prueba que explica cada respuesta.',
    topico='{t} | Teoría musical - BanDoly', n='Tema {i} de {n}', todos='Todos los temas', anterior='Anterior', proximo='Siguiente', band='Por qué importa en el bandoneón',
    pratique='En la app, este tema tiene un laboratorio con el teclado del bandoneón y una prueba de cinco preguntas que explica cada respuesta. Gratis y sin registro.', abrir='Abrir este tema en la app', tipo='Artículo'),
'en': dict(titulo='Music theory for bandoneon', indice_titulo='Music theory for bandoneon: reading, scales and tango harmony | BanDoly',
    indice_desc='Music theory with sound, for bandoneon players: the staff, note values, dynamics, tango rhythm, intervals, scales, key signatures, chords and cadences. 16 topics.',
    intro='Sixteen topics in three modules, from reading music to the harmony of tango. In the app, every topic has a lab with the bandoneon keyboard, where you can hear and see each idea, and a quiz that explains every answer.',
    topico='{t} | Music theory - BanDoly', n='Topic {i} of {n}', todos='All topics', anterior='Previous', proximo='Next', band='Why it matters on the bandoneon',
    pratique='In the app, this topic has a lab with the bandoneon keyboard and a five-question quiz that explains every answer. Free, no sign-up.', abrir='Open this topic in the app', tipo='Article'),
}
for cod, T in TEXTOS.items():  # menus, aviso e rodapé iguais aos das lições
    T.update({k: v for k, v in gl.TEXTOS[cod].items() if k not in T})

# tópico → páginas de referência (mapa de notas, escalas, acordes)
VEJA_TEORIA = {'notas': ['notas'], 'acidentes': ['notas'], 'escalas': ['escalas'], 'menores': ['escalas'], 'armadura': ['escalas'],
               'acordes': ['acordes'], 'setima': ['acordes']}


def carregar():
    """Os módulos (TEORIA_MODULOS) e, de cada tópico, título, texto, quadro do bandoneon e endereço, nos três idiomas.
    Cada campo de js/teoria-textos.js fica numa linha própria: titulo_pt:'…', pt:'…', band_pt:'…', slug_pt:'…'."""
    tx = (RAIZ / 'js' / 'teoria-textos.js').read_text(encoding='utf-8')
    modulos = []
    for m in re.finditer(r"^\{id:'(\w+)', pt:" + gl.STR + r", es:" + gl.STR + r", en:" + gl.STR + r", topicos:\[([^\]]*)\]\}", tx, re.M):
        modulos.append({'id': m.group(1), 'nomes': {'pt': gl.js_str(m.group(2)), 'es': gl.js_str(m.group(3)), 'en': gl.js_str(m.group(4))},
                        'topicos': re.findall(r"'(\w+)'", m.group(5))})
    if len(modulos) != 3: sys.exit('Não achei os 3 módulos em js/teoria-textos.js')
    lista = []
    for mod in modulos:
        for tid in mod['topicos']:
            i = tx.index(f'\n{tid}: {{\n'); prox = re.search(r"\n\w+: \{\n", tx[i + 1:])
            bloco = tx[i: i + 1 + prox.start()] if prox else tx[i:]
            def campo(nome):
                m = re.search('^' + nome + ':' + gl.STR, bloco, re.M)
                return gl.js_str(m.group(1)) if m else None
            t = {'id': tid, 'modulo': mod['id'], 'titulos': {}, 'textos': {}, 'band': {}, 'slugs': {}}
            for c in LANGS:
                t['titulos'][c], t['textos'][c], t['band'][c] = campo('titulo_' + c), campo(c), campo('band_' + c)
                if not (t['titulos'][c] and t['textos'][c] and t['band'][c]): sys.exit(f'Falta título, texto ou quadro do bandoneon de "{tid}" ({c}) em js/teoria-textos.js')
                t['slugs'][c] = campo('slug_' + c) or gl.slug(t['titulos'][c])
            lista.append(t)
    return modulos, lista


def gerar_todas():
    modulos, lista = carregar(); n = len(lista); e = html.escape
    slugs = {c: [t['slugs'][c] for t in lista] for c in LANGS}
    paginas = {}
    for cod in LANGS:
        T, base = TEXTOS[cod], ('' if cod == 'pt' else cod + '/')
        blocos = ''
        for mod in modulos:
            itens = ''.join(f'      <li><a href="{slugs[cod][i]}/" data-local>{e(t["titulos"][cod])}</a><span class="muted">{e(gl.resumo(t["textos"][cod], 120))}</span></li>\n'
                            for i, t in enumerate(lista) if t['modulo'] == mod['id'])
            inicio = next(i for i, t in enumerate(lista) if t['modulo'] == mod['id']) + 1
            blocos += f'    <h2>{e(mod["nomes"][cod])}</h2>\n    <ol class="licoes-indice" start="{inicio}">\n{itens}    </ol>\n'
        corpo = f'''  <div class="card">
    <p class="muted licao-kicker"><a href="../" data-local>{e(T['inicio'])}</a> › {e(T['titulo'])}</p>
    <h1>{e(T['titulo'])}</h1>
    <p>{e(T['intro'])}</p>
{blocos}    <div class="row"><a class="btn" href="../#teoria" data-local>{e(T['abrir_app'])}</a></div>
  </div>'''
        dados = {'@context': 'https://schema.org', '@graph': [
            {'@type': 'CollectionPage', 'name': T['titulo'], 'url': gl.url(cod, PASTA), 'inLanguage': LANGS[cod], 'description': T['indice_desc'],
             'hasPart': [{'@type': 'Article', 'name': t['titulos'][cod], 'url': gl.url(cod, PASTA, slugs[cod][i])} for i, t in enumerate(lista)]},
            gl.migalhas(cod, [(T['inicio'], gl.url(cod)), (T['titulo'], gl.url(cod, PASTA))])]}
        paginas[f'{base}{PASTA}/index.html'] = gl.pagina(cod, 1, gl.titulo_pagina(T['indice_titulo'], T['titulo']), T['indice_desc'], {c: gl.url(c, PASTA) for c in LANGS}, corpo, dados, 'website')
        for i, t in enumerate(lista):
            nav = []
            if i > 0: nav.append(f'<a class="btn sec" href="../{slugs[cod][i-1]}/" data-local><svg class="seta-v" aria-hidden="true" viewBox="0 0 24 24"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>{e(T["anterior"])}</a>')
            nav.append(f'<a class="btn sec" href="../" data-local>{e(T["todos"])}</a>')
            if i < n - 1: nav.append(f'<a class="btn" href="../{slugs[cod][i+1]}/" data-local>{e(T["proximo"])}<svg class="seta-i" aria-hidden="true" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>')
            mod = next(m for m in modulos if m['id'] == t['modulo'])
            corpo = f'''  <article class="card licao">
    <p class="muted licao-kicker"><a href="../../" data-local>{e(T['inicio'])}</a> › <a href="../" data-local>{e(T['titulo'])}</a> › {e(mod['nomes'][cod])} · {e(T['n'].format(i=i+1, n=n))}</p>
    <h1>{e(t['titulos'][cod])}</h1>
    {t['textos'][cod]}
    <h2>{e(T['band'])}</h2>
    {t['band'][cod]}
    <div class="row licao-nav">{''.join(nav)}</div>
  </article>
{gl.veja_tambem(cod, VEJA_TEORIA[t['id']], '../../') if t['id'] in VEJA_TEORIA else ''}  <div class="card licao-cta">
    <p>{e(T['pratique'])}</p>
    <a class="btn" href="../../#teoria-{t['id']}" data-local>{e(T['abrir'])}</a>
  </div>'''
            descricao = gl.resumo(t['textos'][cod])
            dados = {'@context': 'https://schema.org', '@graph': [
                {'@type': 'Article', 'headline': t['titulos'][cod], 'description': descricao, 'url': gl.url(cod, PASTA, slugs[cod][i]),
                 'inLanguage': LANGS[cod], 'isAccessibleForFree': True, 'publisher': {'@type': 'Organization', 'name': 'BanDoly', 'url': gl.SITE}},
                gl.migalhas(cod, [(T['inicio'], gl.url(cod)), (T['titulo'], gl.url(cod, PASTA)), (t['titulos'][cod], gl.url(cod, PASTA, slugs[cod][i]))])]}
            paginas[f'{base}{PASTA}/{slugs[cod][i]}/index.html'] = gl.pagina(cod, 2, gl.titulo_pagina(T['topico'], t['titulos'][cod]), descricao,
                                                                             {c: gl.url(c, PASTA, slugs[c][i]) for c in LANGS}, corpo, dados)
    return paginas, lista, slugs


def sitemap_novo(lista, slugs, paginas):
    grupos = [{c: gl.url(c, PASTA) for c in LANGS}] + [{c: gl.url(c, PASTA, slugs[c][i]) for c in LANGS} for i in range(len(lista))]
    return gl.sitemap_com_bloco('teoria', gl.sitemap_bloco('teoria', grupos, paginas))


def main():
    if hasattr(sys.stdout, 'reconfigure'): sys.stdout.reconfigure(encoding='utf-8')
    verificar = '--verificar' in sys.argv
    paginas, lista, slugs = gerar_todas()
    arquivos = dict(paginas); arquivos['sitemap.xml'] = sitemap_novo(lista, slugs, paginas)
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
        gl.salvar_datas()
        print(f'{len(paginas)} páginas de teoria geradas e sitemap.xml atualizado')


if __name__ == '__main__':
    main()
