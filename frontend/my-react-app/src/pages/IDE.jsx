// frontend/my-react-app/src/pages/IDE.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import CodeEditor from '../components/CodeEditor';
import OutputPanel from '../components/OutputPanel';
import QuestionPanel from '../components/QuestionPanel';
import { executionAPI } from '../services/api';
import { Container, Row, Col, Button, ButtonGroup, Card, Alert } from 'react-bootstrap';
import { PlayFill, SendCheck, Clock, Save } from 'react-bootstrap-icons';

const IDE = () => {
    const { user } = useAuth();
    const [code, setCode] = useState('# Write your Python code here\nprint("Hello, World!")\n\n# Debug this function\ndef add_numbers(a, b):\n    # TODO: Fix the bug\n    return a - b  # This is wrong!\n\n# Test the function\nresult = add_numbers(5, 3)\nprint(f"5 + 3 = {result}")');
    const [output, setOutput] = useState('');
    const [error, setError] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(1800); // 30 minutes in seconds
    const [selectedQuestion, setSelectedQuestion] = useState(null);

    // Sample questions for testing
    const sampleQuestions = [
        {
            id: 1,
            title: "Debug: Fix the Addition Function",
            description: "The add_numbers function is supposed to add two numbers, but it's subtracting them instead. Fix the bug so that it correctly adds the numbers.",
            initialCode: 'def add_numbers(a, b):\n    # TODO: Fix the bug\n    return a - b  # This is wrong!\n\n# Test the function\nresult = add_numbers(5, 3)\nprint(f"5 + 3 = {result}")',
            expectedOutput: "5 + 3 = 8",
            language: "python",
            type: "debugging"
        },
        {
            id: 2,
            title: "Coding Challenge: Fibonacci Sequence",
            description: "Write a function that returns the nth Fibonacci number. The Fibonacci sequence starts with 0 and 1, and each subsequent number is the sum of the previous two.",
            initialCode: 'def fibonacci(n):\n    # Your code here\n    pass\n\n# Test cases\nprint(fibonacci(0))  # Should return 0\nprint(fibonacci(1))  # Should return 1\nprint(fibonacci(5))  # Should return 5\nprint(fibonacci(10)) # Should return 55',
            expectedOutput: "0\n1\n5\n55",
            language: "python",
            type: "coding"
        }
    ];

    // Timer effect
    useEffect(() => {
        if (timeRemaining > 0) {
            const timer = setInterval(() => {
                setTimeRemaining(prev => prev - 1);
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [timeRemaining]);

    // Load first question by default
    useEffect(() => {
        if (sampleQuestions.length > 0 && !selectedQuestion) {
            setSelectedQuestion(sampleQuestions[0]);
            setCode(sampleQuestions[0].initialCode || '# Write your Python code here');
        }
    }, []);
    const [userInputs, setUserInputs] = useState(['John']);
    const handleInputChange = (index, value) => {
        const newInputs = [...userInputs];
        newInputs[index] = value;
        setUserInputs(newInputs);
    };
    const addInputField = () => {
        setUserInputs([...userInputs, '']);
    };
    const handleRunCode = async () => {
        setIsRunning(true);
        setError('');
        setOutput('Running your code...\n');

        try {
            const response = await executionAPI.executeCode(
                code,
                selectedQuestion?.language || 'python',
                userInputs  // Send inputs to backend
            );

            if (response.data.error) {
                setError(response.data.error);
                setOutput(response.data.output || '');
            } else {
                setOutput(response.data.output || '(No output)');
                setError('');
            }
        } catch (err) {
            setError(`Failed to execute code: ${err.message}`);
            setOutput('');
        } finally {
            setIsRunning(false);
        }
    };

    const handleSubmitCode = () => {
        if (window.confirm('Are you sure you want to submit? You cannot change your answer after submission.')) {
            alert('Code submitted successfully! Instructor will review your submission.');
            // In real app, this would save to backend
        }
    };

    const handleSaveCode = () => {
        localStorage.setItem('saved_code', code);
        alert('Code saved locally!');
    };

    const handleSelectQuestion = (question) => {
        setSelectedQuestion(question);
        setCode(question.initialCode || '# Write your Python code here');
        setOutput('');
        setError('');
    };

    const handleCodeChange = (newCode) => {
        setCode(newCode);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <Container fluid className="mt-3">
            <Row>
                <Col md={8}>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h2>Code Editor</h2>
                        <div className="d-flex align-items-center">
                            <div className="me-3">
                                <strong>User:</strong> {user?.username} ({user?.user_type})
                            </div>
                            <div className="alert alert-warning mb-0">
                                <Clock className="me-2" />
                                Time Remaining: {formatTime(timeRemaining)}
                            </div>
                        </div>
                    </div>

                    <Alert variant="info" className="mb-3">
                        <strong>Note:</strong> This is a practice environment. Copy-paste is disabled during assessments.
                    </Alert>

                    <QuestionPanel
                        question={selectedQuestion}
                        timeRemaining={timeRemaining}
                    />

                    <CodeEditor
                        initialCode={code}
                        onCodeChange={handleCodeChange}
                        language={selectedQuestion?.language || 'python'}
                    />

                    <div className="mt-3">
                        <ButtonGroup>
                            <Button
                                variant="success"
                                onClick={handleRunCode}
                                disabled={isRunning}
                            >
                                <PlayFill className="me-2" />
                                {isRunning ? 'Running...' : 'Run Code'}
                            </Button>

                            <Button
                                variant="primary"
                                onClick={handleSaveCode}
                            >
                                <Save className="me-2" />
                                Save Code
                            </Button>

                            <Button
                                variant="danger"
                                onClick={handleSubmitCode}
                            >
                                <SendCheck className="me-2" />
                                Submit Answer
                            </Button>
                        </ButtonGroup>
                    </div>
                    <div className="mt-3">
                        <h6>Test Inputs (for input() function):</h6>
                        {userInputs.map((input, index) => (
                            <div key={index} className="input-group mb-2">
                                <span className="input-group-text">Input {index + 1}</span>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={input}
                                    onChange={(e) => handleInputChange(index, e.target.value)}
                                    placeholder={`Value for input() #${index + 1}`}
                                />
                            </div>
                        ))}
                        <button
                            onClick={addInputField}
                            className="btn btn-sm btn-outline-secondary"
                        >
                            + Add Another Input
                        </button>
                    </div>

                    <OutputPanel
                        output={output}
                        error={error}
                        isLoading={isRunning}
                    />
                </Col>

                <Col md={4}>
                    <Card className="sticky-top" style={{ top: '20px' }}>
                        <Card.Header className="bg-dark text-white">
                            <h5 className="mb-0">Questions List</h5>
                        </Card.Header>
                        <Card.Body>
                            <div className="list-group">
                                {sampleQuestions.map((question) => (
                                    <button
                                        key={question.id}
                                        className={`list-group-item list-group-item-action ${selectedQuestion?.id === question.id ? 'active' : ''}`}
                                        onClick={() => handleSelectQuestion(question)}
                                    >
                                        <div className="d-flex w-100 justify-content-between">
                                            <h6 className="mb-1">Question {question.id}</h6>
                                            <small className={selectedQuestion?.id === question.id ? 'text-light' : 'text-muted'}>
                                                {question.type === 'debugging' ? '🐛 Debug' : '💻 Coding'}
                                            </small>
                                        </div>
                                        <p className="mb-1">{question.title}</p>
                                        <small>{question.description.substring(0, 60)}...</small>
                                    </button>
                                ))}
                            </div>
                        </Card.Body>
                        <Card.Footer className="text-muted">
                            <small>Select a question to start working on it</small>
                        </Card.Footer>
                    </Card>

                    <Card className="mt-3">
                        <Card.Header className="bg-info text-white">
                            <h6 className="mb-0">Instructions</h6>
                        </Card.Header>
                        <Card.Body>
                            <ul className="small">
                                <li>Write your code in the editor</li>
                                <li>Click <strong>Run Code</strong> to test your solution</li>
                                <li>Click <strong>Save Code</strong> to save progress</li>
                                <li>Click <strong>Submit Answer</strong> when finished</li>
                                <li>Timer will count down during assessments</li>
                                <li>Copy-paste may be disabled in real assessments</li>
                            </ul>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default IDE;