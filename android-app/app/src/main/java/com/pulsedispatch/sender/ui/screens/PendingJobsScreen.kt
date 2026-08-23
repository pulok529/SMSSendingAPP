package com.pulsedispatch.sender.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material3.Icon
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
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.pulsedispatch.sender.data.SmsJobDto
import com.pulsedispatch.sender.ui.components.PulseAnimatedFab
import com.pulsedispatch.sender.ui.components.PulsePagination
import com.pulsedispatch.sender.ui.theme.CardBorder
import com.pulsedispatch.sender.ui.theme.CardWhite
import com.pulsedispatch.sender.ui.theme.DarkBrown
import com.pulsedispatch.sender.ui.theme.MutedBrown
import com.pulsedispatch.sender.ui.theme.OrangeLight
import com.pulsedispatch.sender.ui.theme.OrangePrimary
import com.pulsedispatch.sender.ui.theme.WarmCream
import kotlin.math.ceil

@Composable
fun PendingJobsScreen(
    jobs: List<SmsJobDto>,
    isRefreshing: Boolean,
    onRefresh: () -> Unit,
    onBack: () -> Unit,
    modifier: Modifier = Modifier
) {
    var selectedTab by remember { mutableStateOf("All") }
    var currentPage by remember { mutableIntStateOf(1) }
    val pageSize = 10

    // Filter jobs by tab
    val filteredJobs = when (selectedTab) {
        "Assigned" -> jobs.filter { it.status == "ASSIGNED" }
        "Failed" -> jobs.filter { it.status == "FAILED" }
        else -> jobs
    }

    val totalPages = maxOf(1, ceil(filteredJobs.size.toDouble() / pageSize).toInt())
    val paginatedJobs = filteredJobs
        .drop((currentPage - 1) * pageSize)
        .take(pageSize)

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(WarmCream)
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
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
                        .padding(horizontal = 16.dp, vertical = 16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(38.dp)
                            .clip(CircleShape)
                            .clickable(onClick = onBack),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.ArrowBack,
                            contentDescription = "Back",
                            tint = DarkBrown
                        )
                    }

                    Spacer(modifier = Modifier.width(8.dp))

                    Text(
                        text = "Pending Jobs",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        color = DarkBrown
                    )

                    Spacer(modifier = Modifier.width(8.dp))

                    // Badge counter
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(999.dp))
                            .background(OrangePrimary)
                            .padding(horizontal = 8.dp, vertical = 3.dp)
                    ) {
                        Text(
                            text = jobs.size.toString(),
                            color = Color.White,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }

            // Tabs Row
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 12.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                listOf("All", "Assigned", "Failed").forEach { tab ->
                    val isSelected = selectedTab == tab
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(999.dp))
                            .background(if (isSelected) OrangeLight else CardWhite)
                            .border(1.dp, if (isSelected) OrangePrimary else CardBorder, RoundedCornerShape(999.dp))
                            .clickable {
                                selectedTab = tab
                                currentPage = 1
                            }
                            .padding(horizontal = 16.dp, vertical = 8.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = tab,
                            fontSize = 13.sp,
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                            color = if (isSelected) OrangePrimary else DarkBrown
                        )
                    }
                }
            }

            // Jobs List or Empty State
            if (filteredJobs.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = "📨",
                            fontSize = 44.sp
                        )
                        Spacer(modifier = Modifier.height(10.dp))
                        Text(
                            text = "No pending jobs in queue",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = DarkBrown
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "Tap the refresh button below to fetch new jobs",
                            fontSize = 13.sp,
                            color = MutedBrown
                        )
                    }
                }
            } else {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f)
                        .padding(horizontal = 20.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(paginatedJobs, key = { it.id }) { job ->
                        JobItemCard(job = job)
                    }

                    item {
                        Spacer(modifier = Modifier.height(8.dp))
                        PulsePagination(
                            currentPage = currentPage,
                            totalPages = totalPages,
                            totalItems = filteredJobs.size,
                            pageSize = pageSize,
                            onPageChange = { currentPage = it }
                        )
                        Spacer(modifier = Modifier.height(80.dp)) // padding for FAB
                    }
                }
            }
        }

        // Floating Action Button on Bottom Right
        PulseAnimatedFab(
            onClick = onRefresh,
            isSpinning = isRefreshing,
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(24.dp)
        )
    }
}

@Composable
private fun JobItemCard(job: SmsJobDto) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(6.dp, RoundedCornerShape(18.dp), spotColor = Color(0x1F6B4C35))
            .border(1.dp, CardBorder, RoundedCornerShape(18.dp)),
        shape = RoundedCornerShape(18.dp),
        color = CardWhite
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp)
        ) {
            // Left vertical orange gradient strip
            Box(
                modifier = Modifier
                    .width(4.dp)
                    .height(60.dp)
                    .clip(RoundedCornerShape(999.dp))
                    .background(OrangePrimary)
            )

            Spacer(modifier = Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = job.phoneNumber ?: "+880 1700-000000",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = DarkBrown
                    )
                    Icon(
                        imageVector = Icons.Default.MoreVert,
                        contentDescription = "Options",
                        tint = MutedBrown,
                        modifier = Modifier.size(18.dp)
                    )
                }

                Spacer(modifier = Modifier.height(4.dp))

                Text(
                    text = job.message,
                    fontSize = 13.sp,
                    color = MutedBrown,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )

                Spacer(modifier = Modifier.height(8.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(999.dp))
                            .background(OrangeLight)
                            .padding(horizontal = 8.dp, vertical = 3.dp)
                    ) {
                        Text(
                            text = job.status,
                            color = OrangePrimary,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    Text(
                        text = job.customerName,
                        fontSize = 12.sp,
                        color = MutedBrown
                    )
                }
            }
        }
    }
}
