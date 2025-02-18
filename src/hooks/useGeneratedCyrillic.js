import { useCallback } from "react";

import { RussianCharacterMap } from "../maps/russian";

export const useGeneratedCyrillic = () => {
  const processCyrillic = useCallback((e) => {
    e.preventDefault();

    const keyCode = e.code;
    const shiftKey = e.shiftKey;

    console.log("Key Code: ", keyCode);

    if (keyCode === "ShiftLeft" || keyCode === "ShiftRight") {
      return;
    }

    const character = RussianCharacterMap[keyCode]
      ? shiftKey
        ? RussianCharacterMap[keyCode].shift
        : RussianCharacterMap[keyCode].normal
      : null;

    if (character) {
      return character;
    }
    return null;
  }, []);

  return {
    processCyrillic,
  };
};
