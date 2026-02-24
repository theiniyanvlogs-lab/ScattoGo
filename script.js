context.clearRect(0, 0, canvas.width, canvas.height);

// Draw first image full
context.globalAlpha = 1.0;
context.drawImage(firstImage, 0, 0);

// Draw second image with slight transparency
context.globalAlpha = 0.7;
context.drawImage(secondImage, 0, 0);

context.globalAlpha = 1.0;
