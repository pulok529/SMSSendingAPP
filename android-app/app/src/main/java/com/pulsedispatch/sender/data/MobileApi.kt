package com.pulsedispatch.sender.data

import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path

interface MobileApi {
    @POST("api/auth/login")
    suspend fun login(@Body request: LoginRequest): LoginResponse

    @GET("api/auth/me")
    suspend fun getProfile(): ProfileResponse

    @PUT("api/auth/profile")
    suspend fun updateProfile(@Body request: UpdateProfileRequest): ProfileResponse

    @PUT("api/auth/password")
    suspend fun changePassword(@Body request: ChangePasswordRequest): ChangePasswordResponse

    @GET("api/mobile/stats")
    suspend fun getStats(): MobileStatsDto

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

    @GET("api/mobile/tickets")
    suspend fun getTickets(): TicketsResponse

    @POST("api/mobile/tickets")
    suspend fun createTicket(@Body request: CreateTicketRequest): CreateTicketResponse

    @GET("api/mobile/logs")
    suspend fun getLogs(): LogsResponse

    @POST("api/mobile/logs")
    suspend fun sendLog(@Body request: SendLogRequest): JobResultResponse

    // === NEW DISPATCH & DIRECTORY API ENDPOINTS ===

    @POST("api/campaigns/dispatch")
    suspend fun dispatchBatch(@Body request: DispatchBatchRequest): DispatchBatchResponse

    @POST("api/mobile/sync")
    suspend fun syncOffline(@Body request: OfflineSyncRequest): OfflineSyncResponse

    @GET("api/directory")
    suspend fun getDirectory(): DirectoryResponse

    @POST("api/directory")
    suspend fun createContact(@Body request: CreateContactRequest): CreateContactResponse

    @GET("api/groups")
    suspend fun getGroups(): GroupsResponse

    @GET("api/groups/{id}/members")
    suspend fun getGroupMembers(@Path("id") groupId: String): GroupMembersResponse

    @GET("api/messages")
    suspend fun getMessages(): MessagesResponse
}
