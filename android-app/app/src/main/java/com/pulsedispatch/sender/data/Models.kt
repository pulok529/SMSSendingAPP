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
    val email: String = "",
    val name: String = "",
    val deviceName: String = "Android Gateway Phone",
    val phoneNumber: String = "",
    val operator: String = "SIM",
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
    val id: String = "",
    val name: String = "",
    val email: String = "",
    val company: String? = null,
    val dateOfBirth: String = "",
    val phone: String = "",
    val gender: String = "Other",
    val address: String = "",
    val role: String = "CLIENT",
    val isActive: Boolean = true,
    val avatarInitials: String = "PS"
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
    val role: String,
    val company: String? = null,
    val isActive: Boolean? = true,
    val phone: String? = null
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

@Serializable
data class UserProfileDto(
    val id: String,
    val name: String,
    val email: String,
    val role: String,
    val company: String? = null,
    val isActive: Boolean? = true,
    val phone: String? = null,
    val dateOfBirth: String? = null,
    val gender: String? = null,
    val address: String? = null,
    val createdAt: String? = null
)

@Serializable
data class ProfileResponse(
    val user: UserProfileDto? = null,
    val ok: Boolean? = true
)

@Serializable
data class UpdateProfileRequest(
    val name: String? = null,
    val phone: String? = null,
    val dateOfBirth: String? = null,
    val gender: String? = null,
    val address: String? = null
)

@Serializable
data class ChangePasswordRequest(
    val oldPassword: String,
    val newPassword: String
)

@Serializable
data class ChangePasswordResponse(
    val ok: Boolean = true,
    val message: String? = null
)

@Serializable
data class MobileStatsDto(
    val sentToday: Int = 0,
    val pending: Int = 0,
    val failedToday: Int = 0
)

@Serializable
data class SupportTicketDto(
    val id: String,
    val subject: String,
    val category: String,
    val priority: String,
    val description: String,
    val status: String,
    val timestamp: String
)

@Serializable
data class TicketsResponse(
    val tickets: List<SupportTicketDto> = emptyList()
)

@Serializable
data class CreateTicketRequest(
    val subject: String,
    val category: String,
    val priority: String,
    val description: String
)

@Serializable
data class CreateTicketResponse(
    val ok: Boolean = true,
    val ticket: SupportTicketDto
)

@Serializable
data class MobileLogDto(
    val id: String,
    val type: String,
    val title: String,
    val detail: String,
    val timestampMillis: Long,
    val timeFormatted: String
)

@Serializable
data class LogsResponse(
    val logs: List<MobileLogDto> = emptyList()
)

@Serializable
data class SendLogRequest(
    val type: String,
    val title: String,
    val detail: String,
    val deviceId: String? = null
)
