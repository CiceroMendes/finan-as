import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var store: WaterStore

    private let intervals = [30, 45, 60, 90, 120, 180]

    var body: some View {
        NavigationStack {
            Form {
                Section("Meta diária") {
                    Stepper("Meta: \(store.dailyGoalML) ml",
                            value: $store.dailyGoalML, in: 500...5000, step: 100)
                    Stepper("Tamanho do copo: \(store.cupSizeML) ml",
                            value: $store.cupSizeML, in: 50...1000, step: 50)
                }

                Section("Lembretes") {
                    Toggle("Ativar lembretes", isOn: $store.remindersEnabled)

                    if store.remindersEnabled {
                        Picker("A cada", selection: $store.reminderIntervalMin) {
                            ForEach(intervals, id: \.self) { min in
                                Text(label(forMinutes: min)).tag(min)
                            }
                        }
                        Stepper("Começar às \(store.startHour)h",
                                value: $store.startHour, in: 0...23)
                        Stepper("Parar às \(store.endHour)h",
                                value: $store.endHour, in: 1...23)

                        if store.startHour >= store.endHour {
                            Label("A hora de início deve ser antes da de término.",
                                  systemImage: "exclamationmark.triangle.fill")
                                .font(.caption)
                                .foregroundStyle(.orange)
                        }
                    }
                }

                Section {
                    Text("Os lembretes são notificações locais e funcionam mesmo sem internet. Ative as notificações do app em Ajustes do iPhone caso não apareçam.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                } header: {
                    Text("Sobre")
                }
            }
            .navigationTitle("Ajustes")
        }
    }

    private func label(forMinutes m: Int) -> String {
        if m < 60 { return "\(m) min" }
        let h = m / 60
        let rest = m % 60
        return rest == 0 ? "\(h)h" : "\(h)h\(rest)"
    }
}

#Preview {
    SettingsView().environmentObject(WaterStore())
}
