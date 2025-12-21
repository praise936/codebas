import React, { useState } from 'react';
import { Button, Card } from 'react-bootstrap';  // Added Card import
import { Fullscreen } from 'react-bootstrap-icons';

const OutputWindow = ({ output, error, isRunning }) => {
    const [showModal, setShowModal] = useState(false);

    const openInNewTab = () => {
        const newWindow = window.open('', '_blank');
        newWindow.document.write(`
      <html>
        <head>
          <title>Code Output</title>
          <style>
            body { 
              font-family: monospace; 
              background: #1e1e1e; 
              color: #d4d4d4; 
              margin: 20px; 
              white-space: pre-wrap;
            }
            .error { color: #f14c4c; }
            .success { color: #4ec9b0; }
            .header { 
              background: #2d2d2d; 
              padding: 10px; 
              margin-bottom: 15px;
              border-radius: 5px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h3>Code Execution Output</h3>
            <small>Generated on ${new Date().toLocaleString()}</small>
          </div>
          ${error ? `<div class="error"><strong>Error:</strong><br>${error}</div>` : ''}
          ${output ? `<div class="output">${output}</div>` : '<div class="output">(No output)</div>'}
        </body>
      </html>
    `);
        newWindow.document.close();
    };

    return (
        <Card>
            <Card.Header className="bg-secondary text-white d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Output</h5>
                <Button
                    variant="outline-light"
                    size="sm"
                    onClick={openInNewTab}
                    title="Open in new tab"
                >
                    <Fullscreen size={16} />
                </Button>
            </Card.Header>
            <Card.Body style={{
                minHeight: '150px',
                backgroundColor: '#1e1e1e',
                color: '#d4d4d4',
                fontFamily: 'monospace'
            }}>
                {isRunning ? (
                    <div className="text-center">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-2">Running your code...</p>
                    </div>
                ) : error ? (
                    <div className="text-danger">
                        <strong>Error:</strong>
                        <pre className="mt-2" style={{ whiteSpace: 'pre-wrap' }}>{error}</pre>
                    </div>
                ) : output ? (
                    <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{output}</pre>
                ) : (
                    <div className="text-muted">Run your code to see output here...</div>
                )}
            </Card.Body>
        </Card>
    );
};

export default OutputWindow;