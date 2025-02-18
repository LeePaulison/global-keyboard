import { useCallback } from "react";
import { KoreanCharacterMap } from "../maps/korean";
import { constructHangul } from "../lib/constructHangul";
import { characterSetJamo } from "../lib/characterSetJamo";

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
      console.log("Buffer: ", buffer);
      const character = KoreanCharacterMap[keyCode]
        ? shiftKey
          ? KoreanCharacterMap[keyCode].shift
          : KoreanCharacterMap[keyCode].normal
        : null;

      if (character && CHOSEONG.includes(character)) {
        console.log("Choseong Character: ", character);
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
        console.log("Jungseong Character: ", character);
        if (buffer.initial && buffer.medial) {
          let newMedial = updatedBuffer.medial;
          console.log("Compound Vowel: ", character);
          const compoundKey = updatedBuffer.medial + character;
          console.log("Compound Key: ", compoundKey);
          if (compoundVowelMap[compoundKey]) {
            newMedial = compoundVowelMap[compoundKey];
            updatedBuffer.medial = newMedial;
          }
          multiVowel = true;
        } else if (buffer.initial) {
          updatedBuffer.medial = character;
        }
      } else if (JONGSEONG.includes(character)) {
        console.log("Jongseong Character: ", character);
        if (buffer.initial && buffer.medial) {
          updatedBuffer.final = character;
        }
      }

      console.log("Updated Buffer: ", updatedBuffer);
      setBuffer(updatedBuffer);

      let hangul = null;
      console.log("Hangul: ", hangul);
      if (updatedBuffer.initial && updatedBuffer.medial) {
        console.log(updatedBuffer.initial, updatedBuffer.medial, updatedBuffer.final);
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

        console.log("Two Pieces: ", hangul);
        return {
          process: "replace",
          character: hangul,
        };
      }
    },
    [CHOSEONG, JUNGSEONG, JONGSEONG, compoundVowelMap]
  );

  return { processJamo };
};
