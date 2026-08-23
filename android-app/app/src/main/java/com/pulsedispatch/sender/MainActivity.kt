package com.pulsedispatch.sender

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import kotlin.OptIn

class MainActivity : ComponentActivity() {
  private val viewModel: MainViewModel by viewModels()

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    enableEdgeToEdge()

    setContent {
      val uiState by viewModel.uiState.collectAsState()

      MaterialTheme {
        PulseSenderApp(
          uiState = uiState,
          onBaseUrlChange = { viewModel.updateConfig { config -> config.copy(baseUrl = it) } },
          onEmailChange = { viewModel.updateConfig { config -> config.copy(email = it) } },
          onNameChange = { viewModel.updateConfig { config -> config.copy(name = it) } },
          onDeviceNameChange = { viewModel.updateConfig { config -> config.copy(deviceName = it) } },
          onPhoneNumberChange = { viewModel.updateConfig { config -> config.copy(phoneNumber = it) } },
          onOperatorChange = { viewModel.updateConfig { config -> config.copy(operator = it) } },
          onSimulateChange = { viewModel.updateConfig { config -> config.copy(simulateSends = it) } },
          onRegister = viewModel::registerDevice,
          onHeartbeat = viewModel::sendHeartbeat,
          onRefresh = viewModel::refreshJobs,
          onProcess = viewModel::processJobs,
        )
      }
    }
  }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun PulseSenderApp(
  uiState: MainUiState,
  onBaseUrlChange: (String) -> Unit,
  onEmailChange: (String) -> Unit,
  onNameChange: (String) -> Unit,
  onDeviceNameChange: (String) -> Unit,
  onPhoneNumberChange: (String) -> Unit,
  onOperatorChange: (String) -> Unit,
  onSimulateChange: (Boolean) -> Unit,
  onRegister: () -> Unit,
  onHeartbeat: () -> Unit,
  onRefresh: () -> Unit,
  onProcess: () -> Unit,
) {
  val context = LocalContext.current
  val smsPermissionLauncher = rememberLauncherForActivityResult(
    ActivityResultContracts.RequestPermission()
  ) { }

  val hasSmsPermission = ContextCompat.checkSelfPermission(
    context,
    Manifest.permission.SEND_SMS
  ) == PackageManager.PERMISSION_GRANTED

  Scaffold(
    topBar = {
      TopAppBar(
        title = {
          Column {
            Text("Pulse Sender")
            Text(
              text = uiState.status,
              style = MaterialTheme.typography.labelMedium,
              color = MaterialTheme.colorScheme.primary,
            )
          }
        },
        colors = TopAppBarDefaults.topAppBarColors(
          containerColor = Color(0xFFF5E8D8),
          titleContentColor = Color(0xFF3A2618),
        ),
      )
    }
  ) { padding ->
    Box(
      modifier = Modifier
        .fillMaxSize()
        .background(
          Brush.verticalGradient(
            colors = listOf(Color(0xFFF7F3EA), Color(0xFFE8F0EC))
          )
        )
        .padding(padding)
    ) {
      LazyColumn(
        modifier = Modifier
          .fillMaxSize()
          .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
      ) {
        item {
          SummaryCard(
            title = "Test-phase Android companion",
            body = "Register this device, pull SMS jobs from the backend, and either simulate delivery on emulator or submit real SMS through the phone SIM."
          )
        }

        item {
          ConfigCard(
            uiState = uiState,
            onBaseUrlChange = onBaseUrlChange,
            onEmailChange = onEmailChange,
            onNameChange = onNameChange,
            onDeviceNameChange = onDeviceNameChange,
            onPhoneNumberChange = onPhoneNumberChange,
            onOperatorChange = onOperatorChange,
            onSimulateChange = onSimulateChange,
          )
        }

        item {
          SummaryCard(
            title = "Device registration",
            body = if (uiState.config.deviceId.isBlank()) {
              "No device registered yet."
            } else {
              "Registered device id: ${uiState.config.deviceId}"
            }
          )
        }

        item {
          Card(
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.92f)),
          ) {
            Column(
              modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
              verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
              Text("Controls", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)

              if (!uiState.config.simulateSends && !hasSmsPermission) {
                Button(
                  onClick = {
                    smsPermissionLauncher.launch(Manifest.permission.SEND_SMS)
                  }
                ) {
                  Text("Grant SMS permission")
                }
              }

              Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Button(onClick = onRegister, enabled = !uiState.isLoading) {
                  Text("Register")
                }
                Button(onClick = onHeartbeat, enabled = !uiState.isLoading) {
                  Text("Heartbeat")
                }
              }

              Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Button(onClick = onRefresh, enabled = !uiState.isLoading) {
                  Text("Fetch jobs")
                }
                Button(onClick = onProcess, enabled = !uiState.isLoading) {
                  Text("Process queue")
                }
              }
            }
          }
        }

        item {
          SummaryCard(
            title = "Pending jobs",
            body = "${uiState.jobs.size} job(s) currently loaded in the device queue."
          )
        }

        items(uiState.jobs, key = { it.id }) { job ->
          JobCard(job = job)
        }

        item {
          LogCard(logs = uiState.logs)
        }
      }

      if (uiState.isLoading) {
        Box(
          modifier = Modifier
            .fillMaxSize()
            .background(Color.Black.copy(alpha = 0.12f)),
          contentAlignment = Alignment.Center,
        ) {
          CircularProgressIndicator(
            modifier = Modifier.size(48.dp),
            color = Color(0xFF8D5A2B),
          )
        }
      }
    }
  }
}

@Composable
private fun ConfigCard(
  uiState: MainUiState,
  onBaseUrlChange: (String) -> Unit,
  onEmailChange: (String) -> Unit,
  onNameChange: (String) -> Unit,
  onDeviceNameChange: (String) -> Unit,
  onPhoneNumberChange: (String) -> Unit,
  onOperatorChange: (String) -> Unit,
  onSimulateChange: (Boolean) -> Unit,
) {
  Card(
    shape = RoundedCornerShape(24.dp),
    colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.92f)),
  ) {
    Column(
      modifier = Modifier
        .fillMaxWidth()
        .padding(16.dp),
      verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
      Text("Connection settings", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
      OutlinedTextField(
        value = uiState.config.baseUrl,
        onValueChange = onBaseUrlChange,
        label = { Text("Backend URL") },
        modifier = Modifier.fillMaxWidth(),
      )
      OutlinedTextField(
        value = uiState.config.email,
        onValueChange = onEmailChange,
        label = { Text("User email") },
        modifier = Modifier.fillMaxWidth(),
      )
      OutlinedTextField(
        value = uiState.config.name,
        onValueChange = onNameChange,
        label = { Text("User name") },
        modifier = Modifier.fillMaxWidth(),
      )
      OutlinedTextField(
        value = uiState.config.deviceName,
        onValueChange = onDeviceNameChange,
        label = { Text("Device name") },
        modifier = Modifier.fillMaxWidth(),
      )
      OutlinedTextField(
        value = uiState.config.phoneNumber,
        onValueChange = onPhoneNumberChange,
        label = { Text("Phone number") },
        modifier = Modifier.fillMaxWidth(),
      )
      OutlinedTextField(
        value = uiState.config.operator,
        onValueChange = onOperatorChange,
        label = { Text("Operator") },
        modifier = Modifier.fillMaxWidth(),
      )
      Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
      ) {
        Column {
          Text("Simulate sends", fontWeight = FontWeight.SemiBold)
          Text(
            "Keep this on for emulator and first backend testing.",
            style = MaterialTheme.typography.bodySmall,
          )
        }
        Switch(
          checked = uiState.config.simulateSends,
          onCheckedChange = onSimulateChange,
        )
      }
    }
  }
}

@Composable
private fun SummaryCard(title: String, body: String) {
  Card(
    shape = RoundedCornerShape(24.dp),
    colors = CardDefaults.cardColors(containerColor = Color(0xFF2E473B)),
  ) {
    Column(
      modifier = Modifier
        .fillMaxWidth()
        .padding(18.dp),
      verticalArrangement = Arrangement.spacedBy(6.dp),
    ) {
      Text(title, color = Color(0xFFF8F1E7), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
      Text(body, color = Color(0xFFD8E4DE))
    }
  }
}

@Composable
private fun JobCard(job: com.pulsedispatch.sender.data.SmsJobDto) {
  Card(
    shape = RoundedCornerShape(20.dp),
    colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.95f)),
  ) {
    Column(
      modifier = Modifier
        .fillMaxWidth()
        .padding(16.dp),
      verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
      Text(job.customerName, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
      Text(job.campaignName, color = Color(0xFF6F5A45))
      Text(job.phoneNumber ?: "No number provided", color = Color(0xFF8D5A2B))
      Text(job.message)
      Text("Status: ${job.status}", style = MaterialTheme.typography.labelLarge)
    }
  }
}

@Composable
private fun LogCard(logs: List<String>) {
  Card(
    shape = RoundedCornerShape(24.dp),
    colors = CardDefaults.cardColors(containerColor = Color(0xFFFAFAFA)),
  ) {
    Column(
      modifier = Modifier
        .fillMaxWidth()
        .padding(16.dp),
      verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
      Text("Activity log", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
      logs.take(12).forEach { log ->
        Text(log)
      }
    }
  }
}
