package it.trevisantech.quota.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material.icons.rounded.CalendarMonth
import androidx.compose.material.icons.rounded.History
import androidx.compose.material.icons.rounded.Home
import androidx.compose.material.icons.rounded.MusicNote
import androidx.compose.material.icons.rounded.People
import androidx.compose.material.icons.rounded.Settings
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.compose.composable
import it.trevisantech.quota.data.AuthManager
import it.trevisantech.quota.data.QuotaRepository

private sealed class Dest(val route: String, val label: String) {
    data object Dashboard : Dest("dashboard", "Dashboard")
    data object Members : Dest("members", "Membri")
    data object Calendar : Dest("calendar", "Calendario")
    data object Activity : Dest("activity", "Attività")
    data object Settings : Dest("settings", "Impostazioni")
}

private val tabs = listOf(Dest.Dashboard, Dest.Members, Dest.Calendar, Dest.Activity)

@Composable
fun RootScreen(auth: AuthManager, repository: QuotaRepository) {
    val isAuthenticated by auth.isAuthenticated.collectAsState()

    if (!isAuthenticated) {
        LoginScreen(auth = auth)
    } else {
        MainShell(auth = auth, repository = repository)
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun MainShell(auth: AuthManager, repository: QuotaRepository) {
    val navController = rememberNavController()
    var selectedMemberId by remember { mutableStateOf<String?>(null) }

    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = backStackEntry?.destination
    val currentDest = (tabs + Dest.Settings).firstOrNull { d -> currentRoute?.hierarchy?.any { it.route == d.route } == true }
        ?: Dest.Dashboard
    val onSettingsScreen = currentDest == Dest.Settings

    Box(modifier = Modifier.background(QuotaBackground)) {
    Scaffold(
        containerColor = Color.Transparent,
        topBar = {
            TopAppBar(
                title = {
                    if (onSettingsScreen) {
                        Text(Dest.Settings.label, fontWeight = FontWeight.SemiBold)
                    } else {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier.size(28.dp).background(QuotaAccent, RoundedCornerShape(9.dp)),
                                contentAlignment = Alignment.Center,
                            ) {
                                Icon(Icons.Rounded.MusicNote, contentDescription = null, tint = Color.White, modifier = Modifier.size(16.dp))
                            }
                            Spacer(Modifier.padding(start = 10.dp))
                            Text(currentDest.label, fontWeight = FontWeight.SemiBold)
                        }
                    }
                },
                navigationIcon = {
                    if (onSettingsScreen) {
                        IconButton(onClick = { navController.popBackStack() }) {
                            Icon(Icons.AutoMirrored.Rounded.ArrowBack, contentDescription = "Indietro")
                        }
                    }
                },
                actions = {
                    if (!onSettingsScreen) {
                        IconButton(onClick = { navController.navigate(Dest.Settings.route) { launchSingleTop = true } }) {
                            Icon(Icons.Rounded.Settings, contentDescription = "Impostazioni")
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color.Transparent,
                    scrolledContainerColor = Color.Transparent,
                ),
            )
        },
    ) { padding ->
        NavHost(
            navController = navController,
            startDestination = Dest.Dashboard.route,
            modifier = Modifier.padding(top = padding.calculateTopPadding()),
        ) {
            composable(Dest.Dashboard.route) {
                DashboardScreen(
                    repository = repository,
                    onSelectMember = {
                        selectedMemberId = it
                        navController.navigate(Dest.Members.route) {
                            popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                            launchSingleTop = true
                        }
                    },
                )
            }
            composable(Dest.Members.route) {
                MembersScreen(
                    repository = repository,
                    preselectedMemberId = selectedMemberId,
                    onConsumedPreselection = { selectedMemberId = null },
                )
            }
            composable(Dest.Calendar.route) {
                CalendarScreen(repository = repository)
            }
            composable(Dest.Activity.route) {
                ActivityScreen(repository = repository)
            }
            composable(Dest.Settings.route) {
                SettingsScreen(repository = repository)
            }
        }
    }

    // Navbar flottante fuori dallo slot bottomBar dello Scaffold: quello slot
    // riserva sempre spazio opaco e blocca il contenuto sottostante. Qui è
    // un overlay vero — il contenuto scorre pieno fino al bordo e si vede
    // attraverso i margini trasparenti attorno alla pillola.
    Box(
        modifier = Modifier
            .align(Alignment.BottomCenter)
            .fillMaxWidth()
            .windowInsetsPadding(WindowInsets.navigationBars)
            .padding(horizontal = 60.dp)
            .padding(bottom = 18.dp),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(60.dp)
                .glassSurface(shape = RoundedCornerShape(30.dp), elevation = 18.dp),
            horizontalArrangement = androidx.compose.foundation.layout.Arrangement.SpaceEvenly,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            tabs.forEach { dest ->
                val selected = currentRoute?.hierarchy?.any { it.route == dest.route } == true
                GlassNavItem(
                    selected = selected,
                    icon = iconFor(dest),
                    label = dest.label,
                    onClick = {
                        navController.navigate(dest.route) {
                            popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                            launchSingleTop = true
                            restoreState = true
                        }
                    },
                )
            }
        }
    }
    }
}

@Composable
private fun RowScope.GlassNavItem(selected: Boolean, icon: ImageVector, label: String, onClick: () -> Unit) {
    // Cerchio verde tenue dietro l'icona attiva, come nel mockup — leggero,
    // non un blob invadente.
    val tint by androidx.compose.animation.animateColorAsState(
        targetValue = if (selected) QuotaAccentText else Color.White.copy(alpha = 0.5f),
        animationSpec = androidx.compose.animation.core.tween(180),
        label = "navIconTint",
    )
    val circleAlpha by androidx.compose.animation.core.animateFloatAsState(
        targetValue = if (selected) 1f else 0f,
        animationSpec = androidx.compose.animation.core.tween(180),
        label = "navIconCircle",
    )
    Box(
        modifier = Modifier
            .weight(1f)
            .fillMaxSize()
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center,
    ) {
        Box(
            modifier = Modifier
                .size(36.dp)
                .background(QuotaAccent.copy(alpha = 0.18f * circleAlpha), CircleShape),
            contentAlignment = Alignment.Center,
        ) {
            Icon(
                icon,
                contentDescription = label,
                tint = tint,
                modifier = Modifier.size(22.dp),
            )
        }
    }
}

private fun iconFor(dest: Dest) = when (dest) {
    Dest.Dashboard -> Icons.Rounded.Home
    Dest.Members -> Icons.Rounded.People
    Dest.Calendar -> Icons.Rounded.CalendarMonth
    Dest.Activity -> Icons.Rounded.History
    Dest.Settings -> Icons.Rounded.Settings
}
