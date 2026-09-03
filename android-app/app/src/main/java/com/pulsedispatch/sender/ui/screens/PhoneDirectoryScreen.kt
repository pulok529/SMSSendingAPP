package com.pulsedispatch.sender.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.pulsedispatch.sender.MainViewModel
import com.pulsedispatch.sender.data.ContactDto
import com.pulsedispatch.sender.ui.components.PulseHeader
import com.pulsedispatch.sender.ui.theme.PulseColors

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PhoneDirectoryScreen(
    viewModel: MainViewModel,
    onMenuClick: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    var contacts by remember { mutableStateOf(listOf<ContactDto>()) }
    var searchQuery by remember { mutableStateOf("") }
    var loading by remember { mutableStateOf(true) }

    var showAddDialog by remember { mutableStateOf(false) }
    var newName by remember { mutableStateOf("") }
    var newPhone by remember { mutableStateOf("") }
    var newEmail by remember { mutableStateOf("") }

    val fetchDir = {
        loading = true
        viewModel.fetchDirectory { list ->
            contacts = list
            loading = false
        }
    }

    LaunchedEffect(Unit) {
        fetchDir()
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
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showAddDialog = true },
                containerColor = PulseColors.Primary
            ) {
                Icon(Icons.Default.Add, contentDescription = "Add Contact")
            }
        },
        containerColor = PulseColors.Background
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                label = { Text("Search by name, phone, or email...") },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                modifier = Modifier.fillMaxWidth(),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedTextColor = PulseColors.TextPrimary,
                    unfocusedTextColor = PulseColors.TextPrimary
                )
            )

            val filtered = contacts.filter {
                searchQuery.isEmpty() ||
                it.name.contains(searchQuery, ignoreCase = true) ||
                (it.contactNo?.contains(searchQuery) == true) ||
                (it.email?.contains(searchQuery, ignoreCase = true) == true)
            }

            if (loading) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = PulseColors.Primary)
                }
            } else if (filtered.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("No contacts in directory.", color = PulseColors.TextMuted)
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(filtered) { c ->
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = PulseColors.CardBg),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                Text(text = c.name, fontWeight = FontWeight.Bold, color = PulseColors.TextPrimary, fontSize = 15.sp)
                                if (!c.contactNo.isNullOrBlank()) {
                                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                        Icon(Icons.Default.Phone, contentDescription = null, tint = PulseColors.Primary, modifier = Modifier.size(14.dp))
                                        Text(text = c.contactNo ?: "", color = PulseColors.TextSecondary, fontSize = 13.sp)
                                    }
                                }
                                if (!c.email.isNullOrBlank()) {
                                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                        Icon(Icons.Default.Email, contentDescription = null, tint = PulseColors.Success, modifier = Modifier.size(14.dp))
                                        Text(text = c.email ?: "", color = PulseColors.TextSecondary, fontSize = 13.sp)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    if (showAddDialog) {
        AlertDialog(
            onDismissRequest = { showAddDialog = false },
            title = { Text("Add Contact to Directory", color = PulseColors.TextPrimary) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = newName,
                        onValueChange = { newName = it },
                        label = { Text("Name *") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = newPhone,
                        onValueChange = { newPhone = it },
                        label = { Text("Phone") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = newEmail,
                        onValueChange = { newEmail = it },
                        label = { Text("Email") },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (newName.isNotBlank()) {
                            viewModel.createContact(newName, if (newPhone.isBlank()) null else newPhone, if (newEmail.isBlank()) null else newEmail) {
                                showAddDialog = false
                                newName = ""
                                newPhone = ""
                                newEmail = ""
                                fetchDir()
                            }
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = PulseColors.Primary)
                ) {
                    Text("Save Contact")
                }
            },
            dismissButton = {
                TextButton(onClick = { showAddDialog = false }) {
                    Text("Cancel", color = PulseColors.TextMuted)
                }
            },
            containerColor = PulseColors.CardBg
        )
    }
}
