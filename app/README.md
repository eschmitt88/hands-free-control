# Native head-mouse app

Drives the **real Windows cursor** with head pose + facial gestures. This is the
native port of the browser prototype in `../webapp/` — same detection scheme
(head-pose pointer, One-Euro filter, relative-anchor clutch, adaptive
differential wink detector, smile-drag, brow-scroll), but the browser sandbox is
replaced by OpenCV (webcam), MediaPipe's Python Tasks API (face landmarks +
blendshapes + transformation matrix), and `pynput` (real mouse events).

## Why native Windows, not WSL

The app needs two things WSL2 specifically isolates you from:

1. **Injecting mouse/keyboard events into the Windows desktop.** `pynput` inside
   WSL controls the *Linux* display server in the WSL sandbox, not Windows — so
   the cursor would never move.
2. **Direct USB-webcam access.** WSL2 doesn't expose USB cameras without fiddly
   `usbipd` passthrough, and even then OpenCV reads are unreliable.

Run it on **native Windows Python** (3.11 or 3.12). MediaPipe ships Windows
wheels for those; 3.13 may not yet.

## Setup

```powershell
cd app
./setup.ps1            # installs uv (if needed) + Python 3.12 + deps
uv run python headmouse.py
```

`setup.ps1` uses `uv` (your tool of record — it runs natively on Windows). If
you'd rather use the python.org installer instead, install Python 3.12, then:

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python headmouse.py
```

The face-landmark model (`face_landmarker.task`, ~3.7 MB) is found from the
repo's vendored copy under `../webapp/static/vendor/models/`, or auto-downloaded
to `app/models/` on first run.

## Controls

The app **starts paused** — it never grabs your cursor unasked. Global hotkeys
work regardless of which window has focus:

| Hotkey | Action |
| --- | --- |
| `Ctrl+Alt+P` | pause / resume cursor control |
| `Ctrl+Alt+R` | recenter (recapture the neutral head pose) |
| `Ctrl+Alt+Q` | quit |
| `Ctrl+Alt+Y` / `U` | flip yaw / pitch direction (first-run calibration) |
| `Ctrl+Alt+X` | swap yaw↔pitch axes (matrix-layout insurance) |

Gestures while active:

| Gesture | Action |
| --- | --- |
| turn / nod head | move cursor (low-gain, closed-loop) |
| **jaw open (hold)** | clutch — freeze cursor, reposition head, release re-zeros |
| **left / right wink** | left / right click (natural two-eye blinks are ignored) |
| **smile** | toggle drag (grab → move → smile again to drop) |
| **brows up / down** | scroll up / down |

## First-run calibration

Closed-loop control forgives a coarse gain, so calibration is quick:

1. Launch; hold still for the 1-second neutral capture.
2. Press `Ctrl+Alt+P` to take control. Turn your head right — the cursor should
   go right; nod down — it should go down. If either axis is reversed, hit
   `Ctrl+Alt+Y` (yaw) or `Ctrl+Alt+U` (pitch). If turning your head moves the
   cursor *vertically* (a matrix-layout mismatch), hit `Ctrl+Alt+X` once.
3. Tune gain with `--gain <px_per_rad>` (default 1200). All tuning persists to
   `app/tune.json`.

## Notes / current limitations

- Cursor is clamped to the **primary** monitor's bounds; multi-monitor spanning
  is a follow-up.
- The voice layer (Web Speech → LLM intent, in `../webapp/`) is not yet wired
  into the native app; that plus local Whisper is the next build.
- `tune.json` and `models/` are gitignored (per-user / large binary).
