import { ArabicCharacterMap } from "../maps/arabic";

export const useGeneratedArabic = () => {
  const processArabic = (e, buffer, setBuffer) => {
    e.preventDefault();

    const keyCode = e.code;
    const shiftKey = e.shiftKey;

    console.log("Generate Arabic - Key Pressed", keyCode);

    if (keyCode === "ShiftLeft" || keyCode === "ShiftRight") {
      return;
    }

    let updatedBuffer = { ...buffer };
    let character = "";
    let triggerReset = false;

    if (shiftKey) {
      character = ArabicCharacterMap[keyCode] ? ArabicCharacterMap[keyCode]["shift"] : "";
    }

    // console.log("Updated Buffer Before:", updatedBuffer);
    // console.log("Trigger Reset:", triggerReset);

    // Handle Ligature Breaker
    if (["KeyA", "KeyD", "KeyY", "KeyR", "KeyZ", "KeyW", "KeyM"].includes(keyCode)) {
      if (buffer.isolated !== "") {
        updatedBuffer = {
          ...buffer,
          initial: ArabicCharacterMap[buffer.isolatedKey].isolated,
          final: ArabicCharacterMap[keyCode].final,
          isolated: "",
          isolatedKey: "",
          initialKey: buffer.isolatedKey,
          finalKey: keyCode,
        };
      } else if (buffer.medial !== "") {
        updatedBuffer = {
          ...buffer,
          initial: ArabicCharacterMap[buffer.initialKey].initial,
          medial: ArabicCharacterMap[buffer.medialKey].medial,
          final: ArabicCharacterMap[keyCode].final,
          finalKey: keyCode,
        };
      } else if (buffer.final !== "") {
        updatedBuffer = {
          ...buffer,
          initial: ArabicCharacterMap[buffer.initialKey].initial,
          medial: ArabicCharacterMap[buffer.finalKey].medial,
          final: ArabicCharacterMap[keyCode].final,
        };
      } else {
        updatedBuffer = {
          ...buffer,
          isolated: ArabicCharacterMap[keyCode].isolated,
          isolatedKey: keyCode,
        };
      }
      triggerReset = true;
    } else {
      if (buffer.isolated === "" && buffer.initial === "") {
        updatedBuffer = {
          ...buffer,
          isolated: ArabicCharacterMap[keyCode].isolated,
          isolatedKey: keyCode,
        };
      } else if (buffer.isolated !== "") {
        // console.log("Isolated Not Empty: ", buffer.isolatedKey);
        updatedBuffer = {
          ...buffer,
          initial: ArabicCharacterMap[buffer.isolatedKey].initial,
          final: ArabicCharacterMap[keyCode].final,
          initialKey: buffer.isolatedKey,
          finalKey: keyCode,
          isolated: "",
          isolatedKey: "",
        };
      } else {
        updatedBuffer = {
          ...buffer,
          initial: ArabicCharacterMap[buffer.initialKey].initial,
          medial: ArabicCharacterMap[buffer.finalKey].medial,
          final: ArabicCharacterMap[keyCode].final,
        };
        triggerReset = true;
      }
    }
    console.log("Updated Buffer After:", updatedBuffer);

    setBuffer(updatedBuffer);

    // Process the buffer in a specific order: medial → initial → final → isolated
    const replaceOrder = ["initial", "medial", "final"];

    const keys = Object.keys(updatedBuffer).sort((a, b) => replaceOrder.indexOf(a) - replaceOrder.indexOf(b));

    const resultArray = [];
    for (const key of keys) {
      // console.log("Key:", key, "Value:", updatedBuffer[key]);
      if (key === "isolated" && updatedBuffer[key]) {
        resultArray.push({ process: "append", character: updatedBuffer[key] });
        break;
      }
      if (replaceOrder.includes(key) && key !== "final" && updatedBuffer[key]) {
        resultArray.push({ process: "replace", character: updatedBuffer[key] });
      } else if (key === "final" && updatedBuffer[key]) {
        resultArray.push({ process: "append", character: updatedBuffer[key] });
      }
    }
    console.log("Processed Buffer - Results Array:", resultArray);

    if (triggerReset) {
      setBuffer({
        isolated: "",
        initial: "",
        medial: "",
        final: "",
        breakerFound: false,
      });
    }

    return resultArray;
  };

  return {
    processArabic,
  };
};
