// frontend/my-react-app/src/pages/InstructorDashboard.jsx - WORKING VERSION
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { assessmentAPI } from '../services/api';
import { Container, Row, Col, Card, Button, Table, Badge, Alert, Modal, Form } from 'react-bootstrap';
import {
    PlusCircle,
    EyeFill,
    PencilFill,
    TrashFill,
    FileTextFill,
    PeopleFill,
    TrophyFill,
    ClockFill
} from 'react-bootstrap-icons';

const InstructorDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // State
    const [assessments, setAssessments] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showQuestionModal, setShowQuestionModal] = useState(false);
    const [selectedAssessmentForQuestion, setSelectedAssessmentForQuestion] = useState('');

    // Form states
    const [newAssessment, setNewAssessment] = useState({
        title: '',
        description: '',
        assessment_type: 'practice',
        time_limit: 60,
        total_points: 100,
        is_active: true
    });

    const [newQuestion, setNewQuestion] = useState({
        title: '',
        description: '',
        question_type: 'coding',
        initial_code: '',
        language: 'python',
        points: 10,
        order: 1
    });

    // Load data
    useEffect(() => {
        if (user?.user_type === 'instructor') {
            loadData();
        }
    }, [user]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [assessmentsRes, submissionsRes] = await Promise.all([
                assessmentAPI.getAssessments(),
                assessmentAPI.getSubmissions()
            ]);
            setAssessments(assessmentsRes.data);
            setSubmissions(submissionsRes.data);
        } catch (err) {
            console.error('Failed to load data:', err);
        } finally {
            setLoading(false);
        }
    };

    // Redirect if not instructor
    if (user?.user_type !== 'instructor') {
        return (
            <Container className="mt-5 text-center">
                <Alert variant="danger">
                    <h4>Access Denied</h4>
                    <p>This page is only accessible to instructors.</p>
                    <Button variant="primary" onClick={() => navigate('/dashboard')}>
                        Go to Dashboard
                    </Button>
                </Alert>
            </Container>
        );
    }

    const handleCreateAssessment = async () => {
        try {
            // Validate
            if (!newAssessment.title.trim()) {
                alert('Please enter a title for the assessment');
                return;
            }

            // Prepare assessment data
            const assessmentData = {
                title: newAssessment.title,
                description: newAssessment.description,
                assessment_type: newAssessment.assessment_type,
                time_limit: newAssessment.time_limit,
                total_points: newAssessment.total_points,
                is_active: newAssessment.is_active
            };

            console.log('Creating assessment:', assessmentData);

            // Send to backend
            const response = await assessmentAPI.createAssessment(assessmentData);

            // Add the new assessment to the list
            setAssessments([response.data, ...assessments]);

            // Close modal and reset form
            setShowCreateModal(false);
            setNewAssessment({
                title: '',
                description: '',
                assessment_type: 'practice',
                time_limit: 60,
                total_points: 100,
                is_active: true
            });

            alert('Assessment created successfully!');

        } catch (err) {
            console.error('Failed to create assessment:', err);
            alert(`Failed to create assessment: ${err.response?.data?.error || err.message}`);
        }
    };

    const handleAddQuestion = async () => {
        try {
            // Validate
            if (!selectedAssessmentForQuestion) {
                alert('Please select an assessment');
                return;
            }

            if (!newQuestion.title.trim()) {
                alert('Please enter a question title');
                return;
            }

            const questionData = {
                assessment: selectedAssessmentForQuestion,
                title: newQuestion.title,
                description: newQuestion.description,
                question_type: newQuestion.question_type,
                initial_code: newQuestion.initial_code,
                language: newQuestion.language,
                points: newQuestion.points,
                order: newQuestion.order
            };

            console.log('Adding question:', questionData);

            await assessmentAPI.createQuestion(questionData);

            setShowQuestionModal(false);
            setSelectedAssessmentForQuestion('');
            setNewQuestion({
                title: '',
                description: '',
                question_type: 'coding',
                initial_code: '',
                language: 'python',
                points: 10,
                order: 1
            });

            alert('Question added successfully!');

            // Reload data to get updated question count
            loadData();

        } catch (err) {
            console.error('Failed to add question:', err);
            alert(`Failed to add question: ${err.response?.data?.error || err.message}`);
        }
    };

    const handleDeleteAssessment = async (assessmentId) => {
        if (!window.confirm('Are you sure you want to delete this assessment? This action cannot be undone.')) {
            return;
        }

        try {
            await assessmentAPI.deleteAssessment(assessmentId);
            // Remove from local state
            setAssessments(assessments.filter(a => a.id !== assessmentId));
            alert('Assessment deleted successfully!');
        } catch (err) {
            console.error('Failed to delete assessment:', err);
            alert('Failed to delete assessment');
        }
    };

    const handleViewSubmissions = (assessmentId) => {
        navigate(`/instructor/submissions/${assessmentId}`);
    };

    const handleEditAssessment = (assessment) => {
        // For now, just show a modal with the assessment data
        setNewAssessment({
            title: assessment.title,
            description: assessment.description,
            assessment_type: assessment.assessment_type,
            time_limit: assessment.time_limit,
            total_points: assessment.total_points,
            is_active: assessment.is_active
        });
        setShowCreateModal(true);
    };

    const getAssessmentStats = (assessment) => {
        const assessmentSubmissions = submissions.filter(
            s => s.question?.assessment === assessment.id
        );
        const uniqueStudents = [...new Set(assessmentSubmissions.map(s => s.user))];

        return {
            totalSubmissions: assessmentSubmissions.length,
            uniqueStudents: uniqueStudents.length,
            averageScore: assessmentSubmissions.length > 0
                ? Math.round(assessmentSubmissions.reduce((sum, s) => sum + s.score, 0) / assessmentSubmissions.length)
                : 0
        };
    };

    if (loading) {
        return (
            <Container className="mt-5 text-center">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2">Loading instructor dashboard...</p>
            </Container>
        );
    }

    return (
        <Container fluid className="mt-3">
            {/* Header */}
            <Row className="mb-4">
                <Col>
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h1>Instructor Dashboard</h1>
                            <p className="lead">Welcome, Instructor {user?.first_name}!</p>
                        </div>
                        <Button
                            variant="success"
                            onClick={() => setShowCreateModal(true)}
                        >
                            <PlusCircle className="me-2" />
                            Create New Assessment
                        </Button>
                    </div>
                </Col>
            </Row>

            {/* Stats Cards */}
            <Row className="mb-4">
                <Col md={3}>
                    <Card className="text-center">
                        <Card.Body>
                            <FileTextFill size={32} className="text-primary mb-2" />
                            <h3>{assessments.length}</h3>
                            <Card.Text>Total Assessments</Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="text-center">
                        <Card.Body>
                            <PeopleFill size={32} className="text-success mb-2" />
                            <h3>{new Set(submissions.map(s => s.user)).size}</h3>
                            <Card.Text>Active Students</Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="text-center">
                        <Card.Body>
                            <TrophyFill size={32} className="text-warning mb-2" />
                            <h3>{submissions.length}</h3>
                            <Card.Text>Total Submissions</Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="text-center">
                        <Card.Body>
                            <ClockFill size={32} className="text-info mb-2" />
                            <h3>
                                {submissions.length > 0
                                    ? Math.round(submissions.reduce((sum, s) => sum + s.score, 0) / submissions.length)
                                    : 0}%
                            </h3>
                            <Card.Text>Average Score</Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Assessments Table */}
            <Row>
                <Col>
                    <Card>
                        <Card.Header className="bg-dark text-white">
                            <h5 className="mb-0">My Assessments</h5>
                        </Card.Header>
                        <Card.Body>
                            {assessments.length === 0 ? (
                                <Alert variant="info">
                                    <p className="mb-0">You haven't created any assessments yet.</p>
                                    <Button
                                        variant="primary"
                                        className="mt-2"
                                        onClick={() => setShowCreateModal(true)}
                                    >
                                        <PlusCircle className="me-2" />
                                        Create Your First Assessment
                                    </Button>
                                </Alert>
                            ) : (
                                <Table responsive striped hover>
                                    <thead>
                                        <tr>
                                            <th>Title</th>
                                            <th>Type</th>
                                            <th>Questions</th>
                                            <th>Time Limit</th>
                                            <th>Submissions</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {assessments.map((assessment) => {
                                            const stats = getAssessmentStats(assessment);
                                            return (
                                                <tr key={assessment.id}>
                                                    <td>
                                                        <strong>{assessment.title}</strong>
                                                        <div className="small text-muted">
                                                            {assessment.description.substring(0, 60)}...
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <Badge bg={
                                                            assessment.assessment_type === 'exam' ? 'danger' :
                                                                assessment.assessment_type === 'assignment' ? 'warning' : 'info'
                                                        }>
                                                            {assessment.assessment_type}
                                                        </Badge>
                                                    </td>
                                                    <td>{assessment.questions?.length || 0}</td>
                                                    <td>
                                                        {assessment.time_limit === 0
                                                            ? 'No limit'
                                                            : `${assessment.time_limit} min`}
                                                    </td>
                                                    <td>
                                                        <div className="small">
                                                            <div>Students: {stats.uniqueStudents}</div>
                                                            <div>Submissions: {stats.totalSubmissions}</div>
                                                            <div>Avg Score: {stats.averageScore}%</div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <Badge bg={assessment.is_active ? 'success' : 'secondary'}>
                                                            {assessment.is_active ? 'Active' : 'Inactive'}
                                                        </Badge>
                                                    </td>
                                                    <td>
                                                        <div className="btn-group btn-group-sm">
                                                            <Button
                                                                variant="outline-primary"
                                                                onClick={() => handleViewSubmissions(assessment.id)}
                                                                title="View Submissions"
                                                            >
                                                                <EyeFill size={14} />
                                                            </Button>
                                                            <Button
                                                                variant="outline-warning"
                                                                onClick={() => handleEditAssessment(assessment)}
                                                                title="Edit Assessment"
                                                            >
                                                                <PencilFill size={14} />
                                                            </Button>
                                                            <Button
                                                                variant="outline-success"
                                                                onClick={() => {
                                                                    setSelectedAssessmentForQuestion(assessment.id);
                                                                    setShowQuestionModal(true);
                                                                }}
                                                                title="Add Question"
                                                            >
                                                                <PlusCircle size={14} />
                                                            </Button>
                                                            <Button
                                                                variant="outline-danger"
                                                                onClick={() => handleDeleteAssessment(assessment.id)}
                                                                title="Delete Assessment"
                                                            >
                                                                <TrashFill size={14} />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </Table>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Recent Submissions */}
            <Row className="mt-4">
                <Col>
                    <Card>
                        <Card.Header className="bg-dark text-white">
                            <h5 className="mb-0">Recent Submissions</h5>
                        </Card.Header>
                        <Card.Body>
                            {submissions.length === 0 ? (
                                <Alert variant="info">
                                    <p className="mb-0">No submissions yet. Students need to take assessments first.</p>
                                </Alert>
                            ) : (
                                <Table responsive striped hover size="sm">
                                    <thead>
                                        <tr>
                                            <th>Student</th>
                                            <th>Question</th>
                                            <th>Score</th>
                                            <th>Status</th>
                                            <th>Submitted</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {submissions.slice(0, 10).map((submission) => (
                                            <tr key={submission.id}>
                                                <td>{submission.user_name}</td>
                                                <td>{submission.question_title}</td>
                                                <td>
                                                    <Badge bg={submission.is_correct ? 'success' : 'danger'}>
                                                        {submission.score}/{submission.question?.points || 10}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    {submission.is_correct ? (
                                                        <Badge bg="success">Correct</Badge>
                                                    ) : (
                                                        <Badge bg="danger">Incorrect</Badge>
                                                    )}
                                                </td>
                                                <td>
                                                    {new Date(submission.submitted_at).toLocaleDateString()}
                                                </td>
                                                <td>
                                                    <Button
                                                        variant="outline-primary"
                                                        size="sm"
                                                        onClick={() => navigate(`/instructor/submission/${submission.id}`)}
                                                    >
                                                        Review
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Create Assessment Modal */}
            <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Create New Assessment</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Assessment Title *</Form.Label>
                            <Form.Control
                                type="text"
                                value={newAssessment.title}
                                onChange={(e) => setNewAssessment({ ...newAssessment, title: e.target.value })}
                                placeholder="Enter assessment title"
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={newAssessment.description}
                                onChange={(e) => setNewAssessment({ ...newAssessment, description: e.target.value })}
                                placeholder="Describe the assessment"
                            />
                        </Form.Group>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Assessment Type</Form.Label>
                                    <Form.Select
                                        value={newAssessment.assessment_type}
                                        onChange={(e) => setNewAssessment({ ...newAssessment, assessment_type: e.target.value })}
                                    >
                                        <option value="practice">Practice</option>
                                        <option value="assignment">Assignment</option>
                                        <option value="exam">Exam</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Time Limit (minutes)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        value={newAssessment.time_limit}
                                        onChange={(e) => setNewAssessment({ ...newAssessment, time_limit: parseInt(e.target.value) || 0 })}
                                        placeholder="0 for no limit"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Total Points</Form.Label>
                                    <Form.Control
                                        type="number"
                                        value={newAssessment.total_points}
                                        onChange={(e) => setNewAssessment({ ...newAssessment, total_points: parseInt(e.target.value) || 100 })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Status</Form.Label>
                                    <Form.Check
                                        type="switch"
                                        label="Active"
                                        checked={newAssessment.is_active}
                                        onChange={(e) => setNewAssessment({ ...newAssessment, is_active: e.target.checked })}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="success" onClick={handleCreateAssessment}>
                        Create Assessment
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Add Question Modal */}
            <Modal show={showQuestionModal} onHide={() => setShowQuestionModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Add New Question</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Select Assessment *</Form.Label>
                            <Form.Select
                                value={selectedAssessmentForQuestion}
                                onChange={(e) => setSelectedAssessmentForQuestion(e.target.value)}
                                required
                            >
                                <option value="">Select an assessment</option>
                                {assessments.map(assessment => (
                                    <option key={assessment.id} value={assessment.id}>
                                        {assessment.title}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Question Title *</Form.Label>
                            <Form.Control
                                type="text"
                                value={newQuestion.title}
                                onChange={(e) => setNewQuestion({ ...newQuestion, title: e.target.value })}
                                placeholder="Enter question title"
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={newQuestion.description}
                                onChange={(e) => setNewQuestion({ ...newQuestion, description: e.target.value })}
                                placeholder="Describe the question and requirements"
                            />
                        </Form.Group>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Question Type</Form.Label>
                                    <Form.Select
                                        value={newQuestion.question_type}
                                        onChange={(e) => setNewQuestion({ ...newQuestion, question_type: e.target.value })}
                                    >
                                        <option value="coding">Coding Challenge</option>
                                        <option value="debugging">Debugging Task</option>
                                        <option value="multiple_choice">Multiple Choice</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Points</Form.Label>
                                    <Form.Control
                                        type="number"
                                        value={newQuestion.points}
                                        onChange={(e) => setNewQuestion({ ...newQuestion, points: parseInt(e.target.value) || 10 })}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        {newQuestion.question_type !== 'multiple_choice' && (
                            <Form.Group className="mb-3">
                                <Form.Label>Initial Code (for debugging/coding questions)</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={6}
                                    value={newQuestion.initial_code}
                                    onChange={(e) => setNewQuestion({ ...newQuestion, initial_code: e.target.value })}
                                    placeholder="# Write initial code here"
                                    style={{ fontFamily: 'monospace' }}
                                />
                            </Form.Group>
                        )}
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowQuestionModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="success" onClick={handleAddQuestion}>
                        Add Question
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default InstructorDashboard;