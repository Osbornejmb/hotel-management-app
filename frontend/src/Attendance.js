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

  // Save image to local storage (IndexedDB)
  const saveImageLocally = async (imageBlob) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `${cardId}_${timestamp}.jpg`;
        const imageData = {
          filename,
          data: reader.result,
          timestamp: new Date().toISOString()
        };

        // Store in localStorage and IndexedDB
        try {
          // Try to store in IndexedDB for larger images
          const request = indexedDB.open('AttendanceDB', 1);
          request.onsuccess = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('photos')) {
              db.close();
              const request2 = indexedDB.open('AttendanceDB', 2);
              request2.onupgradeneeded = (e) => {
                e.target.result.createObjectStore('photos', { autoIncrement: true });
              };
              request2.onsuccess = () => {
                const db2 = request2.target.result;
                const tx = db2.transaction('photos', 'readwrite');
                tx.objectStore('photos').add(imageData);
                db2.close();
                resolve(filename);
              };
            } else {
              const tx = db.transaction('photos', 'readwrite');
              tx.objectStore('photos').add(imageData);
              db.close();
              resolve(filename);
            }
          };
          request.onerror = () => {
            resolve(filename);
          };
        } catch (err) {
          console.error('Error saving to IndexedDB:', err);
          resolve(filename);
        }
      };
      reader.readAsDataURL(imageBlob);
    });
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
        // Auto-capture after 2 seconds
        setTimeout(() => {
          if (showCamera) {
            capturePhotoAuto();
          }
        }, 2000);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setMessage('Unable to access camera. Please check permissions.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // Auto-capture photo with face detection
  const capturePhotoAuto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      // Detect face
      const faceDetected = detectFace(canvas);

      if (!faceDetected) {
        setMessage('No face detected. Please try again.');
        setTimeout(() => setMessage(''), 2000);
        return;
      }

      // Convert canvas to blob and save
      canvas.toBlob(async (blob) => {
        const filename = await saveImageLocally(blob);
        console.log('Image saved locally:', filename);
        
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

  // Manual capture for testing
  const capturePhotoManual = async () => {
    await capturePhotoAuto();
  };

  // Process attendance locally (mock)
  const processAttendance = () => {
    setLoading(true);
    
    // Simulate attendance processing
    setTimeout(() => {
      // Mock employee data
      const mockName = 'Employee ' + cardId;
      const isClockedOut = Math.random() > 0.5; // Random for demo
      
      if (isClockedOut) {
        setMessage(`Thank You, ${mockName}`);
        setDetails({
          label: 'Clocked Out',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          total: (Math.random() * 8 + 7).toFixed(2) // Mock 7-15 hours
        });
      } else {
        setMessage(`${getGreeting()}, ${mockName}`);
        setDetails({
          label: 'Clocked In',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      }

      setLoading(false);
      setCardId('');
      setTimeout(() => {
        setMessage('');
        setDetails(null);
      }, 4000);
    }, 500);
  };

  // Close camera
  const closeCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
    setShowCamera(false);
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
            Capturing Photo...
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
              onClick={capturePhotoManual}
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
              Capture Now
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