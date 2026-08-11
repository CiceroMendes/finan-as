import Foundation
import SwiftUI

/// Registro de um dia de consumo de água.
struct DayLog: Codable, Identifiable {
    var id: String { date }        // "yyyy-MM-dd"
    let date: String
    var amountML: Int              // total consumido no dia, em mililitros
}

/// Fonte de verdade do app: metas, consumo do dia e histórico.
/// Persiste tudo em `UserDefaults` (nada sai do aparelho).
///
/// As preferências usam `@Published` + gravação manual em vez de `@AppStorage`:
/// dentro de um `ObservableObject`, o `@AppStorage` não emite `objectWillChange`
/// (as telas não se atualizariam) e escritas vindas de um `Binding` não acionam
/// o `didSet` (os lembretes não seriam reagendados).
@MainActor
final class WaterStore: ObservableObject {

    private enum Key {
        static let goal     = "dailyGoalML"
        static let cup      = "cupSizeML"
        static let remOn    = "remindersEnabled"
        static let interval = "reminderIntervalMin"
        static let start    = "startHour"
        static let end      = "endHour"
        static let history  = "waterHistory"
    }

    // MARK: Configurações

    @Published var dailyGoalML: Int          { didSet { persistSettings() } }
    @Published var cupSizeML: Int            { didSet { persistSettings() } }

    /// Notificações ligadas?
    @Published var remindersEnabled: Bool    { didSet { settingsChanged() } }
    /// Intervalo entre lembretes, em minutos.
    @Published var reminderIntervalMin: Int  { didSet { settingsChanged() } }
    /// Hora em que os lembretes começam (0–23).
    @Published var startHour: Int            { didSet { settingsChanged() } }
    /// Hora em que os lembretes param (0–23).
    @Published var endHour: Int              { didSet { settingsChanged() } }

    // MARK: Estado do consumo

    @Published private(set) var todayML: Int = 0
    @Published private(set) var history: [DayLog] = []

    private let defaults = UserDefaults.standard
    private let notifications = NotificationManager()

    init() {
        // Atribuições diretas no init não acionam `didSet` — é o que queremos aqui.
        let d = UserDefaults.standard
        dailyGoalML         = d.object(forKey: Key.goal)     as? Int  ?? 2000
        cupSizeML           = d.object(forKey: Key.cup)      as? Int  ?? 250
        remindersEnabled    = d.object(forKey: Key.remOn)    as? Bool ?? true
        reminderIntervalMin = d.object(forKey: Key.interval) as? Int  ?? 90
        startHour           = d.object(forKey: Key.start)    as? Int  ?? 8
        endHour             = d.object(forKey: Key.end)      as? Int  ?? 22

        loadHistory()
        refreshToday()
    }

    // MARK: Progresso

    var progress: Double {
        guard dailyGoalML > 0 else { return 0 }
        return min(Double(todayML) / Double(dailyGoalML), 1.0)
    }

    var goalReached: Bool { todayML >= dailyGoalML }

    var remainingML: Int { max(dailyGoalML - todayML, 0) }

    // MARK: Ações

    /// Adiciona um copo padrão.
    func addCup() { add(ml: cupSizeML) }

    /// Adiciona uma quantidade arbitrária (pode ser negativa para corrigir).
    func add(ml: Int) {
        todayML = max(todayML + ml, 0)
        saveToday()
    }

    /// Zera o consumo do dia atual.
    func resetToday() {
        todayML = 0
        saveToday()
    }

    // MARK: Persistência

    private func persistSettings() {
        defaults.set(dailyGoalML, forKey: Key.goal)
        defaults.set(cupSizeML, forKey: Key.cup)
        defaults.set(remindersEnabled, forKey: Key.remOn)
        defaults.set(reminderIntervalMin, forKey: Key.interval)
        defaults.set(startHour, forKey: Key.start)
        defaults.set(endHour, forKey: Key.end)
    }

    /// Preferência de lembrete mudou: grava e reprograma as notificações.
    private func settingsChanged() {
        persistSettings()
        rescheduleReminders()
    }

    private func loadHistory() {
        guard let data = defaults.data(forKey: Key.history),
              let decoded = try? JSONDecoder().decode([DayLog].self, from: data) else { return }
        history = decoded.sorted { $0.date > $1.date }
    }

    private func persistHistory() {
        if let data = try? JSONEncoder().encode(history) {
            defaults.set(data, forKey: Key.history)
        }
    }

    /// Garante que `todayML` reflete o dia de hoje (vira o dia à meia-noite).
    func refreshToday() {
        let key = Self.dateKey(Date())
        todayML = history.first(where: { $0.date == key })?.amountML ?? 0
    }

    private func saveToday() {
        let key = Self.dateKey(Date())
        if let idx = history.firstIndex(where: { $0.date == key }) {
            history[idx].amountML = todayML
        } else {
            history.insert(DayLog(date: key, amountML: todayML), at: 0)
        }
        history.sort { $0.date > $1.date }
        persistHistory()
    }

    /// Histórico dos últimos `count` dias, do mais antigo para o mais recente.
    func recentDays(_ count: Int = 7) -> [DayLog] {
        var result: [DayLog] = []
        let cal = Calendar.current
        for offset in stride(from: count - 1, through: 0, by: -1) {
            guard let day = cal.date(byAdding: .day, value: -offset, to: Date()) else { continue }
            let key = Self.dateKey(day)
            let ml = history.first(where: { $0.date == key })?.amountML ?? 0
            result.append(DayLog(date: key, amountML: ml))
        }
        return result
    }

    // MARK: Notificações

    func requestNotificationPermission() {
        Task {
            let granted = await notifications.requestAuthorization()
            if granted { rescheduleReminders() }
        }
    }

    func rescheduleReminders() {
        let enabled = remindersEnabled
        let interval = reminderIntervalMin
        let start = startHour
        let end = endHour

        Task {
            if enabled {
                await notifications.scheduleReminders(
                    intervalMinutes: interval,
                    startHour: start,
                    endHour: end
                )
            } else {
                await notifications.cancelAll()
            }
        }
    }

    // MARK: Helpers

    static func dateKey(_ date: Date) -> String {
        let f = DateFormatter()
        f.calendar = Calendar(identifier: .gregorian)
        f.locale = Locale(identifier: "en_US_POSIX")
        f.dateFormat = "yyyy-MM-dd"
        return f.string(from: date)
    }

    static func weekdayLabel(_ key: String) -> String {
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_US_POSIX")
        f.dateFormat = "yyyy-MM-dd"
        guard let date = f.date(from: key) else { return "" }
        let out = DateFormatter()
        out.locale = Locale(identifier: "pt_BR")
        out.dateFormat = "E"
        return out.string(from: date).replacingOccurrences(of: ".", with: "").capitalized
    }
}
