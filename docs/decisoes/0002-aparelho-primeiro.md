# 0002. O aparelho é a fonte de verdade

- **Situação:** Aceita
- **Data:** 2026-11-21 (registro)

## Contexto
O BanDoly é "sem cadastro": quem chega toca na hora. Muita gente pratica onde a internet é ruim, e parte do
público pode ser menor de idade.

## Decisão
Todo o progresso e as preferências ficam no `localStorage` (prefixo `bandoneon.`, via `store`). O app inteiro
funciona sem conta e, depois da primeira visita, sem internet (service worker, rede primeiro com cache).
Backup em Ajustes exporta tudo num arquivo.

## Alternativas consideradas
- **Conta obrigatória com tudo no servidor:** sincroniza de graça, mas cria barreira de entrada, custo e um
  problema de LGPD com menores.
- **IndexedDB:** mais espaço, mas o volume de dados é pequeno e o `localStorage` é síncrono e simples.

## Consequências
- Privacidade por padrão e zero custo de servidor para quem não tem conta.
- Limpar os dados do navegador apaga o progresso de quem não tem conta nem backup.
- Ranking, hall da fama e qualquer coisa que compare pessoas precisa de servidor e de um registro novo.
