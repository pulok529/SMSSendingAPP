package com.pulsedispatch.sender.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChevronLeft
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material3.Icon
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.pulsedispatch.sender.ui.theme.CardBorder
import com.pulsedispatch.sender.ui.theme.CardWhite
import com.pulsedispatch.sender.ui.theme.DarkBrown
import com.pulsedispatch.sender.ui.theme.MutedBrown
import com.pulsedispatch.sender.ui.theme.OrangePrimary
import kotlin.math.min

@Composable
fun PulsePagination(
    currentPage: Int,
    totalPages: Int,
    totalItems: Int,
    pageSize: Int,
    onPageChange: (Int) -> Unit,
    modifier: Modifier = Modifier
) {
    if (totalPages <= 1 && totalItems == 0) return

    val startItem = if (totalItems == 0) 0 else (currentPage - 1) * pageSize + 1
    val endItem = min(currentPage * pageSize, totalItems)

    Column(
        modifier = modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Pagination pill box
        Surface(
            shape = RoundedCornerShape(999.dp),
            color = CardWhite,
            modifier = Modifier.border(1.dp, CardBorder, RoundedCornerShape(999.dp))
        ) {
            Row(
                modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center
            ) {
                // Previous button
                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .clip(CircleShape)
                        .clickable(enabled = currentPage > 1) { onPageChange(currentPage - 1) },
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.ChevronLeft,
                        contentDescription = "Previous Page",
                        tint = if (currentPage > 1) DarkBrown else Color.LightGray,
                        modifier = Modifier.size(18.dp)
                    )
                }

                Spacer(modifier = Modifier.width(4.dp))

                // Page numbers
                val displayPages = calculateDisplayPages(currentPage, totalPages)
                displayPages.forEach { pageNumber ->
                    if (pageNumber == -1) {
                        Text(
                            text = "···",
                            color = MutedBrown,
                            fontSize = 13.sp,
                            modifier = Modifier.padding(horizontal = 4.dp)
                        )
                    } else {
                        val isSelected = pageNumber == currentPage
                        Box(
                            modifier = Modifier
                                .size(32.dp)
                                .clip(CircleShape)
                                .background(if (isSelected) OrangePrimary else Color.Transparent)
                                .clickable { onPageChange(pageNumber) },
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = pageNumber.toString(),
                                color = if (isSelected) Color.White else DarkBrown,
                                fontSize = 13.sp,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.width(4.dp))

                // Next button
                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .clip(CircleShape)
                        .clickable(enabled = currentPage < totalPages) { onPageChange(currentPage + 1) },
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.ChevronRight,
                        contentDescription = "Next Page",
                        tint = if (currentPage < totalPages) DarkBrown else Color.LightGray,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(6.dp))

        // Showing X-Y of Z text
        Text(
            text = "Showing $startItem–$endItem of $totalItems",
            fontSize = 12.sp,
            color = MutedBrown
        )
    }
}

private fun calculateDisplayPages(current: Int, total: Int): List<Int> {
    if (total <= 5) return (1..total).toList()

    val pages = mutableListOf<Int>()
    pages.add(1)

    if (current > 3) {
        pages.add(-1) // Ellipsis
    }

    val start = maxOf(2, current - 1)
    val end = minOf(total - 1, current + 1)

    for (i in start..end) {
        if (!pages.contains(i)) {
            pages.add(i)
        }
    }

    if (current < total - 2) {
        pages.add(-1) // Ellipsis
    }

    if (!pages.contains(total)) {
        pages.add(total)
    }

    return pages
}
