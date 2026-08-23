package com.pulsedispatch.sender.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.Mail
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.pulsedispatch.sender.data.AppScreen
import com.pulsedispatch.sender.ui.components.NavCard
import com.pulsedispatch.sender.ui.components.PulseHeader
import com.pulsedispatch.sender.ui.components.PulsePrimaryButton
import com.pulsedispatch.sender.ui.components.PulseSuccessButton
import com.pulsedispatch.sender.ui.components.StatCard
import com.pulsedispatch.sender.ui.theme.ErrorRed
import com.pulsedispatch.sender.ui.theme.OrangePrimary
import com.pulsedispatch.sender.ui.theme.SuccessGreen
import com.pulsedispatch.sender.ui.theme.WarmCream
import com.pulsedispatch.sender.ui.theme.WarningAmber

@Composable
fun DashboardScreen(
    isOnline: Boolean,
    isConnecting: Boolean,
    sentCount: Int,
    pendingCount: Int,
    failedCount: Int,
    isFetching: Boolean,
    isProcessing: Boolean,
    onRefreshConnection: () -> Unit,
    onMenuClick: () -> Unit,
    onNavigate: (AppScreen) -> Unit,
    onFetchJobs: () -> Unit,
    onProcessQueue: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .background(WarmCream)
            .navigationBarsPadding()
    ) {
        // Top App Header
        PulseHeader(
            isOnline = isOnline,
            isConnecting = isConnecting,
            onRefresh = onRefreshConnection,
            onMenuClick = onMenuClick
        )

        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp, vertical = 20.dp)
        ) {
            // Stats Row (3 cards)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                StatCard(
                    label = "Sent Today",
                    value = sentCount.toString(),
                    valueColor = OrangePrimary,
                    modifier = Modifier.weight(1f)
                )
                StatCard(
                    label = "Pending",
                    value = pendingCount.toString(),
                    valueColor = WarningAmber,
                    modifier = Modifier.weight(1f)
                )
                StatCard(
                    label = "Failed",
                    value = failedCount.toString(),
                    valueColor = ErrorRed,
                    modifier = Modifier.weight(1f)
                )
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Navigation Card 1: Pending Jobs
            NavCard(
                title = "Pending Jobs",
                subtitle = if (pendingCount > 0) "$pendingCount jobs waiting in queue" else "No pending jobs",
                icon = Icons.Default.Mail,
                accentColor = OrangePrimary,
                onClick = { onNavigate(AppScreen.JOBS) }
            )

            Spacer(modifier = Modifier.height(14.dp))

            // Navigation Card 2: Activity Log
            NavCard(
                title = "Activity Log",
                subtitle = "View dispatch and server history",
                icon = Icons.Default.Description,
                accentColor = SuccessGreen,
                onClick = { onNavigate(AppScreen.ACTIVITY_LOG) }
            )

            Spacer(modifier = Modifier.height(28.dp))

            // Action Button 1: Fetch Jobs
            PulsePrimaryButton(
                text = "FETCH JOBS",
                icon = Icons.Default.Download,
                isLoading = isFetching,
                onClick = onFetchJobs
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Action Button 2: Process Queue
            PulseSuccessButton(
                text = "PROCESS QUEUE",
                icon = Icons.Default.PlayArrow,
                isLoading = isProcessing,
                enabled = pendingCount > 0,
                onClick = onProcessQueue
            )

            Spacer(modifier = Modifier.height(20.dp))
        }
    }
}
