// frontend/my-react-app/src/pages/SubmissionsList.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { assessmentAPI } from '../services/api';
import { Container, Table, Badge, Button, Alert, Card } from 'react-bootstrap';
import { ArrowLeft, Eye } from 'react-bootstrap-icons';

const SubmissionsList = () => {
    const { assessmentId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [submissions, setSubmissions] = useState([]);
    const [assessment, setAssessment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadData();
    }, [assessmentId]);

    const loadData = async () => {
        try {
            setLoading(true);

            // Load assessment
            const assessmentRes = await assessmentAPI.getAssessment(assessmentId);
            setAssessment(assessmentRes.data);

            // Load all submissions
            const submissionsRes = await assessmentAPI.getSubmissions();

            // Filter submissions for this assessment
            const filteredSubmissions = submissionsRes.data.filter(
                submission => submission.question?.assessment == assessmentId
            );

            setSubmissions(filteredSubmissions);

        } catch (err) {
            console.error('Failed to load data:', err);
            setError('Failed to load submissions');
        } finally {
            setLoading(false);
        }
    };

    if (user?.user_type !== 'instructor') {
        return (
            <Container className="mt-5">
                <Alert variant="danger">
                    <h4>Access Denied</h4>
                    <p>Only instructors can view submissions.</p>
                    <Button variant="primary" onClick={() => navigate('/dashboard')}>
                        Go to Dashboard
                    </Button>
                </Alert>
            </Container>
        );
    }

    if (loading) {
        return (
            <Container className="mt-5 text-center">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2">Loading submissions...</p>
            </Container>
        );
    }

    // Group submissions by student
    const submissionsByStudent = {};
    submissions.forEach(submission => {
        const studentId = submission.user;
        if (!submissionsByStudent[studentId]) {
            submissionsByStudent[studentId] = {
                studentName: submission.user_name,
                submissions: []
            };
        }
        submissionsByStudent[studentId].submissions.push(submission);
    });

    return (
        <Container className="mt-4">
            <div className="d-flex align-items-center mb-4">
                <Button
                    variant="outline-secondary"
                    onClick={() => navigate('/instructor')}
                    className="me-3"
                >
                    <ArrowLeft className="me-2" />
                    Back to Dashboard
                </Button>
                <div>
                    <h2>Submissions for: {assessment?.title}</h2>
                    <p className="text-muted mb-0">
                        {Object.keys(submissionsByStudent).length} students • {submissions.length} submissions
                    </p>
                </div>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            {submissions.length === 0 ? (
                <Card>
                    <Card.Body className="text-center py-5">
                        <h4>No submissions yet</h4>
                        <p className="text-muted">Students haven't submitted any answers for this assessment.</p>
                    </Card.Body>
                </Card>
            ) : (
                <div>
                    {Object.entries(submissionsByStudent).map(([studentId, data]) => (
                        <Card key={studentId} className="mb-4">
                            <Card.Header className="bg-light">
                                <h5 className="mb-0">{data.studentName}</h5>
                            </Card.Header>
                            <Card.Body>
                                <Table responsive striped hover>
                                    <thead>
                                        <tr>
                                            <th>Question</th>
                                            <th>Status</th>
                                            <th>Score</th>
                                            <th>Submitted</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.submissions.map(submission => (
                                            <tr key={submission.id}>
                                                <td>{submission.question_title}</td>
                                                <td>
                                                    {submission.is_correct ? (
                                                        <Badge bg="success">Graded</Badge>
                                                    ) : submission.score > 0 ? (
                                                        <Badge bg="warning">Partially Graded</Badge>
                                                    ) : (
                                                        <Badge bg="secondary">Pending</Badge>
                                                    )}
                                                </td>
                                                <td>
                                                    {submission.score}/{submission.question?.points || 10}
                                                </td>
                                                <td>
                                                    {new Date(submission.submitted_at).toLocaleString()}
                                                </td>
                                                <td>
                                                    <Button
                                                        variant="outline-primary"
                                                        size="sm"
                                                        onClick={() => navigate(`/instructor/submission/${submission.id}`)}
                                                    >
                                                        <Eye className="me-1" size={14} />
                                                        Review
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </Card.Body>
                        </Card>
                    ))}
                </div>
            )}
        </Container>
    );
};

export default SubmissionsList;