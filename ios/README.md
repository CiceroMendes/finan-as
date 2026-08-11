# 💧 Lembrete de Água (iOS)

App nativo em **SwiftUI** para lembrar de beber água ao longo do dia, registrar o
consumo e acompanhar o histórico. Tudo funciona **offline** e os dados ficam só no
seu iPhone (nenhum servidor envolvido).

## Funcionalidades

- **Registro rápido**: botão de copo padrão + atalhos de 200/350/500 ml e quantidade personalizada.
- **Meta diária** configurável com anel de progresso animado.
- **Lembretes por notificação local**: escolha o intervalo (30 min a 3 h) e a
  faixa de horário ativa (ex.: das 8h às 22h). Funcionam mesmo sem internet.
- **Histórico dos últimos 7 dias** com gráfico de barras, média diária e dias em que bateu a meta.
- **Persistência local** via `UserDefaults` — vira o dia automaticamente à meia-noite.

## Como abrir e rodar

Você precisa de um **Mac com Xcode 16 ou superior**.

1. Abra o arquivo `Agua.xcodeproj` no Xcode (duplo clique).
2. Selecione um simulador de iPhone (ou o seu iPhone conectado) no topo.
3. Aperte **▶︎ Run** (`Cmd + R`).
4. No primeiro uso, o app pede permissão de notificações — aceite para receber os lembretes.

> **Rodar no seu iPhone físico:** em *Signing & Capabilities* do target `Agua`,
> selecione seu *Apple ID* (Team). Com uma conta gratuita já dá para instalar no
> próprio aparelho por 7 dias; com conta paga do Apple Developer Program é possível
> publicar na App Store.

### Não tem um Mac?

- Use um serviço de build na nuvem (ex.: Xcode Cloud, Codemagic) apontando para este repositório.
- Ou peça a alguém com Mac para gerar o build via TestFlight.

## Estrutura

```
ios/
├─ Agua.xcodeproj/         # projeto Xcode
└─ Agua/
   ├─ AguaApp.swift        # ponto de entrada (@main)
   ├─ WaterStore.swift     # estado, metas, persistência e histórico
   ├─ NotificationManager.swift  # agendamento das notificações locais
   ├─ ContentView.swift    # abas (Hoje / Histórico / Ajustes)
   ├─ HomeView.swift       # tela principal com anel e botões
   ├─ HistoryView.swift    # gráfico dos últimos 7 dias
   ├─ SettingsView.swift   # meta, copo e configuração dos lembretes
   └─ Assets.xcassets/     # ícone e cor de destaque
```

## Observações técnicas

- **Deployment target:** iOS 16.0+.
- **Notificações:** o iOS não oferece "a cada X minutos" nativamente, então o app
  cria uma notificação diária repetida para cada horário calculado dentro da faixa
  ativa (ex.: 8:00, 9:30, 11:00…). O iOS limita a 64 notificações pendentes por
  app — as configurações padrão ficam bem abaixo disso.
- **Bundle identifier:** `com.example.agua` — troque por um identificador seu antes de publicar.
