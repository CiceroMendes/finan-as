import SwiftUI

struct ContentView: View {
    @EnvironmentObject var store: WaterStore
    @Environment(\.scenePhase) private var scenePhase

    var body: some View {
        TabView {
            HomeView()
                .tabItem { Label("Hoje", systemImage: "drop.fill") }

            HistoryView()
                .tabItem { Label("Histórico", systemImage: "chart.bar.fill") }

            SettingsView()
                .tabItem { Label("Ajustes", systemImage: "gearshape.fill") }
        }
        .onAppear {
            store.requestNotificationPermission()
            store.refreshToday()
        }
        .onChange(of: scenePhase) { phase in
            if phase == .active { store.refreshToday() }
        }
    }
}

#Preview {
    ContentView().environmentObject(WaterStore())
}
