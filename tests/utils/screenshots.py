from __future__ import annotations

import re
from pathlib import Path


def save_screenshot(driver, nodeid: str) -> Path:
    destination = Path("screenshots")
    destination.mkdir(exist_ok=True)
    filename = re.sub(r"[^A-Za-z0-9_.-]+", "_", nodeid) + ".png"
    path = destination / filename
    driver.save_screenshot(str(path))
    return path
