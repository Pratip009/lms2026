import { useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import api from '../services/api';

const HEARTBEAT_INTERVAL_MS = 60 * 1000; // 60 seconds — must match backend HEARTBEAT_INTERVAL

/**
 * useAttendance
 * Drop this hook into your root layout/App component.
 * It automatically:
 *  - Starts a session when a logged-in user loads the app
 *  - Sends a heartbeat every 60s while the tab is active
 *  - Ends the session on tab close / logout
 */
export default function useAttendance() {
  const { user, token } = useSelector(s => s.auth);
  const sessionIdRef = useRef(null);
  const intervalRef  = useRef(null);
  const isActiveRef  = useRef(true); // tracks tab visibility

  // ── Start session ────────────────────────────────────────
  const startSession = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api.post('/attendance/session/start');
      const id = res.data.data?.sessionId || res.data.sessionId;
      sessionIdRef.current = id;
    } catch (err) {
      console.warn('Attendance: failed to start session', err?.message);
    }
  }, [token]);

  // ── Heartbeat ────────────────────────────────────────────
  const sendHeartbeat = useCallback(async () => {
    if (!sessionIdRef.current || !isActiveRef.current || !token) return;
    try {
      const res = await api.post('/attendance/session/heartbeat', {
        sessionId: sessionIdRef.current,
      });
      const data = res.data.data || res.data;
      // If session expired server-side, start a new one
      if (data.expired) {
        sessionIdRef.current = null;
        await startSession();
      }
    } catch (err) {
      console.warn('Attendance: heartbeat failed', err?.message);
    }
  }, [token, startSession]);

  // ── End session ──────────────────────────────────────────
  const endSession = useCallback(async () => {
    if (!sessionIdRef.current || !token) return;
    const id = sessionIdRef.current;
    sessionIdRef.current = null;
    try {
      // Use sendBeacon so it fires even on tab close
      const payload = JSON.stringify({ sessionId: id });
      const beaconSent = navigator.sendBeacon
        && navigator.sendBeacon(
            `${api.defaults.baseURL}/attendance/session/end`,
            new Blob([payload], { type: 'application/json' })
          );
      if (!beaconSent) {
        await api.post('/attendance/session/end', { sessionId: id });
      }
    } catch (err) {
      console.warn('Attendance: failed to end session', err?.message);
    }
  }, [token]);

  // ── Main effect: start/stop tracking when auth changes ───
  useEffect(() => {
    if (!user || !token) return;

    startSession();

    intervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);

    // Track tab visibility — pause heartbeat when tab is hidden
    const handleVisibilityChange = () => {
      isActiveRef.current = document.visibilityState === 'visible';
      if (isActiveRef.current && !sessionIdRef.current) {
        // Tab became visible and session expired — restart
        startSession();
      }
    };

    // End session on tab/window close
    const handleBeforeUnload = () => endSession();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      endSession();
    };
  }, [user, token, startSession, sendHeartbeat, endSession]);
}