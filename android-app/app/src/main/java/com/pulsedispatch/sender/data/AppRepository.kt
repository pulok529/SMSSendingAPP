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
        val name = prefs.getString("profile_name", "Pulak Ahmed").orEmpty()
        val email = prefs.getString("profile_email", "pulak@example.com").orEmpty()
        val dob = prefs.getString("profile_dob", "01 Jan 1995").orEmpty()
        val phone = prefs.getString("profile_phone", "+880 1711-123456").orEmpty()
        val gender = prefs.getString("profile_gender", "Male").orEmpty()
        val address = prefs.getString("profile_address", "Dhaka, Bangladesh").orEmpty()
        val role = prefs.getString("profile_role", "ADMIN").orEmpty()

        val initials = name.split(" ")
            .filter { it.isNotBlank() }
            .take(2)
            .map { it.first().uppercase() }
            .joinToString("")
            .ifEmpty { "PA" }

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

    fun loadTickets(): List<SupportTicket> {
        val raw = prefs.getString("support_tickets", null)
        if (raw != null) {
            try {
                return json.decodeFromString(raw)
            } catch (_: Exception) {}
        }
        return listOf(
            SupportTicket(
                id = "#TKT-001",
                subject = "API Connection Timeout",
                category = "Connection Issue",
                priority = "Medium",
                description = "Experienced latency when fetching jobs during peak hours.",
                status = "OPEN",
                timestamp = "2 hours ago"
            ),
            SupportTicket(
                id = "#TKT-000",
                subject = "Initial Gateway Setup",
                category = "Account & Setup",
                priority = "Low",
                description = "Successfully configured SIM gateway parameters.",
                status = "CLOSED",
                timestamp = "Yesterday"
            )
        )
    }

    fun saveTicket(ticket: SupportTicket) {
        val current = loadTickets().toMutableList()
        current.add(0, ticket)
        try {
            prefs.edit().putString("support_tickets", json.encodeToString(current)).apply()
        } catch (_: Exception) {}
    }

    // --- Retrofit API Client ---

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

        val cleanUrl = if (baseUrl.endsWith("/")) baseUrl else "$baseUrl/"

        return Retrofit.Builder()
            .baseUrl(cleanUrl)
            .client(client)
            .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
            .build()
            .create(MobileApi::class.java)
    }

    suspend fun login(baseUrl: String, request: LoginRequest): LoginResponse {
        try {
            return api(baseUrl).login(request)
        } catch (e: HttpException) {
            val errorBody = e.response()?.errorBody()?.string()
            val message = if (!errorBody.isNullOrBlank()) {
                try {
                    val parsed = json.decodeFromString<ApiErrorResponse>(errorBody)
                    parsed.error
                } catch (_: Exception) {
                    null
                }
            } else null
            throw Exception(message ?: "Invalid email or password.")
        } catch (e: ConnectException) {
            throw Exception("Unable to reach API server at $baseUrl. Check network connection.")
        } catch (e: SocketTimeoutException) {
            throw Exception("Connection timed out reaching API server at $baseUrl.")
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
}
