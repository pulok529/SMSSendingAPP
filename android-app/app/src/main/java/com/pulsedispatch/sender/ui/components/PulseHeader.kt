package com.pulsedispatch.sender.ui.components

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.pulsedispatch.sender.ui.theme.CardWhite
import com.pulsedispatch.sender.ui.theme.DarkBrown
import com.pulsedispatch.sender.ui.theme.ErrorRed
import com.pulsedispatch.sender.ui.theme.ErrorRedBg
import com.pulsedispatch.sender.ui.theme.MutedBrown
import com.pulsedispatch.sender.ui.theme.OrangeGradient
import com.pulsedispatch.sender.ui.theme.OrangePrimary
import com.pulsedispatch.sender.ui.theme.SuccessGreen
import com.pulsedispatch.sender.ui.theme.SuccessGreenBg

@Composable
fun PulseHeader(
    isOnline: Boolean,
    isConnecting: Boolean,
    onRefresh: () -> Unit,
    onMenuClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val infiniteTransition = rememberInfiniteTransition(label = "spin")
    val rotation by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(1000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "rotation"
    )

    Surface(
        modifier = modifier
            .fillMaxWidth()
            .shadow(
                elevation = 12.dp,
                shape = RoundedCornerShape(bottomStart = 28.dp, bottomEnd = 28.dp),
                spotColor = Color(0x246B4C35)
            ),
        shape = RoundedCornerShape(bottomStart = 28.dp, bottomEnd = 28.dp),
        color = CardWhite
    ) {
        Column(
            modifier = Modifier.padding(horizontal = 20.dp, vertical = 16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Logo & Title
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = "Pulse Sender",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        color = DarkBrown
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "⚡",
                        fontSize = 18.sp
                    )
                }

                // Right controls: Online badge & Menu Button
                Row(verticalAlignment = Alignment.CenterVertically) {
                    // Status Badge
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(999.dp))
                            .background(if (isOnline) SuccessGreenBg else ErrorRedBg)
                            .padding(horizontal = 10.dp, vertical = 5.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = if (isOnline) "● ONLINE" else "○ OFFLINE",
                            color = if (isOnline) SuccessGreen else ErrorRed,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    Spacer(modifier = Modifier.width(10.dp))

                    // Menu Hamburger Button in Orange Circle
                    Surface(
                        onClick = onMenuClick,
                        shape = CircleShape,
                        color = Color.Transparent,
                        modifier = Modifier
                            .size(38.dp)
                            .shadow(4.dp, CircleShape, spotColor = Color(0x3DCE631D))
                            .clip(CircleShape)
                            .background(OrangeGradient)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                imageVector = Icons.Default.Menu,
                                contentDescription = "Menu",
                                tint = Color.White,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                    }
                }
            }

            // Connection status / Refresh row
            Spacer(modifier = Modifier.height(8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .clickable(enabled = !isConnecting, onClick = onRefresh)
                        .padding(vertical = 4.dp, horizontal = 4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.Refresh,
                        contentDescription = "Refresh connection",
                        tint = if (isConnecting) OrangePrimary else MutedBrown,
                        modifier = Modifier
                            .size(15.dp)
                            .then(if (isConnecting) Modifier.rotate(rotation) else Modifier)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = if (isConnecting) "Connecting to gateway..." else "Tap to check connection",
                        fontSize = 12.sp,
                        color = if (isConnecting) OrangePrimary else MutedBrown,
                        fontWeight = if (isConnecting) FontWeight.SemiBold else FontWeight.Normal
                    )
                }
            }
        }
    }
}
