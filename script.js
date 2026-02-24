const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const captureBtn = document.getElementById("captureBtn");
const countdown = document.getElementById("countdown");
const ctx = canvas.getContext("2d");

let firstImageData = null;
let processing = false;

// Start Camera
navigator.mediaDevices.getUserMedia({ video: true })
.then(stream => {
    video.srcObject = stream;
})
.catch(() => alert("Camera permission required!"));

// Setup MediaPipe Segmentation
const selfieSegmentation = new SelfieSegmentation({
    locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`
});

selfieSegmentation.setOptions({
    modelSelection: 1
});

// Countdown Function
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

captureBtn.addEventListener("click", async () => {

    if (processing) return;
    processing = true;

    await startCountdown(3);

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.drawImage(video, 0, 0);

    if (!firstImageData) {

        // FIRST PHOTO
        firstImageData = canvas.toDataURL("image/png");
        alert("First photo taken! Now join the group and click again.");
        processing = false;

    } else {

        // SECOND PHOTO WITH AI SEGMENTATION
        selfieSegmentation.onResults(results => {

            const firstImage = new Image();
            firstImage.src = firstImageData;

            firstImage.onload = () => {

                ctx.clearRect(0, 0, canvas.width, canvas.height);

                // Draw original first photo
                ctx.drawImage(firstImage, 0, 0);

                // Draw only detected person from second image
                ctx.save();

                // Draw segmentation mask
                ctx.drawImage(results.segmentationMask, 0, 0, canvas.width, canvas.height);

                // Keep only person pixels
                ctx.globalCompositeOperation = "source-in";
                ctx.drawImage(video, 0, 0);

                ctx.restore();

                // Save final image
                const finalImage = canvas.toDataURL("image/png");

                const link = document.createElement("a");
                link.href = finalImage;
                link.download = "ScattoGo_AI_Group.png";
                link.click();

                alert("Smart AI group photo saved!");

                firstImageData = null;
                processing = false;
            };
        });

        await selfieSegmentation.send({ image: video });
    }
});
