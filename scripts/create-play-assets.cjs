const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const assets = path.join(root, 'assets');
const temp = path.join(root, '.codex-temp');
const output = path.join(root, 'output', 'play-listing-2026-07');

fs.mkdirSync(output, { recursive: true });

const escapeXml = (value) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const svgText = (title, subtitle) => Buffer.from(`
  <svg width="1024" height="500" xmlns="http://www.w3.org/2000/svg">
    <style>
      .title { fill: #ffffff; font: 700 48px Arial, sans-serif; letter-spacing: 0.5px; }
      .subtitle { fill: #f4c67b; font: 500 26px Arial, sans-serif; letter-spacing: 0.25px; }
    </style>
    <text class="title" x="72" y="292">${escapeXml(title)}</text>
    <text class="subtitle" x="74" y="338">${escapeXml(subtitle)}</text>
  </svg>`);

async function main() {
  await sharp(path.join(assets, 'app-icon.png'))
    .resize(512, 512, { fit: 'cover' })
    .png()
    .toFile(path.join(output, 'store-icon-512.png'));

  const logo = await sharp(path.join(assets, 'app-icon.png'))
    .resize({ width: 132, height: 132, fit: 'cover' })
    .png()
    .toBuffer();

  await sharp(path.join(temp, 'feature-background.png'))
    .resize(1024, 500, { fit: 'cover' })
    .composite([
      { input: Buffer.from('<svg width="1024" height="500" xmlns="http://www.w3.org/2000/svg"><rect x="68" y="82" width="148" height="148" rx="34" fill="#fffaf2" fill-opacity="0.98"/></svg>') },
      { input: logo, left: 76, top: 90 },
      { input: svgText('SRV Electricals', 'Scan. Earn. Reward.') },
    ])
    .png()
    .toFile(path.join(output, 'feature-graphic-1024x500.png'));

  const showroomLogo = await sharp(path.join(assets, 'app-icon.png'))
    .resize(106, 106, { fit: 'cover' })
    .png()
    .toBuffer();
  const prepareProduct = async (filename, width, height) =>
    sharp(path.join(temp, 'srv-product-refs', filename))
      .trim({ background: '#ffffff', threshold: 10 })
      .resize(width, height, { fit: 'contain' })
      .png()
      .toBuffer();
  const [fanBox, modularBox, concealedBox] = await Promise.all([
    prepareProduct('fan-box.png', 210, 200),
    prepareProduct('modular-box.png', 230, 210),
    prepareProduct('concealed-box.png', 220, 205),
  ]);
  const productCopy = Buffer.from(`
    <svg width="1024" height="500" xmlns="http://www.w3.org/2000/svg">
      <style>
        .brand { fill: #ffffff; font: 700 43px Arial, sans-serif; letter-spacing: 0.2px; }
        .sub { fill: #f4c67b; font: 500 20px Arial, sans-serif; }
        .tag { fill: #ffffff; font: 700 19px Arial, sans-serif; }
        .item { fill: #f4c67b; font: 600 15px Arial, sans-serif; letter-spacing: 0.2px; }
      </style>
      <text class="brand" x="54" y="95">SRV Electricals</text>
      <text class="sub" x="55" y="130">Built for reliable connections.</text>
      <line x1="55" y1="165" x2="370" y2="165" stroke="#c98a35" stroke-width="2"/>
      <text class="tag" x="55" y="232">Electrical essentials,</text>
      <text class="tag" x="55" y="261">made to perform.</text>
      <text class="item" x="476" y="455">FAN BOX</text>
      <text class="item" x="669" y="455">MODULAR BOX</text>
      <text class="item" x="870" y="455">CONCEALED BOX</text>
    </svg>`);
  await sharp(path.join(temp, 'hero-products-background.png'))
    .resize(1024, 500, { fit: 'cover' })
    .composite([
      { input: Buffer.from('<svg width="1024" height="500" xmlns="http://www.w3.org/2000/svg"><rect x="38" y="32" width="138" height="138" rx="30" fill="#fffaf2" fill-opacity="0.98"/></svg>') },
      { input: showroomLogo, left: 54, top: 48 },
      { input: fanBox, left: 430, top: 221 },
      { input: modularBox, left: 620, top: 198 },
      { input: concealedBox, left: 824, top: 202 },
      { input: productCopy },
    ])
    .png()
    .toFile(path.join(output, 'feature-graphic-products-v2-1024x500.png'));

  const productHeroCopy = Buffer.from(`
    <svg width="1024" height="500" xmlns="http://www.w3.org/2000/svg">
      <style>
        .brand { fill: #ffffff; font: 700 42px Arial, sans-serif; letter-spacing: 0.2px; }
        .sub { fill: #f3c577; font: 500 20px Arial, sans-serif; }
        .line { stroke: #c98a35; stroke-width: 2; }
        .statement { fill: #ffffff; font: 700 25px Arial, sans-serif; }
      </style>
      <text class="brand" x="190" y="94">SRV Electricals</text>
      <text class="sub" x="191" y="127">Scan. Earn. Reward.</text>
      <line class="line" x1="56" y1="169" x2="385" y2="169"/>
      <text class="statement" x="56" y="223">Made for lasting</text>
      <text class="statement" x="56" y="255">connections.</text>
    </svg>`);
  await sharp(path.join(temp, 'hero-products-render.png'))
    .resize(1024, 500, { fit: 'cover', position: 'centre' })
    .composite([
      { input: Buffer.from('<svg width="1024" height="500" xmlns="http://www.w3.org/2000/svg"><rect x="42" y="37" width="122" height="122" rx="28" fill="#fffaf2" fill-opacity="0.98"/></svg>') },
      { input: showroomLogo, left: 50, top: 45 },
      { input: productHeroCopy },
    ])
    .png()
    .toFile(path.join(output, 'feature-graphic-products-v3-1024x500.png'));

  const officialPhoto = async (filename) =>
    sharp(path.join(temp, 'official-product-photos', filename))
      .resize(170, 132, { fit: 'contain', background: '#f7f5f0' })
      .png()
      .toBuffer();
  const [officialFanBox, officialConcealedBox, officialMcbBox, officialStabilizer] = await Promise.all([
    officialPhoto('fan-box-3-nipple.jpg'),
    officialPhoto('concealed-box-8p.jpg'),
    officialPhoto('modular-box-eco.jpg'),
    officialPhoto('voltage-stabilizer.png'),
  ]);
  const officialCards = Buffer.from(`
    <svg width="1024" height="500" xmlns="http://www.w3.org/2000/svg">
      <style>
        .brand { fill: #ffffff; font: 700 40px Arial, sans-serif; }
        .sub { fill: #f3c577; font: 500 19px Arial, sans-serif; }
        .statement { fill: #ffffff; font: 700 25px Arial, sans-serif; }
        .label { fill: #f6cf8a; font: 700 14px Arial, sans-serif; letter-spacing: 0.35px; }
      </style>
      <text class="label" x="486" y="211">FAN BOX</text>
      <text class="label" x="692" y="211">CONCEALED BOX</text>
      <text class="label" x="486" y="426">MODULAR BOX</text>
      <text class="label" x="692" y="426">STABILIZER</text>
      <text class="brand" x="184" y="91">SRV Electricals</text>
      <text class="sub" x="185" y="123">Scan. Earn. Reward.</text>
      <line x1="55" y1="166" x2="394" y2="166" stroke="#c98a35" stroke-width="2"/>
      <text class="statement" x="55" y="221">An electrical range</text>
      <text class="statement" x="55" y="253">you can rely on.</text>
      <text class="sub" x="55" y="304">Quality products. Clear rewards.</text>
    </svg>`);
  const officialCardBackdrops = Buffer.from(`
    <svg width="1024" height="500" xmlns="http://www.w3.org/2000/svg">
      <rect x="468" y="44" width="184" height="183" rx="18" fill="#f7f5f0"/>
      <rect x="674" y="44" width="184" height="183" rx="18" fill="#f7f5f0"/>
      <rect x="468" y="259" width="184" height="183" rx="18" fill="#f7f5f0"/>
      <rect x="674" y="259" width="184" height="183" rx="18" fill="#f7f5f0"/>
      <rect x="468" y="185" width="184" height="42" fill="#10223e"/>
      <rect x="674" y="185" width="184" height="42" fill="#10223e"/>
      <rect x="468" y="400" width="184" height="42" fill="#10223e"/>
      <rect x="674" y="400" width="184" height="42" fill="#10223e"/>
    </svg>`);
  await sharp(path.join(temp, 'hero-products-background.png'))
    .resize(1024, 500, { fit: 'cover' })
    .composite([
      { input: Buffer.from('<svg width="1024" height="500" xmlns="http://www.w3.org/2000/svg"><rect x="46" y="37" width="116" height="116" rx="27" fill="#fffaf2" fill-opacity="0.98"/></svg>') },
      { input: showroomLogo, left: 51, top: 42 },
      { input: officialCardBackdrops },
      { input: officialFanBox, left: 475, top: 51 },
      { input: officialConcealedBox, left: 681, top: 51 },
      { input: officialMcbBox, left: 475, top: 266 },
      { input: officialStabilizer, left: 681, top: 266 },
      { input: officialCards },
    ])
    .png()
    .toFile(path.join(output, 'feature-graphic-official-products-v4-1024x500.png'));

  await sharp(path.join(temp, 'staging-initial.png'))
    .extract({ left: 0, top: 120, width: 1080, height: 1920 })
    .png()
    .toFile(path.join(output, 'phone-01-welcome-1080x1920.png'));

  const source = sharp(path.join(root, 'phone-screen.png'));
  const metadata = await source.metadata();
  const sourceTop = Math.min(110, Math.max(0, metadata.height - 1));
  const croppedHeight = metadata.height - sourceTop;
  await source
    .extract({ left: 0, top: sourceTop, width: metadata.width, height: croppedHeight })
    .resize(1080, 1920, { fit: 'cover', position: 'top' })
    .png()
    .toFile(path.join(output, 'phone-02-products-1080x1920.png'));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
