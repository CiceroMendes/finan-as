import Foundation
import UserNotifications

/// Cuida das notificações locais de lembrete de água.
struct NotificationManager {

    private let center = UNUserNotificationCenter.current()

    /// Pede permissão para enviar notificações. Retorna se foi concedida.
    func requestAuthorization() async -> Bool {
        do {
            return try await center.requestAuthorization(options: [.alert, .sound, .badge])
        } catch {
            return false
        }
    }

    func cancelAll() {
        center.removeAllPendingNotificationRequests()
    }

    /// Agenda lembretes diários repetidos entre `startHour` e `endHour`,
    /// espaçados a cada `intervalMinutes`.
    ///
    /// Como notificações locais não permitem "a cada X minutos" de forma nativa,
    /// criamos um gatilho por horário do dia (ex: 8:00, 9:30, 11:00 …) que se
    /// repete todos os dias.
    func scheduleReminders(intervalMinutes: Int, startHour: Int, endHour: Int) async {
        cancelAll()

        guard intervalMinutes > 0, startHour < endHour else { return }

        let messages = [
            "Hora de beber água! 💧",
            "Bora se hidratar? 🚰",
            "Um copo d'água agora vai bem 💧",
            "Lembrete: beba um gole de água 💦",
            "Se hidrate! Seu corpo agradece 💧"
        ]

        var minutesOfDay = startHour * 60
        let limit = endHour * 60
        var index = 0

        while minutesOfDay <= limit {
            let hour = minutesOfDay / 60
            let minute = minutesOfDay % 60

            var comps = DateComponents()
            comps.hour = hour
            comps.minute = minute

            let content = UNMutableNotificationContent()
            content.title = "Lembrete de Água"
            content.body = messages[index % messages.count]
            content.sound = .default

            let trigger = UNCalendarNotificationTrigger(dateMatching: comps, repeats: true)
            let request = UNNotificationRequest(
                identifier: "water-\(hour)-\(minute)",
                content: content,
                trigger: trigger
            )

            try? await center.add(request)

            minutesOfDay += intervalMinutes
            index += 1
        }
    }
}
