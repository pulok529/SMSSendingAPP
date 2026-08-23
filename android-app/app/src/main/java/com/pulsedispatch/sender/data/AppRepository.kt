package com.pulsedispatch.sender.data

import android.content.Context
import com.jakewharton.retrofit2.converter.kotlinx.serialization.asConverterFactory
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit

class AppRepository(context: Context) {
  private val prefs = context.getSharedPreferences("pulse_sender_prefs", Context.MODE_PRIVATE)
  private val json = Json { ignoreUnknownKeys = true }

  fun loadConfig(): DeviceConfig =
    DeviceConfig(
      baseUrl = prefs.getString("baseUrl", "http://10.0.2.2:4000").orEmpty(),
      email = prefs.getString("email", "pulak@example.com").orEmpty(),
      name = prefs.getString("name", "Pulak").orEmpty(),
      deviceName = prefs.getString("deviceName", "Android Test Device").orEmpty(),
      phoneNumber = prefs.getString("phoneNumber", "+61000000000").orEmpty(),
      operator = prefs.getString("operator", "Android Emulator").orEmpty(),
      simulateSends = prefs.getBoolean("simulateSends", true),
      deviceId = prefs.getString("deviceId", "").orEmpty(),
    )

  fun saveConfig(config: DeviceConfig) {
    prefs.edit()
      .putString("baseUrl", config.baseUrl)
      .putString("email", config.email)
      .putString("name", config.name)
      .putString("deviceName", config.deviceName)
      .putString("phoneNumber", config.phoneNumber)
      .putString("operator", config.operator)
      .putBoolean("simulateSends", config.simulateSends)
      .putString("deviceId", config.deviceId)
      .apply()
  }

  private fun api(baseUrl: String): MobileApi {
    val logger = HttpLoggingInterceptor().apply {
      level = HttpLoggingInterceptor.Level.BASIC
    }

    val client = OkHttpClient.Builder()
      .addInterceptor(logger)
      .build()

    return Retrofit.Builder()
      .baseUrl(
        if (baseUrl.endsWith("/")) {
          baseUrl
        } else {
          "$baseUrl/"
        }
      )
      .client(client)
      .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
      .build()
      .create(MobileApi::class.java)
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

  suspend fun heartbeat(config: DeviceConfig, queueDepth: Int) {
    api(config.baseUrl).heartbeat(
      deviceId = config.deviceId,
      request = HeartbeatRequest(
        battery = null,
        queuedJobs = queueDepth,
      )
    )
  }

  suspend fun fetchJobs(config: DeviceConfig): List<SmsJobDto> =
    api(config.baseUrl).jobs(config.deviceId).jobs

  suspend fun reportResult(
    config: DeviceConfig,
    deliveryId: String,
    status: String,
    detail: String,
  ) {
    api(config.baseUrl).sendResult(
      deliveryId = deliveryId,
      request = JobResultRequest(
        status = status,
        detail = detail,
      )
    )
  }
}
