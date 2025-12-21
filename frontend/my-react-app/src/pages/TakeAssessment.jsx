// frontend/my-react-app/src/pages/TakeAssessment.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { assessmentAPI, executionAPI } from '../services/api';
import CodeEditor from '../components/CodeEditor';
import { Container, Row, Col, Card, Button, Alert, ProgressBar, Modal, Badge } from 'react-bootstrap';
import { Clock, CheckCircle, ArrowLeft, Save, SendCheck, PlayFill } from 'react-bootstrap-icons';
import OutputWindow from '../components/OutputWindow';


const TakeAssessment = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    // State
    const [assessment, setAssessment] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [code, setCode] = useState('');
    const [output, setOutput] = useState('');
    const [error, setError] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(0); // in seconds
    const [loading, setLoading] = useState(true);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [answers, setAnswers] = useState({}); // Store answers for all questions

    const timerRef = useRef(null);

    // Load assessment data handleSubmitQuestion
    useEffect(() => {
        loadAssessment();
    }, [id]);

    // Timer effect
    useEffect(() => {
        if (timeRemaining > 0 && assessment?.time_limit > 0) {
            timerRef.current = setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev <= 1) {
                        handleTimeUp();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [timeRemaining]);

    const loadAssessment = async () => {
        try {
            setLoading(true);
            const [assessmentRes, questionsRes] = await Promise.all([
                assessmentAPI.getAssessment(id),
                assessmentAPI.getAssessmentQuestions(id)
            ]);

            setAssessment(assessmentRes.data);
            setQuestions(questionsRes.data);

            // Initialize timer
            if (assessmentRes.data.time_limit > 0) {
                setTimeRemaining(assessmentRes.data.time_limit * 60);
            }

            // Load saved answers if any
            const savedAnswers = localStorage.getItem(`assessment_${id}_answers`);
            if (savedAnswers) {
                setAnswers(JSON.parse(savedAnswers));
                // Load current question's saved code
                if (questionsRes.data.length > 0) {
                    const savedCode = JSON.parse(savedAnswers)[questionsRes.data[0].id]?.code || '';
                    setCode(savedCode || questionsRes.data[0].initial_code || '');
                }
            } else if (questionsRes.data.length > 0) {
                setCode(questionsRes.data[0].initial_code || '');
            }

        } catch (err) {
            console.error('Failed to load assessment:', err);
            navigate('/assessments');
        } finally {
            setLoading(false);
        }
    };

    const handleTimeUp = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        alert('Time is up! Your answers will be submitted automatically.');
        handleSubmitAll();
    };

    const handleRunCode = async () => {
        setIsRunning(true);
        setError('');
        setOutput('Running your code...\n');

        try {
            const response = await executionAPI.executeCode(code);

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

    const handleSaveAnswer = () => {
        const currentQuestion = questions[currentQuestionIndex];
        if (!currentQuestion) return;

        const newAnswers = {
            ...answers,
            [currentQuestion.id]: {
                code,
                savedAt: new Date().toISOString()
            }
        };

        setAnswers(newAnswers);
        localStorage.setItem(`assessment_${id}_answers`, JSON.stringify(newAnswers));

        // Show temporary success message
        const saveBtn = document.getElementById('save-btn');
        if (saveBtn) {
            const originalText = saveBtn.innerHTML;
            saveBtn.innerHTML = '<CheckCircle className="me-2" /> Saved!';
            saveBtn.classList.add('btn-success');
            setTimeout(() => {
                saveBtn.innerHTML = originalText;
                saveBtn.classList.remove('btn-success');
            }, 1000);
        }
    };

    const handleQuestionSelect = (index) => {
        // Save current answer before switching
        handleSaveAnswer();

        setCurrentQuestionIndex(index);
        const question = questions[index];
        const savedCode = answers[question.id]?.code || '';
        setCode(savedCode || question.initial_code || '');
        setOutput('');
        setError('');
    };

    const handleSubmitQuestion = async () => {
        const currentQuestion = questions[currentQuestionIndex];

        // Check if already submitted
        if (answers[currentQuestion.id]?.submitted) {
            alert('You have already submitted this question. No further submissions allowed.');
            return;
        }

        if (!window.confirm('Submit this question? You cannot change it after submission.')) {
            return;
        }

        try {
            await assessmentAPI.createSubmission({
                question: currentQuestion.id,
                code: code
            });

            // Mark as submitted in answers
            const newAnswers = {
                ...answers,
                [currentQuestion.id]: {
                    ...answers[currentQuestion.id],
                    submitted: true,
                    submittedAt: new Date().toISOString()
                }
            };
            setAnswers(newAnswers);
            localStorage.setItem(`assessment_${id}_answers`, JSON.stringify(newAnswers));

            alert('Question submitted successfully! You cannot submit this question again.');

            // Move to next question if available
            if (currentQuestionIndex < questions.length - 1) {
                handleQuestionSelect(currentQuestionIndex + 1);
            }
        } catch (err) {
            if (err.response?.data?.error?.includes('already submitted')) {
                alert('You have already submitted this question.');
                // Update local state to reflect already submitted
                const newAnswers = {
                    ...answers,
                    [currentQuestion.id]: {
                        ...answers[currentQuestion.id],
                        submitted: true
                    }
                };
                setAnswers(newAnswers);
            } else {
                alert('Failed to submit question. Please try again.');
            }
        }
    };

    const handleSubmitAll = async () => {
        setShowSubmitModal(true);
    };

    const confirmSubmitAll = async () => {
        try {
            // Submit all unsaved answers
            for (const [questionId, answer] of Object.entries(answers)) {
                if (!answer.submitted && answer.code) {
                    await assessmentAPI.createSubmission({
                        question: questionId,
                        code: answer.code
                    });
                }
            }

            // Clear saved answers
            localStorage.removeItem(`assessment_${id}_answers`);

            setShowSubmitModal(false);
            alert('Assessment submitted successfully!');
            navigate('/dashboard');
        } catch (err) {
            alert('Failed to submit assessment. Please try again.');
        }
    };

    const formatTime = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <Container className="mt-5 text-center">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2">Loading assessment...</p>
            </Container>
        );
    }

    if (!assessment || questions.length === 0) {
        return (
            <Container className="mt-5">
                <Alert variant="warning">
                    <h4>Assessment not found</h4>
                    <p>The assessment you're looking for doesn't exist or is no longer available.</p>
                    <Button variant="outline-primary" onClick={() => navigate('/assessments')}>
                        <ArrowLeft className="me-2" />
                        Back to Assessments
                    </Button>
                </Alert>
            </Container>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    return (
        <Container fluid className="mt-3 px-4">
            {/* Header */}
            <Row className="mb-4">
                <Col>
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <Button variant="outline-secondary" onClick={() => navigate('/assessments')}>
                                <ArrowLeft className="me-2" />
                                Back
                            </Button>
                            <h2 className="d-inline-block ms-3">{assessment.title}</h2>
                            <Badge bg="info" className="ms-2">
                                Question {currentQuestionIndex + 1} of {questions.length}
                            </Badge>
                        </div>

                        <div className="text-end">
                            {assessment.time_limit > 0 && (
                                <div className={`alert ${timeRemaining < 300 ? 'alert-danger' : 'alert-warning'} mb-2`}>
                                    <Clock className="me-2" />
                                    Time Remaining: {formatTime(timeRemaining)}
                                </div>
                            )}
                            <div>
                                <small className="text-muted">
                                    Student: {user?.first_name} {user?.last_name}
                                </small>
                            </div>
                        </div>
                    </div>

                    <ProgressBar
                        now={progress}
                        label={`${Math.round(progress)}%`}
                        className="mt-2"
                        variant={timeRemaining < 300 ? 'danger' : 'primary'}
                    />
                </Col>
            </Row>

            <Row>
                {/* Questions Sidebar */}
                <Col md={3}>
                    <Card className="sticky-top" style={{ top: '20px' }}>
                        <Card.Header className="bg-dark text-white">
                            <h5 className="mb-0">Questions</h5>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <div className="list-group list-group-flush">
                                {questions.map((question, index) => (
                                    <button
                                        key={question.id}
                                        className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${currentQuestionIndex === index ? 'active' : ''
                                            } ${answers[question.id]?.submitted ? 'list-group-item-success' : ''}`}
                                        onClick={() => handleQuestionSelect(index)}
                                    >
                                        <div>
                                            <strong>Q{index + 1}</strong>: {question.title}
                                        </div>
                                        <div>
                                            {answers[question.id]?.submitted ? (
                                                <CheckCircle size={16} className="text-success" />
                                            ) : answers[question.id]?.code ? (
                                                <small className="text-warning">Saved</small>
                                            ) : (
                                                <small className="text-muted">Not started</small>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </Card.Body>
                        <Card.Footer>
                            <Button
                                variant="danger"
                                className="w-100"
                                onClick={handleSubmitAll}
                                disabled={timeRemaining === 0}
                            >
                                <SendCheck className="me-2" />
                                Submit All Answers
                            </Button>
                        </Card.Footer>
                    </Card>
                </Col>

                {/* Main Content */}
                <Col md={9}>
                    {/* Question Description */}
                    <Card className="mb-3">
                        <Card.Header className="bg-primary text-white">
                            <h4 className="mb-0">{currentQuestion.title}</h4>
                        </Card.Header>
                        <Card.Body>
                            <div dangerouslySetInnerHTML={{
                                __html: currentQuestion.description.replace(/\n/g, '<br />')
                            }} />

                            {currentQuestion.question_type === 'debugging' && currentQuestion.initial_code && (
                                <div className="mt-3">
                                    <h6>Initial Code:</h6>
                                    <pre className="bg-light p-3 border rounded">
                                        <code>{currentQuestion.initial_code}</code>
                                    </pre>
                                </div>
                            )}

                            <div className="mt-3">
                                <Badge bg="info" className="me-2">
                                    {currentQuestion.question_type}
                                </Badge>
                                <Badge bg="warning" text="dark">
                                    {currentQuestion.points} points
                                </Badge>
                            </div>
                        </Card.Body>
                    </Card>

                    {/* Code Editor */}
                    <Card className="mb-3">
                        <Card.Header className="bg-dark text-white d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">Your Solution</h5>
                            <small>Language: {currentQuestion.language}</small>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <CodeEditor
                                initialCode={code}
                                onCodeChange={setCode}
                                language={currentQuestion.language}
                            />
                        </Card.Body>
                    </Card>

                    {/* Action Buttons */}
                    <div className="mb-3">
                        <ButtonGroup className="w-100">
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
                                onClick={handleSaveAnswer}
                                id="save-btn"
                            >
                                <Save className="me-2" />
                                Save Answer
                            </Button>

                            <Button
                                variant="warning"
                                onClick={handleSubmitQuestion}
                                disabled={answers[currentQuestion.id]?.submitted}
                            >
                                <SendCheck className="me-2" />
                                {answers[currentQuestion.id]?.submitted ? 'Submitted' : 'Submit Question'}
                            </Button>
                        </ButtonGroup>
                    </div>

                    {/* Output Panel */}
                    <OutputWindow
                        output={output}
                        error={error}
                        isRunning={isRunning}
                    />
                </Col>
            </Row>

            {/* Submit Confirmation Modal */}
            <Modal show={showSubmitModal} onHide={() => setShowSubmitModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Submit Assessment</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Alert variant="warning">
                        <strong>Warning:</strong> Once submitted, you cannot change your answers.
                    </Alert>

                    <p>You have completed:</p>
                    <ul>
                        <li>
                            Submitted: {Object.values(answers).filter(a => a.submitted).length}/
                            {questions.length} questions
                        </li>
                        <li>
                            Saved: {Object.values(answers).filter(a => a.code && !a.submitted).length}
                            unsaved answers will be submitted
                        </li>
                    </ul>

                    <p>Are you sure you want to submit?</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowSubmitModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={confirmSubmitAll}>
                        Submit Assessment
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

// ButtonGroup component
const ButtonGroup = ({ children }) => (
    <div className="btn-group" role="group" style={{ display: 'flex' }}>
        {React.Children.map(children, (child, index) =>
            React.cloneElement(child, {
                className: `${child.props.className || ''} flex-fill`,
                style: {
                    borderRadius: index === 0 ? '4px 0 0 4px' :
                        index === React.Children.count(children) - 1 ? '0 4px 4px 0' : '0'
                }
            })
        )}
    </div>
);

export default TakeAssessment;