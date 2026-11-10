"""Gera o panfleto para professores (professores/panfleto.pdf, A4) e o QR code (icones/qr-professores.svg).

O QR aponta para https://bandoly.app/professores/. Precisa do pacote `qrcode` (pip install qrcode) e do Edge,
que imprime a página em PDF. Uso: python ferramentas/gerar_panfleto.py
"""
import subprocess, sys, tempfile
from pathlib import Path
import qrcode

RAIZ = Path(__file__).resolve().parent.parent
URL = 'https://bandoly.app/professores/'
EDGE = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'


def qr_svg(url, cor='#1c1624'):
    q = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, border=0)
    q.add_data(url); q.make(fit=True)
    m = q.get_matrix(); n = len(m)
    d = ''.join(f'M{x},{y}h1v1h-1z' for y, linha in enumerate(m) for x, v in enumerate(linha) if v)
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 {n + 4} {n + 4}" shape-rendering="crispEdges"><rect x="-2" y="-2" width="{n + 4}" height="{n + 4}" fill="#fff"/><path fill="{cor}" d="{d}"/></svg>'


def pagina(svg):
    fonte = (RAIZ / 'fontes' / 'onest-latin.woff2').as_uri()
    logo = (RAIZ / 'icones' / 'icone-512.png').as_uri()
    passos = [('1', 'Você monta a tarefa', 'Um exercício ou um plano com vários, o modo de treino, a velocidade e a sua mensagem.'),
              ('2', 'O aluno abre o link', 'Pelo WhatsApp ou por e-mail. O exercício aparece pronto, no celular ou no computador.'),
              ('3', 'Você recebe o relatório', 'A nota, o ritmo, a direção do fole e as notas que ele acertou e errou.')]
    return f'''<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>BanDoly para professores de bandoneon</title><style>
@font-face{{font-family:Onest;font-weight:400 900;src:url({fonte}) format('woff2')}}
@page{{size:A4;margin:0}}
*{{box-sizing:border-box}}
body{{margin:0;font-family:Onest,Segoe UI,sans-serif;color:#1c1624;-webkit-print-color-adjust:exact;print-color-adjust:exact}}
.folha{{width:210mm;height:296mm;overflow:hidden;padding:22mm 20mm 18mm;display:flex;flex-direction:column}}
.marca{{display:flex;align-items:center;gap:5mm;font-size:22pt;font-weight:650;letter-spacing:-.02em}}
.marca img{{width:20mm;height:20mm;border-radius:4.5mm}}
.sobre{{margin:13mm 0 4mm;font-size:11pt;font-weight:600;color:#6b3fd6}}
h1{{margin:0;font-size:36pt;line-height:1.05;letter-spacing:-.035em;font-weight:650}}
h1 span{{display:block}} h1 .lav{{color:#6b3fd6}}
.apoio{{margin:7mm 0 0;font-size:13.5pt;line-height:1.5;color:#3a3442;max-width:150mm}}
ol{{list-style:none;margin:9mm 0 0;padding:0}}
li{{display:flex;gap:6mm;padding:4.5mm 0;border-top:.3mm solid #dcd6e4}}
li:last-child{{border-bottom:.3mm solid #dcd6e4}}
.n{{width:10mm;height:10mm;min-height:10mm;align-self:flex-start;border-radius:50%;background:#ece4ff;color:#5a2fc7;display:grid;place-items:center;font-weight:650;font-size:12pt;flex:none}}
li b{{display:block;font-size:14pt;font-weight:600;letter-spacing:-.01em}}
li div span{{font-size:11.5pt;color:#4a4452;line-height:1.45}}
.qr{{margin-top:auto;padding-top:7mm;display:flex;align-items:center;gap:10mm}}
.qr svg{{width:46mm;height:46mm;flex:none}}
.qr b{{display:block;font-size:20pt;font-weight:650;letter-spacing:-.02em}}
.qr p{{margin:2mm 0 0;font-size:12pt;color:#4a4452;line-height:1.45}}
.pe{{margin-top:9mm;padding-top:5mm;border-top:.3mm solid #dcd6e4;font-size:9.5pt;color:#6a6472;line-height:1.5}}
</style></head><body><div class="folha">
<div class="marca"><img src="{logo}" alt="">BanDoly</div>
<p class="sobre">Para professores de bandoneon</p>
<h1><span>O aluno estuda em casa.</span><span class="lav">Você vê como foi.</span></h1>
<p class="apoio">O BanDoly é um app de bandoneon com o teclado inteiro e som gravado de um instrumento de verdade. Mande a tarefa por um link e receba o relatório do que o aluno tocou.</p>
<ol>{''.join(f'<li><span class="n">{n}</span><div><b>{h}</b><span>{p}</span></div></li>' for n, h, p in passos)}</ol>
<div class="qr">{svg}<div><b>bandoly.app/professores</b><p>Aponte a câmera do celular para o código, ou digite o endereço no navegador.</p><p>Sem cadastro, dos dois lados. Hoje o BanDoly é gratuito.</p></div></div>
<p class="pe">O BanDoly é um apoio ao estudo e não substitui as aulas de um professor. Em português, espanhol e inglês.<br>Criado em homenagem a Doly Costa, bandoneonista de Caçapava do Sul (RS).</p>
</div></body></html>'''


if __name__ == '__main__':
    if hasattr(sys.stdout, 'reconfigure'): sys.stdout.reconfigure(encoding='utf-8')
    svg = qr_svg(URL)
    (RAIZ / 'icones' / 'qr-professores.svg').write_bytes(svg.encode('utf-8'))
    with tempfile.TemporaryDirectory() as tmp:
        html = Path(tmp) / 'panfleto.html'; html.write_bytes(pagina(svg).encode('utf-8'))
        pdf = RAIZ / 'professores' / 'panfleto.pdf'
        subprocess.run([EDGE, '--headless', '--disable-gpu', '--allow-file-access-from-files', '--no-pdf-header-footer',
                        f'--user-data-dir={Path(tmp) / "perfil"}', f'--print-to-pdf={pdf}', html.as_uri()],
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=120, check=False)
    print('QR:', 'icones/qr-professores.svg', '· panfleto:', 'professores/panfleto.pdf', f'({pdf.stat().st_size // 1024} KB)')
