const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const captureBtn = document.getElementById("captureBtn");
const countdown = document.getElementById("countdown");
const ctx = canvas.getContext("2d");

let cameraStarted = false;
let firstImageData = null;
let stream = null;
let processing = false;

// Setup AI
const selfieSegmentation = new SelfieSegmentation({
    locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`
});

selfieSegmentation.setOptions({
    modelSelection: 1
});

// Countdown
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

// Start Camera
async function startCamera() {
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    cameraStarted = true;
}

// Button Click Logic
captureBtn.addEventListener("click", async () => {

    if (processing) return;

    // 1️⃣ First click → start camera
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

    // 2️⃣ Second click → store first photo
    if (!firstImageData) {
        firstImageData = canvas.toDataURL("image/png");
        alert("First photo taken. Join group and click again.");
        captureBtn.innerText = "Take Second Photo";
        processing = false;
        return;
    }

    // 3️⃣ Third click → AI merge
    await selfieSegmentation.send({ image: video });

    selfieSegmentation.onResults(results => {

        const firstImage = new Image();
        firstImage.src = firstImageData;

        firstImage.onload = () => {

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw first photo
            ctx.drawImage(firstImage, 0, 0);

            // Apply mask
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

            // Reset everything
            firstImageData = null;
            captureBtn.innerText = "Start Again";
            processing = false;
        };
    });
});
