import SwiftUI

struct HomeView: View {
    @EnvironmentObject var store: WaterStore
    @State private var showCustom = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 28) {
                    progressRing
                    quickStats
                    addButtons
                    customButton
                }
                .padding()
            }
            .navigationTitle("Lembrete de Água")
            .background(Color(.systemGroupedBackground))
        }
        .sheet(isPresented: $showCustom) {
            // Passado explicitamente: um EnvironmentObject ausente derruba o app.
            CustomAmountSheet()
                .environmentObject(store)
                .presentationDetents([.medium])
        }
    }

    // MARK: Anel de progresso

    private var progressRing: some View {
        ZStack {
            Circle()
                .stroke(Color.blue.opacity(0.15), lineWidth: 22)

            Circle()
                .trim(from: 0, to: store.progress)
                .stroke(
                    LinearGradient(colors: [.cyan, .blue],
                                   startPoint: .top, endPoint: .bottom),
                    style: StrokeStyle(lineWidth: 22, lineCap: .round)
                )
                .rotationEffect(.degrees(-90))
                .animation(.easeInOut(duration: 0.5), value: store.progress)

            VStack(spacing: 4) {
                Image(systemName: store.goalReached ? "checkmark.circle.fill" : "drop.fill")
                    .font(.system(size: 34))
                    .foregroundStyle(store.goalReached ? .green : .blue)
                Text("\(store.todayML) ml")
                    .font(.system(size: 40, weight: .bold, design: .rounded))
                    .contentTransition(.numericText())
                Text("de \(store.dailyGoalML) ml")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
        }
        .frame(width: 240, height: 240)
        .padding(.top, 12)
    }

    private var quickStats: some View {
        HStack(spacing: 12) {
            statCard(title: "Progresso",
                     value: "\(Int(store.progress * 100))%",
                     icon: "percent")
            statCard(title: store.goalReached ? "Meta batida!" : "Faltam",
                     value: store.goalReached ? "🎉" : "\(store.remainingML) ml",
                     icon: "flag.fill")
        }
    }

    private func statCard(title: String, value: String, icon: String) -> some View {
        VStack(spacing: 6) {
            Image(systemName: icon).foregroundStyle(.blue)
            Text(value).font(.title3.bold())
            Text(title).font(.caption).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
        .background(Color(.secondarySystemGroupedBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: Botões de adicionar

    private var addButtons: some View {
        VStack(spacing: 12) {
            Button {
                withAnimation { store.addCup() }
            } label: {
                Label("Adicionar copo (\(store.cupSizeML) ml)",
                      systemImage: "plus.circle.fill")
                    .font(.headline)
                    .frame(maxWidth: .infinity)
                    .padding()
            }
            .buttonStyle(.borderedProminent)

            HStack(spacing: 12) {
                amountButton(200, "cup.and.saucer.fill")
                amountButton(350, "waterbottle.fill")
                amountButton(500, "waterbottle.fill")
            }
        }
    }

    private func amountButton(_ ml: Int, _ icon: String) -> some View {
        Button {
            withAnimation { store.add(ml: ml) }
        } label: {
            VStack(spacing: 4) {
                Image(systemName: icon)
                Text("\(ml) ml").font(.caption.bold())
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
        }
        .buttonStyle(.bordered)
    }

    private var customButton: some View {
        HStack {
            Button {
                showCustom = true
            } label: {
                Label("Outra quantidade", systemImage: "slider.horizontal.3")
            }
            Spacer()
            Button(role: .destructive) {
                withAnimation { store.resetToday() }
            } label: {
                Label("Zerar dia", systemImage: "arrow.counterclockwise")
            }
        }
        .font(.subheadline)
        .padding(.top, 4)
    }
}

/// Folha para adicionar/remover uma quantidade personalizada.
struct CustomAmountSheet: View {
    @EnvironmentObject var store: WaterStore
    @Environment(\.dismiss) private var dismiss
    @State private var amount: Double = 250

    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                Text("\(Int(amount)) ml")
                    .font(.system(size: 44, weight: .bold, design: .rounded))
                    .foregroundStyle(.blue)

                Slider(value: $amount, in: 50...1000, step: 50)
                    .padding(.horizontal)

                HStack(spacing: 16) {
                    Button {
                        store.add(ml: -Int(amount)); dismiss()
                    } label: {
                        Label("Remover", systemImage: "minus")
                            .frame(maxWidth: .infinity).padding()
                    }
                    .buttonStyle(.bordered)

                    Button {
                        store.add(ml: Int(amount)); dismiss()
                    } label: {
                        Label("Adicionar", systemImage: "plus")
                            .frame(maxWidth: .infinity).padding()
                    }
                    .buttonStyle(.borderedProminent)
                }
                Spacer()
            }
            .padding()
            .navigationTitle("Quantidade")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Fechar") { dismiss() }
                }
            }
        }
    }
}

#Preview {
    HomeView().environmentObject(WaterStore())
}
