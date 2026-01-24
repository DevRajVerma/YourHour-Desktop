# Persistent PowerShell script for YourHour Desktop
# This script runs continuously and responds to commands via stdin
# Much more efficient than spawning a new PowerShell process every 2 seconds

# Load Win32 API once at startup (not on every call!)
Add-Type @"
    using System;
    using System.Runtime.InteropServices;
    using System.Text;
    public class Win32 {
        [DllImport("user32.dll")]
        public static extern IntPtr GetForegroundWindow();
        [DllImport("user32.dll")]
        public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);
        [DllImport("user32.dll", SetLastError=true)]
        public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);
    }
"@

# Signal that we're ready
Write-Output "READY"

# Main loop - wait for commands
while ($true) {
    $command = Read-Host
    
    if ($command -eq "GET") {
        try {
            $hwnd = [Win32]::GetForegroundWindow()
            $title = New-Object System.Text.StringBuilder 256
            [void][Win32]::GetWindowText($hwnd, $title, 256)
            $processId = 0
            [void][Win32]::GetWindowThreadProcessId($hwnd, [ref]$processId)
            
            $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
            
            if ($process) {
                $processName = $process.ProcessName
                $windowTitle = $title.ToString()
                Write-Output "RESULT|$processName|$windowTitle|$processId"
            } else {
                Write-Output "RESULT|unknown|No Window|0"
            }
        } catch {
            Write-Output "ERROR|$($_.Exception.Message)"
        }
    } elseif ($command -eq "EXIT") {
        break
    }
}
