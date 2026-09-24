import Foundation
import AppKit

enum Exporter {
    struct Line {
        let date: String, subscription: String, cycle: String, member: String
        let amount: Double, currency: String, method: String, status: String, note: String
    }

    static func lines(from rows: [ExportRow]) -> [Line] {
        rows.map { r in
            Line(date: String(r.paidAt.prefix(10)),
                 subscription: r.charge?.billingCycles?.subscriptions?.name ?? "",
                 cycle: r.charge?.billingCycles.map { String($0.periodStart.prefix(7)) } ?? "",
                 member: r.member?.name ?? "",
                 amount: r.amount, currency: r.currency,
                 method: r.method?.label ?? "", status: r.status == "reversed" ? "stornato" : "valido",
                 note: r.note ?? "")
        }
    }

    static func csv(_ lines: [Line]) -> String {
        func esc(_ s: String) -> String { "\"" + s.replacingOccurrences(of: "\"", with: "\"\"") + "\"" }
        var out = "Data;Abbonamento;Ciclo;Membro;Importo;Valuta;Metodo;Stato;Nota\n"
        for l in lines {
            let amount = String(format: "%.2f", l.amount).replacingOccurrences(of: ".", with: ",")
            out += [l.date, l.subscription, l.cycle, l.member, amount, l.currency, l.method, l.status, l.note].map(esc).joined(separator: ";") + "\n"
        }
        return out
    }

    static func pdf(_ lines: [Line], title: String) -> Data {
        let data = NSMutableData()
        var box = CGRect(x: 0, y: 0, width: 595, height: 842)
        guard let consumer = CGDataConsumer(data: data as CFMutableData),
              let ctx = CGContext(consumer: consumer, mediaBox: &box, nil) else { return Data() }
        let mono = NSFont.monospacedSystemFont(ofSize: 8.5, weight: .regular)
        let bold = NSFont.systemFont(ofSize: 16, weight: .bold)
        let rowsPerPage = 48
        let pages = max(1, Int(ceil(Double(lines.count) / Double(rowsPerPage))))

        for page in 0..<pages {
            ctx.beginPDFPage(nil)
            NSGraphicsContext.saveGraphicsState()
            NSGraphicsContext.current = NSGraphicsContext(cgContext: ctx, flipped: false)
            func draw(_ text: String, x: CGFloat, y: CGFloat, font: NSFont) {
                (text as NSString).draw(at: CGPoint(x: x, y: y), withAttributes: [.font: font, .foregroundColor: NSColor.black])
            }
            draw(title, x: 40, y: 790, font: bold)
            draw("Pagina \(page + 1) di \(pages)", x: 480, y: 794, font: mono)
            draw("DATA        ABBONAMENTO       MEMBRO            IMPORTO      STATO", x: 40, y: 762, font: mono)
            for (i, l) in lines.dropFirst(page * rowsPerPage).prefix(rowsPerPage).enumerated() {
                let row = l.date.padding(toLength: 12, withPad: " ", startingAt: 0)
                    + String(l.subscription.prefix(16)).padding(toLength: 18, withPad: " ", startingAt: 0)
                    + String(l.member.prefix(16)).padding(toLength: 18, withPad: " ", startingAt: 0)
                    + String(format: "%.2f %@", l.amount, l.currency).padding(toLength: 13, withPad: " ", startingAt: 0)
                    + l.status
                draw(row, x: 40, y: 746 - CGFloat(i) * 15, font: mono)
            }
            NSGraphicsContext.restoreGraphicsState()
            ctx.endPDFPage()
        }
        ctx.closePDF()
        return data as Data
    }

    @MainActor
    static func save(data: Data, suggestedName: String) -> Bool {
        let panel = NSSavePanel()
        panel.nameFieldStringValue = suggestedName
        guard panel.runModal() == .OK, let url = panel.url else { return false }
        return (try? data.write(to: url)) != nil
    }
}
