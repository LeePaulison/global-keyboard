import { characterSetJamo } from "./characterSetJamo";
export const constructHangul = (initial, medial, final = "") => {
  const { CHOSEONG, JUNGSEONG, JONGSEONG } = characterSetJamo;

  console.log("Initial: ", initial);
  console.log("Medial: ", medial);
  console.log("Final: ", final);

  const initialIndex = CHOSEONG.indexOf(initial);
  const medialIndex = JUNGSEONG.indexOf(medial);
  const finalIndex = JONGSEONG.indexOf(final);

  if (initialIndex === -1 || medialIndex === -1 || finalIndex === -1) {
    return "";
  }

  const unicode = 0xac00 + initialIndex * 21 * 28 + medialIndex * 28 + finalIndex;
  return String.fromCharCode(unicode);
};
