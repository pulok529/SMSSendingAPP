package com.pulsedispatch.sender.data

import android.content.Context
import com.jakewharton.retrofit2.converter.kotlinx.serialization.asConverterFactory
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.HttpException
import retrofit2.Retrofit
import java.net.ConnectException
import java.net.SocketTimeoutException
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.concurrent.TimeUnit

class AppRepository(context: Context) {
    private val prefs = context.getSharedPreferences("pulse_sender_prefs", Context.MODE_PRIVATE)
    private val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
        encodeDefaults = true
    }

    private val timeFormat = SimpleDateFormat("hh:mm:ss a", Locale.getDefault())
    private val dateFormat = SimpleDateFormat("dd MMM, yyyy", Locale.getDefault())

    // --- Authentication & Session Persistence ---

    fun isLoggedIn(): Boolean = prefs.getBoolean("is_logged_in", false)

    fun setLoggedIn(loggedIn: Boolean) {
        prefs.edit().putBoolean("is_logged_in", loggedIn).apply()
    }

    fun saveAuthToken(token: String?) {
        prefs.edit().putString("auth_token", token).apply()
    }

    fun getAuthToken(): String? = prefs.getString("auth_token", null)

    fun loadProfile(): UserProfile {
        val name = prefs.getString("profile_name", "").orEmpty()
        val email = prefs.getString("profile_email", "").orEmpty()
        val dob = prefs.getString("profile_dob", "").orEmpty()
        val phone = prefs.getString("profile_phone", "").orEmpty()
        val gender = prefs.getString("profile_gender", "Other").orEmpty()
        val address = prefs.getString("profile_address", "").orEmpty()
        val role = prefs.getString("profile_role", "CLIENT").orEmpty()

        val initials = name.split(" ")
            .filter { it.isNotBlank() }
            .take(2)
            .map { it.first().uppercase() }
            .joinToString("")
            .ifEmpty { "PS" }

        return UserProfile(
            name = name,
            email = email,
            dateOfBirth = dob,
            phone = phone,
            gender = gender,
            address = address,
            role = role,
            avatarInitials = initials
        )
    }

    fun saveProfile(profile: UserProfile) {
        prefs.edit()
            .putString("profile_name", profile.name)
            .putString("profile_email", profile.email)
            .putString("profile_dob", profile.dateOfBirth)
            .putString("profile_phone", profile.phone)
            .putString("profile_gender", profile.gender)
            .putString("profile_address", profile.address)
            .putString("profile_role", profile.role)
            .apply()
    }

    // --- Device Config Persistence ---

    fun loadConfig(): DeviceConfig =
        DeviceConfig(
            baseUrl = prefs.getString("baseUrl", "http://10.0.2.2:4000").orEmpty(),
            email = prefs.getString("email", "pulak@example.com").orEmpty(),
            name = prefs.getString("name", "Pulak Ahmed").orEmpty(),
            deviceName = prefs.getString("deviceName", "Android Gateway Device").orEmpty(),
            phoneNumber = prefs.getString("phoneNumber", "+8801711000000").orEmpty(),
            operator = prefs.getString("operator", "Grameenphone").orEmpty(),
            deviceId = prefs.getString("deviceId", "").orEmpty(),
            heartbeatIntervalSeconds = prefs.getInt("heartbeatIntervalSeconds", 30),
            autoFetch = prefs.getBoolean("autoFetch", false),
            autoProcess = prefs.getBoolean("autoProcess", false),
            backgroundService = prefs.getBoolean("backgroundService", true),
            pushNotifications = prefs.getBoolean("pushNotifications", true),
            autoFetchIntervalSeconds = prefs.getInt("autoFetchIntervalSeconds", 15),
            autoProcessIntervalSeconds = prefs.getInt("autoProcessIntervalSeconds", 10),
        )

    fun saveConfig(config: DeviceConfig) {
        prefs.edit()
            .putString("baseUrl", config.baseUrl)
            .putString("email", config.email)
            .putString("name", config.name)
            .putString("deviceName", config.deviceName)
            .putString("phoneNumber", config.phoneNumber)
            .putString("operator", config.operator)
            .putString("deviceId", config.deviceId)
            .putInt("heartbeatIntervalSeconds", config.heartbeatIntervalSeconds)
            .putBoolean("autoFetch", config.autoFetch)
            .putBoolean("autoProcess", config.autoProcess)
            .putBoolean("backgroundService", config.backgroundService)
            .putBoolean("pushNotifications", config.pushNotifications)
            .putInt("autoFetchIntervalSeconds", config.autoFetchIntervalSeconds)
            .putInt("autoProcessIntervalSeconds", config.autoProcessIntervalSeconds)
            .apply()
    }

    // --- Support Tickets Persistence ---

    fun loadCachedTickets(): List<SupportTicket> {
        val raw = prefs.getString("support_tickets", null)
        if (raw != null) {
            try {
                return json.decodeFromString(raw)
            } catch (_: Exception) {}
        }
        return emptyList()
    }

    fun saveCachedTickets(tickets: List<SupportTicket>) {
        try {
            prefs.edit().putString("support_tickets", json.encodeToString(tickets)).apply()
        } catch (_: Exception) {}
    }

    // --- Activity Logs Persistence ---

    fun loadCachedLogs(): List<ActivityLogItem> {
        val raw = prefs.getString("cached_logs", null)
        if (raw != null) {
            try {
                return json.decodeFromString(raw)
            } catch (_: Exception) {}
        }
        return emptyList()
    }

    fun saveCachedLogs(logs: List<ActivityLogItem>) {
        try {
            val trimmed = logs.take(100)
            prefs.edit().putString("cached_logs", json.encodeToString(trimmed)).apply()
        } catch (_: Exception) {}
    }

    fun cleanBaseUrl(url: String): String {
        var clean = url.trim()
        if (clean.isBlank()) return "http://10.0.2.2:4000/"
        if (!clean.startsWith("http://", ignoreCase = true) && !clean.startsWith("https://", ignoreCase = true)) {
            clean = "http://$clean"
        }
        return if (clean.endsWith("/")) clean else "$clean/"
    }

    private fun api(baseUrl: String): MobileApi {
        val logger = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BASIC
        }

        val client = OkHttpClient.Builder()
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(15, TimeUnit.SECONDS)
            .writeTimeout(15, TimeUnit.SECONDS)
            .addInterceptor { chain ->
                val original = chain.request()
                val builder = original.newBuilder()
                val token = getAuthToken()
                if (!token.isNullOrBlank()) {
                    builder.addHeader("Authorization", "Bearer $token")
                    builder.addHeader("Cookie", "pulse_auth_token=$token")
                }
                chain.proceed(builder.build())
            }
            .addInterceptor(logger)
            .build()

        val cleanUrl = cleanBaseUrl(baseUrl)

        return Retrofit.Builder()
            .baseUrl(cleanUrl)
            .client(client)
            .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
            .build()
            .create(MobileApi::class.java)
    }

    private fun parseError(e: HttpException, defaultMsg: String): String {
        val errorBody = e.response()?.errorBody()?.string()
        if (!errorBody.isNullOrBlank()) {
            try {
                val parsed = json.decodeFromString<ApiErrorResponse>(errorBody)
                if (!parsed.error.isNullOrBlank()) return parsed.error
            } catch (_: Exception) {}
        }
        return defaultMsg
    }

    suspend fun login(baseUrl: String, request: LoginRequest): LoginResponse {
        val cleanUrl = cleanBaseUrl(baseUrl)
        try {
            return api(cleanUrl).login(request)
        } catch (e: HttpException) {
            throw Exception(parseError(e, "Invalid email or password."))
        } catch (e: ConnectException) {
            throw Exception("Cannot reach server at $cleanUrl. Check internet connection and Gateway Server URL.")
        } catch (e: SocketTimeoutException) {
            throw Exception("Connection timed out reaching server at $cleanUrl.")
        } catch (e: java.net.UnknownHostException) {
            throw Exception("Server address not found. Please verify the Gateway Server URL.")
        } catch (e: Exception) {
            throw Exception(e.message ?: "Network error. Please check connection.")
        }
    }

    suspend fun fetchProfile(baseUrl: String): UserProfile {
        try {
            val response = api(baseUrl).getProfile()
            val user = response.user ?: throw Exception("No profile data returned")
            val initials = user.name.split(" ")
                .filter { it.isNotBlank() }
                .take(2)
                .map { it.first().uppercase() }
                .joinToString("")
                .ifEmpty { "PA" }

            val profile = UserProfile(
                id = user.id,
                name = user.name,
                email = user.email,
                company = user.company,
                dateOfBirth = user.dateOfBirth ?: "01 Jan 1995",
                phone = user.phone ?: "+880 1711-123456",
                gender = user.gender ?: "Male",
                address = user.address ?: "Dhaka, Bangladesh",
                role = user.role.uppercase(),
                isActive = user.isActive ?: true,
                avatarInitials = initials
            )
            saveProfile(profile)
            return profile
        } catch (e: HttpException) {
            throw Exception(parseError(e, "Failed to load profile."))
        }
    }

    suspend fun updateProfile(baseUrl: String, profile: UserProfile): UserProfile {
        try {
            val response = api(baseUrl).updateProfile(
                UpdateProfileRequest(
                    name = profile.name,
                    phone = profile.phone,
                    dateOfBirth = profile.dateOfBirth,
                    gender = profile.gender,
                    address = profile.address
                )
            )
            val user = response.user ?: throw Exception("Failed to update profile")
            val initials = user.name.split(" ")
                .filter { it.isNotBlank() }
                .take(2)
                .map { it.first().uppercase() }
                .joinToString("")
                .ifEmpty { "PA" }

            val updated = UserProfile(
                id = user.id,
                name = user.name,
                email = user.email,
                company = user.company ?: profile.company,
                dateOfBirth = user.dateOfBirth ?: profile.dateOfBirth,
                phone = user.phone ?: profile.phone,
                gender = user.gender ?: profile.gender,
                address = user.address ?: profile.address,
                role = user.role.uppercase(),
                isActive = user.isActive ?: true,
                avatarInitials = initials
            )
            saveProfile(updated)
            return updated
        } catch (e: HttpException) {
            throw Exception(parseError(e, "Failed to save profile changes."))
        }
    }

    suspend fun changePassword(baseUrl: String, oldPass: String, newPass: String): String {
        try {
            val response = api(baseUrl).changePassword(
                ChangePasswordRequest(
                    oldPassword = oldPass,
                    newPassword = newPass
                )
            )
            return response.message ?: "Password changed successfully."
        } catch (e: HttpException) {
            throw Exception(parseError(e, "Failed to change password."))
        }
    }

    suspend fun fetchStats(baseUrl: String): MobileStatsDto {
        return try {
            api(baseUrl).getStats()
        } catch (_: Exception) {
            MobileStatsDto()
        }
    }

    suspend fun register(config: DeviceConfig): RegisterResponse =
        api(config.baseUrl).register(
            RegisterRequest(
                email = config.email,
                name = config.name,
                deviceName = config.deviceName,
                phoneNumber = config.phoneNumber,
                operator = config.operator,
            )
        )

    suspend fun heartbeat(config: DeviceConfig, queueDepth: Int): HeartbeatResponse =
        api(config.baseUrl).heartbeat(
            deviceId = config.deviceId,
            request = HeartbeatRequest(
                battery = "100%",
                queuedJobs = queueDepth,
            )
        )

    suspend fun fetchJobs(config: DeviceConfig): List<SmsJobDto> =
        api(config.baseUrl).jobs(config.deviceId).jobs

    suspend fun reportResult(
        config: DeviceConfig,
        deliveryId: String,
        status: String,
        detail: String,
    ): JobResultResponse =
        api(config.baseUrl).sendResult(
            deliveryId = deliveryId,
            request = JobResultRequest(
                status = status,
                detail = detail,
            )
        )

    suspend fun fetchTickets(baseUrl: String): List<SupportTicket> {
        try {
            val res = api(baseUrl).getTickets()
            val list = res.tickets.map { t ->
                SupportTicket(
                    id = t.id,
                    subject = t.subject,
                    category = t.category,
                    priority = t.priority,
                    description = t.description,
                    status = t.status,
                    timestamp = formatTimestamp(t.timestamp)
                )
            }
            saveCachedTickets(list)
            return list
        } catch (_: Exception) {
            return loadCachedTickets()
        }
    }

    suspend fun createTicket(
        baseUrl: String,
        subject: String,
        category: String,
        priority: String,
        description: String
    ): SupportTicket {
        try {
            val res = api(baseUrl).createTicket(
                CreateTicketRequest(
                    subject = subject,
                    category = category,
                    priority = priority,
                    description = description
                )
            )
            val t = res.ticket
            val created = SupportTicket(
                id = t.id,
                subject = t.subject,
                category = t.category,
                priority = t.priority,
                description = t.description,
                status = t.status,
                timestamp = formatTimestamp(t.timestamp)
            )
            val current = loadCachedTickets().toMutableList()
            current.add(0, created)
            saveCachedTickets(current)
            return created
        } catch (e: HttpException) {
            throw Exception(parseError(e, "Failed to submit ticket."))
        }
    }

    suspend fun fetchLogs(baseUrl: String): List<ActivityLogItem> {
        try {
            val res = api(baseUrl).getLogs()
            val list = res.logs.map { l ->
                val typeEnum = try {
                    LogType.valueOf(l.type.uppercase())
                } catch (_: Exception) {
                    LogType.INFO
                }
                ActivityLogItem(
                    id = l.id,
                    type = typeEnum,
                    title = l.title,
                    detail = l.detail,
                    timestampMillis = l.timestampMillis,
                    timeFormatted = l.timeFormatted
                )
            }
            if (list.isNotEmpty()) {
                saveCachedLogs(list)
            }
            return list
        } catch (_: Exception) {
            return loadCachedLogs()
        }
    }

    suspend fun sendLog(baseUrl: String, type: LogType, title: String, detail: String, deviceId: String?) {
        try {
            api(baseUrl).sendLog(
                SendLogRequest(
                    type = type.name,
                    title = title,
                    detail = detail,
                    deviceId = deviceId
                )
            )
        } catch (_: Exception) {}
    }

    private fun formatTimestamp(isoString: String): String {
        return try {
            // e.g. 2026-08-24T04:37:49.352Z
            val parser = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
            parser.timeZone = java.util.TimeZone.getTimeZone("UTC")
            val date = parser.parse(isoString) ?: Date()
            val diffMs = System.currentTimeMillis() - date.time
            val diffMins = diffMs / (1000 * 60)
            val diffHours = diffMins / 60
            val diffDays = diffHours / 24

            when {
                diffMins < 1 -> "Just now"
                diffMins < 60 -> "$diffMins mins ago"
                diffHours < 24 -> "$diffHours hours ago"
                diffDays == 1L -> "Yesterday"
                else -> SimpleDateFormat("dd MMM, yyyy", Locale.getDefault()).format(date)
            }
        } catch (_: Exception) {
            "Recent"
        }
    }
}

