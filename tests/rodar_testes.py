"""Roda os testes automáticos do BanDoly num navegador invisível.

Uso:  python tests/rodar_testes.py

Monta tests/_execucao.html (o index.html + tests/testes.js), abre no Edge ou
Chrome em modo headless e mostra o resultado. Sai com código 1 se algo falhar.
Para usar outro navegador, defina a variável de ambiente NAVEGADOR com o caminho.
"""
import html, os, re, subprocess, sys, tempfile
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
    # o que vem depois do # aponta para um trecho da mesma página (doly-costa/#videos é o arquivo doly-costa/)
    faltando = sorted({a.split('#')[0] for a in re.findall(r'(?:src|href)="((?!https?:|#|data:)[^"]+)"', pagina)} - {''})
    faltando = [a for a in faltando if f'"{a}"' not in sw]
    for a in faltando:
        print(f'FALHA  sw.js não guarda "{a}" para uso offline (adicione em ARQUIVOS)')
    # as páginas em espanhol e inglês precisam ser geradas de novo quando o index.html ou o dicionário mudam
    # o mesmo para as páginas das lições, geradas a partir de js/licoes.js e js/licoes-traducao.js
    for gerador in ('gerar_idiomas.py', 'gerar_licoes.py', 'gerar_teoria.py', 'gerar_referencia.py'):
        r = subprocess.run([sys.executable, str(RAIZ / 'ferramentas' / gerador), '--verificar'],
                           capture_output=True, text=True, encoding='utf-8')
        if r.returncode:
            print('FALHA  ' + (r.stdout.strip() or r.stderr.strip()))
            faltando.append(gerador)
    # grid de 8 pontos: todo espaçamento novo precisa cair no grid (ferramentas/grade8.py)
    r = subprocess.run([sys.executable, str(RAIZ / 'ferramentas' / 'grade8.py'), '--verificar'],
                       capture_output=True, text=True, encoding='utf-8')
    if r.returncode:
        print('FALHA  espaçamentos fora do grid de 8 pontos:\n       ' + r.stdout.strip().replace('\n', '\n       '))
        faltando.append('grade8.py')
    captura = ('<base href="../">\n<script>window.__erros=[];'
               'window.onerror=(m,s,l)=>{window.__erros.push(m+" ("+(s||"").split("/").pop()+":"+l+")");};'
               'document.addEventListener("securitypolicyviolation",e=>window.__erros.push("CSP bloqueou "+e.violatedDirective+": "+e.blockedURI));</script>')
    pagina = pagina.replace('<head>', '<head>\n' + captura, 1)
    # sem a contagem de visitas (GoatCounter): ela busca um script na internet, e uma rede lenta deixava o
    # navegador esperando até o tempo acabar; além disso, os testes não devem contar como visitas
    pagina = re.sub(r'<script data-goatcounter[^>]*></script>', '', pagina)
    pagina = pagina.replace('</body>', '<script src="tests/testes.js" defer></script>\n</body>', 1)  # defer: roda depois dos scripts do app
    saida = RAIZ / 'tests' / '_execucao.html'
    saida.write_text(pagina, encoding='utf-8')
    perfil = Path(tempfile.gettempdir()) / 'bandoly-testes-perfil'  # perfil próprio: não depende do navegador aberto
    cmd = [nav, '--headless', f'--user-data-dir={perfil}', '--disable-gpu', '--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required',
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
