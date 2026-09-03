package com.pulsedispatch.sender.data

import kotlinx.serialization.Serializable

enum class AppScreen {
    LOGIN,
    DASHBOARD,
    DISPATCH,
    DIRECTORY,
    GROUPS,
    MESSAGES,
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
    val priority: String,
    val description: String,
    val status: String = "OPEN",
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
    val error: String? = null,
    val message: String? = null
)

@Serializable
data class UserDto(
    val id: String = "",
    val name: String = "",
    val email: String = "",
    val role: String = "CLIENT",
    val company: String? = null,
    val phone: String? = null,
    val dateOfBirth: String? = null,
    val gender: String? = null,
    val address: String? = null,
    val isActive: Boolean = true
)

@Serializable
data class ProfileResponse(
    val user: UserDto
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
    val ok: Boolean = true,
    val device: DeviceDto
)

@Serializable
data class DeviceDto(
    val id: String,
    val userId: String,
    val deviceName: String,
    val phoneNumber: String,
    val operator: String,
    val status: String,
    val queuedJobs: Int = 0,
    val battery: String? = null,
    val lastSeenAt: String? = null
)

@Serializable
data class HeartbeatRequest(
    val battery: String? = null,
    val queuedJobs: Int? = null
)

@Serializable
data class HeartbeatResponse(
    val ok: Boolean = true,
    val device: DeviceDto? = null
)

@Serializable
data class JobsResponse(
    val count: Int = 0,
    val jobs: List<SmsJobDto> = emptyList()
)

@Serializable
data class SmsJobDto(
    val id: String = "",
    val phoneNumber: String = "",
    val message: String = "",
    val createdAt: String = "",
    val customerName: String? = null,
    val campaignName: String? = null,
    val status: String = "PENDING"
)

typealias PendingJobDto = SmsJobDto

@Serializable
data class JobResultRequest(
    val status: String,
    val detail: String
)

@Serializable
data class JobResultResponse(
    val ok: Boolean = true,
    val delivery: DeliveryDto? = null
)

@Serializable
data class DeliveryDto(
    val id: String,
    val status: String,
    val detail: String,
    val timestamp: String? = null
)

@Serializable
data class UpdateProfileRequest(
    val name: String,
    val company: String? = null,
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

// === NEW MULTI-CHANNEL DISPATCH & DIRECTORY MODELS ===

@Serializable
data class ContactDto(
    val id: String = "",
    val name: String = "",
    val contactNo: String? = null,
    val email: String? = null,
    val others: String? = null,
    val createdAt: String? = null
)

@Serializable
data class DirectoryResponse(
    val contacts: List<ContactDto> = emptyList()
)

@Serializable
data class CreateContactRequest(
    val name: String,
    val contactNo: String? = null,
    val email: String? = null,
    val others: String? = null
)

@Serializable
data class CreateContactResponse(
    val ok: Boolean = true,
    val contact: ContactDto? = null,
    val alreadyExisted: Boolean = false
)

@Serializable
data class GroupDto(
    val id: String = "",
    val name: String = "",
    val details: String? = null,
    val code: String? = null,
    val rank: Int? = null
)

@Serializable
data class GroupsResponse(
    val ranked: List<GroupDto> = emptyList(),
    val general: List<GroupDto> = emptyList(),
    val all: List<GroupDto> = emptyList()
)

@Serializable
data class GroupMembersResponse(
    val contacts: List<ContactDto> = emptyList(),
    val total: Int = 0
)

@Serializable
data class MessageTemplateDto(
    val id: String = "",
    val title: String? = null,
    val subject: String? = null,
    val body: String = "",
    val channel: String = "SMS",
    val type: String = "MANUAL",
    val version: Int = 1,
    val createdAt: String? = null
)

@Serializable
data class MessagesResponse(
    val auto: List<MessageTemplateDto> = emptyList(),
    val manual: List<MessageTemplateDto> = emptyList()
)

@Serializable
data class DispatchRecipientDto(
    val name: String = "Valued Contact",
    val phone: String? = null,
    val email: String? = null,
    val company: String? = null,
    val sendSms: Boolean = true,
    val sendEmail: Boolean = false
)

@Serializable
data class DispatchBatchRequest(
    val name: String? = null,
    val subject: String? = null,
    val message: String,
    val recipients: List<DispatchRecipientDto>,
    val saveToDirectory: Boolean = true,
    val scheduledAt: String? = null
)

@Serializable
data class DispatchBatchResponse(
    val ok: Boolean = true,
    val campaignId: String? = null,
    val queuedCount: Int = 0,
    val smsCount: Int = 0,
    val emailCount: Int = 0,
    val message: String? = null
)

@Serializable
data class StagedDispatch(
    val name: String? = null,
    val subject: String? = null,
    val message: String,
    val recipients: List<DispatchRecipientDto>,
    val saveToDirectory: Boolean = true,
    val scheduledAt: String? = null
)

@Serializable
data class OfflineSyncRequest(
    val stagedDispatches: List<StagedDispatch> = emptyList(),
    val stagedContacts: List<ContactDto> = emptyList()
)

@Serializable
data class OfflineSyncResponse(
    val ok: Boolean = true,
    val syncedContactsCount: Int = 0,
    val syncedDispatchesCount: Int = 0,
    val message: String? = null
)
