import Foundation

func formatMoney(_ amount: Double, currency: String = "EUR") -> String {
    amount.formatted(.currency(code: currency).locale(Locale(identifier: "it_IT")))
}

func formatIsoDate(_ iso: String) -> String {
    let parser = DateFormatter()
    parser.dateFormat = "yyyy-MM-dd"
    parser.locale = Locale(identifier: "en_US_POSIX")
    guard let date = parser.date(from: iso) else { return iso }
    return date.formatted(.dateTime.day().month(.abbreviated).year().locale(Locale(identifier: "it_IT")))
}
