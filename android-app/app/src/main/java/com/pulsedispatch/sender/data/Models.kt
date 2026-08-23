package com.pulsedispatch.sender.data

import kotlinx.serialization.Serializable

enum class AppScreen {
    LOGIN,
    DASHBOARD,
    JOBS,
    ACTIVITY_LOG,
    SETTINGS,
    PROFILE,
    TICKET
}

enum class LogType {
    ALL,
    SUCCESS,
    ERROR,
    WARNING,
    INFO
}

enum class DateFilterOption {
    CURRENT_DATE,
    DATE_RANGE
}

data class DeviceConfig(
    val baseUrl: String = "http://10.0.2.2:4000",
    val email: String = "pulak@example.com",
    val name: String = "Pulak Ahmed",
    val deviceName: String = "Android Test Device",
    val phoneNumber: String = "+8801711000000",
    val operator: String = "Grameenphone",
    val deviceId: String = "",
    val heartbeatIntervalSeconds: Int = 30,
    val autoFetch: Boolean = false,
    val autoProcess: Boolean = false,
    val backgroundService: Boolean = true,
    val pushNotifications: Boolean = true,
    val autoFetchIntervalSeconds: Int = 15,
    val autoProcessIntervalSeconds: Int = 10,
)

data class UserProfile(
    val id: String = "usr_1",
    val name: String = "Pulak Ahmed",
    val email: String = "pulak@example.com",
    val dateOfBirth: String = "01 Jan 1995",
    val phone: String = "+880 1711-123456",
    val gender: String = "Male",
    val address: String = "Dhaka, Bangladesh",
    val role: String = "PRO",
    val avatarInitials: String = "PA"
)

data class SupportTicket(
    val id: String,
    val subject: String,
    val category: String,
    val priority: String, // Low, Medium, High
    val description: String,
    val status: String = "OPEN", // OPEN, IN_PROGRESS, CLOSED
    val timestamp: String
)

data class ActivityLogItem(
    val id: String,
    val type: LogType,
    val title: String,
    val detail: String,
    val timestampMillis: Long = System.currentTimeMillis(),
    val timeFormatted: String
)

data class ActivityLogFilter(
    val period: DateFilterOption = DateFilterOption.CURRENT_DATE,
    val fromTime: String = "12:00 AM",
    val toTime: String = "11:59 PM",
    val fromDateMillis: Long? = null,
    val toDateMillis: Long? = null,
    val activeType: LogType = LogType.ALL
)

@Serializable
data class LoginRequest(
    val email: String,
    val password: String
)

@Serializable
data class LoginResponse(
    val user: UserDto,
    val token: String? = null
)

@Serializable
data class ApiErrorResponse(
    val error: String? = null
)

@Serializable
data class UserDto(
    val id: String,
    val name: String,
    val email: String,
    val role: String
)

@Serializable
data class RegisterRequest(
    val email: String,
    val name: String,
    val deviceName: String,
    val phoneNumber: String,
    val operator: String
)

@Serializable
data class RegisterResponse(
    val device: MobileDeviceDto
)

@Serializable
data class MobileDeviceDto(
    val id: String,
    val deviceName: String,
    val phoneNumber: String,
    val operator: String,
    val status: String
)

@Serializable
data class HeartbeatRequest(
    val battery: String? = null,
    val queuedJobs: Int? = null
)

@Serializable
data class HeartbeatResponse(
    val ok: Boolean = true
)

@Serializable
data class JobsResponse(
    val jobs: List<SmsJobDto>
)

@Serializable
data class SmsJobDto(
    val id: String,
    val phoneNumber: String? = null,
    val customerName: String,
    val campaignName: String,
    val message: String,
    val status: String
)

@Serializable
data class JobResultRequest(
    val status: String,
    val detail: String
)

@Serializable
data class JobResultResponse(
    val ok: Boolean = true
)
