package com.pulsedispatch.sender.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.pulsedispatch.sender.MainViewModel
import com.pulsedispatch.sender.data.GroupDto
import com.pulsedispatch.sender.ui.components.PulseHeader
import com.pulsedispatch.sender.ui.theme.PulseColors

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GroupManagementScreen(
    viewModel: MainViewModel,
    onMenuClick: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    var rankedGroups by remember { mutableStateOf(listOf<GroupDto>()) }
    var generalGroups by remember { mutableStateOf(listOf<GroupDto>()) }
    var loading by remember { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        viewModel.fetchGroups { ranked, general ->
            rankedGroups = ranked
            generalGroups = general
            loading = false
        }
    }

    Scaffold(
        topBar = {
            PulseHeader(
                isOnline = uiState.isOnline,
                isConnecting = uiState.isConnecting,
                onRefresh = { viewModel.refreshConnection() },
                onMenuClick = onMenuClick
            )
        },
        containerColor = PulseColors.Background
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            if (loading) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = PulseColors.Primary)
                }
            } else {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    item {
                        Text(
                            text = "Ranked Hierarchy Groups",
                            fontWeight = FontWeight.Bold,
                            color = PulseColors.Primary,
                            fontSize = 15.sp
                        )
                    }

                    if (rankedGroups.isEmpty()) {
                        item {
                            Text("No ranked priority groups.", color = PulseColors.TextMuted, fontSize = 12.sp)
                        }
                    } else {
                        items(rankedGroups) { g ->
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                colors = CardDefaults.cardColors(containerColor = PulseColors.CardBg),
                                shape = RoundedCornerShape(10.dp)
                            ) {
                                Row(
                                    modifier = Modifier.padding(14.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column {
                                        Text(text = g.name, fontWeight = FontWeight.Bold, color = PulseColors.TextPrimary)
                                        Text(text = "Priority Tier", fontSize = 11.sp, color = PulseColors.TextSecondary)
                                    }
                                    Badge(containerColor = PulseColors.Primary) {
                                        Text(text = "Rank #" + (g.rank ?: 1), modifier = Modifier.padding(4.dp))
                                    }
                                }
                            }
                        }
                    }

                    item {
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "General Groups",
                            fontWeight = FontWeight.Bold,
                            color = PulseColors.TextPrimary,
                            fontSize = 15.sp
                        )
                    }

                    if (generalGroups.isEmpty()) {
                        item {
                            Text("No general groups.", color = PulseColors.TextMuted, fontSize = 12.sp)
                        }
                    } else {
                        items(generalGroups) { g ->
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                colors = CardDefaults.cardColors(containerColor = PulseColors.CardBg),
                                shape = RoundedCornerShape(10.dp)
                            ) {
                                Column(modifier = Modifier.padding(14.dp)) {
                                    Text(text = g.name, fontWeight = FontWeight.Bold, color = PulseColors.TextPrimary)
                                    Text(text = g.details ?: "Unranked general group", fontSize = 11.sp, color = PulseColors.TextSecondary)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
