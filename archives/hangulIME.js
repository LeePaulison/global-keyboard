import { KoreanCharacterMap } from "../maps/korean";

const CHOSEONG = [
  "ㄱ",
  "ㄲ",
  "ㄴ",
  "ㄷ",
  "ㄸ",
  "ㄹ",
  "ㅁ",
  "ㅂ",
  "ㅃ",
  "ㅅ",
  "ㅆ",
  "ㅇ",
  "ㅈ",
  "ㅉ",
  "ㅊ",
  "ㅋ",
  "ㅌ",
  "ㅍ",
  "ㅎ",
];
const JUNGSEONG = [
  "ㅏ",
  "ㅐ",
  "ㅑ",
  "ㅒ",
  "ㅓ",
  "ㅔ",
  "ㅕ",
  "ㅖ",
  "ㅗ",
  "ㅘ",
  "ㅙ",
  "ㅚ",
  "ㅛ",
  "ㅜ",
  "ㅝ",
  "ㅞ",
  "ㅟ",
  "ㅠ",
  "ㅡ",
  "ㅢ",
  "ㅣ",
];
const JONGSEONG = [
  "",
  "ㄱ",
  "ㄲ",
  "ㄳ",
  "ㄴ",
  "ㄵ",
  "ㄶ",
  "ㄷ",
  "ㄹ",
  "ㄺ",
  "ㄻ",
  "ㄼ",
  "ㄽ",
  "ㄾ",
  "ㄿ",
  "ㅀ",
  "ㅁ",
  "ㅂ",
  "ㅄ",
  "ㅅ",
  "ㅆ",
  "ㅇ",
  "ㅈ",
  "ㅊ",
  "ㅋ",
  "ㅌ",
  "ㅍ",
  "ㅎ",
];

const constructHangul = (initial, medial, final = "") => {
  const initialIndex = CHOSEONG.indexOf(initial);
  const medialIndex = JUNGSEONG.indexOf(medial);
  const finalIndex = JONGSEONG.indexOf(final);

  if (initialIndex === -1 || medialIndex === -1) return null;

  const baseCode = 0xac00;

  const unicodeValue = baseCode + initialIndex * (21 * 28) + medialIndex * 28 + finalIndex;

  return String.fromCharCode(unicodeValue);
};

export const HangulIME = (eventChar, storage) => {
  console.log("HangulIME", eventChar.code);
  const shiftKey = eventChar.shiftKey;
  const keyCode = eventChar.code;

  const buffer = [];
  console.log("Buffer: ", buffer);

  if (keyCode === "Backspace") {
    storage((prev) => prev.slice(0, -1));
    return;
  }

  if (keyCode === "Delete") {
    storage(() => "");
    return;
  }

  if (keyCode === "Enter") {
    storage((prev) => prev + "\n");
    return;
  }

  if (keyCode === "Tab") {
    storage((prev) => prev + "\t");
    return;
  }

  if (keyCode === "Escape") {
    storage(() => "");
    return;
  }

  if (keyCode === "Space") {
    storage((prev) => prev + " ");
    return;
  }

  if (keyCode === "ShiftLeft" || keyCode === "ShiftRight") {
    return;
  }

  const character = shiftKey ? KoreanCharacterMap[keyCode].shift : KoreanCharacterMap[keyCode].normal;
  console.log("Jamo Character: ", character);
  if (buffer.length < 3) {
    buffer.push(character);
  }

  if (buffer.length > 2) {
    const hangul = constructHangul(buffer[0], buffer[1], buffer[2]);
    storage((prev) => prev + hangul);
    buffer.length = 0;
    return;
  }
};
