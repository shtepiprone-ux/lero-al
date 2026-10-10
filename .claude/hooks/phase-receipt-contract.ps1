# Shared receipt grammar for phase hooks. Keep this source ASCII-only for Windows PowerShell 5.1.
# It deliberately defines syntax only. Phase-specific policy and registry validation stay in phase-write-gate.ps1.

function Get-MobileAdaptationReceiptPattern {
    # Semicolons delimit named fields, not natural-language prose. In particular, mobile order is deliberately free
    # text and may contain semicolons; it ends only at the next required field label.
    return '(?ims)^\s*MOBILE ADAPTATION PREFLIGHT COMPLETE\s*-\s*surfaces:\s*[^;\r\n]+;\s*component families:\s*([a-z][a-z0-9-]*(?:\s*,\s*[a-z][a-z0-9-]*)*)\s*;\s*pattern IDs:\s*([a-z][a-z0-9-]*(?:\s*,\s*[a-z][a-z0-9-]*)*)\s*;\s*standards:\s*([a-z][a-z0-9-]*(?:\s*,\s*[a-z][a-z0-9-]*)*)\s*;\s*mantine mechanism:\s*([a-z][a-z0-9-]*(?:\s*,\s*[a-z][a-z0-9-]*)*)\s*;\s*mantine owner:\s*([^;\r\n]+?)\s*;\s*mobile range:\s*<\s*640px\s*\(theme\.other\.mobileGate\s*/\s*sm\);\s*mobile order:\s*(?:(?!;\s*required content:)[^\r\n])*;\s*required content:\s*no semantic loss;\s*verification:\s*[^\r\n]*<\s*640px[^\r\n]*640px'
}
