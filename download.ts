import fs from 'fs';
import https from 'https';

const url = 'https://i.postimg.cc/qRw70X1t/favicon.jpg';
const dests = ['public/favicon.ico', 'public/favicon-96x96.png', 'public/apple-touch-icon.png'];

if (!fs.existsSync('public')) {
  fs.mkdirSync('public');
}

https.get(url, (res) => {
  if (res.statusCode === 301 || res.statusCode === 302) {
    https.get(res.headers.location!, (res2) => {
      dests.forEach(dest => {
        const file = fs.createWriteStream(dest);
        res2.pipe(file);
      });
    });
  } else {
    dests.forEach(dest => {
      const file = fs.createWriteStream(dest);
      res.pipe(file);
    });
  }
});
