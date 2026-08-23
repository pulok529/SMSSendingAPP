package com.pulsedispatch.sender.data

import kotlinx.serialization.Serializable

data class DeviceConfig(
  val baseUrl: String = "http://10.0.2.2:4000",
  val email: String = "pulak@example.com",
  val name: String = "Pulak",
  val deviceName: String = "Android Test Device",
  val phoneNumber: String = "+61000000000",
  val operator: String = "Android Emulator",
  val simulateSends: Boolean = true,
  val deviceId: String = "",
)

@Serializable
data class RegisterRequest(
  val email: String,
  val name: String,
  val deviceName: String,
  val phoneNumber: String,
  val operator: String,
)

@Serializable
data class RegisterResponse(
  val device: MobileDeviceDto,
)

@Serializable
data class MobileDeviceDto(
  val id: String,
  val deviceName: String,
  val phoneNumber: String,
  val operator: String,
  val status: String,
)

@Serializable
data class HeartbeatRequest(
  val battery: String? = null,
  val queuedJobs: Int? = null,
)

@Serializable
data class JobsResponse(
  val jobs: List<SmsJobDto>,
)

@Serializable
data class SmsJobDto(
  val id: String,
  val phoneNumber: String? = null,
  val customerName: String,
  val campaignName: String,
  val message: String,
  val status: String,
)

@Serializable
data class JobResultRequest(
  val status: String,
  val detail: String,
)
