package it.trevisantech.quota.data

import java.text.NumberFormat
import java.time.LocalDate
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

/**
 * Aritmetica pura su stringhe "YYYY-MM-DD" dove possibile, per evitare gli
 * slittamenti di fuso orario — stesso approccio della web app (lib/domain.ts)
 * e dell'app macOS (DomainFormat.swift).
 */
object IsoDate {
    private val ROME: ZoneId = ZoneId.of("Europe/Rome")
    private val ITALIAN_LONG = DateTimeFormatter.ofPattern("d MMMM yyyy", Locale.ITALIAN)

    data class Parts(val y: Int, val m: Int, val d: Int)

    fun parts(iso: String): Parts {
        val p = iso.split("-").map { it.toInt() }
        return Parts(p[0], p[1], p[2])
    }

    fun addOneMonth(iso: String): String {
        val (y, m, d) = parts(iso)
        val nextMonth = if (m == 12) 1 else m + 1
        val nextYear = if (m == 12) y + 1 else y
        return "%04d-%02d-%02d".format(nextYear, nextMonth, d)
    }

    fun todayInRome(): String {
        val today = LocalDate.now(ROME)
        return "%04d-%02d-%02d".format(today.year, today.monthValue, today.dayOfMonth)
    }

    fun daysBetween(a: String, b: String): Long {
        val pa = parts(a); val pb = parts(b)
        val da = LocalDate.of(pa.y, pa.m, pa.d)
        val db = LocalDate.of(pb.y, pb.m, pb.d)
        return java.time.temporal.ChronoUnit.DAYS.between(da, db)
    }

    fun nextChargeDate(billingDay: Int, from: String): String {
        val (y, m, _) = parts(from)
        var candidate = "%04d-%02d-%02d".format(y, m, billingDay)
        if (candidate <= from) candidate = addOneMonth(candidate)
        return candidate
    }

    fun formatDayMonthYear(iso: String): String {
        val (y, m, d) = parts(iso)
        return ITALIAN_LONG.format(LocalDate.of(y, m, d))
    }

    fun initials(name: String): String =
        name.split(" ").mapNotNull { it.firstOrNull()?.uppercaseChar() }.take(2).joinToString("")
}

object Money {
    private val formatter: NumberFormat = NumberFormat.getCurrencyInstance(Locale.ITALY)

    fun euroString(cents: Int): String = formatter.format(cents / 100.0)

    fun euroToCents(euro: Double): Int = Math.round(euro * 100).toInt()
}
