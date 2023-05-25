import { useState } from "react";

// Python syntax highlighting
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { solarizedlight } from "react-syntax-highlighter/dist/cjs/styles/prism";

// SQL syntax highlighting
import Editor from "react-simple-code-editor";
import { highlight , languages } from "prismjs";
import 'prismjs/components/prism-sql';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRefresh } from '@fortawesome/free-solid-svg-icons';



// TODO add run sql function. passed in from chatmessage and updates the table
const CodeBlock = ({ index, initialCodeString, language, runSqlQuery }) => {
  const [codeString, setCodeString] = useState(initialCodeString);
  const [initialCode, ] = useState(initialCodeString);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleSqlCodeChange = (newCode) => {
    setCodeString(newCode);
  }

  const handleKeyPress = async (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // Execute your code to re-run the SQL query here.
      const result = await runSqlQuery(codeString, index, setErrorMessage);
    }
  }

  const resetCode = () => {
    setCodeString(initialCode);
    setErrorMessage(null);
  }

  if (language === 'sql') {
    return (
      <div>
        <Editor
          value={codeString}
          tabSize={4}
          onValueChange={handleSqlCodeChange}
          highlight={(code) => highlight(code, languages.sql)}
          padding={10}
          className="dark:bg-gray-900 dark:text-gray-100"
          style={{
            fontFamily: '"Fira code", "Fira Mono", monospace',
            fontSize: '0.8em',
            borderRadius: 5,
            border: '1px solid #ccc',
          }}
          onKeyDown={handleKeyPress}
        />
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={resetCode} title="Revert to initial code" style={{ marginRight: '10px' }}>
            <FontAwesomeIcon icon={faRefresh} size="sm" className="text-gray-800 dark:text-gray-200" />
          </button>
          {errorMessage && <p className="text-red-500 dark:text-red-400">{errorMessage}</p>}
        </div>
      </div>

    );
  } else {
    // Use react-syntax-highlighter for non-editable code
    return (
      <div style={{ fontSize: '0.8em' }}>
        <SyntaxHighlighter
          language={language}
          style={solarizedlight}
        >
          {initialCodeString}
        </SyntaxHighlighter>
      </div>
    );
  }
};

export default CodeBlock;
