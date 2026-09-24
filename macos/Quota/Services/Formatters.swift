import Foundation

private let it = Locale(identifier: "it_IT")

func formatMoney(_ amount: Double, currency: String = "EUR") -> String {
    amount.formatted(.currency(code: currency).locale(it))
}

enum Iso {
    private static let parser: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        f.locale = Locale(identifier: "en_US_POSIX")
        f.timeZone = TimeZone(identifier: "Europe/Rome")
        return f
    }()

    static func date(_ iso: String) -> Date? { parser.date(from: String(iso.prefix(10))) }
    static func string(_ date: Date) -> String { parser.string(from: date) }
    static var today: String { string(Date()) }

    static func daysBetween(_ from: String, _ to: String) -> Int {
        guard let a = date(from), let b = date(to) else { return 0 }
        return Calendar.current.dateComponents([.day], from: a, to: b).day ?? 0
    }

    static func relative(_ to: String) -> String {
        let d = daysBetween(today, to)
        switch d {
        case 0: return "oggi"
        case 1: return "domani"
        case 2...: return "tra \(d) giorni"
        case -1: return "ieri"
        default: return "\(-d) giorni fa"
        }
    }
}

func formatIsoDate(_ iso: String) -> String {
    guard let d = Iso.date(iso) else { return iso }
    return d.formatted(.dateTime.day().month(.wide).year().locale(it))
}

func formatIsoShort(_ iso: String) -> String {
    guard let d = Iso.date(iso) else { return iso }
    return d.formatted(.dateTime.day().month(.abbreviated).locale(it))
}

func formatLongToday() -> String {
    Date().formatted(.dateTime.weekday(.wide).day().month(.wide).year().locale(it)).capitalized
}
