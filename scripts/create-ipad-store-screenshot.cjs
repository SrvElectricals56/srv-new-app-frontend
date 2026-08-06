const path = require('node:path');
const sharp = require('sharp');

const workspaceRoot = path.resolve(__dirname, '..', '..');
const inputPath = path.join(
  workspaceRoot,
  'store-assets',
  'ios-2.0.0',
  '01-electrician-home-1242x2688.png'
);
const outputPath = path.join(
  workspaceRoot,
  'store-assets',
  'ios-2.0.0',
  '01-electrician-home-ipad-2048x2732.png'
);

async function main() {
  const source = sharp(inputPath);
  const metadata = await source.metadata();

  if (metadata.width !== 1242 || metadata.height !== 2688) {
    throw new Error(
      `Unexpected source dimensions: ${metadata.width}x${metadata.height}`
    );
  }

  const top = await sharp(inputPath)
    .extract({ left: 0, top: 0, width: 1242, height: 1390 })
    .toBuffer();
  const bottomNavigation = await sharp(inputPath)
    .extract({ left: 0, top: 2422, width: 1242, height: 266 })
    .toBuffer();

  const adaptedViewport = await sharp({
    create: {
      width: 1242,
      height: 1656,
      channels: 4,
      background: '#ffffff',
    },
  })
    .composite([
      { input: top, left: 0, top: 0 },
      { input: bottomNavigation, left: 0, top: 1390 },
    ])
    .png()
    .toBuffer();

  await sharp(adaptedViewport)
    .resize(2048, 2732, { fit: 'fill' })
    .png({ compressionLevel: 9 })
    .toFile(outputPath);

  const outputMetadata = await sharp(outputPath).metadata();
  console.log(
    JSON.stringify(
      {
        outputPath,
        width: outputMetadata.width,
        height: outputMetadata.height,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
