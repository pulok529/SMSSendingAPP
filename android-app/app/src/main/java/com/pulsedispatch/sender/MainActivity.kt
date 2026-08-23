package com.pulsedispatch.sender

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.core.content.ContextCompat
import com.pulsedispatch.sender.data.AppScreen
import com.pulsedispatch.sender.ui.components.PulseSideMenu
import com.pulsedispatch.sender.ui.screens.ActivityLogScreen
import com.pulsedispatch.sender.ui.screens.DashboardScreen
import com.pulsedispatch.sender.ui.screens.LoginScreen
import com.pulsedispatch.sender.ui.screens.PendingJobsScreen
import com.pulsedispatch.sender.ui.screens.ProfileScreen
import com.pulsedispatch.sender.ui.screens.SettingsScreen
import com.pulsedispatch.sender.ui.screens.SupportTicketScreen
import com.pulsedispatch.sender.ui.theme.PulseSenderTheme

class MainActivity : ComponentActivity() {
    private val viewModel: MainViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {
            PulseSenderTheme {
                val uiState by viewModel.uiState.collectAsState()

                // SMS permission launcher
                val permissionLauncher = rememberLauncherForActivityResult(
                    contract = ActivityResultContracts.RequestPermission()
                ) { /* handle */ }

                LaunchedEffect(uiState.isLoggedIn) {
                    if (uiState.isLoggedIn) {
                        val hasSmsPermission = ContextCompat.checkSelfPermission(
                            this@MainActivity,
                            Manifest.permission.SEND_SMS
                        ) == PackageManager.PERMISSION_GRANTED

                        if (!hasSmsPermission) {
                            permissionLauncher.launch(Manifest.permission.SEND_SMS)
                        }
                    }
                }

                // Handle back press
                BackHandler(enabled = uiState.currentScreen != AppScreen.DASHBOARD && uiState.currentScreen != AppScreen.LOGIN) {
                    if (uiState.isSideMenuOpen) {
                        viewModel.closeSideMenu()
                    } else {
                        viewModel.navigateTo(AppScreen.DASHBOARD)
                    }
                }

                Box(modifier = Modifier.fillMaxSize()) {
                    AnimatedContent(
                        targetState = uiState.currentScreen,
                        transitionSpec = {
                            if (targetState == AppScreen.LOGIN || initialState == AppScreen.LOGIN) {
                                fadeIn() togetherWith fadeOut()
                            } else {
                                slideInHorizontally { it } + fadeIn() togetherWith slideOutHorizontally { -it } + fadeOut()
                            }
                        },
                        label = "screen_transition"
                    ) { screen ->
                        when (screen) {
                            AppScreen.LOGIN -> LoginScreen(
                                initialEmail = uiState.config.email,
                                initialServerUrl = uiState.config.baseUrl,
                                isLoading = uiState.loginLoading,
                                errorMessage = uiState.loginError,
                                onLogin = { email, pass, serverUrl -> viewModel.login(email, pass, serverUrl) }
                            )

                            AppScreen.DASHBOARD -> DashboardScreen(
                                isOnline = uiState.isOnline,
                                isConnecting = uiState.isConnecting,
                                sentCount = uiState.sentToday,
                                pendingCount = uiState.jobs.size,
                                failedCount = uiState.failedToday,
                                isFetching = uiState.isFetching,
                                isProcessing = uiState.isProcessing,
                                onRefreshConnection = { viewModel.refreshConnection() },
                                onMenuClick = { viewModel.openSideMenu() },
                                onNavigate = { viewModel.navigateTo(it) },
                                onFetchJobs = { viewModel.fetchJobs() },
                                onProcessQueue = { viewModel.processQueue() }
                            )

                            AppScreen.JOBS -> PendingJobsScreen(
                                jobs = uiState.jobs,
                                isRefreshing = uiState.isFetching,
                                onRefresh = { viewModel.fetchJobs() },
                                onBack = { viewModel.navigateTo(AppScreen.DASHBOARD) }
                            )

                            AppScreen.ACTIVITY_LOG -> ActivityLogScreen(
                                logs = uiState.logs,
                                onBack = { viewModel.navigateTo(AppScreen.DASHBOARD) }
                            )

                            AppScreen.PROFILE -> ProfileScreen(
                                profile = uiState.profile,
                                onSaveProfile = { viewModel.updateProfile(it) },
                                onBack = { viewModel.navigateTo(AppScreen.DASHBOARD) }
                            )

                            AppScreen.SETTINGS -> SettingsScreen(
                                config = uiState.config,
                                onSaveConfig = { viewModel.updateConfig(it) },
                                onRegisterDevice = { viewModel.registerDevice() },
                                onSendHeartbeat = { viewModel.sendHeartbeat() },
                                onBack = { viewModel.navigateTo(AppScreen.DASHBOARD) }
                            )

                            AppScreen.TICKET -> SupportTicketScreen(
                                tickets = uiState.tickets,
                                onSubmitTicket = { viewModel.submitTicket(it) },
                                onBack = { viewModel.navigateTo(AppScreen.DASHBOARD) }
                            )
                        }
                    }

                    // Side Navigation Drawer
                    PulseSideMenu(
                        isOpen = uiState.isSideMenuOpen,
                        userProfile = uiState.profile,
                        pendingJobsCount = uiState.jobs.size,
                        onNavigate = { viewModel.navigateTo(it) },
                        onLogout = { viewModel.logout() },
                        onClose = { viewModel.closeSideMenu() }
                    )
                }
            }
        }
    }
}
