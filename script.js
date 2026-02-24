const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const captureBtn = document.getElementById("captureBtn");
const switchBtn = document.getElementById("switchBtn");
const countdown = document.getElementById("countdown");
const ctx = canvas.getContext("2d");

let cameraStarted = false;
let firstImageData = null;
let stream = null;
let processing = false;
let useFrontCamera = true;

// =========================
// Setup AI (MediaPipe)
// =========================
const selfieSegmentation = new SelfieSegmentation({
    locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`
});

selfieSegmentation.setOptions({
    modelSelection: 1
});

// Register ONCE (important fix)
selfieSegmentation.onResults(onResults);

// =========================
// Countdown
// =========================
function startCountdown(seconds) {
    return new Promise(resolve => {
        countdown.style.display = "block";
        let counter = seconds;

        const interval = setInterval(() => {
            countdown.innerText = counter;
            counter--;

            if (counter < 0) {
                clearInterval(interval);
                countdown.style.display = "none";
                resolve();
            }
        }, 1000);
    });
}

// =========================
// Start / Restart Camera
// =========================
async function startCamera() {

    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }

    stream = await navigator.mediaDevices.getUserMedia({
        video: {
            facingMode: useFrontCamera ? "user" : "environment"
        }
    });

    video.srcObject = stream;
    cameraStarted = true;
}

// =========================
// Switch Camera Button
// =========================
if (switchBtn) {
    switchBtn.addEventListener("click", async () => {
        useFrontCamera = !useFrontCamera;
        await startCamera();
    });
}

// =========================
// Capture Button Logic
// =========================
captureBtn.addEventListener("click", async () => {

    if (processing) return;

    // 1️⃣ First Click → Start Camera
    if (!cameraStarted) {
        await startCamera();
        captureBtn.innerText = "Take First Photo";
        return;
    }

    processing = true;

    await startCountdown(3);

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.drawImage(video, 0, 0);

    // 2️⃣ Second Click → Save First Image
    if (!firstImageData) {
        firstImageData = canvas.toDataURL("image/png");
        alert("First photo taken. Join group and click again.");
        captureBtn.innerText = "Take Second Photo";
        processing = false;
        return;
    }

    // 3️⃣ Third Click → Send to AI
    await selfieSegmentation.send({ image: video });
});

// =========================
// AI Result Handler
// =========================
function onResults(results) {

    const firstImage = new Image();
    firstImage.src = firstImageData;

    firstImage.onload = () => {

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw first photo
        ctx.drawImage(firstImage, 0, 0);

        // Apply AI mask
        ctx.save();
        ctx.drawImage(results.segmentationMask, 0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = "source-in";
        ctx.drawImage(video, 0, 0);
        ctx.restore();

        const finalImage = canvas.toDataURL("image/png");

        const link = document.createElement("a");
        link.href = finalImage;
        link.download = "ScattoGo_AI_Group.png";
        link.click();

        alert("Smart AI group photo saved!");

        // Reset for next use
        firstImageData = null;
        captureBtn.innerText = "Start Again";
        processing = false;
    };
}
