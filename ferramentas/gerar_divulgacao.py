"""Peças de divulgação (Instagram, LinkedIn, X/Twitter) a partir de capturas reais do app.

1. Captura telas do app num celular de 360x640 a 3x (1080x1920), com estados montados pelo próprio app.
2. Monta as peças em HTML (fonte Onest, paleta do app) e fotografa com o Edge:
   - instagram-1..5.png (1080x1350, carrossel), também usados no LinkedIn
   - linkedin-carrossel.pdf (os 5 slides num PDF, para post de documento)
   - linkedin-capa.png (1200x627) e x-twitter.png (1600x900)
Saída em divulgacao/ (fora do site: _config.yml). Uso: python ferramentas/gerar_divulgacao.py
"""
import re, subprocess, sys, tempfile
from pathlib import Path
from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
SAIDA = RAIZ / 'divulgacao'
EDGE = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
PRE = ("localStorage.clear();localStorage['bandoneon.perfilAluno']=JSON.stringify({exp:'nunca',inst:'nao',obj:'tango',data:'2026-11-06'});"
       "localStorage['bandoneon.pcLigado']='false';localStorage['bandoneon.avisoProfVisto']='true';localStorage['bandoneon.instalarNao']='true';"
       "localStorage['bandoneon.guiaInicio']='true';")
ROLAR = "const el=document.querySelector('{}');if(el)scrollTo(0,el.getBoundingClientRect().top+scrollY-{});"
TELAS = {
    # Início: o instrumento com um botão aceso e a partitura viva com as primeiras notas de El Choclo
    'inicio': ('', "iniGuiaFim();const it=iniBotoes.find(x=>x.mao==='right'&&x.b.open===79)||iniBotoes[40];it.el.classList.add('on');iniVisor(it);"
                   "[79,76,73,79,78,74,71,78].forEach(m=>iniPautaNota(m));" + ROLAR.format('#iniInst', 64)),
    'teclado': ('#teclado', "setTimeout(()=>{const k=[...document.querySelectorAll('#kbRight .key')];[12,19].forEach(i=>k[i]&&k[i].classList.add('down'));"
                            + ROLAR.format('#kbLeft', 120) + "},300)"),
    'academia': ('#academia', "carregarExercicio('n6-choclo');document.querySelector('#acModo [data-modo=aprender]').click();acadRecolher(true);"
                              "acad.rodando=true;novaRodada();acad.g=-1;avancar();avancar();avancar();faixaMarca(0,'ok');faixaMarca(1,'ok');"
                              "setTimeout(()=>{" + ROLAR.format('#acTeclados', 250) + "},200)"),
    'relatorios': ('#relatorios', "document.querySelector('#relVerExemplo').click();setTimeout(()=>{" + ROLAR.format('#relDetalhe', 60) + "},200)"),
    'conquistas': ('#perfil', "state.layout.right.forEach((b,i)=>{if(i%4)state.progress.btnStats[statKey('right',b.id,'open')]={ok:i%5+2,err:i%3};});"
                              "state.layout.left.slice(0,16).forEach((b,i)=>state.progress.btnStats[statKey('left',b.id,'close')]={ok:3,err:i%3});"
                              "renderPerfil();" + ROLAR.format('.pf-mapa', 60)),
}


def capturar(tmp):
    src0 = (RAIZ / 'index.html').read_text(encoding='utf-8')
    src0 = re.sub(r'<meta http-equiv="Content-Security-Policy"[^>]*>', '', src0)
    src0 = re.sub(r'<script data-goatcounter[^>]*></script>', '', src0)
    out = {}
    for nome, (hash_, extra) in TELAS.items():
        src = src0.replace('<head>', f'<head><base href="{RAIZ.as_uri()}/"><script>try{{{PRE}}}catch(e){{}}</script>'
                                     '<style>.toast{display:none!important}</style>', 1)
        src = src.replace('</body>', f"<script>setTimeout(()=>{{document.documentElement.classList.remove('tem-teclado');{extra}}},800)</script></body>", 1)
        (tmp / 'app.html').write_bytes(src.encode('utf-8'))
        (tmp / 'cel.html').write_bytes(f'<!DOCTYPE html><html><body style="margin:0;background:#000"><iframe src="app.html{hash_}" '
                                       'style="width:360px;height:640px;border:0"></iframe></body></html>'.encode('utf-8'))
        png = tmp / f'cap-{nome}.png'
        subprocess.run([EDGE, '--headless', '--disable-gpu', '--hide-scrollbars', '--force-prefers-reduced-motion', '--allow-file-access-from-files',
                        f'--user-data-dir={tmp / "perfil"}', '--virtual-time-budget=8000', '--force-device-scale-factor=3',
                        '--window-size=500,640', f'--screenshot={png}', (tmp / 'cel.html').as_uri()],
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=120)
        Image.open(png).convert('RGB').crop((0, 0, 1080, 1920)).save(SAIDA / f'tela-{nome}.png', optimize=True)
        out[nome] = SAIDA / f'tela-{nome}.png'
        print('tela', nome)
    return out


SETA = '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
SLIDES = [
    ('inicio', 'Aprenda bandoneon.', 'Um botão de cada vez.', 'O bandoneon inteiro na tela do celular, com som de verdade.'),
    ('teclado', '71 botões, duas notas cada.', 'Abrindo e fechando o fole.', 'O teclado Rheinische 142, com o som gravado de um bandoneon de 1930.'),
    ('academia', 'Um instrutor em cada nota.', 'Do primeiro botão ao tango.', 'O app mostra o botão, a mão e o fole e, no fim, diz o que revisar.'),
    ('relatorios', 'Para quem ensina.', 'Tarefa por link, relatório de volta.', 'O aluno estuda em casa. Você vê a nota, o ritmo e o fole de cada exercício.'),
]


def css_base(fonte):
    return f'''@font-face{{font-family:Onest;font-weight:400 900;src:url({fonte}) format('woff2')}}
*{{box-sizing:border-box}} body{{margin:0;overflow:hidden;position:relative;background:#1c1624;font-family:Onest,sans-serif;color:#f1f0ec}}
.luz{{position:absolute;pointer-events:none;background:radial-gradient(closest-side,rgba(107,19,245,.5),rgba(255,86,50,.12) 62%,transparent 78%);filter:blur(30px)}}
.marca{{display:flex;align-items:center;gap:16px;font-weight:650;letter-spacing:-.02em}}
.marca img{{border-radius:22%}}
h1{{margin:0;font-weight:650;letter-spacing:-.035em;line-height:1.04}} h1 span{{display:block;color:#b997ff}}
.sub{{color:#d0c9c4;line-height:1.4;margin:0}}
.tel{{position:absolute;border-radius:6.5%/3.7%;overflow:hidden;background:#000 center top/cover no-repeat;box-shadow:0 0 0 10px #0d0a12,0 0 0 11px rgba(255,255,255,.12),0 50px 90px -30px rgba(0,0,0,.95)}}
.pe{{position:absolute;display:flex;align-items:center;justify-content:space-between;color:#a5a2a5;font-weight:500}}
.pe b{{color:#f1f0ec;font-weight:600}}'''


def foto(tmp, html, w, h, png):
    f = tmp / 'peca.html'; f.write_bytes(html.encode('utf-8'))
    subprocess.run([EDGE, '--headless', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files', '--virtual-time-budget=3000',
                    f'--user-data-dir={tmp / "perfil2"}', f'--window-size={w},{h}', f'--screenshot={png}', f.as_uri()],
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=120)
    Image.open(png).convert('RGB').save(png, optimize=True)


def pecas(tmp, telas):
    fonte = (RAIZ / 'fontes' / 'onest-latin.woff2').as_uri(); logo = (RAIZ / 'icones' / 'icone-512.png').as_uri()
    desenho = (RAIZ / 'icones' / 'bandoly-desenho.png').as_uri(); base = css_base(fonte)
    total = len(SLIDES) + 1
    # ---- carrossel 1080x1350 ----
    for i, (tela, l1, l2, sub) in enumerate(SLIDES, 1):
        html = f'''<!doctype html><html><head><meta charset="utf-8"><style>{base}
body{{width:1080px;height:1350px}} .luz{{left:140px;top:520px;width:800px;height:800px}}
.topo{{position:absolute;left:84px;right:84px;top:76px}} .marca{{font-size:30px}} .marca img{{width:56px;height:56px}}
h1{{margin-top:50px;font-size:68px}} .sub{{margin-top:22px;font-size:29px;max-width:880px}}
.tel{{left:50%;top:548px;width:540px;height:960px;margin-left:-270px;background-image:url({telas[tela].as_uri()})}}
.lin{{display:flex;justify-content:space-between;align-items:center}} .pg{{font-size:22px;color:#a5a2a5;font-variant-numeric:tabular-nums}}
</style></head><body><div class="luz"></div>
<div class="topo"><div class="lin"><div class="marca"><img src="{logo}">BanDoly</div><span class="pg">{i}/{total}</span></div><h1>{l1}<span>{l2}</span></h1><p class="sub">{sub}</p></div>
<div class="tel"></div></body></html>'''
        foto(tmp, html, 1080, 1350, SAIDA / f'instagram-{i}.png'); print('slide', i)
    # último: convite, com o desenho e a homenagem
    html = f'''<!doctype html><html><head><meta charset="utf-8"><style>{base}
body{{width:1080px;height:1350px}} .luz{{left:90px;top:60px;width:900px;height:900px}}
.des{{position:absolute;left:50%;top:120px;width:520px;margin-left:-260px}}
.txt{{position:absolute;left:84px;right:84px;top:680px;text-align:center}}
h1{{font-size:76px}} .sub{{margin:28px auto 0;font-size:30px;max-width:820px}}
.cta{{display:inline-flex;align-items:center;gap:14px;margin-top:44px;padding:22px 40px;border-radius:18px;background:#00f575;color:#000;font-size:34px;font-weight:550}}
.hom{{margin-top:40px;font-size:22px;color:#a5a2a5}}
.pe{{left:84px;right:84px;bottom:40px;font-size:22px}}
</style></head><body><div class="luz"></div><img class="des" src="{desenho}">
<div class="txt"><h1>Hoje é gratuito.<span>No navegador e no celular.</span></h1>
<p class="sub">Em português, espanhol e inglês. Sem cadastro: a conta é opcional, para guardar o progresso na nuvem.</p>
<div class="cta">bandoly.app {SETA}</div>
<p class="hom">Criado em homenagem a Doly Costa, bandoneonista de Caçapava do Sul (RS).</p></div>
<div class="pe"><span>bandoly.app</span><span>{total}/{total}</span></div></body></html>'''
    foto(tmp, html, 1080, 1350, SAIDA / f'instagram-{total}.png'); print('slide', total)
    # PDF do carrossel (post de documento no LinkedIn)
    imgs = [Image.open(SAIDA / f'instagram-{i}.png').convert('RGB') for i in range(1, total + 1)]
    imgs[0].save(SAIDA / 'linkedin-carrossel.pdf', save_all=True, append_images=imgs[1:], resolution=150)
    # ---- paisagem: LinkedIn (1200x627) e X (1600x900) ----
    for nome, w, h in [('linkedin-capa', 1200, 627), ('x-twitter', 1600, 900)]:
        k = h / 900
        html = f'''<!doctype html><html><head><meta charset="utf-8"><style>{base}
body{{width:{w}px;height:{h}px}} .luz{{right:{-80*k}px;top:{-120*k}px;width:{1000*k}px;height:{1000*k}px}}
.txt{{position:absolute;left:{90*k}px;top:0;bottom:0;width:{(w*.5)}px;display:flex;flex-direction:column;justify-content:center}}
.marca{{font-size:{34*k}px}} .marca img{{width:{62*k}px;height:{62*k}px}}
h1{{margin-top:{44*k}px;font-size:{62*k}px}} .sub{{margin-top:{26*k}px;font-size:{28*k}px;max-width:{600*k}px}}
.url{{margin-top:{36*k}px;font-size:{30*k}px;font-weight:550;color:#f1f0ec}}
.tel{{width:{380*k}px;height:{676*k}px;top:{150*k}px}} .t1{{right:{400*k}px;background-image:url({telas['inicio'].as_uri()})}}
.t2{{right:{70*k}px;top:{90*k}px;background-image:url({telas['academia'].as_uri()})}}
</style></head><body><div class="luz"></div>
<div class="txt"><div class="marca"><img src="{logo}">BanDoly</div><h1>Aprenda bandoneon.<span>Um botão de cada vez.</span></h1>
<p class="sub">Teclado com som real, lições, exercícios com instrutor e ferramentas para professores. No navegador e no celular.</p>
<div class="url">bandoly.app</div></div><div class="tel t1"></div><div class="tel t2"></div></body></html>'''
        foto(tmp, html, w, h, SAIDA / f'{nome}.png'); print('peça', nome)


if __name__ == '__main__':
    if hasattr(sys.stdout, 'reconfigure'): sys.stdout.reconfigure(encoding='utf-8')
    SAIDA.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory() as t:
        tmp = Path(t); telas = capturar(tmp); pecas(tmp, telas)
