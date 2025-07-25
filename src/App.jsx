import React, { useRef, useEffect, useState } from 'react';
import './App.css';

function App() {
  const videoRef = useRef(null);
  const photoRef = useRef(null);
  const [hasPhoto, setHasPhoto] = useState(false);
  const [identificationResult, setIdentificationResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const API_URL = 'https://perezdj.pythonanywhere.com/identify'; 

  const getVideo = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }

    navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } })
      .then(stream => {
        let video = videoRef.current;
        video.srcObject = stream;
        video.play();
        setHasPhoto(false);
        setIdentificationResult(null);
      })
      .catch(err => {
        console.error("Error accessing camera:", err);
        setIdentificationResult({ status: "error", message: "No se pudo acceder a la cámara. Asegúrate de otorgar permisos." });
      });
  };

  const takePhoto = () => {
    const width = 640;
    const height = width / (videoRef.current.videoWidth / videoRef.current.videoHeight);

    let video = videoRef.current;
    let photo = photoRef.current;

    photo.width = width;
    photo.height = height;

    let ctx = photo.getContext('2d');
    ctx.drawImage(video, 0, 0, width, height);
    setHasPhoto(true);
  };

  const clearPhoto = () => {
    setHasPhoto(false);
    setIdentificationResult(null);
    let photo = photoRef.current;
    let ctx = photo.getContext('2d');
    ctx.clearRect(0, 0, photo.width, photo.height);
    getVideo();
  };

  const identifyPhoto = async () => {
    setLoading(true);
    setIdentificationResult(null);

    let photo = photoRef.current;
    const imageData = photo.toDataURL('image/png');

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: imageData }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error HTTP! Estado: ${response.status}. Detalles: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      setIdentificationResult(data);
      console.log("Backend response:", data);

    } catch (error) {
      console.error("Error al enviar imagen al backend:", error);
      setIdentificationResult({ status: "error", message: `Error al conectar con el servidor o procesar la imagen: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getVideo();
  }, []);

  return (
    <div className="App">
      <h1>Sistema de Identificación Visual</h1>

      <div className="camera">
        <video ref={videoRef} autoPlay playsInline muted></video>
        <button onClick={takePhoto}>Tomar Foto</button>
      </div>

      <div className={'result ' + (hasPhoto ? 'hasPhoto' : '')}>
        <canvas ref={photoRef}></canvas>
        <div className="buttons-group">
            <button onClick={clearPhoto}>Borrar Foto</button>
            <button onClick={identifyPhoto} disabled={loading}>
                {loading ? 'Identificando...' : 'Identificar'}
            </button>
        </div>

        {identificationResult && (
          <div className="identification-output">
            {identificationResult.status === "success" ? (
              <>
                <p>Identificación: <strong>{identificationResult.identification}</strong></p>
                <p>Confianza: {Math.round(identificationResult.confidence * 100)}%</p>
              </>
            ) : (
              <p className="error-message">Error: {identificationResult.message}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
