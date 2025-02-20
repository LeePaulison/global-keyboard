export const useCursorManipulation = () => {
  const setCursorPosition = (elem, position) => {
    if (!elem) return;

    requestAnimationFrame(() => {
      elem.selectionStart = position;
      elem.selectionEnd = position;
      elem.focus();
    });
  };

  const getCursorPosition = (elem) => {
    if (!elem) return;

    return elem.selectionStart;
  };

  const moveCursorToPosition = (elem, position) => {
    if (!elem) return;

    elem.selectionStart = position;
    elem.selectionEnd = position;
    elem.focus();
  };

  const moveCursorToHome = (elem) => {
    if (!elem) return;

    elem.selectionStart = 0;
    elem.selectionEnd = 0;
    elem.focus();
  };

  const moveCursorToEnd = (elem) => {
    if (!elem) return;

    const length = elem.value.length;
    elem.selectionStart = length;
    elem.selectionEnd = length;
    elem.focus();
  };

  const moveCursorForwardOne = (elem) => {
    if (!elem) return;

    const position = getCursorPosition(elem);
    setCursorPosition(elem, position + 1);
  };

  const moveCursorBackwardOne = (elem) => {
    if (!elem) return;

    const position = getCursorPosition(elem);
    setCursorPosition(elem, position - 1);
  };

  const moveCursorForwardOneWord = (elem) => {
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
  };

  const moveCursorBackwardOneWord = (elem) => {
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
  };

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
