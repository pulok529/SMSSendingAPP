package com.pulsedispatch.sender

import android.app.Application
import android.content.Intent
import android.os.Build
import android.telephony.SmsManager
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.pulsedispatch.sender.data.ActivityLogItem
import com.pulsedispatch.sender.data.AppRepository
import com.pulsedispatch.sender.data.AppScreen
import com.pulsedispatch.sender.data.DeviceConfig
import com.pulsedispatch.sender.data.LogType
import com.pulsedispatch.sender.data.LoginRequest
import com.pulsedispatch.sender.data.SmsJobDto
import com.pulsedispatch.sender.data.SupportTicket
import com.pulsedispatch.sender.data.UserProfile
import com.pulsedispatch.sender.service.PulseBackgroundService
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

data class MainUiState(
    val currentScreen: AppScreen = AppScreen.LOGIN,
    val isSideMenuOpen: Boolean = false,
    val isLoggedIn: Boolean = false,
    val loginLoading: Boolean = false,
    val loginError: String? = null,
    val profile: UserProfile = UserProfile(),
    val config: DeviceConfig = DeviceConfig(),
    val jobs: List<SmsJobDto> = emptyList(),
    val logs: List<ActivityLogItem> = emptyList(),
    val tickets: List<SupportTicket> = emptyList(),
    val isOnline: Boolean = false,
    val isConnecting: Boolean = false,
    val isFetching: Boolean = false,
    val isProcessing: Boolean = false,
    val sentToday: Int = 0,
    val failedToday: Int = 0
)

class MainViewModel(application: Application) : AndroidViewModel(application) {
    private val repository = AppRepository(application)
    private val timeFormat = SimpleDateFormat("hh:mm:ss a", Locale.getDefault())

    private val _uiState = MutableStateFlow(
        MainUiState(
            isLoggedIn = repository.isLoggedIn(),
            currentScreen = if (repository.isLoggedIn()) AppScreen.DASHBOARD else AppScreen.LOGIN,
            profile = repository.loadProfile(),
            config = repository.loadConfig(),
            tickets = repository.loadTickets(),
            logs = createInitialLogs()
        )
    )
    val uiState: StateFlow<MainUiState> = _uiState.asStateFlow()

    private var autoFetchJob: Job? = null

    init {
        if (_uiState.value.isLoggedIn) {
            refreshConnection()
            startBackgroundServiceIfEnabled()
            startAutomationLoops()
        }
    }

    private fun createInitialLogs(): List<ActivityLogItem> {
        val now = System.currentTimeMillis()
        val timeStr = timeFormat.format(Date(now))
        return listOf(
            ActivityLogItem(
                id = "log_init_1",
                type = LogType.SUCCESS,
                title = "Pulse Sender Initialized",
                detail = "Gateway client ready for live cellular dispatch.",
                timestampMillis = now,
                timeFormatted = timeStr
            ),
            ActivityLogItem(
                id = "log_init_2",
                type = LogType.INFO,
                title = "Device Ready",
                detail = "SIM radio interface and SMSManager online.",
                timestampMillis = now - 1000,
                timeFormatted = timeFormat.format(Date(now - 1000))
            )
        )
    }

    // --- Navigation & Drawer ---

    fun navigateTo(screen: AppScreen) {
        _uiState.value = _uiState.value.copy(currentScreen = screen, isSideMenuOpen = false)
    }

    fun openSideMenu() {
        _uiState.value = _uiState.value.copy(isSideMenuOpen = true)
    }

    fun closeSideMenu() {
        _uiState.value = _uiState.value.copy(isSideMenuOpen = false)
    }

    // --- Web App API Authentication ---

    fun login(email: String, pass: String, serverUrl: String? = null) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(loginLoading = true, loginError = null)
            try {
                val urlToUse = serverUrl?.trim()?.ifBlank { null } ?: _uiState.value.config.baseUrl
                val updatedConfig = _uiState.value.config.copy(baseUrl = urlToUse, email = email)
                repository.saveConfig(updatedConfig)
                _uiState.value = _uiState.value.copy(config = updatedConfig)

                // 1. Authenticate with Web App API
                val res = repository.login(urlToUse, LoginRequest(email = email.trim(), password = pass))
                repository.saveAuthToken(res.token)

                // 2. Extract profile details returned by API
                val nameInitials = res.user.name.split(" ")
                    .filter { it.isNotBlank() }
                    .take(2)
                    .map { it.first().uppercase() }
                    .joinToString("")
                    .ifEmpty { "PA" }

                val updatedProfile = _uiState.value.profile.copy(
                    id = res.user.id,
                    name = res.user.name,
                    email = res.user.email,
                    role = res.user.role.uppercase(),
                    avatarInitials = nameInitials
                )
                repository.saveProfile(updatedProfile)
                repository.setLoggedIn(true)

                _uiState.value = _uiState.value.copy(
                    profile = updatedProfile,
                    isLoggedIn = true,
                    loginLoading = false,
                    loginError = null,
                    currentScreen = AppScreen.DASHBOARD
                )

                appendLog(LogType.SUCCESS, "Web App API Login", "Authenticated as ${res.user.name} (${res.user.email})")

                // 3. Register device and sync with Web App Gateway
                refreshConnection()
                startBackgroundServiceIfEnabled()
                startAutomationLoops()
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    loginLoading = false,
                    loginError = e.message ?: "Authentication failed."
                )
                appendLog(LogType.ERROR, "Login Failed", e.message ?: "Unknown authentication error")
            }
        }
    }

    fun logout() {
        repository.setLoggedIn(false)
        repository.saveAuthToken(null)
        _uiState.value = _uiState.value.copy(
            isLoggedIn = false,
            currentScreen = AppScreen.LOGIN,
            isSideMenuOpen = false
        )
        appendLog(LogType.INFO, "User Logged Out", "Session ended.")
    }

    // --- Connection & Gateway ---

    fun refreshConnection() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isConnecting = true)
            try {
                val config = _uiState.value.config
                if (config.deviceId.isBlank()) {
                    val regResponse = repository.register(config)
                    val updated = config.copy(deviceId = regResponse.device.id)
                    repository.saveConfig(updated)
                    _uiState.value = _uiState.value.copy(config = updated)
                }

                repository.heartbeat(_uiState.value.config, _uiState.value.jobs.size)
                val freshJobs = repository.fetchJobs(_uiState.value.config)

                _uiState.value = _uiState.value.copy(
                    isOnline = true,
                    isConnecting = false,
                    jobs = freshJobs
                )
                appendLog(LogType.SUCCESS, "Connection Established", "Online and synced with backend gateway.")
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isOnline = false,
                    isConnecting = false
                )
                appendLog(LogType.ERROR, "Connection Error", e.message ?: "Failed to reach server.")
            }
        }
    }

    fun registerDevice() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isConnecting = true)
            try {
                val response = repository.register(_uiState.value.config)
                val updated = _uiState.value.config.copy(deviceId = response.device.id)
                repository.saveConfig(updated)
                _uiState.value = _uiState.value.copy(
                    config = updated,
                    isOnline = true,
                    isConnecting = false
                )
                appendLog(LogType.SUCCESS, "Device Registered", "Registered device ${response.device.deviceName} (${response.device.id})")
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(isConnecting = false)
                appendLog(LogType.ERROR, "Registration Failed", e.message ?: "Registration error")
            }
        }
    }

    fun sendHeartbeat() {
        viewModelScope.launch {
            try {
                val config = _uiState.value.config
                require(config.deviceId.isNotBlank()) { "Please register the device first." }
                repository.heartbeat(config, _uiState.value.jobs.size)
                _uiState.value = _uiState.value.copy(isOnline = true)
                appendLog(LogType.INFO, "Heartbeat Sent", "Ping acknowledged by server.")
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(isOnline = false)
                appendLog(LogType.WARNING, "Heartbeat Timeout", e.message ?: "Server unreachable")
            }
        }
    }

    // --- SMS Jobs & Queue Processing ---

    fun fetchJobs() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isFetching = true)
            try {
                val config = _uiState.value.config
                if (config.deviceId.isBlank()) {
                    registerDevice()
                }
                val jobs = repository.fetchJobs(_uiState.value.config)
                _uiState.value = _uiState.value.copy(
                    jobs = jobs,
                    isFetching = false,
                    isOnline = true
                )
                appendLog(LogType.INFO, "Fetched SMS Jobs", "Loaded ${jobs.size} job(s) from server.")
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(isFetching = false)
                appendLog(LogType.ERROR, "Job Fetch Failed", e.message ?: "Network error fetching jobs.")
            }
        }
    }

    fun processQueue() {
        viewModelScope.launch {
            val jobs = _uiState.value.jobs
            if (jobs.isEmpty()) {
                appendLog(LogType.INFO, "Queue Empty", "No jobs to process.")
                return@launch
            }

            _uiState.value = _uiState.value.copy(isProcessing = true)
            val config = _uiState.value.config

            jobs.forEach { job ->
                processSingleJob(config, job)
            }

            // Refresh jobs after processing
            try {
                val refreshed = repository.fetchJobs(config)
                _uiState.value = _uiState.value.copy(jobs = refreshed, isProcessing = false)
                appendLog(LogType.SUCCESS, "Queue Complete", "Finished processing queue. ${refreshed.size} remaining.")
            } catch (_: Exception) {
                _uiState.value = _uiState.value.copy(isProcessing = false)
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
                detail = "Missing phone number for ${job.customerName}."
            )
            _uiState.value = _uiState.value.copy(failedToday = _uiState.value.failedToday + 1)
            appendLog(LogType.ERROR, "Delivery Failed", "Missing phone number for ${job.customerName}")
            return
        }

        try {
            val smsManager = SmsManager.getDefault()
            smsManager.sendTextMessage(phoneNumber, null, job.message, null, null)

            repository.reportResult(
                config = config,
                deliveryId = job.id,
                status = "SENT",
                detail = "Live SMS accepted by cellular modem for $phoneNumber"
            )
            _uiState.value = _uiState.value.copy(sentToday = _uiState.value.sentToday + 1)
            appendLog(LogType.SUCCESS, "SMS Sent", "Delivered to ${job.customerName} ($phoneNumber)")
        } catch (e: Exception) {
            repository.reportResult(
                config = config,
                deliveryId = job.id,
                status = "FAILED",
                detail = e.message ?: "SMS failure"
            )
            _uiState.value = _uiState.value.copy(failedToday = _uiState.value.failedToday + 1)
            appendLog(LogType.ERROR, "SMS Dispatch Error", "Failed sending to $phoneNumber: ${e.message}")
        }
    }

    // --- Profile, Config & Tickets ---

    fun updateProfile(profile: UserProfile) {
        repository.saveProfile(profile)
        _uiState.value = _uiState.value.copy(profile = profile)
        appendLog(LogType.INFO, "Profile Updated", "Personal info saved.")
    }

    fun updateConfig(config: DeviceConfig) {
        repository.saveConfig(config)
        _uiState.value = _uiState.value.copy(config = config)
        appendLog(LogType.INFO, "Settings Saved", "Gateway parameters updated.")
        startAutomationLoops()
    }

    fun submitTicket(ticket: SupportTicket) {
        repository.saveTicket(ticket)
        val updatedList = listOf(ticket) + _uiState.value.tickets
        _uiState.value = _uiState.value.copy(tickets = updatedList)
        appendLog(LogType.INFO, "Ticket Created", "${ticket.id} (${ticket.subject}) submitted.")
    }

    // --- Automation & Background Loops ---

    private fun startAutomationLoops() {
        autoFetchJob?.cancel()
        autoFetchJob = viewModelScope.launch {
            while (isActive) {
                val config = _uiState.value.config
                if (config.autoFetch && _uiState.value.isLoggedIn && config.deviceId.isNotBlank()) {
                    try {
                        val jobs = repository.fetchJobs(config)
                        _uiState.value = _uiState.value.copy(jobs = jobs)
                        if (config.autoProcess && jobs.isNotEmpty()) {
                            processQueue()
                        }
                    } catch (_: Exception) {}
                }
                delay(config.autoFetchIntervalSeconds * 1000L)
            }
        }
    }

    private fun startBackgroundServiceIfEnabled() {
        if (_uiState.value.config.backgroundService) {
            val app = getApplication<Application>()
            val intent = Intent(app, PulseBackgroundService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                app.startForegroundService(intent)
            } else {
                app.startService(intent)
            }
        }
    }

    private fun appendLog(type: LogType, title: String, detail: String) {
        val now = System.currentTimeMillis()
        val item = ActivityLogItem(
            id = "log_${now}_${(100..999).random()}",
            type = type,
            title = title,
            detail = detail,
            timestampMillis = now,
            timeFormatted = timeFormat.format(Date(now))
        )
        _uiState.value = _uiState.value.copy(logs = listOf(item) + _uiState.value.logs)
    }
}
