package com.pulsedispatch.sender.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.ConfirmationNumber
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.ExitToApp
import androidx.compose.material.icons.filled.Mail
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.pulsedispatch.sender.data.AppScreen
import com.pulsedispatch.sender.data.UserProfile
import com.pulsedispatch.sender.ui.theme.CardBorder
import com.pulsedispatch.sender.ui.theme.CardWhite
import com.pulsedispatch.sender.ui.theme.DarkBrown
import com.pulsedispatch.sender.ui.theme.ErrorRed
import com.pulsedispatch.sender.ui.theme.MutedBrown
import com.pulsedispatch.sender.ui.theme.OrangeGradient
import com.pulsedispatch.sender.ui.theme.OrangeLight
import com.pulsedispatch.sender.ui.theme.OrangePrimary
import com.pulsedispatch.sender.ui.theme.WarmCream

@Composable
fun PulseSideMenu(
    isOpen: Boolean,
    userProfile: UserProfile,
    pendingJobsCount: Int,
    onNavigate: (AppScreen) -> Unit,
    onLogout: () -> Unit,
    onClose: () -> Unit,
    modifier: Modifier = Modifier
) {
    var showLogoutDialog by remember { mutableStateOf(false) }

    if (showLogoutDialog) {
        AlertDialog(
            onDismissRequest = { showLogoutDialog = false },
            title = {
                Text(
                    text = "Confirm Logout",
                    fontWeight = FontWeight.Bold,
                    color = DarkBrown
                )
            },
            text = {
                Text(
                    text = "Are you sure you want to log out of Pulse Sender?",
                    color = DarkBrown
                )
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        showLogoutDialog = false
                        onLogout()
                    }
                ) {
                    Text(
                        text = "Logout",
                        color = ErrorRed,
                        fontWeight = FontWeight.Bold
                    )
                }
            },
            dismissButton = {
                TextButton(onClick = { showLogoutDialog = false }) {
                    Text(
                        text = "Cancel",
                        color = DarkBrown,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            },
            containerColor = CardWhite,
            shape = RoundedCornerShape(20.dp)
        )
    }

    AnimatedVisibility(
        visible = isOpen,
        enter = fadeIn(),
        exit = fadeOut()
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black.copy(alpha = 0.45f))
                .clickable(
                    interactionSource = remember { MutableInteractionSource() },
                    indication = null,
                    onClick = onClose
                )
        ) {
            // Slide-in panel from the right
            AnimatedVisibility(
                visible = isOpen,
                enter = slideInHorizontally(initialOffsetX = { it }),
                exit = slideOutHorizontally(targetOffsetX = { it }),
                modifier = Modifier.align(Alignment.CenterEnd)
            ) {
                Surface(
                    modifier = Modifier
                        .fillMaxHeight()
                        .fillMaxWidth(0.75f)
                        .shadow(24.dp, RoundedCornerShape(topStart = 28.dp, bottomStart = 28.dp)),
                    shape = RoundedCornerShape(topStart = 28.dp, bottomStart = 28.dp),
                    color = CardWhite
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .statusBarsPadding()
                            .navigationBarsPadding()
                            .padding(top = 16.dp, bottom = 20.dp, start = 20.dp, end = 20.dp)
                    ) {
                        // User Profile Header
                        Surface(
                            onClick = {
                                onNavigate(AppScreen.PROFILE)
                                onClose()
                            },
                            shape = RoundedCornerShape(14.dp),
                            color = Color.Transparent,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 8.dp, horizontal = 4.dp)
                            ) {
                                // Avatar circle with initials
                                Box(
                                    modifier = Modifier
                                        .size(54.dp)
                                        .clip(CircleShape)
                                        .background(OrangeGradient),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = userProfile.avatarInitials,
                                        color = Color.White,
                                        fontSize = 20.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }

                                Spacer(modifier = Modifier.width(12.dp))

                                Column(modifier = Modifier.weight(1f)) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Text(
                                            text = userProfile.name,
                                            style = MaterialTheme.typography.titleMedium,
                                            fontWeight = FontWeight.Bold,
                                            color = DarkBrown,
                                            maxLines = 1
                                        )
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Box(
                                            modifier = Modifier
                                                .clip(RoundedCornerShape(999.dp))
                                                .background(OrangeLight)
                                                .padding(horizontal = 6.dp, vertical = 2.dp)
                                        ) {
                                            Text(
                                                text = userProfile.role,
                                                fontSize = 10.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = OrangePrimary
                                            )
                                        }
                                    }
                                    Spacer(modifier = Modifier.height(2.dp))
                                    Text(
                                        text = userProfile.email,
                                        fontSize = 12.sp,
                                        color = MutedBrown,
                                        maxLines = 1
                                    )
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(16.dp))
                        HorizontalDivider(color = CardBorder)
                        Spacer(modifier = Modifier.height(16.dp))

                        // Navigation Menu Items
                        SideMenuItem(
                            icon = Icons.Default.Person,
                            title = "Profile",
                            onClick = {
                                onNavigate(AppScreen.PROFILE)
                                onClose()
                            }
                        )

                        SideMenuItem(
                            icon = Icons.Default.Mail,
                            title = "Dispatch Console",
                            onClick = {
                                onNavigate(AppScreen.DISPATCH)
                                onClose()
                            }
                        )

                        SideMenuItem(
                            icon = Icons.Default.Person,
                            title = "Phone Directory",
                            onClick = {
                                onNavigate(AppScreen.DIRECTORY)
                                onClose()
                            }
                        )

                        SideMenuItem(
                            icon = Icons.Default.Mail,
                            title = "Contact Groups",
                            onClick = {
                                onNavigate(AppScreen.GROUPS)
                                onClose()
                            }
                        )

                        SideMenuItem(
                            icon = Icons.Default.Description,
                            title = "Message Library",
                            onClick = {
                                onNavigate(AppScreen.MESSAGES)
                                onClose()
                            }
                        )

                        SideMenuItem(
                            icon = Icons.Default.Mail,
                            title = "Pulse Sender (Jobs)",
                            badge = if (pendingJobsCount > 0) pendingJobsCount.toString() else null,
                            onClick = {
                                onNavigate(AppScreen.JOBS)
                                onClose()
                            }
                        )

                        SideMenuItem(
                            icon = Icons.Default.Description,
                            title = "Activity Log",
                            onClick = {
                                onNavigate(AppScreen.ACTIVITY_LOG)
                                onClose()
                            }
                        )

                        SideMenuItem(
                            icon = Icons.Default.ConfirmationNumber,
                            title = "Ticket Support",
                            onClick = {
                                onNavigate(AppScreen.TICKET)
                                onClose()
                            }
                        )

                        SideMenuItem(
                            icon = Icons.Default.Settings,
                            title = "Settings",
                            onClick = {
                                onNavigate(AppScreen.SETTINGS)
                                onClose()
                            }
                        )

                        Spacer(modifier = Modifier.weight(1f))

                        HorizontalDivider(color = CardBorder)
                        Spacer(modifier = Modifier.height(12.dp))

                        // Logout Item
                        Surface(
                            onClick = { showLogoutDialog = true },
                            shape = RoundedCornerShape(12.dp),
                            color = Color.Transparent,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 12.dp, horizontal = 8.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    imageVector = Icons.Default.ExitToApp,
                                    contentDescription = "Logout",
                                    tint = ErrorRed,
                                    modifier = Modifier.size(22.dp)
                                )
                                Spacer(modifier = Modifier.width(14.dp))
                                Text(
                                    text = "Logout",
                                    fontSize = 15.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = ErrorRed
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        // Version
                        Text(
                            text = "Pulse Sender v1.0.0",
                            fontSize = 11.sp,
                            color = MutedBrown,
                            modifier = Modifier.align(Alignment.CenterHorizontally)
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun SideMenuItem(
    icon: ImageVector,
    title: String,
    badge: String? = null,
    onClick: () -> Unit
) {
    Surface(
        onClick = onClick,
        shape = RoundedCornerShape(12.dp),
        color = Color.Transparent,
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 12.dp, horizontal = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = OrangePrimary,
                modifier = Modifier.size(22.dp)
            )
            Spacer(modifier = Modifier.width(14.dp))
            Text(
                text = title,
                fontSize = 15.sp,
                fontWeight = FontWeight.SemiBold,
                color = DarkBrown,
                modifier = Modifier.weight(1f)
            )
            if (badge != null) {
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(999.dp))
                        .background(OrangePrimary)
                        .padding(horizontal = 8.dp, vertical = 2.dp)
                ) {
                    Text(
                        text = badge,
                        color = Color.White,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
                Spacer(modifier = Modifier.width(8.dp))
            }
            Icon(
                imageVector = Icons.Default.ChevronRight,
                contentDescription = null,
                tint = Color(0xFFAAA098),
                modifier = Modifier.size(18.dp)
            )
        }
    }
}
