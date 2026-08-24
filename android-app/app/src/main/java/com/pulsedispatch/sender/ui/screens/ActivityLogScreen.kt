package com.pulsedispatch.sender.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Cancel
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.FilterList
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.pulsedispatch.sender.data.ActivityLogFilter
import com.pulsedispatch.sender.data.ActivityLogItem
import com.pulsedispatch.sender.data.DateFilterOption
import com.pulsedispatch.sender.data.LogType
import com.pulsedispatch.sender.ui.components.PulseFilterBottomSheet
import com.pulsedispatch.sender.ui.components.PulsePagination
import com.pulsedispatch.sender.ui.theme.CardBorder
import com.pulsedispatch.sender.ui.theme.CardWhite
import com.pulsedispatch.sender.ui.theme.DarkBrown
import com.pulsedispatch.sender.ui.theme.ErrorRed
import com.pulsedispatch.sender.ui.theme.ErrorRedBg
import com.pulsedispatch.sender.ui.theme.InfoBlue
import com.pulsedispatch.sender.ui.theme.InfoBlueBg
import com.pulsedispatch.sender.ui.theme.MutedBrown
import com.pulsedispatch.sender.ui.theme.OrangeGradient
import com.pulsedispatch.sender.ui.theme.OrangeLight
import com.pulsedispatch.sender.ui.theme.OrangePrimary
import com.pulsedispatch.sender.ui.theme.SuccessGreen
import com.pulsedispatch.sender.ui.theme.SuccessGreenBg
import com.pulsedispatch.sender.ui.theme.WarmCream
import com.pulsedispatch.sender.ui.theme.WarningAmber
import com.pulsedispatch.sender.ui.theme.WarningAmberBg
import kotlin.math.ceil

@OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)
@Composable
fun ActivityLogScreen(
    logs: List<ActivityLogItem>,
    onBack: () -> Unit,
    modifier: Modifier = Modifier
) {
    var selectedType by remember { mutableStateOf(LogType.ALL) }
    var filter by remember { mutableStateOf(ActivityLogFilter()) }
    var showFilterSheet by remember { mutableStateOf(false) }
    var currentPage by remember { mutableIntStateOf(1) }
    val pageSize = 10

    if (showFilterSheet) {
        PulseFilterBottomSheet(
            filter = filter,
            onDismiss = { showFilterSheet = false },
            onApply = {
                filter = it
                currentPage = 1
            },
            onReset = {
                filter = ActivityLogFilter()
                currentPage = 1
            }
        )
    }

    // 1. Filter logs by Date
    val dateFilteredLogs = logs.filter { item ->
        val itemCal = java.util.Calendar.getInstance().apply { timeInMillis = item.timestampMillis }
        if (filter.period == DateFilterOption.CURRENT_DATE) {
            val todayCal = java.util.Calendar.getInstance()
            itemCal.get(java.util.Calendar.YEAR) == todayCal.get(java.util.Calendar.YEAR) &&
            itemCal.get(java.util.Calendar.DAY_OF_YEAR) == todayCal.get(java.util.Calendar.DAY_OF_YEAR)
        } else {
            val fromOk = filter.fromDateMillis?.let { item.timestampMillis >= it } ?: true
            val toOk = filter.toDateMillis?.let { item.timestampMillis <= it } ?: true
            fromOk && toOk
        }
    }

    // 2. Filter by Type
    val typeFilteredLogs = if (selectedType == LogType.ALL) {
        dateFilteredLogs
    } else {
        dateFilteredLogs.filter { it.type == selectedType }
    }

    // Sort by timestamp descending
    val sortedLogs = typeFilteredLogs.sortedByDescending { it.timestampMillis }

    val totalPages = maxOf(1, ceil(sortedLogs.size.toDouble() / pageSize).toInt())
    val paginatedLogs = sortedLogs
        .drop((currentPage - 1) * pageSize)
        .take(pageSize)

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(WarmCream)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .navigationBarsPadding()
        ) {
            // Top Bar
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .shadow(8.dp, RoundedCornerShape(bottomStart = 24.dp, bottomEnd = 24.dp)),
                shape = RoundedCornerShape(bottomStart = 24.dp, bottomEnd = 24.dp),
                color = CardWhite
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .statusBarsPadding()
                        .padding(horizontal = 16.dp, vertical = 14.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        IconButton(
                            onClick = onBack,
                            modifier = Modifier.size(40.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.ArrowBack,
                                contentDescription = "Back",
                                tint = DarkBrown
                            )
                        }

                        Spacer(modifier = Modifier.width(8.dp))

                        Text(
                            text = "Activity Log",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                            color = DarkBrown
                        )
                    }

                    // Orange Filter Funnel Button
                    Surface(
                        onClick = { showFilterSheet = true },
                        shape = CircleShape,
                        color = Color.Transparent,
                        modifier = Modifier
                            .size(38.dp)
                            .shadow(4.dp, CircleShape, spotColor = Color(0x3DCE631D))
                            .clip(CircleShape)
                            .background(OrangeGradient)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                imageVector = Icons.Default.FilterList,
                                contentDescription = "Filter",
                                tint = Color.White,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                    }
                }
            }

            // Type Filter Chips Row (Horizontally Scrollable)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState())
                    .padding(horizontal = 20.dp, vertical = 12.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                TypeChip(
                    label = "All",
                    isSelected = selectedType == LogType.ALL,
                    activeBgColor = OrangePrimary,
                    activeTextColor = Color.White,
                    onClick = {
                        selectedType = LogType.ALL
                        currentPage = 1
                    }
                )

                TypeChip(
                    label = "Success",
                    isSelected = selectedType == LogType.SUCCESS,
                    activeBgColor = SuccessGreen,
                    activeTextColor = Color.White,
                    onClick = {
                        selectedType = LogType.SUCCESS
                        currentPage = 1
                    }
                )

                TypeChip(
                    label = "Error",
                    isSelected = selectedType == LogType.ERROR,
                    activeBgColor = ErrorRed,
                    activeTextColor = Color.White,
                    onClick = {
                        selectedType = LogType.ERROR
                        currentPage = 1
                    }
                )

                TypeChip(
                    label = "Warning",
                    isSelected = selectedType == LogType.WARNING,
                    activeBgColor = WarningAmber,
                    activeTextColor = Color.White,
                    onClick = {
                        selectedType = LogType.WARNING
                        currentPage = 1
                    }
                )

                TypeChip(
                    label = "Info",
                    isSelected = selectedType == LogType.INFO,
                    activeBgColor = InfoBlue,
                    activeTextColor = Color.White,
                    onClick = {
                        selectedType = LogType.INFO
                        currentPage = 1
                    }
                )
            }

            // Active Date Filter Context Chip
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(999.dp))
                        .background(OrangeLight)
                        .padding(horizontal = 10.dp, vertical = 4.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = if (filter.period == DateFilterOption.CURRENT_DATE) "Today • Full Day" else "Date Range Filter Active",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = OrangePrimary
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = "Clear",
                            tint = OrangePrimary,
                            modifier = Modifier
                                .size(14.dp)
                                .clickable {
                                    filter = ActivityLogFilter()
                                }
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Logs List
            if (sortedLogs.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "No activity logs for this filter",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MutedBrown
                    )
                }
            } else {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f)
                        .padding(horizontal = 20.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    items(paginatedLogs, key = { it.id }) { item ->
                        ActivityLogCard(item = item)
                    }

                    item {
                        Spacer(modifier = Modifier.height(8.dp))
                        PulsePagination(
                            currentPage = currentPage,
                            totalPages = totalPages,
                            totalItems = sortedLogs.size,
                            pageSize = pageSize,
                            onPageChange = { currentPage = it }
                        )
                        Spacer(modifier = Modifier.height(24.dp))
                    }
                }
            }
        }
    }
}

@Composable
private fun TypeChip(
    label: String,
    isSelected: Boolean,
    activeBgColor: Color,
    activeTextColor: Color,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(999.dp))
            .background(if (isSelected) activeBgColor else CardWhite)
            .border(1.dp, if (isSelected) activeBgColor else CardBorder, RoundedCornerShape(999.dp))
            .clickable(onClick = onClick)
            .padding(horizontal = 16.dp, vertical = 7.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = label,
            fontSize = 13.sp,
            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
            color = if (isSelected) activeTextColor else DarkBrown
        )
    }
}

@Composable
private fun ActivityLogCard(item: ActivityLogItem) {
    val (borderAccent, bgTint, iconVector, badgeText) = when (item.type) {
        LogType.SUCCESS -> Quadruple(SuccessGreen, SuccessGreenBg, Icons.Default.CheckCircle, "SUCCESS")
        LogType.ERROR -> Quadruple(ErrorRed, ErrorRedBg, Icons.Default.Cancel, "ERROR")
        LogType.WARNING -> Quadruple(WarningAmber, WarningAmberBg, Icons.Default.Warning, "WARNING")
        LogType.INFO, LogType.ALL -> Quadruple(InfoBlue, InfoBlueBg, Icons.Default.Info, "INFO")
    }

    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(4.dp, RoundedCornerShape(18.dp), spotColor = Color(0x1F6B4C35))
            .border(1.dp, CardBorder, RoundedCornerShape(18.dp)),
        shape = RoundedCornerShape(18.dp),
        color = CardWhite
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Left vertical colored accent strip
            Box(
                modifier = Modifier
                    .width(4.dp)
                    .height(48.dp)
                    .clip(RoundedCornerShape(999.dp))
                    .background(borderAccent)
            )

            Spacer(modifier = Modifier.width(12.dp))

            // Icon
            Box(
                modifier = Modifier
                    .size(38.dp)
                    .clip(CircleShape)
                    .background(bgTint),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = iconVector,
                    contentDescription = null,
                    tint = borderAccent,
                    modifier = Modifier.size(20.dp)
                )
            }

            Spacer(modifier = Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = item.title,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = DarkBrown
                    )
                    Text(
                        text = item.timeFormatted,
                        fontSize = 11.sp,
                        color = MutedBrown
                    )
                }

                Spacer(modifier = Modifier.height(2.dp))

                Text(
                    text = item.detail,
                    fontSize = 12.sp,
                    color = MutedBrown,
                    maxLines = 2
                )
            }
        }
    }
}

private data class Quadruple<A, B, C, D>(val first: A, val second: B, val third: C, val fourth: D)
