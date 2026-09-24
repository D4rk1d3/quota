import SwiftUI

struct DashboardView: View {
    let model: AppModel
    var onOpen: (Subscription) -> Void

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                QPageHeader(title: "Dashboard") {
                    Text(formatLongToday()).font(.system(size: 14)).foregroundStyle(Color.qTextSecondary)
                }
                if let error = model.errorMessage { QErrorBanner(message: error) }

                if let sub = model.nextSubscription {
                    HeroCard(subscription: sub, cycle: model.heroCycle) { onOpen(sub) }
                }

                HStack(spacing: 16) {
                    MetricCard(label: "Incassato", value: formatMoney(model.summary.totalCollected),
                               hint: "su \(formatMoney(model.summary.totalExpected)) attesi", tint: .qAccentText)
                    MetricCard(label: "Da recuperare", value: formatMoney(model.summary.totalOutstanding),
                               hint: model.summary.overdueCount == 0 ? "Nessun ritardo" : "\(model.summary.overdueCount) in ritardo",
                               tint: model.summary.overdueCount == 0 ? .qTextPrimary : .qRed)
                }

                QSectionLabel(title: "Abbonamenti", trailing: "\(model.subscriptions.count)")
                if model.subscriptions.isEmpty && !model.loading {
                    QEmptyState(icon: "rectangle.stack.badge.plus", title: "Nessun abbonamento ancora",
                                message: "Aggiungilo dalla sezione Abbonamenti per iniziare.").qCard()
                } else {
                    QList {
                        ForEach(Array(model.subscriptions.enumerated()), id: \.element.id) { index, sub in
                            if index > 0 { QDivider() }
                            Button { onOpen(sub) } label: {
                                QRow(title: sub.name, subtitle: "Rinnovo \(formatIsoDate(sub.nextRenewalDate))", showsChevron: true) {
                                    QAvatar(name: sub.name)
                                } trailing: {
                                    Text(formatMoney(sub.currentPrice, currency: sub.currency))
                                        .font(.system(size: 14, weight: .semibold)).monospacedDigit()
                                }
                            }.buttonStyle(.plain)
                        }
                    }
                }
            }
            .padding(28)
        }
        .refreshable { await model.refresh() }
    }
}

private struct HeroCard: View {
    let subscription: Subscription
    let cycle: BillingCycle?
    var onOpen: () -> Void

    private var missing: Double { max(0, (cycle?.expectedTotal ?? 0) - (cycle?.collectedTotal ?? 0)) }
    private var progress: Double {
        guard let cycle, cycle.expectedTotal > 0 else { return 0 }
        return cycle.collectedTotal / cycle.expectedTotal
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(alignment: .top) {
                Text("PROSSIMO ADDEBITO").font(.system(size: 11, weight: .semibold)).tracking(0.6)
                    .foregroundStyle(Color.qTextSecondary)
                Spacer()
                if cycle != nil {
                    if missing > 0.005 {
                        QBadge(label: "Mancano \(formatMoney(missing, currency: subscription.currency))", icon: "clock", color: .qAmber)
                    } else {
                        QBadge(label: "Fondo coperto", icon: "checkmark", color: .qAccentText)
                    }
                }
            }
            Text(formatMoney(subscription.currentPrice, currency: subscription.currency))
                .font(.system(size: 40, weight: .bold)).monospacedDigit().padding(.top, 10)
            Text("\(subscription.name) · \(formatIsoDate(subscription.nextRenewalDate)) · \(Iso.relative(subscription.nextRenewalDate))")
                .font(.system(size: 14)).foregroundStyle(Color.qTextSecondary).padding(.top, 2)

            if let cycle {
                HStack {
                    Text("Fondo coperto").font(.system(size: 13)).foregroundStyle(Color.qTextSecondary)
                    Spacer()
                    Text("\(formatMoney(cycle.collectedTotal, currency: cycle.currency)) / \(formatMoney(cycle.expectedTotal, currency: cycle.currency))")
                        .font(.system(size: 13)).foregroundStyle(Color.qTextSecondary).monospacedDigit()
                }.padding(.top, 20)
                QProgressBar(value: progress).padding(.top, 8)
            }

            Button(action: onOpen) {
                Label("Apri \(subscription.name)", systemImage: "plus").frame(maxWidth: .infinity)
            }
            .buttonStyle(.qPrimaryLarge).padding(.top, 22)
        }
        .padding(24)
        .qCard(radius: QRadius.hero)
    }
}

private struct MetricCard: View {
    let label: String
    let value: String
    let hint: String
    let tint: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label.uppercased()).font(.system(size: 11, weight: .semibold)).tracking(0.6).foregroundStyle(Color.qTextSecondary)
            Text(value).font(.system(size: 26, weight: .bold)).monospacedDigit().foregroundStyle(tint)
            Text(hint).font(.system(size: 12)).foregroundStyle(Color.qTextSecondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(20).qCard()
    }
}
