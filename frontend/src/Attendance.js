import React, { useState, useRef, useEffect } from 'react';

const Attendance = () => {
  const [cardId, setCardId] = useState('');
  const [message, setMessage] = useState('');
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [captureEnabled, setCaptureEnabled] = useState(false);
  const [captureTimer, setCaptureTimer] = useState(5);
  const [videoReady, setVideoReady] = useState(false);
  const inputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const streamRef = useRef(null);
  const autoCapturIntervalRef = useRef(null);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  // Simple, lenient face detection - not overly strict
  const detectFace = (canvas) => {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    let facePixels = 0;
    // Broader skin tone detection - lenient thresholds
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Lenient skin tone detection (not overly strict)
      if (r > 75 && g > 25 && b > 5 && r > b && (r - g) > 8) {
        facePixels++;
      }
    }

    // Lenient threshold - 2-55% of pixels
    const facePercentage = (facePixels / (canvas.width * canvas.height)) * 100;
    return facePercentage > 2 && facePercentage < 55;
  };

  // Save image by downloading it
  const saveImageLocally = async (imageBlob) => {
    return new Promise((resolve) => {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${cardId}_${timestamp}.jpg`;
      
      // Create a download link
      const url = URL.createObjectURL(imageBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log('Image downloaded:', filename);
      resolve(filename);
    });
  };

  // Start camera - simple and direct
  const startCamera = async () => {
    console.log('startCamera called');
    try {
      console.log('Requesting camera access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }
      });
      console.log('Camera stream obtained:', stream);
      
      streamRef.current = stream;
      setShowCamera(true);
      setCaptureEnabled(false);
      setCaptureTimer(5);
      setVideoReady(false);
      
    } catch (err) {
      console.error('Error accessing camera:', err);
      setMessage('Unable to access camera. Please check permissions. Error: ' + err.message);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // Attempt automatic capture without user interaction (optional)
  const attemptAutoCapture = async () => {
    if (!videoRef.current || !canvasRef.current || !showCamera) return;

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Check if video has loaded and has dimensions
      if (video.readyState !== video.HAVE_ENOUGH_DATA) {
        console.log('Video not ready yet, readyState:', video.readyState);
        return; // Video not ready yet
      }
      
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.log('Video dimensions not ready: ', video.videoWidth, video.videoHeight);
        return; // Video not ready yet
      }
      
      const ctx = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      // Detect face
      const faceDetected = detectFace(canvas);

      if (faceDetected) {
        console.log('Face detected, auto-capturing');
        // Face detected, proceed with capture
        canvas.toBlob(async (blob) => {
          const filename = await saveImageLocally(blob);
          console.log('Image saved locally:', filename);
          
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
          }
          closeCamera();
          
          // Process attendance
          processAttendance();
        }, 'image/jpeg', 0.8);
      }
    } catch (err) {
      console.error('Error in auto-capture attempt:', err);
    }
  };

  // Manual capture photo
  const capturePhotoManual = async () => {
    if (!videoRef.current || !canvasRef.current) {
      console.error('Video or canvas ref not available');
      return;
    }

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Check video readiness
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.error('Video not ready, dimensions:', video.videoWidth, video.videoHeight);
        setMessage('Camera not ready yet. Please try again.');
        setTimeout(() => setMessage(''), 2000);
        return;
      }
      
      const ctx = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      console.log('Drawing image to canvas:', canvas.width, 'x', canvas.height);
      ctx.drawImage(video, 0, 0);

      // Detect face
      const faceDetected = detectFace(canvas);
      console.log('Face detected:', faceDetected);

      if (!faceDetected) {
        setMessage('No face detected. Please try again.');
        setTimeout(() => setMessage(''), 2000);
        return;
      }

      // Convert canvas to blob and save
      canvas.toBlob(async (blob) => {
        if (!blob) {
          console.error('Failed to create blob from canvas');
          return;
        }
        
        const filename = await saveImageLocally(blob);
        console.log('Image saved locally:', filename);
        
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
        }
        closeCamera();
        
        // Process attendance (mock - no backend)
        processAttendance();
      }, 'image/jpeg', 0.8);
    } catch (err) {
      console.error('Error capturing photo:', err);
      setMessage('Error capturing photo. Please try again.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // Process attendance locally (mock)
  const processAttendance = async () => {
    setLoading(true);
    
    try {
      console.log('Processing attendance for cardId:', cardId);
      
      // Call backend API
      const response = await fetch('http://localhost:5000/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cardId })
      });
      
      const data = await response.json();
      console.log('Attendance response:', data);
      
      if (!response.ok) {
        console.log('Response not ok, status:', data.status);
        // Handle cooldown
        if (data.status === 'cooldown') {
          console.log('Cooldown triggered. Minutes passed:', data.minutesPassed, 'Remaining:', data.minutesRemaining);
          setMessage(`30 - Minutes is needed before clocking out`);
          setDetails(null);
        } else if (data.status === 'already-clocked-out') {
          // Calculate next clock-in time (same time as clock-in from today)
          const clockInTime = new Date(data.clockInTime);
          const nextClockInTime = new Date(clockInTime);
          nextClockInTime.setDate(nextClockInTime.getDate() + 1); // Next day at same time
          
          const clockInTimeStr = clockInTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          
          setMessage(`Already clocked out for today`);
          setDetails({
            label: 'Can clock in tomorrow at',
            time: clockInTimeStr
          });
        } else {
          setMessage('Error: ' + (data.error || 'Unknown error'));
        }
        setLoading(false);
        setCardId('');
        setTimeout(() => {
          setMessage('');
          setDetails(null);
        }, 11000);
        return;
      }
      
      // Display response
      if (data.status === 'clocked-in') {
        setMessage(`${getGreeting()}, ${data.name}`);
        setDetails({
          label: 'Clocked In',
          time: new Date(data.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      } else if (data.status === 'clocked-out') {
        setMessage(`Thank You, ${data.name}`);
        setDetails({
          label: 'Clocked Out',
          time: new Date(data.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          total: data.totalHours.toFixed(2)
        });
      }
      
      setLoading(false);
      setCardId('');
      setTimeout(() => {
        setMessage('');
        setDetails(null);
      }, 12000);
    } catch (err) {
      console.error('Error processing attendance:', err);
      setMessage('Error: Unable to process attendance. Check backend connection.');
      setLoading(false);
      setCardId('');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // Close camera
  const closeCamera = () => {
    console.log('Closing camera');
    
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    if (autoCapturIntervalRef.current) {
      clearInterval(autoCapturIntervalRef.current);
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        console.log('Stopping track:', track.kind);
        track.stop();
      });
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setShowCamera(false);
    setCaptureEnabled(false);
    setCaptureTimer(5);
    setVideoReady(false);
  };

  // Handle card ID submission
  const handleCardIdSubmit = async (e) => {
    console.log('Key pressed:', e.key, 'CardID:', cardId, 'Loading:', loading, 'ShowCamera:', showCamera);
    if (e.key === 'Enter' && cardId.trim() && !loading && !showCamera) {
      console.log('Conditions met, calling startCamera');
      await startCamera();
    }
  };

  useEffect(() => {
    if (!showCamera && !loading) {
      inputRef.current?.focus();
    }
    
    // Setup video stream when camera is shown
    if (showCamera && streamRef.current && videoRef.current && !videoReady) {
      console.log('Setting up video stream in useEffect');
      videoRef.current.srcObject = streamRef.current;
      
      // Wait for video to load
      const onLoadedMetadata = () => {
        console.log('Video metadata loaded, dimensions:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
        setVideoReady(true);
        
        // Start countdown and auto-capture after video is ready
        let timeLeft = 5;
        const autoCapturInterval = setInterval(() => {
          if (videoReady) {
            attemptAutoCapture();
          }
        }, 100);
        
        autoCapturIntervalRef.current = autoCapturInterval;
        
        timerIntervalRef.current = setInterval(() => {
          timeLeft--;
          console.log('Timer: ', timeLeft);
          setCaptureTimer(timeLeft);
          
          if (timeLeft <= 0) {
            clearInterval(timerIntervalRef.current);
            clearInterval(autoCapturInterval);
            setCaptureEnabled(true);
            console.log('Capture enabled');
          }
        }, 1000);
      };
      
      videoRef.current.addEventListener('loadedmetadata', onLoadedMetadata);
      
      return () => {
        if (videoRef.current) {
          videoRef.current.removeEventListener('loadedmetadata', onLoadedMetadata);
        }
      };
    }
    
    // Cleanup on unmount
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (autoCapturIntervalRef.current) {
        clearInterval(autoCapturIntervalRef.current);
      }
    };
  }, [showCamera, loading, videoReady]);

  return (
    <div
      style={{
        height: '100vh',
        width: '100%',
        backgroundImage: `url("AttendanceBackground.png")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: "'Playfair Display', serif",
        color: '#fff',
        position: 'relative'
      }}
    >
      {/* Title */}
      <h1
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '7rem',
          fontWeight: '700',
          color: '#E4B169',
          position: 'absolute',
          top: '10px',
          textAlign: 'center'
        }}
      >
        <span style={{ position: 'relative', display: 'inline-block' }}>
          L
          <span
            style={{
              position: 'absolute',
              left: 0,
              bottom: -10,
              width: '80px',
              height: '3px',
              backgroundColor: '#fff'
            }}
          ></span>
        </span>
        UMINE
        <span
          style={{
            fontFamily: 'Poppins, sans-serif',
            fontSize: '0.8rem',
            fontWeight: '400',
            color: '#fff',
            position: 'absolute',
            bottom: -20,
            right: -90,
            letterSpacing: '1px'
          }}
        >
          HOTEL MANAGEMENT SYSTEM
        </span>
      </h1>

      {/* Input box */}
      <input
        ref={inputRef}
        type="password"
        placeholder="Enter Card ID"
        value={cardId}
        onChange={(e) => setCardId(e.target.value)}
        onKeyDown={handleCardIdSubmit}
        maxLength={10}
        disabled={loading || showCamera}
        style={{
          marginTop: '120px',
          width: '320px',
          padding: '12px 15px',
          fontSize: '1.2rem',
          textAlign: 'center',
          border: 'none',
          borderRadius: '6px',
          outline: 'none',
          background: 'rgba(255, 255, 255, 0.85)',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
          letterSpacing: '4px',
          fontFamily: "'Playfair Display', serif",
          cursor: 'text'
        }}
      />

      {/* Message */}
      {message && (
        <div style={{ marginTop: 25, fontSize: '1.4rem', fontWeight: '600' }}>
          {message}
        </div>
      )}

      {/* Details */}
      {details && (
        <div style={{ marginTop: 10, fontSize: '1.2rem' }}>
          <div>
            {details.label}:{" "}
            <span style={{ color: '#7FFF00', fontWeight: 'bold' }}>
              {details.time}
            </span>
          </div>
          {details.total && (
            <div style={{ marginTop: 6, fontSize: '1.2rem', color: '#e0e0e0' }}>
              Total Hours Worked: {details.total}
            </div>
          )}
        </div>
      )}

      {/* Camera Modal */}
      {showCamera && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}
        >
          <h2 style={{ color: '#fff', marginBottom: '30px', fontSize: '1.8rem' }}>
            Capturing Photo...
          </h2>

          {/* Video frame - Square */}
          <div
            style={{
              position: 'relative',
              width: '420px',
              height: '420px',
              border: '3px solid rgba(255, 255, 255, 0.8)',
              borderRadius: '20px',
              overflow: 'hidden',
              marginBottom: '40px',
              boxShadow: '0 0 30px rgba(255, 255, 255, 0.3)',
              backgroundColor: '#000'
            }}
          >
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'scaleX(-1)'
              }}
            />
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '20px' }}>
            <button
              onClick={capturePhotoManual}
              disabled={!captureEnabled}
              style={{
                padding: '15px 40px',
                fontSize: '1.1rem',
                backgroundColor: captureEnabled ? '#7FFF00' : '#CCCCCC',
                color: captureEnabled ? '#000' : '#666',
                border: 'none',
                borderRadius: '5px',
                cursor: captureEnabled ? 'pointer' : 'not-allowed',
                fontWeight: 'bold',
                transition: 'all 0.3s',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
                opacity: captureEnabled ? 1 : 0.6
              }}
              onMouseEnter={(e) => {
                if (captureEnabled) {
                  e.target.style.backgroundColor = '#90EE90';
                  e.target.style.transform = 'scale(1.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (captureEnabled) {
                  e.target.style.backgroundColor = '#7FFF00';
                  e.target.style.transform = 'scale(1)';
                }
              }}
            >
              {captureEnabled ? 'Capture Now' : `Wait ${captureTimer}s`}
            </button>
            <button
              onClick={() => {
                closeCamera();
                setCardId('');
              }}
              style={{
                padding: '15px 40px',
                fontSize: '1.1rem',
                backgroundColor: '#FF6B6B',
                color: '#fff',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'all 0.3s',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#FF8787';
                e.target.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#FF6B6B';
                e.target.style.transform = 'scale(1)';
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Hidden canvas for capturing */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Footer */}
      <footer
        style={{
          position: 'absolute',
          bottom: '20px',
          width: '100%',
          textAlign: 'center',
          fontSize: '1rem',
          fontWeight: 'normal',
          letterSpacing: '2px'
        }}
      >
        PLEASE TAP YOUR ID ON THE SCANNER
      </footer>
    </div>
  );
};

export default Attendance;