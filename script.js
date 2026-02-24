const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const captureBtn = document.getElementById("captureBtn");

let firstImage = null;

// Start Camera
navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
        video.srcObject = stream;
    });

captureBtn.addEventListener("click", () => {

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL("image/png");

    if (!firstImage) {
        firstImage = new Image();
        firstImage.src = imageData;
        alert("First photo taken! Join the group and click again.");
    } else {
        const secondImage = new Image();
        secondImage.src = imageData;

        secondImage.onload = () => {
            ctx.drawImage(firstImage, 0, 0);
            ctx.drawImage(secondImage, 0, 0);

            const finalImage = canvas.toDataURL("image/png");

            const link = document.createElement("a");
            link.download = "Final_Group_Photo.png";
            link.href = finalImage;
            link.click();

            firstImage = null;
        };
    }
});