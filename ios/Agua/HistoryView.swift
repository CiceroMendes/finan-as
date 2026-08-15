import SwiftUI

struct HistoryView: View {
    @EnvironmentObject var store: WaterStore

    private var days: [DayLog] { store.recentDays(7) }
    private var maxML: Int { max(days.map(\.amountML).max() ?? 0, store.dailyGoalML) }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    chart
                    summary
                }
                .padding()
            }
            .navigationTitle("Histórico")
            .background(Color(.systemGroupedBackground))
        }
    }

    private var chart: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Últimos 7 dias").font(.headline)
            HStack(alignment: .bottom, spacing: 10) {
                ForEach(days) { day in
                    VStack(spacing: 6) {
                        Text("\(day.amountML)")
                            .font(.system(size: 9))
                            .foregroundStyle(.secondary)
                        RoundedRectangle(cornerRadius: 6)
                            .fill(day.amountML >= store.dailyGoalML
                                  ? Color.green : Color.blue)
                            .frame(height: barHeight(day.amountML))
                            .frame(maxWidth: .infinity)
                        Text(WaterStore.weekdayLabel(day.date))
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }
            }
            .frame(height: 180)
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func barHeight(_ ml: Int) -> CGFloat {
        guard maxML > 0 else { return 2 }
        return max(CGFloat(ml) / CGFloat(maxML) * 140, 2)
    }

    private var summary: some View {
        let reached = days.filter { $0.amountML >= store.dailyGoalML }.count
        let avg = days.isEmpty ? 0 : days.map(\.amountML).reduce(0, +) / days.count
        return VStack(spacing: 12) {
            row("Meta batida", "\(reached) de 7 dias", "flag.checkered")
            Divider()
            row("Média diária", "\(avg) ml", "chart.line.uptrend.xyaxis")
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func row(_ title: String, _ value: String, _ icon: String) -> some View {
        HStack {
            Image(systemName: icon).foregroundStyle(.blue).frame(width: 28)
            Text(title)
            Spacer()
            Text(value).bold()
        }
    }
}

#Preview {
    HistoryView().environmentObject(WaterStore())
}
