"""Logo do BanDoly na paleta do app (opção B, escolhida pelo dono em 2026-11-10).

O desenho original (bandoneonista em dourado e branco sobre azul-marinho) é separado, pixel a pixel, em fundo,
traço e claro, e repintado: o traço em madrepérola, o claro em osso e o fundo em ameixa com uma luz violeta.
Fonte: icones/originais/compartilhar-original.png (o desenho em maior resolução). Gera:
  icones/bandoly-desenho.png       desenho recortado, fundo transparente (para outras peças)
  icones/icone-192.png, -512.png   ícone do app (só o desenho; o nome aparece embaixo do ícone)
  icones/icone-maskable-*.png      com margem, para o Android recortar em círculo
  icones/logo-cabecalho.png        o ícone no topo do site
  favicon.ico                      16, 32 e 48 px
  icones/compartilhar*.png         prévia ao compartilhar o link (pt, es, en), montada no Edge
Uso: python ferramentas/gerar_logo.py
"""
import subprocess, sys, tempfile
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

RAIZ = Path(__file__).resolve().parent.parent
IC = RAIZ / 'icones'
EDGE = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
TRACO, CLARO = '#cdbf9c', '#f6f1e4'   # madrepérola e osso
LUZ, AMEIXA = '#3a2a5c', '#1c1624'


def hexa(h): return np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], np.float32) / 255


def separar(rgb):
    """Pesos de fundo, traço (dourado) e claro (branco) de cada pixel, pela claridade e pelo calor da cor."""
    A = np.asarray(rgb.convert('RGB')).astype(np.float32) / 255
    V, W = A.max(axis=2), A[..., 0] - A[..., 2]
    P = np.array([[0.27, -0.20], [0.80, 0.42], [1.0, 0.02]])  # fundo, dourado, branco em (claridade, calor)
    T = np.array([[P[0, 0], P[1, 0], P[2, 0]], [P[0, 1], P[1, 1], P[2, 1]], [1, 1, 1]])
    X = np.stack([V, W, np.ones_like(V)], axis=-1) @ np.linalg.inv(T).T
    X = np.clip(X, 0, None); X /= X.sum(axis=-1, keepdims=True) + 1e-6
    frio = np.clip((W + 0.19) / 0.06, 0, 1)  # azul puro é sempre fundo (o degradê do fundo original)
    return X[..., 1] * frio, X[..., 2] * frio


def desenho():
    fonte = Image.open(IC / 'originais' / 'compartilhar-original.png').convert('RGB')
    ouro, branco = separar(fonte)
    alfa = np.clip(ouro + branco, 0, 1)
    cor = (hexa(TRACO) * ouro[..., None] + hexa(CLARO) * branco[..., None]) / (alfa[..., None] + 1e-6)
    alfa = np.clip((alfa - 0.22) / 0.55, 0, 1)  # o resto do degradê do fundo original fica de fora
    alfa[:, 600:] = 0  # à direita fica o texto da imagem original
    img = Image.fromarray(np.dstack([np.clip(cor, 0, 1) * 255, alfa * 255]).astype(np.uint8))
    return img.crop(img.getbbox())


def fundo(n):
    yy, xx = np.mgrid[0:n, 0:n] / n
    d = np.clip(np.hypot(xx - .5, (yy - .12) * .9) / .95, 0, 1)[..., None]
    return Image.fromarray(((hexa(LUZ) * (1 - d) + hexa(AMEIXA) * d) * 255).astype(np.uint8))


def icone(des, n, ocupa):
    base = fundo(n).convert('RGBA')
    w, h = des.size; k = ocupa * n / max(w, h)
    d = des.resize((round(w * k), round(h * k)), Image.LANCZOS)
    base.alpha_composite(d, ((n - d.width) // 2, (n - d.height) // 2 + round(n * .01)))
    return base.convert('RGB')


TEXTOS = {
    'pt': ('Aprenda bandoneon', 'online e grátis', 'Teclado com som real, lições,<br>acordes e ritmos de tango', 'compartilhar.png'),
    'es': ('Aprendé bandoneón', 'online y gratis', 'Teclado con sonido real, lecciones,<br>acordes y ritmos de tango', 'compartilhar-es.png'),
    'en': ('Learn the bandoneon', 'online, for free', 'Keyboard with real sound, lessons,<br>chords and tango rhythms', 'compartilhar-en.png'),
}


def compartilhar(desenho_png):
    fonte = (RAIZ / 'fontes' / 'onest-latin.woff2').as_uri()
    with tempfile.TemporaryDirectory() as tmp:
        for cod, (l1, l2, sub, arq) in TEXTOS.items():
            html = Path(tmp) / f'{cod}.html'
            html.write_bytes(f'''<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{{font-family:Onest;font-weight:400 900;src:url({fonte}) format('woff2')}}
body{{margin:0;width:1200px;height:630px;overflow:hidden;position:relative;background:#1c1624;font-family:Onest,sans-serif}}
.luz{{position:absolute;left:-120px;top:-160px;width:900px;height:900px;background:radial-gradient(closest-side,rgba(107,19,245,.42),rgba(255,86,50,.08) 60%,transparent 75%);filter:blur(20px)}}
img{{position:absolute;left:36px;top:50%;transform:translateY(-50%);height:500px}}
.t{{position:absolute;left:610px;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center;color:#f1f0ec}}
.m{{font-size:118px;font-weight:650;letter-spacing:-.04em;line-height:1}} .m b{{font-weight:inherit;color:#b997ff}}
h1{{margin:44px 0 0;font-size:46px;font-weight:600;line-height:1.15;letter-spacing:-.025em}} h1 span{{display:block;color:#b997ff}}
p{{margin:26px 0 0;font-size:28px;line-height:1.4;color:#d0c9c4}}
</style></head><body><div class="luz"></div><img src="{desenho_png.as_uri()}">
<div class="t"><div class="m">Ban<b>Doly</b></div><h1>{l1}<span>{l2}</span></h1><p>{sub}</p></div></body></html>'''.encode('utf-8'))
            png = Path(tmp) / f'{cod}.png'
            subprocess.run([EDGE, '--headless', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files', '--virtual-time-budget=3000',
                            f'--user-data-dir={Path(tmp) / "perfil"}', '--window-size=1200,630', f'--screenshot={png}', html.as_uri()],
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=120)
            Image.open(png).convert('RGB').save(IC / arq, optimize=True)


if __name__ == '__main__':
    if hasattr(sys.stdout, 'reconfigure'): sys.stdout.reconfigure(encoding='utf-8')
    des = desenho()
    des.save(IC / 'bandoly-desenho.png', optimize=True)
    grande = icone(des, 1024, .84)
    for n in (512, 192): grande.resize((n, n), Image.LANCZOS).save(IC / f'icone-{n}.png', optimize=True)
    mask = icone(des, 1024, .62)
    for n in (512, 192): mask.resize((n, n), Image.LANCZOS).save(IC / f'icone-maskable-{n}.png', optimize=True)
    grande.resize((96, 96), Image.LANCZOS).filter(ImageFilter.UnsharpMask(1, 60, 2)).save(IC / 'logo-cabecalho.png', optimize=True)
    icone(des, 1024, .92).save(RAIZ / 'favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)])
    compartilhar(IC / 'bandoly-desenho.png')
    print('ok: desenho', des.size)
