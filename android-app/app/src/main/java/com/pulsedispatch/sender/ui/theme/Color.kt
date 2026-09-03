package com.pulsedispatch.sender.ui.theme

import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color

// Warm Cream & Amber Palette (matching Web Dashboard)
val WarmCream = Color(0xFFF7EFE6)
val WarmCreamLight = Color(0xFFFAF5EE)
val WarmCreamDark = Color(0xFFEDE2D4)

val DarkBrown = Color(0xFF22150E)
val MediumBrown = Color(0xFF4A3427)
val MutedBrown = Color(0xFF826753)
val SubtleBrown = Color(0xFFA68E7C)

// Amber / Orange Accent & Gradient
val OrangePrimary = Color(0xFFCE631D)
val OrangeSecondary = Color(0xFFECA051)
val OrangeLight = Color(0xFFFFF3E8)
val OrangeBorder = Color(0xFFF0D5C0)

val OrangeGradient = Brush.horizontalGradient(
    colors = listOf(Color(0xFFCE631D), Color(0xFFECA051))
)

val OrangeVerticalGradient = Brush.verticalGradient(
    colors = listOf(Color(0xFFCE631D), Color(0xFFECA051))
)

val DarkHeroGradient = Brush.linearGradient(
    colors = listOf(Color(0xFF2C1F16), Color(0xFF593317))
)

// Cards & Surface
val CardWhite = Color(0xFFFFFFFF)
val CardWhiteGlass = Color(0xF5FFFFFF)
val CardBorder = Color(0x1F6B4C35)

// Status Colors
val SuccessGreen = Color(0xFF17623F)
val SuccessGreenBg = Color(0xFFDAF5E7)
val SuccessGreenBorder = Color(0xFFB5E8CE)

val ErrorRed = Color(0xFF9F2432)
val ErrorRedBg = Color(0xFFFDE1E2)
val ErrorRedBorder = Color(0xFFF5B6BA)

val WarningAmber = Color(0xFF915C10)
val WarningAmberBg = Color(0xFFFCE9C4)
val WarningAmberBorder = Color(0xFFF2D190)

val InfoBlue = Color(0xFF0F4F74)
val InfoBlueBg = Color(0xFFDFF0FB)
val InfoBlueBorder = Color(0xFFB5DDF4)

object PulseColors {
    val Background = WarmCream
    val CardBg = CardWhite
    val Primary = OrangePrimary
    val Secondary = OrangeSecondary
    val TextPrimary = DarkBrown
    val TextSecondary = MediumBrown
    val TextMuted = MutedBrown
    val Success = SuccessGreen
    val Error = ErrorRed
}

