import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { LoadingCenter } from '../components/common';

export default function PaymentSuccess() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = params.get('session_id');
  const [status, setStatus] = useState('loading');
  const [courseId, setCourseId] = useState(null);

  useEffect(() => {
    if (!sessionId) { setStatus('error'); return; }
    api.get(`/orders/verify/${sessionId}`)
      .then(r => {
        if (r.data.isPaid) {
          setCourseId(r.data.courseId);
          setStatus('success');
        } else {
          setStatus('pending');
        }
      })
      .catch(() => setStatus('error'));
  }, [sessionId]);

  if (status === 'loading') return <LoadingCenter />;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 60px)' }}>
      <div className="card text-center" style={{ maxWidth: 400 }}>
        {status === 'success' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
            <h2 style={{ fontWeight: 700, fontSize: 20, marginBottom: 8 }}>Payment Successful!</h2>
            <p className="text-muted mb-16">You're now enrolled. Start learning!</p>
            <button className="btn btn-primary btn-full" onClick={() => navigate(courseId ? `/courses/${courseId}` : '/my-courses')}>
              Start Learning →
            </button>
          </>
        )}
        {status === 'pending' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
            <h2 style={{ fontWeight: 700, fontSize: 20, marginBottom: 8 }}>Processing...</h2>
            <p className="text-muted mb-16">Your payment is being processed.</p>
            <button className="btn btn-outline btn-full" onClick={() => navigate('/my-courses')}>Go to My Courses</button>
          </>
        )}
        {status === 'error' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
            <h2 style={{ fontWeight: 700, fontSize: 20, marginBottom: 8 }}>Something went wrong</h2>
            <p className="text-muted mb-16">We couldn't verify your payment.</p>
            <button className="btn btn-outline btn-full" onClick={() => navigate('/courses')}>Back to Courses</button>
          </>
        )}
      </div>
    </div>
  );
}
