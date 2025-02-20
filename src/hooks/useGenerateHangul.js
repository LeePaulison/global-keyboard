import { useCallback } from "react";
import { KoreanCharacterMap } from "../maps/korean";
import { constructHangul } from "../lib/constructHangul";
import { characterSetJamo } from "../lib/characterSetJamo";

const deconstructHangul = (char) => {
  // character is a Hangul character
  const unicode = char.charCodeAt(0) - 0xac00;

  // character is not a Hangul character - it is a Jamo character
  if (unicode < 0 || unicode > 11171) {
    return { initial: char, medial: "", final: "" };
  }

  const initialIndex = Math.floor(unicode / (21 * 28));
  const medialIndex = Math.floor((unicode % (21 * 28)) / 28);
  const finalIndex = unicode % 28;

  const initial = characterSetJamo.CHOSEONG[initialIndex];
  const medial = characterSetJamo.JUNGSEONG[medialIndex];
  const final = characterSetJamo.JONGSEONG[finalIndex];

  return { initial, medial, final };
};

export const useGenerateHangul = () => {
  const { CHOSEONG, JUNGSEONG, JONGSEONG, compoundVowelMap } = characterSetJamo;

  const processJamo = useCallback(
    (event, buffer, setBuffer, setText) => {
      event.preventDefault();

      const keyCode = event.code;
      const shiftKey = event.shiftKey;
      let multiVowel = false;

      if (keyCode === "ShiftLeft" || keyCode === "ShiftRight") {
        return;
      }

      if (keyCode === "Space") {
        setText((prev) => prev + " ");
        setBuffer({ initial: "", medial: "", final: "" });
      }

      let updatedBuffer = { ...buffer };
      const character = KoreanCharacterMap[keyCode]
        ? shiftKey
          ? KoreanCharacterMap[keyCode].shift
          : KoreanCharacterMap[keyCode].normal
        : null;

      if (character && CHOSEONG.includes(character)) {
        if (buffer.initial && buffer.medial) {
          if (!buffer.final && JONGSEONG.includes(character)) {
            updatedBuffer.final = character;
          } else {
            // started a new Hangul character
            setBuffer({ initial: character, medial: "", final: "" });
          }
        } else {
          updatedBuffer.initial = character;
          setBuffer(updatedBuffer);
          return {
            process: "append",
            character: character,
          };
        }
      } else if (JUNGSEONG.includes(character)) {
        if (buffer.initial && buffer.medial) {
          let newMedial = updatedBuffer.medial;
          const compoundKey = updatedBuffer.medial + character;
          if (compoundVowelMap[compoundKey]) {
            newMedial = compoundVowelMap[compoundKey];
            updatedBuffer.medial = newMedial;
          }
          multiVowel = true;
        } else if (buffer.initial) {
          updatedBuffer.medial = character;
        }
      } else if (JONGSEONG.includes(character)) {
        if (buffer.initial && buffer.medial) {
          updatedBuffer.final = character;
        }
      }

      setBuffer(updatedBuffer);

      let hangul = null;
      if (updatedBuffer.initial && updatedBuffer.medial) {
        hangul = constructHangul(updatedBuffer.initial, updatedBuffer.medial, updatedBuffer.final);

        if (keyCode === "Space" && hangul) {
          setBuffer({ initial: "", medial: "", final: "" });
          hangul = null;
          return {
            process: "append",
            character: " ",
          };
        } else if (updatedBuffer.final) {
          setBuffer({ initial: "", medial: "", final: "" });
          return {
            process: "replace",
            character: hangul,
          };
        } else if (multiVowel) {
          setBuffer({ initial: "", medial: "", final: "" });
          multiVowel = false;
          return {
            process: "replace",
            character: hangul,
          };
        }

        return {
          process: "replace",
          character: hangul,
        };
      }
    },
    [CHOSEONG, JUNGSEONG, JONGSEONG, compoundVowelMap]
  );

  const processBackspace = useCallback(
    (charToDelete) => {
      const { initial, medial, final } = deconstructHangul(charToDelete);

      if (final) {
        return {
          process: "replace",
          character: constructHangul(initial, medial, ""),
        };
      } else if (medial) {
        const compoundKey = Object.keys(compoundVowelMap).find((key) => compoundVowelMap[key] === medial);
        if (compoundKey) {
          const [first, second] = compoundKey.split("");
          return {
            process: "replace",
            character: constructHangul(initial, first, ""),
          };
        }

        return {
          process: "replace",
          character: initial,
          resetBuffer: true,
        };
      } else if (initial) {
        return {
          process: "replace",
          character: "",
          resetBuffer: true,
        };
      } else {
        return {
          process: "replace",
          character: "",
          resetBuffer: true,
        };
      }
    },
    [compoundVowelMap]
  );

  return { processJamo, processBackspace };
};
