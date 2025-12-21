// frontend/my-react-app/src/components/OutputPanel.jsx
import React from 'react';

const OutputPanel = ({ output, error, isLoading }) => {
    return (
        <div className="card mt-3">
            <div className="card-header bg-dark text-white">
                <h5 className="mb-0">Output</h5>
            </div>
            <div className="card-body" style={{ minHeight: '150px', backgroundColor: '#1e1e1e', color: '#d4d4d4' }}>
                {isLoading ? (
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
            </div>
        </div>
    );
};

export default OutputPanel;