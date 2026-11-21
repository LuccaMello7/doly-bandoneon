"""Confere se o ARCHITECTURE.md ainda descreve o código: a ordem dos scripts do index.html e as áreas de
js/navegacao.js. Sai com código 1 e diz o que mudou. Rodado por tests/rodar_testes.py."""
import re, sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent


def bloco(texto, nome):
    m = re.search(rf'<!--{nome}-->(.*?)<!--/{nome}-->', texto, re.S)
    return m.group(1).strip() if m else ''


def main():
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    doc = (RAIZ / 'ARCHITECTURE.md').read_text(encoding='utf-8')
    erros = []
    scripts = re.findall(r'<script[^>]*src="js/([\w-]+)\.js"', (RAIZ / 'index.html').read_text(encoding='utf-8'))
    no_doc = [s.strip() for s in bloco(doc, 'scripts').strip('`').split(',') if s.strip()]
    if scripts != no_doc:
        erros.append('ordem dos scripts. No index.html: ' + ', '.join(scripts))
    nav = (RAIZ / 'js' / 'navegacao.js').read_text(encoding='utf-8')
    corpo = re.search(r'const AREAS = \{(.*?)\n\};', nav, re.S).group(1)
    areas = [(a, re.findall(r"'([\w-]+)'", v)) for a, v in re.findall(r'(\w+):\[([^\]]*)\]', corpo)]
    doc_areas = [(a.strip(), [x.strip() for x in v.split(',')]) for a, v in
                 (l[2:].split(':', 1) for l in bloco(doc, 'areas').splitlines() if l.startswith('- '))]
    if areas != doc_areas:
        erros.append('áreas. Em navegacao.js: ' + '; '.join(f'{a}: {", ".join(v)}' for a, v in areas))
    if erros:
        print('ARCHITECTURE.md desatualizado (' + ' | '.join(erros) + ')')
        sys.exit(1)
    print('ARCHITECTURE.md em dia')


if __name__ == '__main__':
    main()
