// frontend/my-react-app/src/components/QuestionPanel.jsx
import React from 'react';

const QuestionPanel = ({ question, timeRemaining }) => {
    return (
        <div className="card mb-3">
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Question</h5>
                {timeRemaining && (
                    <div className="timer badge bg-warning text-dark">
                        ⏱️ Time: {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                    </div>
                )}
            </div>
            <div className="card-body">
                {question ? (
                    <div>
                        <h4>{question.title}</h4>
                        <p>{question.description}</p>

                        {question.initialCode && (
                            <div className="mt-3">
                                <h6>Initial Code:</h6>
                                <pre className="bg-light p-3 border rounded">
                                    <code>{question.initialCode}</code>
                                </pre>
                            </div>
                        )}

                        {question.expectedOutput && (
                            <div className="mt-3">
                                <h6>Expected Output:</h6>
                                <pre className="bg-light p-3 border rounded">
                                    <code>{question.expectedOutput}</code>
                                </pre>
                            </div>
                        )}
                    </div>
                ) : (
                    <p>Select a question to get started.</p>
                )}
            </div>
        </div>
    );
};

export default QuestionPanel;