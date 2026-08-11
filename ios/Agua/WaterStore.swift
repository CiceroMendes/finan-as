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
@MainActor
final class WaterStore: ObservableObject {

    // MARK: Configurações (persistidas via AppStorage)

    @AppStorage("dailyGoalML") var dailyGoalML: Int = 2000
    @AppStorage("cupSizeML")   var cupSizeML: Int = 250

    /// Notificações ligadas?
    @AppStorage("remindersEnabled") var remindersEnabled: Bool = true {
        didSet { rescheduleReminders() }
    }
    /// Intervalo entre lembretes, em minutos.
    @AppStorage("reminderIntervalMin") var reminderIntervalMin: Int = 90 {
        didSet { rescheduleReminders() }
    }
    /// Hora em que os lembretes começam (0–23).
    @AppStorage("startHour") var startHour: Int = 8 {
        didSet { rescheduleReminders() }
    }
    /// Hora em que os lembretes param (0–23).
    @AppStorage("endHour") var endHour: Int = 22 {
        didSet { rescheduleReminders() }
    }

    // MARK: Estado do consumo

    @Published private(set) var todayML: Int = 0
    @Published private(set) var history: [DayLog] = []

    private let historyKey = "waterHistory"
    private let notifications = NotificationManager()

    init() {
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
        objectWillChange.send()
    }

    /// Zera o consumo do dia atual.
    func resetToday() {
        todayML = 0
        saveToday()
    }

    // MARK: Persistência

    private func loadHistory() {
        guard let data = UserDefaults.standard.data(forKey: historyKey),
              let decoded = try? JSONDecoder().decode([DayLog].self, from: data) else { return }
        history = decoded.sorted { $0.date > $1.date }
    }

    private func persistHistory() {
        if let data = try? JSONEncoder().encode(history) {
            UserDefaults.standard.set(data, forKey: historyKey)
        }
    }

    /// Garante que `todayML` reflete o dia de hoje (vira o dia à meia-noite).
    func refreshToday() {
        let key = Self.dateKey(Date())
        if let log = history.first(where: { $0.date == key }) {
            todayML = log.amountML
        } else {
            todayML = 0
        }
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
        Task {
            if remindersEnabled {
                await notifications.scheduleReminders(
                    intervalMinutes: reminderIntervalMin,
                    startHour: startHour,
                    endHour: endHour
                )
            } else {
                notifications.cancelAll()
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
