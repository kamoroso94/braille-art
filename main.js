window.addEventListener('load', () => {
  const form = document.querySelector('form');
  const fileInput = document.querySelector('input[type="file"]');
  const pre = document.querySelector('pre');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if(fileInput.files.length == 0) return;

    const url = window.URL.createObjectURL(fileInput.files[0]);
    loadImage(url)
      .then(image => imageToBraille(image))
      .then(text => {
        pre.textContent = text;
      });
  });

  form.addEventListener('reset', () => {
    pre.textContent = '';
  });

  document.getElementById('copy-text').addEventListener('click', () => {
    const range = document.createRange();
    range.selectNodeContents(pre);
    window.getSelection().addRange(range);
    document.execCommand('copy');
  });
});

function imageToCanvas(image) {
  // draw to padded canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const scaledWidth = Math.floor(image.width / 4);
  const scaledHeight = Math.floor(image.height / 4);
  const paddedWidth = 2 * Math.ceil(scaledWidth / 2);
  const paddedHeight = 4 * Math.ceil(scaledHeight / 4);

  canvas.width = paddedWidth;
  canvas.height = paddedHeight;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0, scaledWidth, scaledHeight);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  window.URL.revokeObjectURL(image.src);

  return imageData;
}

function imageToBraille(image) {
  // create ascii art from image data
  const imageData = imageToCanvas(image);
  let asciiArt = '';
  const getIndex = (x, y) => 4 * (x + imageData.width * y);
  const dotMap = [[0, 1, 2, 6], [3, 4, 5, 7]];

  for(let y = 0; y < imageData.height; y += 4) {
    for(let x = 0; x < imageData.width; x += 2) {
      let codePoint = 0x2800;

      for(let h = 0; h < 2; h++) {
        for(let k = 0; k < 4; k++) {
          const index = getIndex(x + h, y + k);
          const r = imageData.data[index + 0];
          const g = imageData.data[index + 1];
          const b = imageData.data[index + 2];
          const intensity = Math.floor(0.2126 * r + 0.7152 * g + 0.0722 * b);

          if(intensity < 128) {
            codePoint |= 1 << dotMap[h][k];
          }
        }
      }
      asciiArt += String.fromCodePoint(codePoint | 0x1);
    }
    asciiArt += '\n';
  }

  return asciiArt;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', (err) => reject(err));
    img.src = src;
  });
}
