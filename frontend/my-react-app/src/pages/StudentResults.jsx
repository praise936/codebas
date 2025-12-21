// frontend/my-react-app/src/pages/StudentResults.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { assessmentAPI } from '../services/api';
import { Container, Card, Table, Badge, Alert, ProgressBar } from 'react-bootstrap';
import { Award, Clock, FileText } from 'react-bootstrap-icons';

const StudentResults = () => {
    const { user } = useAuth();
    const [submissions, setSubmissions] = useState([]);
    const [assessments, setAssessments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [user]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [submissionsRes, assessmentsRes] = await Promise.all([
                assessmentAPI.getMySubmissions(),
                assessmentAPI.getAssessments()
            ]);
            setSubmissions(submissionsRes.data);
            setAssessments(assessmentsRes.data);
        } catch (err) {
            console.error('Failed to load data:', err);
        } finally {
            setLoading(false);
        }
    };

    // Group submissions by assessment
    const submissionsByAssessment = {};
    submissions.forEach(submission => {
        const assessmentId = submission.question?.assessment;
        if (assessmentId) {
            if (!submissionsByAssessment[assessmentId]) {
                submissionsByAssessment[assessmentId] = {
                    submissions: [],
                    totalScore: 0,
                    maxScore: 0
                };
            }
            submissionsByAssessment[assessmentId].submissions.push(submission);
            submissionsByAssessment[assessmentId].totalScore += submission.score || 0;
            submissionsByAssessment[assessmentId].maxScore += submission.question?.points || 0;
        }
    });

    if (loading) {
        return (
            <Container className="mt-5 text-center">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2">Loading your results...</p>
            </Container>
        );
    }

    return (
        <Container className="mt-4">
            <h1>My Results</h1>
            <p className="lead">View your assessment scores and feedback</p>

            {submissions.length === 0 ? (
                <Alert variant="info">
                    <h4>No submissions yet</h4>
                    <p>You haven't submitted any assessments yet. Complete an assessment to see your results here.</p>
                </Alert>
            ) : (
                <>
                    {/* Assessment Summary Cards */}
                    <div className="row mb-4">
                        {Object.entries(submissionsByAssessment).map(([assessmentId, data]) => {
                            const assessment = assessments.find(a => a.id == assessmentId);
                            const percentage = data.maxScore > 0 ? (data.totalScore / data.maxScore) * 100 : 0;

                            return (
                                <div key={assessmentId} className="col-md-6 col-lg-4 mb-3">
                                    <Card>
                                        <Card.Body>
                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                <div>
                                                    <h5 className="mb-1">{assessment?.title || 'Unknown Assessment'}</h5>
                                                    <small className="text-muted">
                                                        {data.submissions.length} question{data.submissions.length !== 1 ? 's' : ''}
                                                    </small>
                                                </div>
                                                <Badge bg={percentage >= 70 ? 'success' : percentage >= 50 ? 'warning' : 'danger'}>
                                                    {Math.round(percentage)}%
                                                </Badge>
                                            </div>

                                            <ProgressBar
                                                now={percentage}
                                                variant={percentage >= 70 ? 'success' : percentage >= 50 ? 'warning' : 'danger'}
                                                className="mb-2"
                                            />

                                            <div className="d-flex justify-content-between">
                                                <small>Score: {data.totalScore}/{data.maxScore}</small>
                                                <small>
                                                    {data.submissions.filter(s => s.score > 0).length}/{data.submissions.length} graded
                                                </small>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </div>
                            );
                        })}
                    </div>

                    {/* Detailed Submissions Table */}
                    <Card>
                        <Card.Header className="bg-dark text-white">
                            <h5 className="mb-0">Submission Details</h5>
                        </Card.Header>
                        <Card.Body>
                            <Table responsive striped hover>
                                <thead>
                                    <tr>
                                        <th>Assessment</th>
                                        <th>Question</th>
                                        <th>Status</th>
                                        <th>Score</th>
                                        <th>Feedback</th>
                                        <th>Submitted</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {submissions.map(submission => {
                                        const assessment = assessments.find(a => a.id == submission.question?.assessment);
                                        return (
                                            <tr key={submission.id}>
                                                <td>{assessment?.title || 'Unknown'}</td>
                                                <td>{submission.question_title}</td>
                                                <td>
                                                    {submission.score > 0 ? (
                                                        <Badge bg="success">Graded</Badge>
                                                    ) : (
                                                        <Badge bg="secondary">Pending Review</Badge>
                                                    )}
                                                </td>
                                                <td>
                                                    {submission.score !== undefined ? (
                                                        <>
                                                            {submission.score}/{submission.question?.points || 10}
                                                            {submission.score >= (submission.question?.points || 10) * 0.6 && ' ✅'}
                                                        </>
                                                    ) : (
                                                        'Not graded'
                                                    )}
                                                </td>
                                                <td>
                                                    {submission.output ? (
                                                        <small className="text-truncate d-inline-block" style={{ maxWidth: '200px' }}>
                                                            {submission.output.length > 50
                                                                ? `${submission.output.substring(0, 50)}...`
                                                                : submission.output}
                                                        </small>
                                                    ) : (
                                                        <span className="text-muted">No feedback yet</span>
                                                    )}
                                                </td>
                                                <td>{new Date(submission.submitted_at).toLocaleDateString()}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </>
            )}
        </Container>
    );
};

export default StudentResults;