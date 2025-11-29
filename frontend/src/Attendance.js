import React, { useState, useRef, useEffect } from 'react';
import * as faceapi from 'face-api.js';

const Attendance = () => {
  const [cardId, setCardId] = useState('');
  const [message, setMessage] = useState('');
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const inputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null); 

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
          faceapi.nets.faceExpressionNet.loadFromUri('/models')
        ]);
        setModelsLoaded(true);
      } catch (err) {
        console.error('Error loading face-api models:', err);
        setMessage('Error loading face detection. Please refresh the page.');
      }
    };
    loadModels();
  }, []);

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 } }
      });
      videoRef.current.srcObject = stream;
      setShowCamera(true);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setMessage('Unable to access camera. Please check permissions.');
    }
  };

  // Capture and detect face
  const captureFace = async () => {
    if (!videoRef.current || !canvasRef.current || !modelsLoaded) {
      setMessage('Camera or face detection not ready.');
      return;
    }

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      // Set canvas size
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame
      ctx.drawImage(video, 0, 0);

      // Detect faces
      const detections = await faceapi.detectAllFaces(
        video,
        new faceapi.TinyFaceDetector()
      );

      if (detections.length === 0) {
        setMessage('No face detected. Please try again.');
        return;
      }

      if (detections.length > 1) {
        setMessage('Multiple faces detected. Please ensure only one person is in frame.');
        return;
      }

      // Draw detection
      const displaySize = {
        width: canvas.width,
        height: canvas.height
      };
      faceapi.matchDimensions(canvas, displaySize);
      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      ctx.strokeStyle = '#00FF00';
      ctx.lineWidth = 2;
      resizedDetections.forEach(detection => {
        const box = detection.detection.box;
        ctx.strokeRect(box.x, box.y, box.width, box.height);
      });

      // Save image locally
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `attendance_${cardId}_${timestamp}.jpg`;
      
      // Store image in state to send to backend
      setCapturedImage(imageData);
      
      // Store in localStorage
      try {
        const storageKey = `captured_image_${cardId}_${new Date().toISOString().split('T')[0]}`;
        localStorage.setItem(storageKey, imageData);
        console.log(`Image saved locally: ${filename}`);
      } catch (err) {
        if (err.name === 'QuotaExceededError') {
          console.warn('LocalStorage quota exceeded, attempting to clear old images');
          // Clear old images to make space
          const keys = Object.keys(localStorage);
          keys.forEach(key => {
            if (key.startsWith('captured_image_')) {
              localStorage.removeItem(key);
            }
          });
          // Try saving again
          const storageKey = `captured_image_${cardId}_${new Date().toISOString().split('T')[0]}`;
          localStorage.setItem(storageKey, imageData);
        }
      }

      // Also try to download the image
      downloadImage(imageData, filename);

      // Close camera and proceed with attendance
      closeCamera();
      await handleSubmit();
    } catch (err) {
      console.error('Error detecting face:', err);
      setMessage('Face detection error. Please try again.');
    }
  };

  // Download image function
  const downloadImage = (imageData, filename) => {
    try {
      const link = document.createElement('a');
      link.href = imageData;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log(`Image download initiated: ${filename}`);
    } catch (err) {
      console.error('Error downloading image:', err);
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

  const handleSubmit = async () => {
    if (!cardId) return;
    setLoading(true);
    setMessage('');
    setDetails(null);
    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId, image: capturedImage })
      });
      const data = await response.json();

      if (response.ok) {
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
      } else {
        setMessage(data.error || 'An error occurred.');
      }
    } catch (error) {
      setMessage('Failed to connect to the server.');
    } finally {
      setLoading(false);
      setCardId('');
      setCapturedImage(null);
      setTimeout(() => {
        setMessage('');
        setDetails(null);
      }, 4000);
    }
  };

  const handleCardIdSubmit = async () => {
    if (!cardId) return;
    if (!modelsLoaded) {
      setMessage('Face detection not ready. Please wait.');
      return;
    }
    await startCamera();
  };

  useEffect(() => {
    if (!loading && !showCamera) {
      inputRef.current?.focus();
    }
  }, [loading, showCamera]);

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
          {/* Custom underline only under L */}
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
        {/* Subtitle */}
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
        onKeyDown={(e) => {
          if (e.key === 'Enter' && cardId.length === 10 && !loading && !showCamera) {
            handleCardIdSubmit();
          }
        }}
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
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}
        >
          <h2 style={{ color: '#fff', marginBottom: '20px', fontSize: '1.5rem' }}>
            Please Look at the Camera
          </h2>
          <div
            style={{
              position: 'relative',
              width: '500px',
              height: '375px',
              border: '3px solid #E4B169',
              borderRadius: '10px',
              overflow: 'hidden',
              marginBottom: '20px'
            }}
          >
            <video
              ref={videoRef}
              autoPlay
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'scaleX(-1)'
              }}
            />
            <canvas
              ref={canvasRef}
              style={{
                display: 'none'
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={captureFace}
              style={{
                padding: '12px 30px',
                fontSize: '1rem',
                backgroundColor: '#7FFF00',
                color: '#000',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'background-color 0.3s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#90EE90'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#7FFF00'}
            >
              Capture
            </button>
            <button
              onClick={() => {
                closeCamera();
                setCardId('');
              }}
              style={{
                padding: '12px 30px',
                fontSize: '1rem',
                backgroundColor: '#FF6B6B',
                color: '#fff',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'background-color 0.3s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#FF8787'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#FF6B6B'}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

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