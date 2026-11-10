const video = document.getElementById('video');
const statusText = document.getElementById('status');

async function loadModels() {
    try {
        statusText.innerText = "Loading AI Models...";
        const MODEL_URL = './models';

        // Check availability of each net
        console.log("Checking faceapi nets availability:", {
            ssd: !!faceapi.nets.ssdMobilenetv1,
            landmark68: !!faceapi.nets.faceLandmark68Net, // Corrected property name
            recognition: !!faceapi.nets.faceRecognitionNet,
            expression: !!faceapi.nets.faceExpressionNet
        });

        await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL); // Updated here
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
        
        statusText.innerText = "Models Loaded! Requesting webcam access...";
        statusText.style.color = "#059669";
        startWebcam();
    } catch (err) {
        console.error("Detailed model error:", err);
        statusText.innerText = "Error loading models: " + err.message;
        statusText.style.color = "#dc2626";
    }
}

function startWebcam() {
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then((stream) => {
            video.srcObject = stream;
            statusText.innerText = "Webcam active. Detecting emotions...";
        })
        .catch((err) => {
            console.error("Webcam access error:", err);
            statusText.innerText = "Webcam permission denied or camera not found.";
            statusText.style.color = "#dc2626";
        });
}

video.addEventListener('play', () => {
    const canvas = faceapi.createCanvasFromMedia(video);
    document.getElementById('video-wrapper').append(canvas);

    const displaySize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, displaySize);

    setInterval(async () => {
        const detections = await faceapi.detectSingleFace(
            video, 
            new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 })
        )
        .withFaceLandmarks()
        .withFaceExpressions();

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (detections) {
            const resizedDetections = faceapi.resizeResults(detections, displaySize);
            faceapi.draw.drawDetections(canvas, resizedDetections);
            faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
            faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
        }
    }, 100);
});

window.addEventListener('load', () => {
    loadModels();
});