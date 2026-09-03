package com.pulsedispatch.sender.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.pulsedispatch.sender.MainViewModel
import com.pulsedispatch.sender.data.DispatchRecipientDto
import com.pulsedispatch.sender.ui.components.PulseHeader
import com.pulsedispatch.sender.ui.theme.PulseColors

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DispatchScreen(
    viewModel: MainViewModel,
    onMenuClick: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()

    var subject by remember { mutableStateOf("") }
    var message by remember { mutableStateOf("Hello {{name}}, update from Pulse Dispatch!") }
    var recipients by remember { mutableStateOf(listOf<DispatchRecipientDto>()) }
    var saveToDirectory by remember { mutableStateOf(true) }

    // Manual Form
    var manualName by remember { mutableStateOf("") }
    var manualPhone by remember { mutableStateOf("") }
    var manualEmail by remember { mutableStateOf("") }

    // Modals
    var showConfirmModal by remember { mutableStateOf(false) }
    var isSending by remember { mutableStateOf(false) }
    var statusMessage by remember { mutableStateOf<String?>(null) }

    val hasEmail = recipients.any { it.sendEmail }
    val smsCount = recipients.count { it.sendSms && (it.phone?.isNotEmpty() == true) }
    val emailCount = recipients.count { it.sendEmail && (it.email?.isNotEmpty() == true) }

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
                .padding(16.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Header Info Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = PulseColors.CardBg),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Icon(Icons.Default.Send, contentDescription = null, tint = PulseColors.Primary)
                        Text(
                            text = "Universal Dispatch Console",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = PulseColors.TextPrimary
                        )
                    }
                    Text(
                        text = "Prepare and queue SMS & Email broadcasts directly from your mobile device. Supports offline staging.",
                        fontSize = 12.sp,
                        color = PulseColors.TextSecondary
                    )
                }
            }

            // Message Composer Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = PulseColors.CardBg),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text(
                        text = "1. Message & Content",
                        fontWeight = FontWeight.SemiBold,
                        color = PulseColors.TextPrimary,
                        fontSize = 14.sp
                    )

                    if (hasEmail) {
                        OutlinedTextField(
                            value = subject,
                            onValueChange = { subject = it },
                            label = { Text("Email Subject Line") },
                            modifier = Modifier.fillMaxWidth(),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedTextColor = PulseColors.TextPrimary,
                                unfocusedTextColor = PulseColors.TextPrimary
                            )
                        )
                    }

                    OutlinedTextField(
                        value = message,
                        onValueChange = { message = it },
                        label = { Text("Message Body (Supports {{name}}, {{phone}})") },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(110.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = PulseColors.TextPrimary,
                            unfocusedTextColor = PulseColors.TextPrimary
                        )
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = "" + message.length + " chars • " + ((message.length / 160) + 1) + " SMS segment(s)",
                            fontSize = 11.sp,
                            color = PulseColors.TextMuted
                        )
                    }
                }
            }

            // Recipient Quick Add Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = PulseColors.CardBg),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(
                        text = "2. Add Recipients",
                        fontWeight = FontWeight.SemiBold,
                        color = PulseColors.TextPrimary,
                        fontSize = 14.sp
                    )

                    OutlinedTextField(
                        value = manualName,
                        onValueChange = { manualName = it },
                        label = { Text("Full Name") },
                        modifier = Modifier.fillMaxWidth()
                    )

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = manualPhone,
                            onValueChange = { manualPhone = it },
                            label = { Text("Phone Number") },
                            modifier = Modifier.weight(1f)
                        )
                        OutlinedTextField(
                            value = manualEmail,
                            onValueChange = { manualEmail = it },
                            label = { Text("Email (Optional)") },
                            modifier = Modifier.weight(1f)
                        )
                    }

                    Button(
                        onClick = {
                            if (manualName.isNotBlank() || manualPhone.isNotBlank() || manualEmail.isNotBlank()) {
                                recipients = recipients + DispatchRecipientDto(
                                    name = if (manualName.isBlank()) "Valued Contact" else manualName,
                                    phone = manualPhone.trim(),
                                    email = manualEmail.trim(),
                                    sendSms = manualPhone.isNotBlank(),
                                    sendEmail = manualEmail.isNotBlank()
                                )
                                manualName = ""
                                manualPhone = ""
                                manualEmail = ""
                            }
                        },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = PulseColors.Primary)
                    ) {
                        Icon(Icons.Default.Add, contentDescription = null)
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Add to Dispatch Grid")
                    }
                }
            }

            // Recipients Grid Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = PulseColors.CardBg),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Recipients (" + recipients.size + ")",
                            fontWeight = FontWeight.Bold,
                            color = PulseColors.TextPrimary
                        )
                        if (recipients.isNotEmpty()) {
                            TextButton(onClick = { recipients = emptyList() }) {
                                Text("Clear All", color = Color(0xFFEF4444), fontSize = 12.sp)
                            }
                        }
                    }

                    if (recipients.isEmpty()) {
                        Text(
                            text = "No recipients added yet. Enter details above to add.",
                            fontSize = 12.sp,
                            color = PulseColors.TextMuted,
                            modifier = Modifier.padding(vertical = 12.dp)
                        )
                    } else {
                        recipients.forEachIndexed { idx, r ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(PulseColors.Background, RoundedCornerShape(8.dp))
                                    .padding(8.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(text = r.name, fontWeight = FontWeight.SemiBold, color = PulseColors.TextPrimary, fontSize = 13.sp)
                                    Text(text = (r.phone ?: "—") + " • " + (r.email ?: "—"), fontSize = 11.sp, color = PulseColors.TextSecondary)
                                }

                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Checkbox(
                                        checked = r.sendSms,
                                        onCheckedChange = { checked ->
                                            recipients = recipients.mapIndexed { i, item ->
                                                if (i == idx) item.copy(sendSms = checked) else item
                                            }
                                        }
                                    )
                                    Text("SMS", fontSize = 11.sp, color = PulseColors.TextMuted)

                                    Checkbox(
                                        checked = r.sendEmail,
                                        onCheckedChange = { checked ->
                                            recipients = recipients.mapIndexed { i, item ->
                                                if (i == idx) item.copy(sendEmail = checked) else item
                                            }
                                        }
                                    )
                                    Text("Email", fontSize = 11.sp, color = PulseColors.TextMuted)

                                    IconButton(
                                        onClick = { recipients = recipients.filterIndexed { i, _ -> i != idx } },
                                        modifier = Modifier.size(28.dp)
                                    ) {
                                        Icon(Icons.Default.Close, contentDescription = null, tint = Color(0xFFEF4444), modifier = Modifier.size(16.dp))
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Directory Toggle & Dispatch CTA
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Checkbox(
                    checked = saveToDirectory,
                    onCheckedChange = { saveToDirectory = it }
                )
                Text(
                    text = "Save new contacts to Phone Directory",
                    fontSize = 12.sp,
                    color = PulseColors.TextSecondary
                )
            }

            Button(
                onClick = { showConfirmModal = true },
                enabled = recipients.isNotEmpty() && (smsCount > 0 || emailCount > 0),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp),
                colors = ButtonDefaults.buttonColors(containerColor = PulseColors.Primary),
                shape = RoundedCornerShape(10.dp)
            ) {
                Icon(Icons.Default.Send, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Preview & Dispatch (" + (smsCount + emailCount) + " Dispatches)",
                    fontWeight = FontWeight.Bold,
                    fontSize = 15.sp
                )
            }

            statusMessage?.let { msg ->
                Text(
                    text = msg,
                    color = PulseColors.Success,
                    fontSize = 13.sp,
                    modifier = Modifier.padding(top = 8.dp)
                )
            }
        }
    }

    // Confirmation Preview Modal
    if (showConfirmModal) {
        AlertDialog(
            onDismissRequest = { showConfirmModal = false },
            title = {
                Text(text = "Confirm Multi-Channel Dispatch", fontWeight = FontWeight.Bold, color = PulseColors.TextPrimary)
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(
                        text = "From: " + uiState.config.phoneNumber + " (SIM Gateway)",
                        fontSize = 12.sp,
                        color = PulseColors.Primary
                    )

                    if (hasEmail) {
                        Text(
                            text = "Subject: " + (if (subject.isBlank()) "Update from Pulse Sender" else subject),
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = PulseColors.TextPrimary
                        )
                    }

                    Text(
                        text = "Message: " + message,
                        fontSize = 12.sp,
                        color = PulseColors.TextSecondary,
                        modifier = Modifier
                            .background(PulseColors.Background, RoundedCornerShape(6.dp))
                            .padding(8.dp)
                    )

                    Text(
                        text = "Total " + recipients.size + " recipients: " + smsCount + " via SMS SIM, " + emailCount + " via SMTP Email.",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = PulseColors.TextPrimary
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        isSending = true
                        viewModel.dispatchBatch(
                            subject = if (hasEmail) subject else null,
                            message = message,
                            recipients = recipients,
                            saveToDirectory = saveToDirectory,
                            onResult = { ok, msg ->
                                isSending = false
                                showConfirmModal = false
                                if (ok) {
                                    statusMessage = msg
                                    recipients = emptyList()
                                } else {
                                    statusMessage = "Staged offline: " + msg
                                }
                            }
                        )
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = PulseColors.Primary)
                ) {
                    Text("Confirm & Send")
                }
            },
            dismissButton = {
                TextButton(onClick = { showConfirmModal = false }) {
                    Text("Cancel", color = PulseColors.TextMuted)
                }
            },
            containerColor = PulseColors.CardBg
        )
    }
}
