import { ArabicCharacterMap } from "../maps/arabic";

export const useGeneratedArabic = () => {
  const processArabic = (e, buffer, setBuffer) => {
    e.preventDefault();

    const keyCode = e.code;
    const shiftKey = e.shiftKey;

    console.log("Generate Arabic - Key Pressed", e.code);

    if (keyCode === "ShiftLeft" || keyCode === "ShiftRight") {
      return;
    }

    let updatedBuffer = { ...buffer };
    let character = "";

    if (shiftKey) {
      character = ArabicCharacterMap[keyCode] ? ArabicCharacterMap[keyCode]["shift"] : "";
    }

    // characters move from isolated to initial to medial to final
    // certain characters do not connect left
    // Store previous values before overwriting them
    const previousIsolated = buffer.isolated;
    const previousInitial = buffer.initial;
    const previousMedial = buffer.medial;

    const previousKeyIsolated = buffer.keyIsolated;
    const previousKeyInitial = buffer.keyInitial;
    const previousKeyMedial = buffer.keyMedial;

    // Check if the character is a Ligature Breaker
    const isLigatureBreaker = ["KeyA", "KeyD", "KeyY", "KeyR", "KeyZ", "KeyW"].includes(keyCode);

    console.log("Before Update - Buffer:", JSON.stringify(buffer, null, 2));

    if (!previousIsolated) {
      // First character is always isolated
      character = ArabicCharacterMap[keyCode]?.isolated || "";
      console.log("Generate Arabic - Isolated Character:", character);
      updatedBuffer = {
        isolated: character,
        keyIsolated: keyCode,
      };
    } else if (isLigatureBreaker) {
      // If a ligature breaker is typed, it stays isolated and resets future connections
      character = ArabicCharacterMap[keyCode]?.isolated || "";
      console.log("Generate Arabic - Ligature Breaker Character:", character);
      updatedBuffer = {
        isolated: character,
        keyIsolated: keyCode,
      };
    } else if (!previousInitial) {
      // Second character: Move isolated → initial
      updatedBuffer = {
        isolated: ArabicCharacterMap[keyCode]?.isolated || "",
        initial: ArabicCharacterMap[previousKeyIsolated]?.initial || previousIsolated,
        keyIsolated: keyCode,
        keyInitial: previousKeyIsolated,
      };
      console.log("Generate Arabic - Initial Character:", updatedBuffer.initial);
    } else if (!previousMedial) {
      // Third character: Move initial → medial
      updatedBuffer = {
        isolated: ArabicCharacterMap[keyCode]?.isolated || "",
        initial: ArabicCharacterMap[previousKeyIsolated]?.initial || previousIsolated,
        medial: ArabicCharacterMap[previousKeyInitial]?.medial || previousInitial,
        keyIsolated: keyCode,
        keyInitial: previousKeyInitial,
        keyMedial: previousKeyInitial,
      };
      console.log("Generate Arabic - Medial Character:", updatedBuffer.medial);
    } else {
      // Fourth character: Move medial → final, ensuring transitions are correct
      updatedBuffer = {
        isolated: ArabicCharacterMap[keyCode]?.isolated || "",
        initial: ArabicCharacterMap[previousKeyMedial]?.initial || previousMedial,
        medial: ArabicCharacterMap[previousKeyInitial]?.medial || previousInitial,
        final: ArabicCharacterMap[previousKeyMedial]?.final || previousMedial,
        keyIsolated: keyCode,
        keyInitial: previousKeyInitial,
        keyMedial: previousKeyMedial,
      };
      console.log("Generate Arabic - Final Character:", updatedBuffer.final);
    }

    console.log("After Update - Buffer:", JSON.stringify(updatedBuffer, null, 2));

    setBuffer(updatedBuffer);

    // Process the buffer in a specific order: medial → initial → final → isolated
    // - Medial first: It connects two characters, so it must be updated first.
    // - Initial second: It starts a word, changing once a second letter appears.
    // - Final third: It ends a word, updating if another letter follows.
    // - Isolated last: It is a single character, never affecting others.
    // This ensures correct ligature shaping and replacement.
    const replaceOrder = ["medial", "initial", "final"];

    const resultArray = Object.keys(updatedBuffer)
      .sort((a, b) => replaceOrder.indexOf(a) - replaceOrder.indexOf(b))
      .map((key) => {
        if (key === "isolated" && updatedBuffer[key]) {
          return { process: "append", character: updatedBuffer[key] };
        }
        if (replaceOrder.includes(key) && updatedBuffer[key]) {
          return { process: "replace", character: updatedBuffer[key] };
        }
      })
      .filter(Boolean); // Remove undefined entries

    return resultArray;
  };

  return {
    processArabic,
  };
};
