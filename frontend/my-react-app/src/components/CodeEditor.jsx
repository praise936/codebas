// frontend/my-react-app/src/components/CodeEditor.jsx
import React, { useState, useRef } from 'react';
import Editor from '@monaco-editor/react';

const CodeEditor = ({ initialCode = '', onCodeChange, language = 'python' }) => {
    const editorRef = useRef(null);
    const [code, setCode] = useState(initialCode);

    const handleEditorDidMount = (editor, monaco) => {
        editorRef.current = editor;

        // Disable some shortcuts for assessment mode
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyC, () => {
            // Allow Ctrl+C for copy within editor
        });

        // Disable right-click context menu (optional)
        editor.onContextMenu((e) => {
            // You can prevent default here if needed
            // e.preventDefault();
        });
    };

    const handleEditorChange = (value) => {
        setCode(value);
        if (onCodeChange) {
            onCodeChange(value);
        }
    };

    return (
        <div style={{ border: '1px solid #ccc', borderRadius: '4px', overflow: 'hidden' }}>
            <Editor
                height="500px"
                language={language}
                value={code}
                onMount={handleEditorDidMount}
                onChange={handleEditorChange}
                theme="vs-dark"
                options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    wordWrap: 'on',
                    automaticLayout: true,
                    readOnly: false,
                    // Disable some features for assessment
                    contextmenu: true, // Set to false to disable right-click menu
                    copyWithSyntaxHighlighting: true,
                }}
            />
        </div>
    );
};

export default CodeEditor;