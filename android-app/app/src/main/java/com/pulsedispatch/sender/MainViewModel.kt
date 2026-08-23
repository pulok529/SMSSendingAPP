package com.pulsedispatch.sender

import android.app.Application
import android.telephony.SmsManager
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.pulsedispatch.sender.data.AppRepository
import com.pulsedispatch.sender.data.DeviceConfig
import com.pulsedispatch.sender.data.SmsJobDto
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class MainUiState(
  val config: DeviceConfig = DeviceConfig(),
  val jobs: List<SmsJobDto> = emptyList(),
  val logs: List<String> = listOf("Open the app, register the device, then sync jobs."),
  val isLoading: Boolean = false,
  val status: String = "Idle",
)

class MainViewModel(application: Application) : AndroidViewModel(application) {
  private val repository = AppRepository(application)
  private val _uiState = MutableStateFlow(MainUiState(config = repository.loadConfig()))
  val uiState: StateFlow<MainUiState> = _uiState.asStateFlow()

  fun updateConfig(transform: (DeviceConfig) -> DeviceConfig) {
    val updated = transform(_uiState.value.config)
    repository.saveConfig(updated)
    _uiState.value = _uiState.value.copy(config = updated)
  }

  fun registerDevice() {
    viewModelScope.launch {
      runTask("Registering device") {
        val response = repository.register(uiState.value.config)
        val updated = uiState.value.config.copy(deviceId = response.device.id)
        repository.saveConfig(updated)
        _uiState.value = _uiState.value.copy(config = updated)
        appendLog("Device registered as ${response.device.deviceName} (${response.device.id}).")
      }
    }
  }

  fun sendHeartbeat() {
    viewModelScope.launch {
      runTask("Sending heartbeat") {
        val config = uiState.value.config
        require(config.deviceId.isNotBlank()) { "Register the device before sending heartbeat." }
        repository.heartbeat(config, uiState.value.jobs.size)
        appendLog("Heartbeat sent for device ${config.deviceId}.")
      }
    }
  }

  fun refreshJobs() {
    viewModelScope.launch {
      runTask("Fetching jobs") {
        val config = uiState.value.config
        require(config.deviceId.isNotBlank()) { "Register the device before fetching jobs." }
        val jobs = repository.fetchJobs(config)
        _uiState.value = _uiState.value.copy(jobs = jobs)
        appendLog("Loaded ${jobs.size} SMS job(s) from backend.")
      }
    }
  }

  fun processJobs() {
    viewModelScope.launch {
      runTask("Processing jobs") {
        val config = uiState.value.config
        require(config.deviceId.isNotBlank()) { "Register the device before processing jobs." }

        if (uiState.value.jobs.isEmpty()) {
          appendLog("No jobs available to process.")
          return@runTask
        }

        uiState.value.jobs.forEach { job ->
          processSingleJob(config, job)
        }

        val refreshed = repository.fetchJobs(config)
        _uiState.value = _uiState.value.copy(jobs = refreshed)
        appendLog("Queue processing complete. Remaining jobs: ${refreshed.size}.")
      }
    }
  }

  private suspend fun processSingleJob(config: DeviceConfig, job: SmsJobDto) {
    val phoneNumber = job.phoneNumber

    if (phoneNumber.isNullOrBlank()) {
      repository.reportResult(
        config = config,
        deliveryId = job.id,
        status = "FAILED",
        detail = "Missing phone number for ${job.customerName}.",
      )
      appendLog("Failed ${job.customerName}: missing phone number.")
      return
    }

    if (config.simulateSends) {
      delay(300)
      repository.reportResult(
        config = config,
        deliveryId = job.id,
        status = "SENT",
        detail = "Simulated Android send completed for $phoneNumber.",
      )
      appendLog("Simulated send to ${job.customerName} at $phoneNumber.")
      return
    }

    try {
      val smsManager = SmsManager.getDefault()
      smsManager.sendTextMessage(phoneNumber, null, job.message, null, null)
      repository.reportResult(
        config = config,
        deliveryId = job.id,
        status = "SENT",
        detail = "SmsManager accepted message for $phoneNumber.",
      )
      appendLog("Live SMS submitted to ${job.customerName} at $phoneNumber.")
    } catch (error: Exception) {
      repository.reportResult(
        config = config,
        deliveryId = job.id,
        status = "FAILED",
        detail = error.message ?: "Unknown SMS failure",
      )
      appendLog("Live SMS failed for ${job.customerName}: ${error.message}.")
    }
  }

  private suspend fun runTask(status: String, block: suspend () -> Unit) {
    _uiState.value = _uiState.value.copy(isLoading = true, status = status)

    try {
      block()
      _uiState.value = _uiState.value.copy(isLoading = false, status = "Ready")
    } catch (error: Exception) {
      appendLog("Error: ${error.message}")
      _uiState.value = _uiState.value.copy(isLoading = false, status = "Needs attention")
    }
  }

  private fun appendLog(message: String) {
    _uiState.value = _uiState.value.copy(logs = listOf(message) + _uiState.value.logs)
  }
}
