import { useCallback } from "react";

export const useCursorManipulation = () => {
  const setCursorPosition = useCallback((elem, position) => {
    if (!elem) return;

    elem.selectionStart = position;
    elem.selectionEnd = position;
    elem.focus();
  }, []);

  const getCursorPosition = useCallback((elem) => {
    if (!elem) return;

    return elem.selectionStart;
  }, []);

  const moveCursorToPosition = useCallback((elem, position) => {
    if (!elem) return;

    elem.selectionStart = position;
    elem.selectionEnd = position;
    elem.focus();
  }, []);

  const moveCursorToHome = useCallback((elem) => {
    if (!elem) return;

    elem.selectionStart = 0;
    elem.selectionEnd = 0;
    elem.focus();
  }, []);

  const moveCursorToEnd = useCallback((elem) => {
    if (!elem) return;

    const length = elem.value.length;
    elem.selectionStart = length;
    elem.selectionEnd = length;
    elem.focus();
  }, []);

  const moveCursorForwardOne = useCallback(
    (elem) => {
      if (!elem) return;

      const position = getCursorPosition(elem);
      setCursorPosition(elem, position + 1);
    },
    [getCursorPosition, setCursorPosition]
  );

  const moveCursorBackwardOne = useCallback(
    (elem) => {
      if (!elem) return;

      const position = getCursorPosition(elem);
      setCursorPosition(elem, position - 1);
    },
    [getCursorPosition, setCursorPosition]
  );

  const moveCursorForwardOneWord = useCallback(
    (elem) => {
      if (!elem) return;

      let position = getCursorPosition(elem);
      const value = elem.value;

      while (position < value.length && /\S/.test(value[position])) {
        position++;
      }

      while (position < value.length && /\s/.test(value[position])) {
        position++;
      }

      setCursorPosition(elem, position);
    },
    [getCursorPosition, setCursorPosition]
  );

  const moveCursorBackwardOneWord = useCallback(
    (elem) => {
      if (!elem) return;

      let position = getCursorPosition(elem);
      const value = elem.value;

      while (position > 0 && /\S/.test(value[position - 1])) {
        position--;
      }

      while (position > 0 && /\s/.test(value[position - 1])) {
        position--;
      }

      setCursorPosition(elem, position);
    },
    [getCursorPosition, setCursorPosition]
  );

  return {
    setCursorPosition,
    getCursorPosition,
    moveCursorToPosition,
    moveCursorToHome,
    moveCursorToEnd,
    moveCursorForwardOne,
    moveCursorBackwardOne,
    moveCursorForwardOneWord,
    moveCursorBackwardOneWord,
  };
};
