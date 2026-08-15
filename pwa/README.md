# 💧 Água — versão PWA (web)

Mesma ideia do app iOS nativo, mas como **aplicativo web instalável**: abre no
Safari, você adiciona à Tela de Início e ele passa a se comportar como um app —
ícone próprio, tela cheia, funciona **offline** e não precisa de Mac nem App Store.

Nesta versão a tela inteira é o copo: a água **sobe** conforme você bebe.

## Funcionalidades

- Registro rápido: botão do copo padrão + atalhos de 200/350/500 ml
- Meta diária e tamanho do copo configuráveis
- **Desfazer** o último registro
- Histórico de 7 dias com gráfico, média diária e sequência de dias na meta
- Lembretes por notificação (veja as limitações abaixo)
- Funciona sem internet (service worker)
- Tema claro e escuro automáticos
- Dados só no aparelho (`localStorage`) — nada é enviado para servidor algum

## Como instalar no iPhone

1. Publique a pasta `pwa/` em qualquer host **HTTPS** (veja abaixo).
2. Abra o endereço no **Safari** do iPhone.
3. Toque em **Compartilhar** → **“Adicionar à Tela de Início”**.
4. Abra o app pelo ícone e ative os lembretes em **Ajustes**.

> O passo 3 não é opcional: no iOS, notificações e tela cheia **só funcionam**
> quando o app é aberto pela Tela de Início, não pela aba do Safari.

## ⚠️ Limitação importante dos lembretes no iOS

Esta é a diferença real entre a versão web e o app nativo, e vale conhecer antes
de escolher:

| | PWA (web) | App nativo (`ios/`) |
|---|---|---|
| Precisa de Mac/Xcode | Não | Sim |
| Instalação | Adicionar à Tela de Início | Xcode ou App Store |
| Lembrete com o app **fechado** | ❌ Não confiável | ✅ Sim, sempre |
| Funciona offline | ✅ | ✅ |

O iOS suspende PWAs em segundo plano e **não** oferece agendamento de notificações
locais para a web. Sem um servidor de push, os avisos desta versão disparam quando
o app está aberto ou foi usado há pouco — ou seja, servem como acompanhamento do
dia, mas **não substituem um alarme**.

Dois caminhos para lembretes 100% confiáveis:

1. **Usar o app nativo** da pasta `ios/` (precisa de um Mac com Xcode).
2. **Plugar um servidor de Web Push**: o `sw.js` já trata o evento `push`. Bastaria
   gerar chaves VAPID, salvar as inscrições e disparar os avisos pelo servidor.
   Requer iOS 16.4+ e o app instalado na Tela de Início.

## Rodando localmente

O service worker exige `https://` **ou** `localhost`:

```bash
cd pwa
python3 -m http.server 8000
# abra http://localhost:8000
```

Ou, com Node: `npx serve pwa`

## Publicando (o jeito mais fácil de usar no celular)

São arquivos estáticos, sem build. Qualquer um destes serve:

- **Netlify / Vercel**: arraste a pasta `pwa/` na interface, ou aponte o projeto
  para este repositório com `pwa` como diretório de publicação.
- **GitHub Pages**: publique a branch e aponte o Pages para a pasta `/pwa`.
- **Cloudflare Pages**: mesma ideia, sem comando de build.

Só precisa ser **HTTPS** — sem isso o service worker e as notificações não sobem.

## Estrutura

```
pwa/
├─ index.html            # telas e folhas (histórico / ajustes)
├─ styles.css            # tokens de tema, layout, componentes
├─ app.js                # estado, animação da água, histórico, lembretes
├─ sw.js                 # cache offline + clique na notificação + push
├─ manifest.webmanifest  # nome, ícones, cores, modo standalone
└─ icons/                # ícones 192/512/apple-touch
```
