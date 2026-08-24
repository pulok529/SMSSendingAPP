package com.pulsedispatch.sender.data

import android.app.Activity
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.os.Build
import android.telephony.SmsManager
import android.telephony.SubscriptionManager
import androidx.core.content.ContextCompat
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.withTimeoutOrNull
import java.util.concurrent.atomic.AtomicInteger

sealed class SmsSendResult {
    data class Success(val message: String) : SmsSendResult()
    data class Error(val reason: String) : SmsSendResult()
}

class SmsDispatcher(private val context: Context) {

    private val requestCodeGenerator = AtomicInteger(100)

    suspend fun sendSms(rawPhoneNumber: String, rawMessage: String): SmsSendResult {
        // 1. Validate SMS Permission
        val hasPermission = ContextCompat.checkSelfPermission(
            context,
            android.Manifest.permission.SEND_SMS
        ) == PackageManager.PERMISSION_GRANTED

        if (!hasPermission) {
            return SmsSendResult.Error("SMS Permission not granted on phone. Open Android App Info -> Permissions -> Allow SMS.")
        }

        // 2. Sanitize & Format Phone Number
        val phoneNumber = sanitizePhoneNumber(rawPhoneNumber)
        if (phoneNumber.length < 6) {
            return SmsSendResult.Error("Invalid phone number format: $rawPhoneNumber")
        }

        val message = rawMessage.trim()
        if (message.isEmpty()) {
            return SmsSendResult.Error("SMS message content is empty.")
        }

        // 3. Resolve SmsManager (handles Android 12+ and Dual SIM)
        val smsManager: SmsManager = resolveSmsManager()

        // 4. Divide into parts for multipart if needed (> 160 chars GSM-7 or > 70 Unicode)
        val parts = try {
            smsManager.divideMessage(message)
        } catch (e: Exception) {
            arrayListOf(message)
        }
        val partCount = parts.size

        val actionId = "com.pulsedispatch.sender.SMS_SENT_${System.currentTimeMillis()}_${requestCodeGenerator.incrementAndGet()}"
        val deferred = CompletableDeferred<SmsSendResult>()

        val sentReceiver = object : BroadcastReceiver() {
            private var successfulParts = 0
            private var failed = false

            override fun onReceive(receiverContext: Context?, intent: Intent?) {
                if (failed) return

                when (resultCode) {
                    Activity.RESULT_OK -> {
                        successfulParts++
                        if (successfulParts >= partCount) {
                            deferred.complete(
                                SmsSendResult.Success(
                                    "SMS confirmed by carrier network ($partCount part(s) sent to $phoneNumber)"
                                )
                            )
                        }
                    }
                    SmsManager.RESULT_ERROR_GENERIC_FAILURE -> {
                        failed = true
                        deferred.complete(
                            SmsSendResult.Error(
                                "Carrier Rejected (Code 1): Insufficient SIM balance, SIM plan restricted, or invalid destination."
                            )
                        )
                    }
                    SmsManager.RESULT_ERROR_NO_SERVICE -> {
                        failed = true
                        deferred.complete(
                            SmsSendResult.Error(
                                "No Cellular Service (Code 4): Phone has no carrier signal or network registration."
                            )
                        )
                    }
                    SmsManager.RESULT_ERROR_RADIO_OFF -> {
                        failed = true
                        deferred.complete(
                            SmsSendResult.Error(
                                "Radio Off (Code 2): Phone is in Airplane mode or SIM is deactivated."
                            )
                        )
                    }
                    SmsManager.RESULT_ERROR_LIMIT_EXCEEDED -> {
                        failed = true
                        deferred.complete(
                            SmsSendResult.Error(
                                "Android SMS limit exceeded (Code 5): System security dialog requires user confirmation."
                            )
                        )
                    }
                    else -> {
                        failed = true
                        deferred.complete(
                            SmsSendResult.Error("Carrier dispatch failure with error code: $resultCode")
                        )
                    }
                }
            }
        }

        val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE
        } else {
            PendingIntent.FLAG_UPDATE_CURRENT
        }

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                context.registerReceiver(
                    sentReceiver,
                    IntentFilter(actionId),
                    Context.RECEIVER_NOT_EXPORTED
                )
            } else {
                context.registerReceiver(sentReceiver, IntentFilter(actionId))
            }

            if (partCount > 1) {
                val sentIntents = ArrayList<PendingIntent>()
                for (i in 0 until partCount) {
                    val intent = Intent(actionId)
                    val pendingIntent = PendingIntent.getBroadcast(
                        context,
                        requestCodeGenerator.incrementAndGet(),
                        intent,
                        flags
                    )
                    sentIntents.add(pendingIntent)
                }
                smsManager.sendMultipartTextMessage(phoneNumber, null, parts, sentIntents, null)
            } else {
                val intent = Intent(actionId)
                val pendingIntent = PendingIntent.getBroadcast(
                    context,
                    requestCodeGenerator.incrementAndGet(),
                    intent,
                    flags
                )
                smsManager.sendTextMessage(phoneNumber, null, parts[0], pendingIntent, null)
            }

            // Wait up to 12 seconds for cellular modem broadcast confirmation
            val result = withTimeoutOrNull(12000L) {
                deferred.await()
            } ?: SmsSendResult.Error("Carrier timeout: Modem did not confirm transmission within 12 seconds.")

            return result
        } catch (e: Exception) {
            return SmsSendResult.Error("Modem Exception: ${e.message ?: "Unknown transmission error"}")
        } finally {
            try {
                context.unregisterReceiver(sentReceiver)
            } catch (_: Exception) {}
        }
    }

    private fun resolveSmsManager(): SmsManager {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            context.getSystemService(SmsManager::class.java)
        } else {
            val subId = SubscriptionManager.getDefaultSmsSubscriptionId()
            if (subId != SubscriptionManager.INVALID_SUBSCRIPTION_ID) {
                SmsManager.getSmsManagerForSubscriptionId(subId)
            } else {
                @Suppress("DEPRECATION")
                SmsManager.getDefault()
            }
        }
    }

    private fun sanitizePhoneNumber(raw: String): String {
        // Strip spaces, dashes, parentheses, dots
        return raw.trim().replace(Regex("[^0-9+]"), "")
    }
}
