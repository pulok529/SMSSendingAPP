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
import com.pulsedispatch.sender.data.MessageTemplateDto
import com.pulsedispatch.sender.ui.components.PulseHeader
import com.pulsedispatch.sender.ui.theme.PulseColors

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MessageLibraryScreen(
    viewModel: MainViewModel,
    onMenuClick: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    var manualTemplates by remember { mutableStateOf(listOf<MessageTemplateDto>()) }
    var autoTemplates by remember { mutableStateOf(listOf<MessageTemplateDto>()) }
    var selectedTab by remember { mutableStateOf(0) }
    var loading by remember { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        viewModel.fetchMessages { manual, auto ->
            manualTemplates = manual
            autoTemplates = auto
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
            TabRow(
                selectedTabIndex = selectedTab,
                containerColor = PulseColors.CardBg,
                contentColor = PulseColors.Primary
            ) {
                Tab(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    text = { Text("Manual (" + manualTemplates.size + ")") }
                )
                Tab(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    text = { Text("Auto Audits (" + autoTemplates.size + ")") }
                )
            }

            val list = if (selectedTab == 0) manualTemplates else autoTemplates

            if (loading) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = PulseColors.Primary)
                }
            } else if (list.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("No messages in this category.", color = PulseColors.TextMuted)
                }
            } else {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    items(list) { item ->
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = PulseColors.CardBg),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(text = item.title ?: "Broadcast Copy", fontWeight = FontWeight.Bold, color = PulseColors.TextPrimary)
                                    Badge(containerColor = PulseColors.Background) {
                                        Text(text = item.channel, color = PulseColors.Primary, modifier = Modifier.padding(2.dp), fontSize = 10.sp)
                                    }
                                }

                                if (!item.subject.isNullOrBlank()) {
                                    Text(text = "Subject: " + item.subject, fontSize = 12.sp, color = PulseColors.TextSecondary)
                                }

                                Text(text = item.body, fontSize = 12.sp, color = PulseColors.TextMuted)
                            }
                        }
                    }
                }
            }
        }
    }
}
