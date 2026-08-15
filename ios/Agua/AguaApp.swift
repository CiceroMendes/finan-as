import SwiftUI

@main
struct AguaApp: App {
    @StateObject private var store = WaterStore()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(store)
                .tint(.blue)
        }
    }
}
