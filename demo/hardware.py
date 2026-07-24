#!/usr/bin/env python3
"""Erkennt Arbeitsspeicher und Grafikkarte und waehlt das passende Modell.

Damit niemand entscheiden muss, welches Modell auf welche Maschine passt.

    python3 hardware.py          # zeigt Hardware und Empfehlung
    python3 hardware.py --nur-modell   # gibt nur den Modellnamen aus (fuer Skripte)
"""

import ctypes
import os
import subprocess
import sys

# Untergrenze RAM in GB -> Modell. Absteigend geprueft.
STUFEN = [
    (32, "qwen2.5:14b", "grosses Modell, deutlich genauer bei Belegen"),
    (16, "llama3.1:8b", "guter Kompromiss aus Tempo und Qualitaet"),
    (8, "llama3.2:3b", "klein und schnell, reicht fuer die Demo"),
    (0, "llama3.2:1b", "Notnagel - Ergebnisse werden ungenau"),
]


def ram_gb() -> float:
    """Arbeitsspeicher in GB, plattformuebergreifend."""
    if sys.platform == "win32":
        class Status(ctypes.Structure):
            _fields_ = [("dwLength", ctypes.c_ulong),
                        ("dwMemoryLoad", ctypes.c_ulong),
                        ("ullTotalPhys", ctypes.c_ulonglong),
                        ("ullAvailPhys", ctypes.c_ulonglong),
                        ("ullTotalPageFile", ctypes.c_ulonglong),
                        ("ullAvailPageFile", ctypes.c_ulonglong),
                        ("ullTotalVirtual", ctypes.c_ulonglong),
                        ("ullAvailVirtual", ctypes.c_ulonglong),
                        ("ullAvailExtendedVirtual", ctypes.c_ulonglong)]
        status = Status()
        status.dwLength = ctypes.sizeof(Status)
        ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(status))
        return status.ullTotalPhys / 1024**3

    if sys.platform == "darwin":
        roh = subprocess.run(["sysctl", "-n", "hw.memsize"],
                             capture_output=True, text=True, check=True)
        return int(roh.stdout.strip()) / 1024**3

    return (os.sysconf("SC_PAGE_SIZE") * os.sysconf("SC_PHYS_PAGES")) / 1024**3


def vram_gb() -> float:
    """VRAM der ersten NVIDIA-Karte in GB, 0 wenn keine gefunden."""
    try:
        roh = subprocess.run(
            ["nvidia-smi", "--query-gpu=memory.total", "--format=csv,noheader,nounits"],
            capture_output=True, text=True, timeout=10,
        )
        if roh.returncode == 0 and roh.stdout.strip():
            return int(roh.stdout.strip().splitlines()[0]) / 1024
    except (FileNotFoundError, subprocess.TimeoutExpired, ValueError):
        pass
    return 0.0


def apple_silicon() -> bool:
    """Auf M-Chips teilen sich CPU und GPU den Speicher - laeuft deutlich besser."""
    return sys.platform == "darwin" and os.uname().machine == "arm64"


def waehlen() -> tuple[str, float, float, str]:
    """Gibt (modell, ram, vram, begruendung) zurueck."""
    ram, vram = ram_gb(), vram_gb()

    # Massgeblich ist der Speicher, der dem Modell zur Verfuegung steht.
    # Dedizierte Karte: VRAM zaehlt und ist schneller als RAM.
    massgeblich = max(ram, vram * 2) if vram >= 6 else ram
    if apple_silicon():
        massgeblich = ram

    for untergrenze, modell, hinweis in STUFEN:
        if massgeblich >= untergrenze:
            return modell, ram, vram, hinweis
    return STUFEN[-1][1], ram, vram, STUFEN[-1][2]


def main() -> None:
    modell, ram, vram, hinweis = waehlen()

    if "--nur-modell" in sys.argv:
        print(modell)
        return

    print(f"Arbeitsspeicher : {ram:.1f} GB")
    if vram:
        print(f"Grafikspeicher  : {vram:.1f} GB (NVIDIA)")
    elif apple_silicon():
        print("Grafik          : Apple Silicon, gemeinsamer Speicher")
    else:
        print("Grafikspeicher  : keine dedizierte Karte gefunden")
    print(f"Modell          : {modell}")
    print(f"                  {hinweis}")

    if ram < 8:
        print("\nWarnung: Unter 8 GB wird es zaeh und die Ergebnisse werden ungenau.")


if __name__ == "__main__":
    main()
