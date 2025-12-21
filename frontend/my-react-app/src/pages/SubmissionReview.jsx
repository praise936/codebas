// frontend/my-react-app/src/pages/SubmissionReview.jsx - UPDATED
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { assessmentAPI, executionAPI } from '../services/api';
import CodeEditor from '../components/CodeEditor';
import { Container, Card, Button, Row, Col, Badge, Alert, Form } from 'react-bootstrap';
import { ArrowLeft, CheckCircle, XCircle, Save, Award } from 'react-bootstrap-icons';

const SubmissionReview = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [submission, setSubmission] = useState(null);
    const [loading, setLoading] = useState(true);
    const [output, setOutput] = useState('');
    const [error, setError] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [feedback, setFeedback] = useState('');
    const [score, setScore] = useState(0);
    const [maxPoints, setMaxPoints] = useState(10);
    const [grading, setGrading] = useState(false);

    useEffect(() => {
        loadSubmission();
    }, [id]);

    const loadSubmission = async () => {
        try {
            setLoading(true);
            // Load all submissions and find the specific one
            const response = await assessmentAPI.getSubmissions();
            const found = response.data.find(s => s.id === parseInt(id));

            if (found) {
                setSubmission(found);
                setScore(found.score || 0);
                setFeedback(found.output || '');
                setMaxPoints(found.question?.points || 10);
            } else {
                throw new Error('Submission not found');
            }
        } catch (err) {
            console.error('Failed to load submission:', err);
            navigate('/instructor');
        } finally {
            setLoading(false);
        }
    };

    const handleRunCode = async () => {
        if (!submission?.code) return;

        setIsRunning(true);
        setError('');
        setOutput('Running student code...\n');

        try {
            const response = await executionAPI.executeCode(submission.code);

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

    const handleSaveGrade = async () => {
        if (grading) return;

        setGrading(true);
        try {
            // In a real app, you would have an API endpoint to update grades
            // For now, we'll simulate it
            alert(`Grade saved!\nScore: ${score}/${maxPoints}\nFeedback saved.`);

            // Update local submission
            setSubmission({
                ...submission,
                score: score,
                is_correct: score >= (maxPoints * 0.6) // 60% to pass
            });

        } catch (err) {
            alert('Failed to save grade. Please try again.');
        } finally {
            setGrading(false);
        }
    };

    const markAsCorrect = () => {
        setScore(maxPoints);
        setFeedback('Excellent work! Code meets all requirements.');
    };

    const markAsNeedsImprovement = () => {
        setScore(Math.floor(maxPoints * 0.5));
        setFeedback('Code works but could be improved. See comments.');
    };

    const markAsIncorrect = () => {
        setScore(0);
        setFeedback('Code does not meet requirements. Please review.');
    };

    if (loading) {
        return (
            <Container className="mt-5 text-center">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2">Loading submission...</p>
            </Container>
        );
    }

    if (!submission) {
        return (
            <Container className="mt-5">
                <Alert variant="danger">
                    <h4>Submission not found</h4>
                    <Button variant="primary" onClick={() => navigate('/instructor')}>
                        <ArrowLeft className="me-2" />
                        Back to Dashboard
                    </Button>
                </Alert>
            </Container>
        );
    }

    return (
        <Container fluid className="mt-3">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <Button variant="outline-secondary" onClick={() => navigate('/instructor')}>
                        <ArrowLeft className="me-2" />
                        Back to Dashboard
                    </Button>
                    <h2 className="d-inline-block ms-3">Grade Submission</h2>
                </div>
                <div>
                    <Badge bg="info" className="me-2">
                        {submission.score > 0 ? 'Graded' : 'Pending'}
                    </Badge>
                    <Badge bg="warning" text="dark">
                        Max: {maxPoints} points
                    </Badge>
                </div>
            </div>

            <Row>
                {/* Student Info */}
                <Col md={4}>
                    <Card className="mb-3">
                        <Card.Header className="bg-primary text-white">
                            <h5 className="mb-0">Submission Details</h5>
                        </Card.Header>
                        <Card.Body>
                            <p><strong>Student:</strong> {submission.user_name}</p>
                            <p><strong>Question:</strong> {submission.question_title}</p>
                            <p><strong>Submitted:</strong> {new Date(submission.submitted_at).toLocaleString()}</p>
                            <p><strong>Current Score:</strong> {submission.score || 0}/{maxPoints}</p>
                            <hr />
                            <Button
                                variant="outline-primary"
                                className="w-100 mb-2"
                                onClick={handleRunCode}
                                disabled={isRunning}
                            >
                                {isRunning ? 'Running...' : 'Run Student Code'}
                            </Button>
                        </Card.Body>
                    </Card>

                    {/* Grading Panel */}
                    <Card className="mb-3">
                        <Card.Header className="bg-success text-white">
                            <h5 className="mb-0">Grading</h5>
                        </Card.Header>
                        <Card.Body>
                            <Form.Group className="mb-3">
                                <Form.Label>Score (0-{maxPoints})</Form.Label>
                                <Form.Control
                                    type="number"
                                    value={score}
                                    onChange={(e) => setScore(Math.min(maxPoints, Math.max(0, parseInt(e.target.value) || 0)))}
                                    min="0"
                                    max={maxPoints}
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Instructor Feedback</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={4}
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    placeholder="Provide detailed feedback to the student..."
                                />
                            </Form.Group>

                            <div className="d-grid gap-2 mb-3">
                                <Button variant="success" onClick={markAsCorrect}>
                                    <CheckCircle className="me-2" />
                                    Mark as Correct ({maxPoints} points)
                                </Button>
                                <Button variant="warning" onClick={markAsNeedsImprovement}>
                                    <Award className="me-2" />
                                    Needs Improvement ({Math.floor(maxPoints * 0.5)} points)
                                </Button>
                                <Button variant="danger" onClick={markAsIncorrect}>
                                    <XCircle className="me-2" />
                                    Incorrect (0 points)
                                </Button>
                            </div>

                            <Button
                                variant="primary"
                                className="w-100"
                                onClick={handleSaveGrade}
                                disabled={grading}
                            >
                                <Save className="me-2" />
                                {grading ? 'Saving...' : 'Save Grade & Feedback'}
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Code and Output */}
                <Col md={8}>
                    <Card className="mb-3">
                        <Card.Header className="bg-dark text-white d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">Student's Code</h5>
                            <small>Length: {submission.code?.length || 0} characters</small>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <CodeEditor
                                initialCode={submission.code}
                                onCodeChange={() => { }} // Read-only for review
                                language="python"
                                readOnly={true}
                            />
                        </Card.Body>
                    </Card>

                    {/* Output */}
                    <Card className="mb-3">
                        <Card.Header className="bg-secondary text-white">
                            <h5 className="mb-0">
                                {isRunning ? 'Running...' : 'Code Execution Output'}
                            </h5>
                        </Card.Header>
                        <Card.Body style={{
                            minHeight: '200px',
                            backgroundColor: '#1e1e1e',
                            color: '#d4d4d4',
                            fontFamily: 'monospace'
                        }}>
                            {isRunning ? (
                                <div className="text-center">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                    <p className="mt-2">Running student's code...</p>
                                </div>
                            ) : error ? (
                                <div className="text-danger">
                                    <strong>Error:</strong>
                                    <pre className="mt-2" style={{ whiteSpace: 'pre-wrap' }}>{error}</pre>
                                </div>
                            ) : output ? (
                                <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{output}</pre>
                            ) : submission.output ? (
                                <div>
                                    <strong>Original Student Output:</strong>
                                    <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{submission.output}</pre>
                                </div>
                            ) : (
                                <div className="text-muted">Click "Run Student Code" to test the solution</div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default SubmissionReview;