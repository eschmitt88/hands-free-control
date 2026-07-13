"""Head-mouse + facial gestures — native Windows desktop app.

Direct port of the browser prototype (webapp/static/headmouse.js) to drive the
REAL OS cursor via pynput. The detection scheme is identical; only the I/O ends
change — OpenCV replaces getUserMedia, MediaPipe's Python Tasks API replaces
tasks-vision, and pynput replaces the canvas.

  pointer  = head pose (low-gain, One-Euro filtered, relative-anchor ratchet)
  clutch   = jaw-open HELD: freeze cursor, move head freely, release re-zeros
  click    = wink  (L wink -> left click, R wink -> right click; natural
                    two-eye blinks are ignored by the differential detector)
  drag     = smile toggles left-button hold (press on grab, release on drop);
             the cursor is frozen while smiling so the head-dip doesn't jerk it
  scroll   = brows up / brows down

Runs natively on Windows (NOT WSL — WSL can neither reach the USB webcam nor
inject events into the Windows desktop). See README.md.

Safety: global hotkeys work regardless of focus —
  Ctrl+Alt+P  pause / resume cursor control   (starts PAUSED)
  Ctrl+Alt+R  recenter (recapture neutral head pose)
  Ctrl+Alt+Q  quit
  Ctrl+Alt+Y / U  flip yaw / pitch direction   (first-run calibration)
  Ctrl+Alt+X  swap yaw<->pitch axes            (matrix-layout insurance)
"""
from __future__ import annotations

import argparse
import math
import os
import platform
import sys
import time
import urllib.request
from dataclasses import dataclass, field, asdict
from pathlib import Path

import cv2
import numpy as np

import mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision as mp_vision

from pynput.mouse import Controller as MouseController, Button
from pynput import keyboard

IS_WINDOWS = platform.system() == "Windows"

MODEL_URL = (
    "https://storage.googleapis.com/mediapipe-models/face_landmarker/"
    "face_landmarker/float16/1/face_landmarker.task"
)
# Search order for the model: env override, local cache, the repo's vendored
# copy (so a git checkout works offline), else download to the local cache.
HERE = Path(__file__).resolve().parent
MODEL_CANDIDATES = [
    os.environ.get("FACE_LANDMARKER_TASK", ""),
    str(HERE / "models" / "face_landmarker.task"),
    str(HERE.parent / "webapp" / "static" / "vendor" / "models" / "face_landmarker.task"),
]


# --------------------------------------------------------------------------- #
# tunables — defaults are the values the user converged on in the prototype    #
# --------------------------------------------------------------------------- #
@dataclass
class Tune:
    gain: float = 1200.0          # px per radian of head rotation
    min_cutoff: float = 1.0       # One-Euro: lower = steadier at rest
    beta: float = 0.007           # One-Euro: higher = snappier when moving
    deadzone: float = 0.0         # px; sub-deadzone motion is dropped
    wink_margin: float = 0.30     # asymmetry deviation to count as a wink
    wink_abs_min: float = 0.25    # the winking eye must actually be closing
    wink_method: str = "spike"    # "spike" (level + fast onset) | "level"
    wink_rate: float = 1.5        # min onset rate (per s) for "spike"
    jaw_thr: float = 0.45         # jawOpen score to engage the clutch
    smile_thr: float = 0.40       # smile score to toggle drag
    brow_thr: float = 0.40        # brow score to scroll
    scroll_rate: float = 14.0     # accumulator units per frame while held

    invert_yaw: bool = True       # look-right moves cursor right when True
    invert_pitch: bool = True     # look-up moves cursor up when True
    swap_axes: bool = False       # swap which forward-vector axis drives yaw

    def save(self, path: Path) -> None:
        import json
        path.write_text(json.dumps(asdict(self), indent=2))

    @classmethod
    def load(cls, path: Path) -> "Tune":
        import json
        t = cls()
        if path.exists():
            try:
                for k, v in json.loads(path.read_text()).items():
                    if hasattr(t, k):
                        setattr(t, k, v)
            except Exception:
                pass
        return t


# --------------------------------------------------------------------------- #
# One-Euro filter (Casiez 2012) — verbatim port of the JS class                #
# --------------------------------------------------------------------------- #
class OneEuro:
    def __init__(self, min_cutoff: float, beta: float, d_cutoff: float = 1.0):
        self.min_cutoff = min_cutoff
        self.beta = beta
        self.d_cutoff = d_cutoff
        self.x_prev: float | None = None
        self.dx_prev = 0.0
        self.t_prev: float | None = None

    @staticmethod
    def _alpha(cutoff: float, dt: float) -> float:
        tau = 1.0 / (2.0 * math.pi * cutoff)
        return 1.0 / (1.0 + tau / dt)

    def filter(self, x: float, t: float) -> float:
        if self.x_prev is None:
            self.x_prev = x
            self.t_prev = t
            return x
        dt = (t - self.t_prev)
        if not (dt > 0):
            dt = 1.0 / 60.0
        self.t_prev = t
        dx = (x - self.x_prev) / dt
        a_d = self._alpha(self.d_cutoff, dt)
        edx = a_d * dx + (1 - a_d) * self.dx_prev
        self.dx_prev = edx
        a = self._alpha(self.min_cutoff + self.beta * abs(edx), dt)
        xf = a * x + (1 - a) * self.x_prev
        self.x_prev = xf
        return xf


# --------------------------------------------------------------------------- #
# adaptive differential wink detector — verbatim port                          #
# --------------------------------------------------------------------------- #
class WinkDetector:
    """Track asymmetry d = blinkL - blinkR against a slow baseline and fire on a
    spike relative to it. Full blinks move both eyes (d flat -> ignored); a
    head-angle bias drifts into the baseline and cancels out. Self-calibrating."""

    def __init__(self, tune: Tune):
        self.t = tune
        self.reset()
        # live diagnostics (for the debug HUD)
        self.dbg = {"bl": 0.0, "br": 0.0, "d": 0.0, "dev": 0.0, "rate": 0.0}

    def reset(self) -> None:
        self.base_d = 0.0
        self.prev_d: float | None = None
        self.prev_t = 0.0
        self.armed_l = True
        self.armed_r = True
        self.last_fire = 0.0

    def detect(self, bl: float, br: float, now: float) -> str | None:
        t = self.t
        d = bl - br
        dev = d - self.base_d
        rate = 0.0
        if self.prev_d is not None:
            dt = max(1e-3, now - self.prev_t)
            rate = (d - self.prev_d) / dt
        self.prev_d = d
        self.prev_t = now
        self.dbg = {"bl": bl, "br": br, "d": d, "dev": dev, "rate": rate}

        level_l = dev > t.wink_margin and bl > t.wink_abs_min
        level_r = -dev > t.wink_margin and br > t.wink_abs_min
        spike = t.wink_method == "spike"
        left_cand = level_l and (not spike or rate > t.wink_rate)
        right_cand = level_r and (not spike or -rate > t.wink_rate)

        fired: str | None = None
        if now - self.last_fire > 0.250:                 # refractory
            if left_cand and self.armed_l:
                fired, self.armed_l, self.last_fire = "L", False, now
            elif right_cand and self.armed_r:
                fired, self.armed_r, self.last_fire = "R", False, now

        if dev < t.wink_margin * 0.5:                    # re-arm on relax
            self.armed_l = True
        if -dev < t.wink_margin * 0.5:
            self.armed_r = True
        if not level_l and not level_r:                  # adapt only when calm
            self.base_d = 0.97 * self.base_d + 0.03 * d
        return fired


class Edge:
    """Rising-edge trigger for toggle gestures (smile)."""
    def __init__(self) -> None:
        self.on = False

    def rise(self, active: bool) -> bool:
        if active and not self.on:
            self.on = True
            return True
        if not active:
            self.on = False
        return False


# --------------------------------------------------------------------------- #
# platform glue                                                                #
# --------------------------------------------------------------------------- #
def screen_size() -> tuple[int, int]:
    if IS_WINDOWS:
        import ctypes
        try:
            ctypes.windll.shcore.SetProcessDpiAwareness(2)   # PER_MONITOR_AWARE
        except Exception:
            try:
                ctypes.windll.user32.SetProcessDPIAware()
            except Exception:
                pass
        u = ctypes.windll.user32
        return int(u.GetSystemMetrics(0)), int(u.GetSystemMetrics(1))
    # non-Windows fallback (dev/lint only)
    try:
        import tkinter
        r = tkinter.Tk()
        w, h = r.winfo_screenwidth(), r.winfo_screenheight()
        r.destroy()
        return w, h
    except Exception:
        return 1920, 1080


def resolve_model() -> str:
    for cand in MODEL_CANDIDATES:
        if cand and Path(cand).exists():
            return cand
    dest = HERE / "models" / "face_landmarker.task"
    dest.parent.mkdir(parents=True, exist_ok=True)
    print(f"[headmouse] downloading face_landmarker.task -> {dest}")
    urllib.request.urlretrieve(MODEL_URL, dest)
    return str(dest)


# --------------------------------------------------------------------------- #
# face reading                                                                 #
# --------------------------------------------------------------------------- #
@dataclass
class Face:
    yaw: float
    pitch: float
    bs: dict


def read_face(result, swap_axes: bool) -> Face | None:
    mats = result.facial_transformation_matrixes
    if not mats:
        return None
    m = np.asarray(mats[0])
    if m.shape != (4, 4):
        return None
    # Forward (z) basis vector = third column, matching JS m[8],m[9],m[10].
    fx, fy, fz = float(m[0, 2]), float(m[1, 2]), float(m[2, 2])
    if swap_axes:
        fx, fy = fy, fx
    yaw = math.atan2(fx, fz)
    pitch = math.atan2(fy, fz)
    if not (math.isfinite(yaw) and math.isfinite(pitch)):
        return None
    bs: dict = {}
    if result.face_blendshapes:
        for c in result.face_blendshapes[0]:
            bs[c.category_name] = c.score
    return Face(yaw=yaw, pitch=pitch, bs=bs)


# --------------------------------------------------------------------------- #
# the app                                                                      #
# --------------------------------------------------------------------------- #
@dataclass
class State:
    paused: bool = True          # start paused — never grab the cursor unasked
    quit: bool = False
    recenter: bool = False       # request neutral recapture
    neutral: tuple[float, float] | None = None   # (yaw, pitch)


class HeadMouse:
    def __init__(self, tune: Tune, cam_index: int, tune_path: Path):
        self.t = tune
        self.tune_path = tune_path
        self.sw, self.sh = screen_size()
        self.mouse = MouseController()
        self.state = State()

        model = resolve_model()
        opts = mp_vision.FaceLandmarkerOptions(
            base_options=mp_python.BaseOptions(model_asset_path=model),
            running_mode=mp_vision.RunningMode.VIDEO,
            num_faces=1,
            output_face_blendshapes=True,
            output_facial_transformation_matrixes=True,
        )
        self.landmarker = mp_vision.FaceLandmarker.create_from_options(opts)

        backend = cv2.CAP_DSHOW if IS_WINDOWS else 0
        self.cap = cv2.VideoCapture(cam_index, backend)
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
        if not self.cap.isOpened():
            raise RuntimeError(f"could not open camera index {cam_index}")

        self.filt_yaw = OneEuro(tune.min_cutoff, tune.beta)
        self.filt_pitch = OneEuro(tune.min_cutoff, tune.beta)
        self.wink = WinkDetector(tune)
        self.smile_edge = Edge()

        # cursor ratchet state
        cx, cy = self.mouse.position
        self.cursor = [float(cx), float(cy)]
        self.cursor_anchor = [float(cx), float(cy)]
        self.neutral_head = (0.0, 0.0)
        self.frozen = False
        self.dragging = False
        self.scroll_accum = 0.0
        self.last_ts = 0
        self.debug = True            # start with the diagnostic HUD on
        self.fps = 0.0
        self._last_frame_t: float | None = None

    # -- hotkeys ------------------------------------------------------------- #
    def _install_hotkeys(self) -> keyboard.GlobalHotKeys:
        def toggle_pause():
            self.state.paused = not self.state.paused
            if self.state.paused and self.dragging:      # never leave a held button
                self.mouse.release(Button.left)
                self.dragging = False
            print(f"[headmouse] {'PAUSED' if self.state.paused else 'ACTIVE'}")

        def recenter():
            self.state.recenter = True

        def quit_():
            self.state.quit = True

        def flip_yaw():
            self.t.invert_yaw = not self.t.invert_yaw
            self.t.save(self.tune_path)
            print(f"[headmouse] invert_yaw = {self.t.invert_yaw}")

        def flip_pitch():
            self.t.invert_pitch = not self.t.invert_pitch
            self.t.save(self.tune_path)
            print(f"[headmouse] invert_pitch = {self.t.invert_pitch}")

        def swap_axes():
            self.t.swap_axes = not self.t.swap_axes
            self.t.save(self.tune_path)
            print(f"[headmouse] swap_axes = {self.t.swap_axes}")

        def toggle_debug():
            self.debug = not self.debug
            print(f"[headmouse] debug HUD = {self.debug}")

        hk = keyboard.GlobalHotKeys({
            "<ctrl>+<alt>+p": toggle_pause,
            "<ctrl>+<alt>+r": recenter,
            "<ctrl>+<alt>+q": quit_,
            "<ctrl>+<alt>+y": flip_yaw,
            "<ctrl>+<alt>+u": flip_pitch,
            "<ctrl>+<alt>+x": swap_axes,
            "<ctrl>+<alt>+d": toggle_debug,
        })
        hk.start()
        return hk

    # -- detection ----------------------------------------------------------- #
    def _detect(self, frame_rgb) -> Face | None:
        ts = int(time.perf_counter() * 1000)
        if ts <= self.last_ts:
            ts = self.last_ts + 1
        self.last_ts = ts
        image = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame_rgb)
        try:
            res = self.landmarker.detect_for_video(image, ts)
        except Exception:
            return None
        return read_face(res, self.t.swap_axes)

    def _reset_filters(self) -> None:
        self.filt_yaw = OneEuro(self.t.min_cutoff, self.t.beta)
        self.filt_pitch = OneEuro(self.t.min_cutoff, self.t.beta)

    def _capture_neutral(self, dur: float = 1.0) -> bool:
        print("[headmouse] capturing neutral — hold still…")
        samples: list[Face] = []
        t0 = time.perf_counter()
        while time.perf_counter() - t0 < dur:
            ok, frame = self.cap.read()
            if not ok:
                continue
            f = self._detect(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            if f:
                samples.append(f)
            self._preview(frame, f, "NEUTRAL — hold still")
            if cv2.waitKey(1) & 0xFF == 27:
                break
        if len(samples) < 3:
            print("[headmouse] no face during neutral — will retry")
            return False
        ny = sum(f.yaw for f in samples) / len(samples)
        npi = sum(f.pitch for f in samples) / len(samples)
        self.state.neutral = (ny, npi)
        self.neutral_head = (ny, npi)
        cx, cy = self.mouse.position
        self.cursor = [float(cx), float(cy)]
        self.cursor_anchor = [float(cx), float(cy)]
        self._reset_filters()
        self.wink.reset()
        print("[headmouse] neutral captured ✓")
        return True

    # -- one control step ---------------------------------------------------- #
    def _step(self, f: Face | None, now: float) -> str:
        t = self.t
        if f is None:
            return "no face"

        jaw = f.bs.get("jawOpen", 0.0) > t.jaw_thr
        smile_score = (f.bs.get("mouthSmileLeft", 0.0) + f.bs.get("mouthSmileRight", 0.0)) / 2.0
        smile_active = smile_score > t.smile_thr * 0.35   # catch the head-dip early
        frozen = jaw or smile_active

        # any freeze->unfreeze re-anchors at the current cursor (relative ratchet)
        if not frozen and self.frozen:
            self.cursor_anchor = list(self.cursor)
            self.neutral_head = (f.yaw, f.pitch)
            self._reset_filters()
        self.frozen = frozen

        mode = "MOVE"
        if not frozen:
            fy = self.filt_yaw.filter(f.yaw, now)
            fp = self.filt_pitch.filter(f.pitch, now)
            sx = -1.0 if t.invert_yaw else 1.0
            sy = -1.0 if t.invert_pitch else 1.0
            cx = self.cursor_anchor[0] + sx * t.gain * (fy - self.neutral_head[0])
            cy = self.cursor_anchor[1] + sy * t.gain * (fp - self.neutral_head[1])
            cx = max(0.0, min(self.sw - 1, cx))
            cy = max(0.0, min(self.sh - 1, cy))
            if not (t.deadzone > 0 and math.hypot(cx - self.cursor[0], cy - self.cursor[1]) <= t.deadzone):
                self.cursor = [cx, cy]
                self.mouse.position = (int(cx), int(cy))
        mode = "CLUTCH" if jaw else ("SMILE (locked)" if smile_active else "MOVE")

        # winks -> real clicks (L = left, R = right)
        w = self.wink.detect(f.bs.get("eyeBlinkLeft", 0.0), f.bs.get("eyeBlinkRight", 0.0), now)
        if w == "L":
            self.mouse.click(Button.left)
        elif w == "R":
            self.mouse.click(Button.right)

        # smile -> drag toggle: press/hold left button on grab, release on drop
        if self.smile_edge.rise(smile_score > t.smile_thr):
            if not self.dragging:
                self.mouse.press(Button.left)
                self.dragging = True
            else:
                self.mouse.release(Button.left)
                self.dragging = False
        if self.dragging:
            mode = "DRAG (smile to drop)"

        # brows up/down -> scroll (accumulator -> discrete notches)
        brow_up = max(f.bs.get("browInnerUp", 0.0),
                      f.bs.get("browOuterUpLeft", 0.0),
                      f.bs.get("browOuterUpRight", 0.0))
        brow_dn = (f.bs.get("browDownLeft", 0.0) + f.bs.get("browDownRight", 0.0)) / 2.0
        direction = 0
        if brow_up > t.brow_thr and brow_up > brow_dn:
            direction = 1
        elif brow_dn > t.brow_thr:
            direction = -1
        if direction:
            self.scroll_accum += t.scroll_rate
            while self.scroll_accum >= 30.0:             # ~one notch per 30 units
                self.mouse.scroll(0, direction)
                self.scroll_accum -= 30.0
            if not self.dragging:
                mode = "SCROLL " + ("↑" if direction > 0 else "↓")
        else:
            self.scroll_accum = 0.0
        return mode

    # -- preview window ------------------------------------------------------ #
    def _preview(self, frame_bgr, f: Face | None, mode: str) -> None:
        h, w = frame_bgr.shape[:2]
        scale = 480.0 / w
        small = cv2.resize(frame_bgr, (int(w * scale), int(h * scale)))
        status = "PAUSED" if self.state.paused else "ACTIVE"
        color = (60, 200, 60) if not self.state.paused else (60, 60, 220)
        face_txt = "face ✓" if f else "no face"
        lines = [
            f"{status}  {mode}  {self.fps:.0f}fps",
            f"{face_txt}  gain={int(self.t.gain)}",
            "Ctrl+Alt: P pause  R recenter  Q quit",
            "         Y/U flip  X swap  D debug",
        ]
        y = 22
        for i, ln in enumerate(lines):
            cv2.putText(small, ln, (10, y), cv2.FONT_HERSHEY_SIMPLEX,
                        0.5, color if i == 0 else (230, 230, 230), 1, cv2.LINE_AA)
            y += 22

        if self.debug and f is not None:
            b = f.bs
            has_bs = bool(b)
            dw = self.wink.dbg
            smile = (b.get("mouthSmileLeft", 0.0) + b.get("mouthSmileRight", 0.0)) / 2.0
            brow_up = max(b.get("browInnerUp", 0.0), b.get("browOuterUpLeft", 0.0),
                          b.get("browOuterUpRight", 0.0))
            brow_dn = (b.get("browDownLeft", 0.0) + b.get("browDownRight", 0.0)) / 2.0
            dbg_lines = [
                f"blendshapes: {'YES' if has_bs else 'NONE!'} ({len(b)})",
                f"blinkL {b.get('eyeBlinkLeft',0):.2f}  blinkR {b.get('eyeBlinkRight',0):.2f}",
                f"wink d {dw['d']:+.2f} dev {dw['dev']:+.2f} rate {dw['rate']:+.1f}",
                f"  need |dev|>{self.t.wink_margin:.2f} eye>{self.t.wink_abs_min:.2f} rate>{self.t.wink_rate:.1f}",
                f"jawOpen {b.get('jawOpen',0):.2f}  smile {smile:.2f}",
                f"browUp {brow_up:.2f}  browDn {brow_dn:.2f}",
            ]
            yy = small.shape[0] - 12 * len(dbg_lines) - 6
            for ln in dbg_lines:
                cv2.rectangle(small, (6, yy - 11), (6 + 9 * len(ln), yy + 3), (0, 0, 0), -1)
                cv2.putText(small, ln, (8, yy), cv2.FONT_HERSHEY_SIMPLEX,
                            0.4, (120, 230, 255), 1, cv2.LINE_AA)
                yy += 14
        cv2.imshow("headmouse (preview)", small)

    # -- main loop ----------------------------------------------------------- #
    def run(self) -> None:
        hk = self._install_hotkeys()
        print(f"[headmouse] screen {self.sw}x{self.sh} · camera open · "
              f"model loaded.\n[headmouse] STARTS PAUSED — press Ctrl+Alt+P to "
              f"take control, Ctrl+Alt+R to recenter, Ctrl+Alt+Q to quit.")
        if not self._capture_neutral():
            # keep trying until we get a face
            while not self.state.neutral and not self.state.quit:
                if not self._capture_neutral():
                    time.sleep(0.2)
        try:
            while not self.state.quit:
                if self.state.recenter:
                    self.state.recenter = False
                    if self.dragging:
                        self.mouse.release(Button.left)
                        self.dragging = False
                    self._capture_neutral()
                    continue
                ok, frame = self.cap.read()
                if not ok:
                    continue
                now = time.perf_counter()
                if self._last_frame_t is not None:
                    dt = now - self._last_frame_t
                    if dt > 0:
                        self.fps = 0.9 * self.fps + 0.1 * (1.0 / dt)
                self._last_frame_t = now
                f = self._detect(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
                if self.state.paused:
                    mode = "paused"
                    # keep wink diagnostics live so we can watch values safely
                    if f is not None:
                        self.wink.detect(f.bs.get("eyeBlinkLeft", 0.0),
                                         f.bs.get("eyeBlinkRight", 0.0), now)
                else:
                    mode = self._step(f, now)
                self._preview(frame, f, mode)
                if cv2.waitKey(1) & 0xFF == 27:          # Esc in preview = quit
                    break
        finally:
            if self.dragging:
                self.mouse.release(Button.left)
            hk.stop()
            self.cap.release()
            cv2.destroyAllWindows()
            self.landmarker.close()
            self.t.save(self.tune_path)
            print("[headmouse] stopped.")


def main() -> int:
    ap = argparse.ArgumentParser(description="Head-mouse + facial gestures (native).")
    ap.add_argument("--camera", type=int, default=0, help="OpenCV camera index")
    ap.add_argument("--gain", type=float, help="px per radian (override)")
    ap.add_argument("--tune-file", default=str(HERE / "tune.json"),
                    help="where per-user tuning is persisted")
    args = ap.parse_args()

    if not IS_WINDOWS:
        print("[headmouse] WARNING: not on Windows. pynput will target the local "
              "display server, and USB-webcam access may be unavailable — this app "
              "is meant to run on native Windows. Continuing for a dev/smoke check.")

    tune_path = Path(args.tune_file)
    tune = Tune.load(tune_path)
    if args.gain:
        tune.gain = args.gain

    try:
        app = HeadMouse(tune, args.camera, tune_path)
    except Exception as e:
        print(f"[headmouse] startup failed: {e}")
        return 1
    app.run()
    return 0


if __name__ == "__main__":
    sys.exit(main())
