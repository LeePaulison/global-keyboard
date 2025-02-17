import { useState, useEffect } from "react";

import { KoreanCharacterMap } from "../maps/korean";

// Define Hangul composition rules
const CHO = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ".split("");
const JUNG = "ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ".split("");
const JONG = "ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ".split("");

// Example key mapping from `event.code` to Hangul characters
const hangulMap = KoreanCharacterMap;

/**
 * Converts indices into a Hangul syllable
 */
const composeHangul = (choIdx, jungIdx, jongIdx = -1) => {
  if (choIdx === null || jungIdx === null) return ""; // No valid syllable yet
  const baseCode = 0xac00;
  return String.fromCharCode(baseCode + choIdx * 588 + jungIdx * 28 + (jongIdx + 1));
};

/**
 * Custom Hook: Handles Hangul Composition via Keystrokes in an Input or TextArea
 */
const useHangulInput = (ref) => {
  const [buffer, setBuffer] = useState({ cho: null, jung: null, jong: null });
  const [text, setText] = useState("");

  useEffect(() => {
    if (!ref?.current) return;

    const handleKeyPress = (event) => {
      const key = event.code;
      if (!hangulMap[key] && key !== "Backspace") return;

      event.preventDefault(); // Prevent normal input behavior
      const char = hangulMap[key];

      setBuffer((prev) => {
        let newBuffer = { ...prev };

        if (key === "Backspace") {
          // Handle deletion logic: Remove last typed character or decompose Hangul
          if (prev.jong !== null) {
            newBuffer.jong = null; // Remove 종성 first
          } else if (prev.jung !== null) {
            newBuffer.jung = null; // Then 중성
          } else if (prev.cho !== null) {
            newBuffer.cho = null; // Finally 초성
          } else {
            setText((prevText) => prevText.slice(0, -1)); // If no buffer, delete last char
          }
          return newBuffer;
        }

        if (CHO.includes(char)) {
          if (prev.cho === null) {
            newBuffer.cho = CHO.indexOf(char);
          } else {
            newBuffer.jong = JONG.indexOf(char);
          }
        } else if (JUNG.includes(char)) {
          newBuffer.jung = JUNG.indexOf(char);
        }

        if (newBuffer.cho !== null && newBuffer.jung !== null) {
          const newHangul = composeHangul(newBuffer.cho, newBuffer.jung, newBuffer.jong);
          setText((prevText) => prevText.slice(0, -1) + newHangul); // Replace last char
          return { cho: null, jung: null, jong: null }; // Reset buffer
        }

        return newBuffer;
      });
    };

    const inputEl = ref.current;
    inputEl.addEventListener("keydown", handleKeyPress);
    return () => inputEl.removeEventListener("keydown", handleKeyPress);
  }, [ref]);

  return text;
};

export default useHangulInput;
