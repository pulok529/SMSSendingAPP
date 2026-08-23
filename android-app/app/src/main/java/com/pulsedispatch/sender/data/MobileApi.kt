package com.pulsedispatch.sender.data

import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path

interface MobileApi {
    @POST("api/auth/login")
    suspend fun login(@Body request: LoginRequest): LoginResponse

    @POST("api/mobile/register")
    suspend fun register(@Body request: RegisterRequest): RegisterResponse

    @POST("api/mobile/{deviceId}/heartbeat")
    suspend fun heartbeat(
        @Path("deviceId") deviceId: String,
        @Body request: HeartbeatRequest
    ): HeartbeatResponse

    @GET("api/mobile/{deviceId}/jobs")
    suspend fun jobs(@Path("deviceId") deviceId: String): JobsResponse

    @POST("api/mobile/jobs/{deliveryId}/result")
    suspend fun sendResult(
        @Path("deliveryId") deliveryId: String,
        @Body request: JobResultRequest
    ): JobResultResponse
}
