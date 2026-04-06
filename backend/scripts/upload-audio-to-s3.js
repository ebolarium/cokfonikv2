const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env'), override: false });

const requiredEnvVars = [
  'S3_BUCKET',
  'S3_REGION',
  'S3_ENDPOINT',
  'S3_ACCESS_KEY_ID',
  'S3_SECRET_ACCESS_KEY',
];

const missingEnvVars = requiredEnvVars.filter((name) => !process.env[name]);

if (missingEnvVars.length > 0) {
  console.error('Missing required env vars:', missingEnvVars.join(', '));
  process.exit(1);
}

const audioRoot = path.resolve(__dirname, '../../audio');
const bucket = process.env.S3_BUCKET;
const region = process.env.S3_REGION;
const endpoint = process.env.S3_ENDPOINT;
const prefix = (process.env.S3_PREFIX || '').replace(/^\/+|\/+$/g, '');
const normalizedPrefix = prefix ? `${prefix}/` : '';
const dryRun = process.argv.includes('--dry-run');

const validParts = new Set(['general', 'soprano', 'alto', 'tenor', 'bass']);

const s3 = new S3Client({
  region,
  endpoint,
  forcePathStyle: false,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
});

function getContentType(fileName) {
  const ext = path.extname(fileName).toLowerCase();

  if (ext === '.mp3') return 'audio/mpeg';
  if (ext === '.wav') return 'audio/wav';
  if (ext === '.m4a') return 'audio/mp4';
  if (ext === '.aac') return 'audio/aac';
  if (ext === '.ogg') return 'audio/ogg';

  return 'application/octet-stream';
}

async function walkFiles(dir) {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        return walkFiles(fullPath);
      }

      return [fullPath];
    })
  );

  return files.flat();
}

function toS3Key(filePath) {
  const relativePath = path.relative(audioRoot, filePath);
  const pathParts = relativePath.split(path.sep);
  const part = pathParts[0];

  if (!validParts.has(part)) {
    throw new Error(`Unsupported audio folder: ${relativePath}`);
  }

  const objectName = pathParts.slice(1).join('/');
  return `${normalizedPrefix}audio/${part}/${objectName}`;
}

async function uploadFile(filePath) {
  const key = toS3Key(filePath);

  if (dryRun) {
    console.log(`[dry-run] ${filePath} -> s3://${bucket}/${key}`);
    return { key, skipped: false };
  }

  const body = fs.createReadStream(filePath);
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: getContentType(filePath),
    })
  );

  console.log(`Uploaded ${filePath} -> s3://${bucket}/${key}`);
  return { key, skipped: false };
}

async function main() {
  if (!fs.existsSync(audioRoot)) {
    throw new Error(`Audio folder not found: ${audioRoot}`);
  }

  const allFiles = await walkFiles(audioRoot);
  const audioFiles = allFiles.filter((filePath) => {
    const baseName = path.basename(filePath);

    if (baseName === '.DS_Store') {
      return false;
    }

    return validParts.has(path.relative(audioRoot, filePath).split(path.sep)[0]);
  });

  console.log(`Audio root: ${audioRoot}`);
  console.log(`Bucket: ${bucket}`);
  console.log(`Prefix: ${normalizedPrefix || '(root)'}`);
  console.log(`Mode: ${dryRun ? 'dry-run' : 'upload'}`);
  console.log(`Files to process: ${audioFiles.length}`);

  const results = {
    uploaded: 0,
    failed: 0,
    errors: [],
  };

  for (const filePath of audioFiles) {
    try {
      await uploadFile(filePath);
      results.uploaded += 1;
    } catch (error) {
      results.failed += 1;
      results.errors.push({ filePath, message: error.message });
      console.error(`Failed ${filePath}: ${error.message}`);
    }
  }

  console.log('\nSummary:');
  console.log(`Uploaded: ${results.uploaded}`);
  console.log(`Failed: ${results.failed}`);

  if (results.errors.length > 0) {
    console.log('\nFailures:');
    results.errors.forEach((entry) => {
      console.log(`- ${entry.filePath}: ${entry.message}`);
    });
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('\nUpload script failed.');
  console.error(`Message: ${error.message}`);
  process.exit(1);
});
