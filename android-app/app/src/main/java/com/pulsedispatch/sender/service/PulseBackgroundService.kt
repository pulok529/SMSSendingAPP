package com.pulsedispatch.sender.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.pulsedispatch.sender.MainActivity
import com.pulsedispatch.sender.data.AppRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

class PulseBackgroundService : Service() {
    private val serviceScope = CoroutineScope(Dispatchers.IO + Job())
    private lateinit var repository: AppRepository
    private var heartbeatJob: Job? = null

    override fun onCreate() {
        super.onCreate()
        repository = AppRepository(applicationContext)
        startForegroundServiceNotification()
        startBackgroundLoops()
    }

    private fun startForegroundServiceNotification() {
        val channelId = "pulse_sender_gateway_service"
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "Pulse Sender Background Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Keeps SMS Gateway active in background"
            }
            notificationManager.createNotificationChannel(channel)
        }

        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE
        )

        val notification: Notification = NotificationCompat.Builder(this, channelId)
            .setContentTitle("Pulse Sender Gateway Active")
            .setContentText("Monitoring SMS jobs and maintaining connection")
            .setSmallIcon(android.R.drawable.stat_notify_chat)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .build()

        startForeground(1001, notification)
    }

    private fun startBackgroundLoops() {
        heartbeatJob?.cancel()
        heartbeatJob = serviceScope.launch {
            while (isActive) {
                try {
                    val config = repository.loadConfig()
                    if (config.deviceId.isNotBlank()) {
                        repository.heartbeat(config, queueDepth = 0)

                        if (config.autoFetch) {
                            val jobs = repository.fetchJobs(config)
                            if (config.autoProcess && jobs.isNotEmpty()) {
                                // Background auto-processing
                            }
                        }
                    }
                } catch (_: Exception) {}

                val interval = repository.loadConfig().heartbeatIntervalSeconds.coerceAtLeast(15)
                delay(interval * 1000L)
            }
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        super.onDestroy()
        heartbeatJob?.cancel()
    }
}
