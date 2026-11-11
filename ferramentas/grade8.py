"""Grid de 8 pontos: confere (e corrige) os espaçamentos do app.

Regra (a mesma dos sistemas de design de app para celular e computador):
  - espaçamentos de 16px para cima em múltiplos de 8 (16, 24, 32, 40…);
  - abaixo de 16px, múltiplos de 4 (4, 8, 12), o "meio passo" para ajustes pequenos;
  - linhas finas de 1-2px ficam de fora.
Vale para margin, padding, gap e min-height em css/app.css e nos atributos style das páginas.

Uso:
  python ferramentas/grade8.py              mostra o resumo e o que está fora do grid
  python ferramentas/grade8.py --corrigir   leva cada valor ao múltiplo mais próximo (empate: para cima)
  python ferramentas/grade8.py --verificar  sai com erro se houver valor fora do grid (os testes usam)
"""
import math, re, sys
from collections import Counter
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
CSS = RAIZ / 'css' / 'app.css'
PAGINAS = [RAIZ / p for p in ('index.html', 'doly-costa/index.html', 'perguntas-frequentes/index.html',
                              'professores/index.html', 'privacidade/index.html', 'termos/index.html')]
# a propriedade não pode vir depois de "(" (seria uma condição de @media, como min-height:700px)
DECL = re.compile(r'(?<![(\w-])(margin(?:-top|-right|-bottom|-left|-inline|-block)?|padding(?:-top|-right|-bottom|-left|-inline|-block)?'
                  r'|gap|row-gap|column-gap|min-height|scroll-margin-top)(\s*:\s*)([^;}"]+)')
PX = re.compile(r'(?<![\w.])(-?)(\d+(?:\.\d+)?)px')


def no_grid(x):
    return x <= 2 or (x % 8 == 0 if x >= 16 else x % 4 == 0)


def ajustar(x):
    if x <= 2: return x
    passo = 8 if x >= 16 else 4
    v = math.floor(x / passo + 0.5) * passo
    return max(v, 4)


def percorrer(texto, corrigir=False):
    achados = Counter()
    def troca_valor(m):
        def troca_px(n):
            x = float(n.group(2))
            if no_grid(x): return n.group(0)
            achados[x] += 1
            return f'{n.group(1)}{ajustar(x):g}px' if corrigir else n.group(0)
        return m.group(1) + m.group(2) + PX.sub(troca_px, m.group(3))
    novo = DECL.sub(troca_valor, texto)
    return novo, achados


def main():
    corrigir, verificar = '--corrigir' in sys.argv, '--verificar' in sys.argv
    total = Counter()
    for arq in [CSS] + [p for p in PAGINAS if p.exists()]:
        b = arq.read_bytes().decode('utf-8')
        if arq.suffix == '.html':  # nas páginas, só os atributos style="…"
            achados = Counter()
            def no_style(m):
                novo, a = percorrer(m.group(2), corrigir); achados.update(a); return m.group(1) + novo + m.group(3)
            novo = re.sub(r'(style=")([^"]*)(")', no_style, b)
        else:
            novo, achados = percorrer(b, corrigir)
        if achados:
            total.update(achados)
            print(f'{arq.relative_to(RAIZ)}: {sum(achados.values())} valores fora do grid' + (' (corrigidos)' if corrigir else ''))
        if corrigir and novo != b:
            arq.write_bytes(novo.encode('utf-8'))
    if not total:
        print('Todos os espaçamentos estão no grid de 8 pontos.')
        return
    print('mais comuns: ' + ', '.join(f'{x:g}px ×{n}' for x, n in total.most_common(12)))
    if verificar and not corrigir:
        print('Rode: python ferramentas/grade8.py --corrigir')
        sys.exit(1)


if __name__ == '__main__':
    main()
