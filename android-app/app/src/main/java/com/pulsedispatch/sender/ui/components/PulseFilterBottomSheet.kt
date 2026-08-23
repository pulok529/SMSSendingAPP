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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccessTime
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.pulsedispatch.sender.data.ActivityLogFilter
import com.pulsedispatch.sender.data.DateFilterOption
import com.pulsedispatch.sender.ui.theme.CardBorder
import com.pulsedispatch.sender.ui.theme.CardWhite
import com.pulsedispatch.sender.ui.theme.DarkBrown
import com.pulsedispatch.sender.ui.theme.MutedBrown
import com.pulsedispatch.sender.ui.theme.OrangePrimary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PulseFilterBottomSheet(
    filter: ActivityLogFilter,
    onDismiss: () -> Unit,
    onApply: (ActivityLogFilter) -> Unit,
    onReset: () -> Unit
) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    var period by remember { mutableStateOf(filter.period) }
    var fromTime by remember { mutableStateOf(filter.fromTime) }
    var toTime by remember { mutableStateOf(filter.toTime) }
    var fromDate by remember { mutableStateOf("Today") }
    var toDate by remember { mutableStateOf("Today") }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp),
        containerColor = CardWhite,
        dragHandle = {
            Box(
                modifier = Modifier
                    .padding(top = 10.dp, bottom = 6.dp)
                    .size(width = 40.dp, height = 5.dp)
                    .clip(RoundedCornerShape(999.dp))
                    .background(Color(0xFFD4C8BE))
            )
        }
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 24.dp, vertical = 12.dp)
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Filter by Date & Time",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = DarkBrown
                )
                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .clickable(onClick = onDismiss),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Close,
                        contentDescription = "Close",
                        tint = MutedBrown,
                        modifier = Modifier.size(20.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // PERIOD Label
            Text(
                text = "PERIOD",
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                color = OrangePrimary,
                letterSpacing = 0.8.sp
            )

            Spacer(modifier = Modifier.height(10.dp))

            // Segmented pill control
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(46.dp)
                    .clip(RoundedCornerShape(14.dp))
                    .border(1.dp, CardBorder, RoundedCornerShape(14.dp))
                    .background(Color(0xFFF9F4EE))
                    .padding(4.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Current Date pill
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(10.dp))
                        .background(if (period == DateFilterOption.CURRENT_DATE) OrangePrimary else Color.Transparent)
                        .clickable { period = DateFilterOption.CURRENT_DATE },
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "Current Date",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (period == DateFilterOption.CURRENT_DATE) Color.White else DarkBrown
                    )
                }

                // Date Range pill
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(10.dp))
                        .background(if (period == DateFilterOption.DATE_RANGE) OrangePrimary else Color.Transparent)
                        .clickable { period = DateFilterOption.DATE_RANGE },
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "Date Range",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (period == DateFilterOption.DATE_RANGE) Color.White else DarkBrown
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Date Range extra pickers if selected
            if (period == DateFilterOption.DATE_RANGE) {
                Row(modifier = Modifier.fillMaxWidth()) {
                    OutlinedTextField(
                        value = fromDate,
                        onValueChange = { fromDate = it },
                        label = { Text("From Date") },
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(14.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = OrangePrimary,
                            unfocusedBorderColor = CardBorder
                        )
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    OutlinedTextField(
                        value = toDate,
                        onValueChange = { toDate = it },
                        label = { Text("To Date") },
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(14.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = OrangePrimary,
                            unfocusedBorderColor = CardBorder
                        )
                    )
                }
                Spacer(modifier = Modifier.height(12.dp))
            }

            // Time Pickers (From / To)
            Row(modifier = Modifier.fillMaxWidth()) {
                OutlinedTextField(
                    value = fromTime,
                    onValueChange = { fromTime = it },
                    label = { Text("From Time") },
                    leadingIcon = {
                        Icon(
                            imageVector = Icons.Default.AccessTime,
                            contentDescription = null,
                            tint = OrangePrimary,
                            modifier = Modifier.size(18.dp)
                        )
                    },
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(14.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = OrangePrimary,
                        unfocusedBorderColor = CardBorder
                    )
                )
                Spacer(modifier = Modifier.width(12.dp))
                OutlinedTextField(
                    value = toTime,
                    onValueChange = { toTime = it },
                    label = { Text("To Time") },
                    leadingIcon = {
                        Icon(
                            imageVector = Icons.Default.AccessTime,
                            contentDescription = null,
                            tint = OrangePrimary,
                            modifier = Modifier.size(18.dp)
                        )
                    },
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(14.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = OrangePrimary,
                        unfocusedBorderColor = CardBorder
                    )
                )
            }

            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Data will be scoped for the selected time window.",
                fontSize = 12.sp,
                color = MutedBrown
            )

            Spacer(modifier = Modifier.height(24.dp))

            // Apply Button
            PulsePrimaryButton(
                text = "Apply Filter",
                onClick = {
                    onApply(
                        filter.copy(
                            period = period,
                            fromTime = fromTime,
                            toTime = toTime
                        )
                    )
                    onDismiss()
                }
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Reset Button
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable {
                        onReset()
                        onDismiss()
                    }
                    .padding(vertical = 8.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "Reset to Default",
                    fontSize = 14.sp,
                    color = MutedBrown,
                    fontWeight = FontWeight.Medium
                )
            }

            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}
