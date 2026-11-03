"""Converte um SoundFont (.sf2) em sons/bandoneon.js para o BanDoly.

Uso:  python ferramentas/sf2_para_js.py caminho/para/arquivo.sf2 [sons/bandoneon.js]

Lê o primeiro preset do arquivo, pega as zonas do instrumento (faixa de teclas,
amostra, nota raiz, afinação e loop) e grava as amostras em PCM 16 bits (base64)
num arquivo .js que o index.html carrega com <script>. Assim o app funciona até
quando é aberto direto do disco (file://).
"""
import base64, json, math, struct, sys
from array import array

KEY_RANGE, INSTRUMENT, SAMPLE_ID, ROOT_KEY, SAMPLE_MODES = 43, 41, 53, 58, 54
COARSE, FINE, RELEASE, ATTEN = 51, 52, 38, 48
TARGET_RMS = 0.3


def chunks(b, off, end):
    while off < end:
        cid = b[off:off + 4].decode('latin1')
        size = struct.unpack_from('<I', b, off + 4)[0]
        yield cid, off + 8, size
        off += 8 + size + (size & 1)


def signed(v):
    return v - 65536 if v > 32767 else v


def main(src, dst):
    b = open(src, 'rb').read()
    if b[:4] != b'RIFF' or b[8:12] != b'sfbk':
        sys.exit('Não é um arquivo SoundFont 2 válido.')
    info, smpl, pd = {}, None, {}
    for cid, o, sz in chunks(b, 12, len(b)):
        if cid != 'LIST':
            continue
        kind = b[o:o + 4].decode()
        for c2, o2, s2 in chunks(b, o + 4, o + sz):
            if kind == 'INFO':
                info[c2] = b[o2:o2 + s2].split(b'\0')[0].decode('latin1')
            elif kind == 'sdta' and c2 == 'smpl':
                smpl = o2
            elif kind == 'pdta':
                pd[c2] = (o2, s2)

    def recs(name, fmt):
        o, s = pd[name]
        n = struct.calcsize(fmt)
        return [struct.unpack_from(fmt, b, o + i * n) for i in range(s // n)]

    phdr, pbag, pgen = recs('phdr', '<20sHHHIII'), recs('pbag', '<HH'), recs('pgen', '<HH')
    inst, ibag, igen = recs('inst', '<20sH'), recs('ibag', '<HH'), recs('igen', '<HH')
    shdr = recs('shdr', '<20sIIIIIBbHH')

    def zones(bags, gens, i0, i1):
        out = []
        for z in range(i0, i1):
            g = {}
            for k in range(bags[z][0], bags[z + 1][0]):
                g[gens[k][0]] = gens[k][1]
            out.append(g)
        return out

    pz = zones(pbag, pgen, phdr[0][3], phdr[1][3])
    inst_id = next(z[INSTRUMENT] for z in pz if INSTRUMENT in z)
    izones = zones(ibag, igen, inst[inst_id][1], inst[inst_id + 1][1])
    glob = next((z for z in izones if SAMPLE_ID not in z), {})

    samples, sample_index, out_zones = [], {}, []
    for z in izones:
        if SAMPLE_ID not in z:
            continue
        g = {**glob, **z}
        sid = g[SAMPLE_ID]
        name, start, end, ls, le, rate, root, corr, _, _ = shdr[sid]
        if sid not in sample_index:
            pcm = array('h', b[smpl + start * 2: smpl + end * 2])
            if sys.byteorder == 'big':
                pcm.byteswap()
            loop = pcm[ls - start: le - start] or pcm
            rms = math.sqrt(sum(x * x for x in loop) / len(loop)) / 32768 or 1
            sample_index[sid] = len(samples)
            samples.append({
                'name': name.split(b'\0')[0].decode('latin1'), 'rate': rate,
                'loopStart': ls - start, 'loopEnd': le - start,
                'gain': round(TARGET_RMS / rms, 4),
                'data': base64.b64encode(pcm.tobytes()).decode(),
            })
        kr = g.get(KEY_RANGE, 127 << 8)
        tune = signed(g.get(COARSE, 0)) * 100 + signed(g.get(FINE, 0)) + corr
        out_zones.append({
            'lo': kr & 255, 'hi': kr >> 8, 's': sample_index[sid],
            'root': g.get(ROOT_KEY, root), 'tune': tune,
            'loop': g.get(SAMPLE_MODES, 0) in (1, 3),
            'atten': g.get(ATTEN, 0) / 10,  # dB
        })
    rel = 2 ** (signed(glob.get(RELEASE, izones[1].get(RELEASE, -12000))) / 1200)
    out_zones.sort(key=lambda z: z['lo'])
    data = {
        'name': info.get('INAM', ''), 'credit': info.get('IENG', ''), 'copyright': info.get('ICOP', ''),
        'release': round(min(max(rel, 0.03), 2), 3), 'zones': out_zones, 'samples': samples,
    }
    with open(dst, 'w', encoding='utf-8') as f:
        f.write('// Gerado por ferramentas/sf2_para_js.py a partir de "%s".\n' % data['name'])
        f.write('// %s. Licença: uso livre, inclusive em projetos de software (ver README).\n' % data['copyright'])
        f.write('window.BANDONEON_SF = ' + json.dumps(data, ensure_ascii=False) + ';\n')
    lo, hi = min(z['lo'] for z in out_zones), max(z['hi'] for z in out_zones)
    print(f'{len(samples)} amostras, {len(out_zones)} zonas, teclas {lo}-{hi}, release {data["release"]}s -> {dst}')


if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else 'sons/bandoneon.js')
