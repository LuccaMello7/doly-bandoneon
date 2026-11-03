"""Roda os testes automáticos da Escola de Bandoneon num navegador invisível.

Uso:  python tests/rodar_testes.py

Monta tests/_execucao.html (o index.html + tests/testes.js), abre no Edge ou
Chrome em modo headless e mostra o resultado. Sai com código 1 se algo falhar.
Para usar outro navegador, defina a variável de ambiente NAVEGADOR com o caminho.
"""
import html, os, re, subprocess, sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
CANDIDATOS = [
    os.environ.get('NAVEGADOR', ''),
    r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
    r'C:\Program Files\Microsoft\Edge\Application\msedge.exe',
    r'C:\Program Files\Google\Chrome\Application\chrome.exe',
    '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
]


def main():
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    nav = next((c for c in CANDIDATOS if c and Path(c).exists()), None)
    if not nav:
        sys.exit('Nenhum navegador encontrado. Defina NAVEGADOR com o caminho do Edge ou Chrome.')
    pagina = (RAIZ / 'index.html').read_text(encoding='utf-8')
    sw = (RAIZ / 'sw.js').read_text(encoding='utf-8')
    faltando = [a for a in re.findall(r'(?:src|href)="((?!https?:|#|data:)[^"]+)"', pagina) if f'"{a}"' not in sw]
    for a in faltando:
        print(f'FALHA  sw.js não guarda "{a}" para uso offline (adicione em ARQUIVOS)')
    captura = ('<base href="../">\n<script>window.__erros=[];'
               'window.onerror=(m,s,l)=>{window.__erros.push(m+" ("+(s||"").split("/").pop()+":"+l+")");};</script>')
    pagina = pagina.replace('<head>', '<head>\n' + captura, 1)
    pagina = pagina.replace('</body>', '<script src="tests/testes.js"></script>\n</body>', 1)
    saida = RAIZ / 'tests' / '_execucao.html'
    saida.write_text(pagina, encoding='utf-8')
    cmd = [nav, '--headless', '--disable-gpu', '--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required',
           '--virtual-time-budget=30000', '--dump-dom', saida.as_uri()]
    dom = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', timeout=180).stdout
    m = re.search(r'<pre id="resultado-testes">(.*?)</pre>', dom, re.S)
    if not m:
        sys.exit('Os testes não terminaram (erro ao carregar a página?).')
    texto = html.unescape(m.group(1))
    print(texto)
    sys.exit(1 if 'FALHA' in texto or faltando else 0)


if __name__ == '__main__':
    main()
