package it.trevisantech.quota.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import it.trevisantech.quota.R
import it.trevisantech.quota.model.MemberStatus

/** SF Pro Display — fornito dall'utente, non redistribuibile: font proprietario Apple. */
val SFProDisplay = FontFamily(
    // Nessun file Semibold "upright" disponibile in questo pacchetto (solo
    // Regular/Medium/Bold) — il testo Semibold usa il file Bold, l'emphasis
    // resta leggibile.
    Font(R.font.sf_pro_display_regular, FontWeight.Normal),
    Font(R.font.sf_pro_display_medium, FontWeight.Medium),
    Font(R.font.sf_pro_display_bold, FontWeight.SemiBold),
    Font(R.font.sf_pro_display_bold, FontWeight.Bold),
)

private val defaultTypography = Typography()
val QuotaTypography = Typography(
    displayLarge = defaultTypography.displayLarge.copy(fontFamily = SFProDisplay),
    displayMedium = defaultTypography.displayMedium.copy(fontFamily = SFProDisplay),
    displaySmall = defaultTypography.displaySmall.copy(fontFamily = SFProDisplay),
    headlineLarge = defaultTypography.headlineLarge.copy(fontFamily = SFProDisplay),
    headlineMedium = defaultTypography.headlineMedium.copy(fontFamily = SFProDisplay),
    headlineSmall = defaultTypography.headlineSmall.copy(fontFamily = SFProDisplay),
    titleLarge = defaultTypography.titleLarge.copy(fontFamily = SFProDisplay),
    titleMedium = defaultTypography.titleMedium.copy(fontFamily = SFProDisplay),
    titleSmall = defaultTypography.titleSmall.copy(fontFamily = SFProDisplay),
    bodyLarge = defaultTypography.bodyLarge.copy(fontFamily = SFProDisplay),
    bodyMedium = defaultTypography.bodyMedium.copy(fontFamily = SFProDisplay),
    bodySmall = defaultTypography.bodySmall.copy(fontFamily = SFProDisplay),
    labelLarge = defaultTypography.labelLarge.copy(fontFamily = SFProDisplay),
    labelMedium = defaultTypography.labelMedium.copy(fontFamily = SFProDisplay),
    labelSmall = defaultTypography.labelSmall.copy(fontFamily = SFProDisplay),
)

// Design token dall'handoff "Quota — mockup UI macOS & Android".
val QuotaAccent = Color(0xFF5B8F6F)
/** Variante più leggibile del verde per testo/icone su sfondo scuro. */
val QuotaAccentText = Color(0xFF7FB093)
val QuotaAccentStrong = Color(0xFF4A7A5C)
val QuotaBrick = Color(0xFFE2685C)
val QuotaBrickSoft = Color(0x1FE2685C)
val QuotaAmber = Color(0xFFE3A548)
val QuotaAmberSoft = Color(0x24E3A548)
val QuotaBackground = Color(0xFF0B0B0D)
val QuotaSurface = Color(0xFF1C1C1E)

val QuotaTextSecondary = Color.White.copy(alpha = 0.56f)
val QuotaTextTertiary = Color.White.copy(alpha = 0.35f)
val QuotaLabelSecondary = Color.White.copy(alpha = 0.45f)
val QuotaSeparator = Color.White.copy(alpha = 0.08f)

/** Raggi standard dell'handoff. */
val RadiusCard = 20.dp
val RadiusHeroCard = 22.dp
val RadiusInput = 14.dp

/** Raggio "continuo" in stile Apple — alias storici, ancora usati per righe compatte. */
val GlassCornerLarge = RadiusCard
val GlassCornerMedium = 18.dp
val GlassCornerSmall = 14.dp

/**
 * Carta piena (superficie #1C1C1E) con ombra morbida — lo stile di tutte le
 * card di contenuto. Il vetro/vibrancy è riservato solo alla navbar
 * flottante e alla sidebar nativa (mac), non ai contenuti.
 */
fun Modifier.solidCard(shape: Shape = RoundedCornerShape(RadiusCard), overlay: Boolean = false): Modifier =
    this
        .shadow(
            elevation = if (overlay) 20.dp else 14.dp,
            shape = shape,
            ambientColor = Color.Black.copy(alpha = if (overlay) 0.5f else 0.35f),
            spotColor = Color.Black.copy(alpha = if (overlay) 0.5f else 0.35f),
        )
        .clip(shape)
        .background(QuotaSurface)

/**
 * Vetro/vibrancy vero e proprio — solo per chrome di navigazione (navbar
 * flottante Android). Nessun blur reale disponibile senza libreria di terze
 * parti: strati di trasparenza sottili + bordo luminoso, secondo i valori
 * dell'handoff (bg 0.05–0.08 bianco, bordo 0.09–0.12).
 */
fun Modifier.glassSurface(
    shape: Shape = RoundedCornerShape(GlassCornerLarge),
    elevation: Dp = 20.dp,
    opacity: Float = 0.9f,
): Modifier =
    this
        .shadow(elevation = elevation, shape = shape, ambientColor = Color.Black.copy(alpha = 0.5f), spotColor = Color.Black.copy(alpha = 0.5f))
        .clip(shape)
        .background(QuotaSurface.copy(alpha = opacity))
        .background(Color.White.copy(alpha = 0.06f))
        .border(0.5.dp, Color.White.copy(alpha = 0.1f), shape)

/** Card di contenuto piena — sostituisce il vecchio "vetro" simulato sulle card. */
fun Modifier.glassCard(shape: Shape = RoundedCornerShape(GlassCornerLarge)): Modifier =
    this.solidCard(shape = shape)

/** Bagliore soffuso del colore dello stato dietro un badge, come i pill colorati Apple/watchOS. */
fun Modifier.glowBadge(color: Color, shape: Shape = RoundedCornerShape(50)): Modifier =
    this.shadow(elevation = 10.dp, shape = shape, ambientColor = color.copy(alpha = 0.45f), spotColor = color.copy(alpha = 0.45f))

fun colorFromHex(hex: String): Color = try {
    Color(android.graphics.Color.parseColor(hex))
} catch (e: Exception) {
    QuotaAccent
}

fun MemberStatus.color(): Color = when (this) {
    MemberStatus.REGOLARE -> QuotaAccentText
    MemberStatus.IN_SCADENZA -> QuotaAmber
    MemberStatus.IN_RITARDO -> QuotaBrick
}

fun MemberStatus.softColor(): Color = when (this) {
    MemberStatus.REGOLARE -> QuotaAccent.copy(alpha = 0.16f)
    MemberStatus.IN_SCADENZA -> QuotaAmberSoft
    MemberStatus.IN_RITARDO -> QuotaBrickSoft
}

private val QuotaColorScheme = darkColorScheme(
    primary = QuotaAccent,
    onPrimary = Color.White,
    background = QuotaBackground,
    surface = QuotaSurface,
    error = QuotaBrick,
)

@Composable
fun QuotaTheme(content: @Composable () -> Unit) {
    MaterialTheme(colorScheme = QuotaColorScheme, typography = QuotaTypography, content = content)
}
