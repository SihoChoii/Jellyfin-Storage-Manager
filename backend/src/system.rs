use serde::Serialize;
use sysinfo::{CpuRefreshKind, MemoryRefreshKind, RefreshKind, System};

#[derive(Debug, Clone, Serialize)]
pub struct SystemStats {
    pub cpu_percent: f32,
    pub memory_percent: f32,
    pub memory_used_bytes: u64,
    pub memory_total_bytes: u64,
}

pub struct SystemMonitor {
    system: System,
}

impl SystemMonitor {
    pub fn new() -> Self {
        let mut system = System::new_with_specifics(
            RefreshKind::new()
                .with_cpu(CpuRefreshKind::new().with_cpu_usage())
                .with_memory(MemoryRefreshKind::new().with_ram()),
        );

        // Initial refresh to populate data
        system.refresh_cpu_usage();
        system.refresh_memory();

        Self { system }
    }

    pub fn get_stats(&mut self) -> SystemStats {
        // Refresh the system information
        self.system.refresh_cpu_usage();
        self.system.refresh_memory();

        let cpu_percent = self.system.global_cpu_info().cpu_usage();
        let memory_total = self.system.total_memory();
        let memory_used = self.system.used_memory();
        let memory_percent = if memory_total > 0 {
            (memory_used as f64 / memory_total as f64 * 100.0) as f32
        } else {
            0.0
        };

        SystemStats {
            cpu_percent,
            memory_percent,
            memory_used_bytes: memory_used,
            memory_total_bytes: memory_total,
        }
    }
}

impl Default for SystemMonitor {
    fn default() -> Self {
        Self::new()
    }
}
