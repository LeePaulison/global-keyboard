# Global Virtual Keyboard

## Overview
This project is a testbed for a custom virtual keyboard to handle multiple targetted foreign languages.

###Korean Hangul IME
**custom Hangul IME (Input Method Editor)** designed to correctly process **Korean character composition** in a React environment. It supports:
- **Choseong (Initial consonants), Jungseong (Medial vowels), and Jongseong (Final consonants)**
- **Multi-vowel (compound vowels) handling** (e.g., `ㅗ + ㅏ = ㅘ`)
- **Real-time Hangul construction**
- **Backspace handling** for stepwise deletion (`간` → `가` → `ㄱ`) - in-progress

## Features
✅ **Correct Hangul composition** following Korean orthographic rules  
✅ **Handles two-part and three-part syllables** (`초성 + 중성`, `초성 + 중성 + 종성`)  
✅ **Compound vowel merging** (`ㅗ + ㅏ = ㅘ`, `ㅜ + ㅓ = ㅝ`)  
✅ **Space handling for multi-word input**  
✅ **Backspace support** (removes 종성 first, then 중성, then 초성)  

###Russian Cyrillic 

### Arabic
- not implemented

## Installation
Clone the repository and install dependencies:
```sh
git clone <repo-url>
cd global-keyboard
npm install
