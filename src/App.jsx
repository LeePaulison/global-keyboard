import { useState, useRef } from "react";
import "./App.css";
import "@radix-ui/themes/styles.css";
import { Box, Flex, Text, Theme } from "@radix-ui/themes";
import { Form, DropdownMenu } from "radix-ui";
import { KeyboardIcon } from "@radix-ui/react-icons";

// IME's - Input Method Editors
import { useGenerateHangul } from "./hooks/useGenerateHangul";
import { useGeneratedCyrillic } from "./hooks/useGeneratedCyrillic";
// Cursor Manipulation
import { useCursorManipulation } from "./hooks/useCursorManipulation";

function App() {
  const [text, setText] = useState("Hello World!");
  const [selectedKeyboard, setSelectedKeyboard] = useState("korean");
  const [open, setOpen] = useState(false);

  // temporary state for debugging
  const [fileName, setFileName] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [keymap, setKeymap] = useState({});
  const textAreaRef = useRef(null);
  const cursorPosition = useRef(0);

  //IME's
  const { processJamo, processBackspace } = useGenerateHangul();
  const [buffer, setBuffer] = useState({ initial: "", medial: "", final: "" });
  const { processCyrillic } = useGeneratedCyrillic();
  // Cursor Manipulation
  const { setCursorPosition, getCursorPosition, moveCursorToPosition, moveCursorToHome, moveCursorToEnd, moveCursorForwardOne, moveCursorBackwardOne } = useCursorManipulation();


  console.log("fileName", fileName);
  // console.log("fileContent", fileContent);
  console.log("fileError", fileError);
  console.log("keymap", keymap);

  const parseXMLFile = (fileContents) => {
    if (!fileContents) return;

    console.log('I am parsing the file');

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(fileContents, "text/xml");

    console.log("xmlDoc", xmlDoc);

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

      console.log("Type: ", file.type);
      console.log("Content: ", content);

      const mapJson = parseXMLFile(content);
      console.log("Map JSON: ", mapJson);
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

  const handleCursorPosition = (e) => {
    e.preventDefault();
    const textArea = e.target;
    const selectionStart = textArea.selectionStart;
    cursorPosition.current = selectionStart;
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
    let textArea = null;
    if (textAreaRef.current) textArea = textAreaRef.current;
    const selectionStart = textArea.selectionStart;

    const keyCode = e.code;


    console.log("****Cursor Position: ", cursorPosition, " ****");

    if (keyCode === "ArrowLeft" && cursorPosition.current > 0) {
      cursorPosition.current = cursorPosition.current - 1;
      return;
    }

    if (keyCode === "ArrowRight" && cursorPosition.current < content.length) {
      cursorPosition.current = cursorPosition.current + 1;
      return;
    }

    if (keyCode === "Backspace") {
      cursorPosition.current = selectionStart - 1;
      if (selectedKeyboard === "korean") {
        if (cursorPosition.current === 0) return;

        const charBeforeCursor = content[selectionStart - 1];

        console.log("Char Before Cursor: ", charBeforeCursor);

        const result = processBackspace(charBeforeCursor);

        console.log("Result: ", result);

        if (result.process === "replace") {
          func((prev) => prev.slice(0, selectionStart - 1) + result.character + prev.slice(selectionStart));
        } else if (result.process === "delete") {
          func((prev) => prev.slice(0, selectionStart - 1) + prev.slice(selectionStart));
        }

        if (result.resetBuffer) {
          setBuffer({ initial: "", medial: "", final: "" });
        }

      } else if (selectedKeyboard === "russian") {
        func((prev) => prev.slice(0, selectionStart - 1) + prev.slice(selectionStart));
        cursorPosition.current = selectionStart - 1;
      }
      return;
    }

    if (keyCode === "Delete" && selectionStart < content.length) {
      func((prev) => prev.slice(0, selectionStart) + prev.slice(selectionStart + 1));
      cursorPosition.current = selectionStart;
      return;
    }

    if (selectedKeyboard === "korean") {
      const result = processJamo(e, buffer, setBuffer, setText);

      if (result) {
        if (result.process === "append") {
          func((prev) => prev.slice(0, selectionStart) + result.character + prev.slice(selectionStart));
          cursorPosition.current = selectionStart + 1;
        } else if (result.process === "replace") {
          func((prev) => prev.slice(0, selectionStart - 1) + result.character + prev.slice(selectionStart));
          cursorPosition.current = selectionStart;
        }
      }

      return;
    } else if (selectedKeyboard === "russian") {
      const result = processCyrillic(e);

      if (result) {
        func((prev) => prev.slice(0, selectionStart) + result.character + prev.slice(selectionStart));
      }
      cursorPosition.current = selectionStart + 1;
      return;
    }

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
            <Form.Field name="file-upload">
              <Form.Label>Keyboard Layout .XLM File Upload: </Form.Label>
              <Form.Control asChild>
                <input type="file" accept=".xml" onChange={(e) => handleFileChange(e, setKeymap)} className="border border-gray-500 rounded-md p-2" />
              </Form.Control>
            </Form.Field>
            <Text className="text-gray-900 font-bold">
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
                    cursorPosition.current = e.target.selectionStart;
                  }
                  }
                  readOnly
                  rows={10}
                  dir={selectedKeyboard === "arabic" ? "rtl" : "ltr"}
                  className={`caret-black border border-gray-500 rounded-md p-2 w-full ${alignText(
                    selectedKeyboard
                  )}`}
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
