source: https://talonvoice.com/docs/
fetched: 2026-07-01
title: Talon Voice Documentation

# Talon Voice Documentation Summary

## Core Purpose
Talon is a hands-free input system designed to enable "programming, realtime video gaming, command line, and full desktop computer proficiency" for people with limited hand mobility, while enhancing productivity for all users.

## Primary Features

**Voice Control**
- Includes a built-in free speech recognition engine
- Compatible with Dragon speech recognition software without additional setup
- Commands defined via `.talon` files using a custom grammar syntax

**Eye Tracking**
- Multiple algorithms for mouse control via eye movement
- Requires compatible eye trackers: Tobii 4C, Tobii 5, or equivalent devices

**Noise Recognition**
- Detects "pop" and "hiss" sounds for additional input control
- Expandable for additional noise recognition in future releases

**Mouse & Keyboard Control**
- Fully programmable keyboard and mouse automation
- Python 3 scripting via embedded CPython (no external Python installation required)
- Modular architecture allowing use of individual features independently

## System Architecture

**Scripting & Customization**
- `.talon` files define voice commands, hotkeys, and context-specific behaviors
- Python API with decorators for actions, captures, lists, modes, settings, and scopes
- Application matching via window titles and app names

**Supported Platforms**
- Windows 8+
- macOS High Sierra (10.13)+
- Linux/X11 (Ubuntu 18.04+); Wayland not supported

The system uses "Conformer" as its speech recognition model, installed via the application menu.
