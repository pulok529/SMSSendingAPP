package com.pulsedispatch.sender.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val LightColorScheme = lightColorScheme(
    primary = OrangePrimary,
    onPrimary = CardWhite,
    primaryContainer = OrangeLight,
    onPrimaryContainer = DarkBrown,
    secondary = OrangeSecondary,
    onSecondary = DarkBrown,
    background = WarmCream,
    onBackground = DarkBrown,
    surface = CardWhite,
    onSurface = DarkBrown,
    surfaceVariant = WarmCreamLight,
    onSurfaceVariant = MutedBrown,
    outline = CardBorder,
    error = ErrorRed,
    onError = CardWhite,
    errorContainer = ErrorRedBg,
    onErrorContainer = ErrorRed
)

@Composable
fun PulseSenderTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = LightColorScheme
    val view = LocalView.current

    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = WarmCream.toArgb()
            window.navigationBarColor = WarmCream.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = true
            WindowCompat.getInsetsController(window, view).isAppearanceLightNavigationBars = true
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
