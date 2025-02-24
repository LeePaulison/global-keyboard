import { useState, useRef, useEffect } from "react";
import "./App.css";
import "@radix-ui/themes/styles.css";
import { Box, Flex, Text, Theme } from "@radix-ui/themes";
import { Form, DropdownMenu } from "radix-ui";
import { KeyboardIcon } from "@radix-ui/react-icons";

// IME's - Input Method Editors
import { useGenerateHangul } from "./hooks/useGenerateHangul";
import { useGeneratedCyrillic } from "./hooks/useGeneratedCyrillic";
import { useGeneratedArabic } from "./hooks/useGeneratedArabic";
// Cursor Manipulation
import { useCursorManipulation } from "./hooks/useCursorManipulation";

function App() {
  const [text, setText] = useState("");
  const [selectedKeyboard, setSelectedKeyboard] = useState("arabic");
  const [open, setOpen] = useState(false);

  // temporary state for debugging
  const [fileName, setFileName] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [keymap, setKeymap] = useState({});
  const textAreaRef = useRef(null);
  const cursorPosition = useRef(0);

  //IME's
  const { processJamo, processBackspace } = useGenerateHangul();
  const [buffer, setBuffer] = useState({ isolated: "", initial: "", medial: "", final: "", shift: "" });
  const { processCyrillic } = useGeneratedCyrillic();
  const { processArabic } = useGeneratedArabic();
  // Cursor Manipulation
  const { setCursorPosition, getCursorPosition, moveCursorToPosition, moveCursorToHome, moveCursorToEnd, moveCursorForwardOne, moveCursorBackwardOne } = useCursorManipulation();


  const parseXMLFile = (fileContents) => {
    if (!fileContents) return;

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(fileContents, "text/xml");

    const layout = {};
    const keys = xmlDoc.getElementsByTagName("PK");

    for (let key of keys) {
      const keyCode = key.getAttribute("VK");

      if (!keyCode) continue;

      const results = key.getElementsByTagName("Result");
      let normal = "";
      let shift = "";
      let altGr = "";

      for (let result of results) {
        const text = result.getAttribute("Text") || "";
        const withShift = result.getAttribute("With");

        if (!withShift) normal = text;
        if (withShift === "VK_SHIFT") shift = text;
        if (withShift === "VK_CONTROL VK_MENU") altGr = text;
      }
      const formattedKeyCode = keyCode.replace("VK_", "Key");
      layout[formattedKeyCode] = { normal, shift, altGr };
    }

    return layout;
  };

  const handleFileChange = (e, storage) => {
    if (e.target.files.length < 1) return;

    const file = e.target.files[0];
    setFileName(file.name);

    if (file.type !== "text/xml") return setFileError("File must be a .xml file");

    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result;

      const mapJson = parseXMLFile(content);

      storage((prev) => {
        if (prev !== mapJson) {
          return mapJson;
        }
        return prev;
      })
    };

    reader.onError = (error) => {
      setFileError("Error reading file. Error: " + error);
    }

    reader.readAsText(file);
  };

  const handleKeyboardChange = (e, keyboard, func) => {
    e.preventDefault();
    func((prev) => {
      if (prev !== keyboard) {
        return keyboard;
      }
      return prev;
    });
  };

  const mapKeyPressToCharacter = (e, content, func) => {
    e.preventDefault();

    const { selectionStart, selectionEnd } = e.target;

    const keyCode = e.code;

    // Arrow keys
    if (keyCode === "ArrowLeft" && selectionStart > 0) {
      moveCursorBackwardOne(textAreaRef.current);
      return;
    }

    if (keyCode === "ArrowRight" && selectionStart < content.length) {
      moveCursorForwardOne(textAreaRef.current);
      return;
    }

    if (keyCode === "Space") {
      func((prev) => prev.slice(0, selectionStart) + " " + prev.slice(selectionStart));
      textAreaRef.current = selectionStart + 1;
      return;
    }

    // Backspace key
    if (keyCode === "Backspace") {
      cursorPosition.current = selectionStart - 1;
      if (selectedKeyboard === "korean") {
        if (selectionStart === 0) return;

        const charBeforeCursor = content[selectionStart - 1];

        const result = processBackspace(charBeforeCursor);

        if (result.process === "replace") {
          func((prev) => prev.slice(0, selectionStart - 1) + result.character + prev.slice(selectionStart));

          requestAnimationFrame(() => {
            setCursorPosition(textAreaRef.current, selectionStart);
          });

        } else if (result.process === "delete") {
          func((prev) => prev.slice(0, selectionStart - 1) + prev.slice(selectionStart));

          requestAnimationFrame(() => {
            moveCursorBackwardOne(textAreaRef.current);
          });
        }

        if (result.resetBuffer) {
          setBuffer({ initial: "", medial: "", final: "" });
        }

      } else if (selectedKeyboard === "russian") {
        func((prev) => prev.slice(0, selectionStart - 1) + prev.slice(selectionStart));
        cursorPosition.current = selectionStart - 1;
      } else if (selectedKeyboard === "arabic") {
        func((prev) => prev.slice(0, selectionStart - 1) + prev.slice(selectionStart));
        requestAnimationFrame(() => {
          setCursorPosition(textAreaRef.current, selectionStart - 1);
        }
        );
      }
      return;
    }

    // Delete key
    if (keyCode === "Delete" && selectionStart < content.length) {
      func((prev) => prev.slice(0, selectionStart) + prev.slice(selectionStart + 1));
      requestAnimationFrame(() => {
        setCursorPosition(textAreaRef.current, selectionStart);
      }
      );
      return;
    }

    // IME's
    if (selectedKeyboard === "korean") {
      const result = processJamo(e, buffer, setBuffer);

      if (result) {
        if (result.process === "append") {
          func((prev) => prev.slice(0, selectionStart) + result.character + prev.slice(selectionStart));
          requestAnimationFrame(() => {
            setCursorPosition(textAreaRef.current, selectionStart + 1);
          }
          );
        } else if (result.process === "replace") {
          func((prev) => prev.slice(0, selectionStart - 1) + result.character + prev.slice(selectionStart));
          requestAnimationFrame(() => {
            setCursorPosition(textAreaRef.current, selectionStart);
          }
          );
        }
      }

      return;
    } else if (selectedKeyboard === "russian") {
      const result = processCyrillic(e);

      console.log("Result: ", result);

      if (result) {
        func((prev) => prev.slice(0, selectionStart) + result + prev.slice(selectionStart));
      }
      requestAnimationFrame(() => {
        setCursorPosition(textAreaRef.current, selectionStart + 1);
      }
      );
      return;
    } else if (selectedKeyboard === "arabic") {
      const resultsArray = processArabic(e, buffer, setBuffer);

      if (resultsArray) {
        console.log("Selection Start: ", selectionStart);
        const replaceCount = resultsArray.filter((result) => result.process === "replace").length;
        console.log("Replace Count: ", replaceCount);
        let currentSelectionStart = selectionStart + replaceCount;
        console.log("Current Selection Start: ", currentSelectionStart);

        resultsArray.forEach((result) => {
          if (result.process === "replace") {
            func((prev) => prev.slice(0, currentSelectionStart) + result.character + prev.slice(currentSelectionStart + 1));
            currentSelectionStart -= 1;
            console.log("Replaced Current Selection Start: ", currentSelectionStart);
          } else if (result.process === "append") {
            func((prev) => prev.slice(0, currentSelectionStart) + result.character + prev.slice(currentSelectionStart));
            console.log("Appended Current Selection Start: ", currentSelectionStart);
          }
        });

        requestAnimationFrame(() => {
          setCursorPosition(textAreaRef.current, currentSelectionStart);
          console.log("Cursor Set to: ", currentSelectionStart);
        });
      };

      return;
    };
  };

  const alignText = (keyboard) => {
    switch (keyboard) {
      case "arabic":
        return "text-right";
      case "korean":
        return "text-left";
      case "russian":
        return "text-left";
      default:
        return "text-left";
    }
  };

  useEffect(() => {
    console.log([...text].map((char) => char.charCodeAt(0).toString(16)));
  }, [text]);

  return (
    <Theme>
      <Box className="h-screen bg-gray-900">
        <Flex
          direction="column"
          gap="3"
          align={"center"}
          justify={"center"}
          className="w-full max-w-screen-lg mx-auto bg-gray-300 border-x border-gray-300 p-4 h-full"
        >
          <Flex direction={"column"} gap="3" className="w-full max-w-screen-md border-b border-gray-500" align={"center"}>
            <Text className="text-gray-900 font-bold">Entered Text:</Text>
            <Text className="min-h-[1.5rem]">{text}</Text>
          </Flex>
          <Form.Root className="w-full">
            {/*             <Form.Field name="file-upload">
              <Form.Label>Keyboard Layout .XLM File Upload: </Form.Label>
              <Form.Control asChild>
                <input type="file" accept=".xml" onChange={(e) => handleFileChange(e, setKeymap)} className="border border-gray-500 rounded-md p-2" />
              </Form.Control>
            </Form.Field>
 */}            <Text className="text-gray-900 font-bold">
              Current Keyboard:{" "}
              {selectedKeyboard.charAt(0).toUpperCase() +
                selectedKeyboard.slice(1)}
            </Text>
            <Form.Field name="text-entry">
              <Form.Label>Text Entry: </Form.Label>
              <Form.Control asChild>
                <textarea
                  ref={textAreaRef}
                  value={text}
                  onKeyDown={(e) => {
                    mapKeyPressToCharacter(
                      e,
                      text,
                      setText
                    )
                  }
                  }
                  onClick={(e) => {
                    const cursorPos = getCursorPosition(e.target)
                    console.log("Clicked Cursor Position: ", cursorPos);
                  }}
                  onChange={(e) => console.log([e.target.value.map((char) => char.charCodeAt(0).toString(16))])}
                  readOnly
                  rows={10}
                  dir={selectedKeyboard === "arabic" ? "rtl" : "ltr"}
                  className={`caret-black border border-gray-500 rounded-md p-2 w-full ${alignText(
                    selectedKeyboard
                  )}`}
                  style={selectedKeyboard === "arabic" ? { fontFeatureSettings: '"liga" 0, "dlig" 0, "calt" 0' } : {}}
                  id="text-entry"
                />
              </Form.Control>
            </Form.Field>
          </Form.Root>
          <Text className="text-gray-900 font-bold">Select Keyboard:</Text>
          <DropdownMenu.Root open={open} onOpenChange={setOpen}>
            <DropdownMenu.Trigger>
              <KeyboardIcon width={32} height={32} className="text-gray-300" />
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
              <DropdownMenu.Item
                onSelect={(e) => {
                  setOpen(false);
                  handleKeyboardChange(e, "arabic", setSelectedKeyboard);
                }}
                className={`px-3 py-2 cursor-pointer rounded-md hover:bg-gray-700 hover:text-white ${selectedKeyboard === "arabic" ? "bg-gray-700 text-white" : ""
                  }`}
              >
                Arabic
              </DropdownMenu.Item>
              <DropdownMenu.Item
                onSelect={(e) => {
                  setOpen(false);
                  handleKeyboardChange(e, "korean", setSelectedKeyboard);
                }}
                className={`px-3 py-2 cursor-pointer rounded-md hover:bg-gray-700 hover:text-white ${selectedKeyboard === "korean" ? "bg-gray-700 text-white" : ""
                  }`}
              >
                Korean
              </DropdownMenu.Item>
              <DropdownMenu.Item
                onSelect={(e) => {
                  setOpen(false);
                  handleKeyboardChange(e, "russian", setSelectedKeyboard);
                }}
                className={`px-3 py-2 cursor-pointer rounded-md hover:bg-gray-700 hover:text-white ${selectedKeyboard === "russian" ? "bg-gray-700 text-white" : ""
                  }`}
              >
                Russian
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </Flex>
      </Box>
    </Theme>
  );
}

export default App;
