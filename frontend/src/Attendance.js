import React, { useState, useRef, useEffect } from 'react';

const Attendance = () => {
  const [cardId, setCardId] = useState('');
  const [message, setMessage] = useState('');
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const inputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  // Simple face detection using edge detection
  const detectFace = (canvas) => {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Convert to grayscale and find edges (simple skin tone detection)
    let skinPixels = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Detect skin tone ranges (basic face detection)
      // Skin tones typically have R > G > B with specific ranges
      if (r > 95 && g > 40 && b > 20 && r > b && r > g && (r - g) > 15) {
        skinPixels++;
      }
    }

    // Calculate percentage of skin-like pixels
    const skinPercentage = (skinPixels / (canvas.width * canvas.height)) * 100;

    // If we detect between 5-40% skin tone, likely a face is present
    return skinPercentage > 5 && skinPercentage < 40;
  };

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 } }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setShowCamera(true);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setMessage('Unable to access camera. Please check permissions.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // Capture photo with face detection
  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      // Set canvas dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0);

      // Detect face
      const faceDetected = detectFace(canvas);

      if (!faceDetected) {
        setMessage('No face detected. Please try again.');
        setTimeout(() => setMessage(''), 2000);
        return;
      }

      // Get image data
      const imageData = canvas.toDataURL('image/jpeg', 0.8);

      // Close camera
      closeCamera();

      // Send to server with attendance
      await submitAttendance(imageData);
    } catch (err) {
      console.error('Error capturing photo:', err);
      setMessage('Error capturing photo. Please try again.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // Close camera
  const closeCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  // Submit attendance with image
  const submitAttendance = async (imageData) => {
    setLoading(true);
    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId, image: imageData })
      });
      const data = await response.json();

      if (response.ok) {
        if (data.status === 'clocked-in') {
          setMessage(`${getGreeting()}, ${data.name}`);
          setDetails({
            label: 'Clocked In',
            time: new Date(data.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-minute' })
          });
        } else if (data.status === 'clocked-out') {
          setMessage(`Thank You, ${data.name}`);
          setDetails({
            label: 'Clocked Out',
            time: new Date(data.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            total: data.totalHours.toFixed(2)
          });
        }
      } else {
        setMessage(data.error || 'An error occurred.');
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage('Failed to connect to server.');
    } finally {
      setLoading(false);
      setCardId('');
      setTimeout(() => {
        setMessage('');
        setDetails(null);
      }, 4000);
    }
  };

  // Handle card ID submission
  const handleCardIdSubmit = async (e) => {
    if (e.key === 'Enter' && cardId.trim() && !loading && !showCamera) {
      await startCamera();
    }
  };

  useEffect(() => {
    if (!showCamera && !loading) {
      inputRef.current?.focus();
    }
  }, [showCamera, loading]);

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
            Take Your Photo
          </h2>

          {/* Video frame */}
          <div
            style={{
              position: 'relative',
              width: '500px',
              height: '375px',
              border: '4px solid #E4B169',
              borderRadius: '10px',
              overflow: 'hidden',
              marginBottom: '30px',
              boxShadow: '0 0 20px rgba(228, 177, 105, 0.5)'
            }}
          >
            <video
              ref={videoRef}
              autoPlay
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
              onClick={capturePhoto}
              style={{
                padding: '15px 40px',
                fontSize: '1.1rem',
                backgroundColor: '#7FFF00',
                color: '#000',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'all 0.3s',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#90EE90';
                e.target.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#7FFF00';
                e.target.style.transform = 'scale(1)';
              }}
            >
              Capture
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