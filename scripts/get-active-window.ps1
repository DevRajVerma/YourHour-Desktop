# Get the foreground (active) window using Win32 API
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

$hwnd = [Win32]::GetForegroundWindow()
$title = New-Object System.Text.StringBuilder 256
[void][Win32]::GetWindowText($hwnd, $title, 256)
$processId = 0
[void][Win32]::GetWindowThreadProcessId($hwnd, [ref]$processId)

$process = Get-Process -Id $processId -ErrorAction SilentlyContinue

if ($process) {
    $processName = $process.ProcessName
    $windowTitle = $title.ToString()
    
    Write-Output "$processName|$windowTitle|$processId"
}
