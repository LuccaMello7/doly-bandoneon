# Mede a altura das cabeças de nota em relação às linhas da pauta, para conferir uma transcrição nota a nota.
# uso: python ferramentas/medir_notas.py pagina.png x0 y0 x1 y1 saida.png   (precisa de numpy, pillow e scipy)
# Saída: a posição de cada nota (0 = linha de baixo, 1 = 1º espaço, 2 = 2ª linha…) e uma imagem marcada.
import sys
import numpy as np
from PIL import Image, ImageOps, ImageDraw
from scipy import ndimage

arq, x0, y0, x1, y1, saida = sys.argv[1], *map(int, sys.argv[2:6]), sys.argv[6]
im = ImageOps.autocontrast(Image.open(arq).convert('L'), cutoff=2).crop((x0, y0, x1, y1))
a = np.asarray(im, dtype=float) / 255.0
escuro = a < 0.5
# linhas da pauta: linhas de pixels com muita tinta ao longo da largura
perfil = escuro.mean(axis=1)
cand = np.where(perfil > 0.45)[0]
grupos = []
for y in cand:
    if grupos and y - grupos[-1][-1] <= 2: grupos[-1].append(y)
    else: grupos.append([y])
linhas = [float(np.mean(g)) for g in grupos]
print('linhas da pauta (y):', [round(l, 1) for l in linhas])
if len(linhas) >= 5:
    linhas = linhas[:5] if len(linhas) == 5 else linhas
esp = np.median(np.diff(linhas[:5])) if len(linhas) >= 5 else None
print('espaço entre linhas:', esp)
# tira as linhas da pauta e as hastes finas: abertura morfológica com um disco do tamanho de meia cabeça
sem_linhas = escuro.copy()
for l in linhas:
    for dy in (-2, -1, 0, 1, 2):
        yy = int(round(l)) + dy
        if 0 <= yy < sem_linhas.shape[0]:
            # só apaga onde acima e abaixo não há tinta (a linha "pura")
            acima = escuro[max(0, yy - 4)]; abaixo = escuro[min(escuro.shape[0] - 1, yy + 4)]
            sem_linhas[yy] &= (acima | abaixo)
r = max(2, int(esp * 0.28)) if esp else 4
yy, xx = np.ogrid[-r:r + 1, -r:r + 1]
disco = (xx * xx + yy * yy) <= r * r
cab = ndimage.binary_opening(sem_linhas, structure=disco)
lab, n = ndimage.label(cab)
objs = ndimage.find_objects(lab)
d = ImageDraw.Draw(im := im.convert('RGB'))
for l in linhas: d.line([(0, l), (im.width, l)], fill=(0, 160, 255))
res = []
for i, s in enumerate(objs):
    h = s[0].stop - s[0].start; w = s[1].stop - s[1].start
    if esp and (h < esp * 0.5 or h > esp * 1.6 or w < esp * 0.7 or w > esp * 2.6): continue
    cy, cx = ndimage.center_of_mass(cab, lab, i + 1)
    # posição em meios-espaços acima da linha de baixo (0 = linha 1, 1 = espaço 1, 2 = linha 2...)
    pos = (linhas[4] - cy) / (esp / 2) if len(linhas) >= 5 else None
    res.append((cx, cy, pos))
    d.rectangle([s[1].start, s[0].start, s[1].stop, s[0].stop], outline=(255, 0, 0))
    d.text((s[1].start, s[0].stop + 2), f'{pos:.1f}', fill=(255, 0, 0))
for cx, cy, pos in sorted(res):
    print(f'x={cx:7.1f}  y={cy:6.1f}  posição={pos:5.2f}  -> {round(pos)}')
im.save(saida)
