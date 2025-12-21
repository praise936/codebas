// frontend/my-react-app/src/pages/AssessmentList.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { assessmentAPI } from '../services/api';
import { Container, Card, Row, Col, Button, Badge, Alert, Spinner } from 'react-bootstrap';
import { Clock, Award, FileText, PlayFill } from 'react-bootstrap-icons';

const AssessmentList = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [assessments, setAssessments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadAssessments();
    }, []);

    const loadAssessments = async () => {
        try {
            setLoading(true);
            const response = await assessmentAPI.getAssessments();
            setAssessments(response.data);
        } catch (err) {
            setError('Failed to load assessments');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getAssessmentTypeBadge = (type) => {
        const types = {
            practice: { variant: 'info', label: 'Practice' },
            exam: { variant: 'danger', label: 'Exam' },
            assignment: { variant: 'warning', label: 'Assignment' },
        };
        const typeInfo = types[type] || { variant: 'secondary', label: type };
        return <Badge bg={typeInfo.variant}>{typeInfo.label}</Badge>;
    };

    const formatTimeLimit = (minutes) => {
        if (minutes === 0) return 'No time limit';
        if (minutes < 60) return `${minutes} minutes`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
    };

    if (loading) {
        return (
            <Container className="mt-5 text-center">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2">Loading assessments...</p>
            </Container>
        );
    }

    return (
        <Container className="mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1>Available Assessments</h1>
                    <p className="text-muted">
                        Welcome, {user?.first_name}! Select an assessment to begin.
                    </p>
                </div>
                {user?.user_type === 'instructor' && (
                    <Button variant="success" as={Link} to="/instructor">
                        <FileText className="me-2" />
                        Create Assessment
                    </Button>
                )}
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            {assessments.length === 0 ? (
                <Card>
                    <Card.Body className="text-center py-5">
                        <Award size={48} className="text-muted mb-3" />
                        <h4>No assessments available</h4>
                        <p className="text-muted">
                            {user?.user_type === 'instructor'
                                ? 'Create your first assessment to get started!'
                                : 'Check back later for new assessments.'}
                        </p>
                    </Card.Body>
                </Card>
            ) : (
                <Row>
                    {assessments.map((assessment) => (
                        <Col key={assessment.id} md={6} lg={4} className="mb-4">
                            <Card className="h-100 shadow-sm">
                                <Card.Header className="bg-white border-bottom-0 pb-0">
                                    <div className="d-flex justify-content-between align-items-start">
                                        {getAssessmentTypeBadge(assessment.assessment_type)}
                                        <Badge bg={assessment.is_active ? 'success' : 'secondary'}>
                                            {assessment.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>
                                </Card.Header>

                                <Card.Body>
                                    <Card.Title>{assessment.title}</Card.Title>
                                    <Card.Text className="text-muted" style={{ minHeight: '60px' }}>
                                        {assessment.description.length > 100
                                            ? `${assessment.description.substring(0, 100)}...`
                                            : assessment.description}
                                    </Card.Text>

                                    <div className="mt-3">
                                        <div className="d-flex align-items-center mb-2">
                                            <Clock size={16} className="me-2 text-muted" />
                                            <small className="text-muted">
                                                {formatTimeLimit(assessment.time_limit)}
                                            </small>
                                        </div>

                                        <div className="d-flex align-items-center mb-2">
                                            <FileText size={16} className="me-2 text-muted" />
                                            <small className="text-muted">
                                                {assessment.questions?.length || 0} questions
                                            </small>
                                        </div>

                                        <div className="d-flex align-items-center">
                                            <Award size={16} className="me-2 text-muted" />
                                            <small className="text-muted">
                                                {assessment.total_points} total points
                                            </small>
                                        </div>
                                    </div>
                                </Card.Body>

                                <Card.Footer className="bg-white border-top-0 pt-0">
                                    <div className="d-grid">
                                        <Button
                                            variant="primary"
                                            onClick={() => navigate(`/assessment/${assessment.id}`)}
                                            disabled={!assessment.is_active}
                                        >
                                            <PlayFill className="me-2" />
                                            {assessment.is_active ? 'Start Assessment' : 'Not Available'}
                                        </Button>
                                    </div>
                                </Card.Footer>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}
        </Container>
    );
};

export default AssessmentList;