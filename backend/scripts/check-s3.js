const path = require('path');
const dotenv = require('dotenv');
const {
  S3Client,
  HeadBucketCommand,
  ListObjectsV2Command,
} = require('@aws-sdk/client-s3');

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

const bucket = process.env.S3_BUCKET;
const region = process.env.S3_REGION;
const endpoint = process.env.S3_ENDPOINT;
const prefix = (process.env.S3_PREFIX || '').replace(/^\/+|\/+$/g, '');
const normalizedPrefix = prefix ? `${prefix}/` : '';

const client = new S3Client({
  region,
  endpoint,
  forcePathStyle: false,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
});

async function listLevel(currentPrefix) {
  const response = await client.send(
    new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: currentPrefix,
      Delimiter: '/',
      MaxKeys: 200,
    })
  );

  const folders = (response.CommonPrefixes || []).map((entry) => entry.Prefix);
  const files = (response.Contents || [])
    .map((entry) => entry.Key)
    .filter((key) => key !== currentPrefix);

  return { folders, files, isTruncated: Boolean(response.IsTruncated) };
}

async function main() {
  console.log('Checking S3 connection...');
  console.log(`Bucket: ${bucket}`);
  console.log(`Region: ${region}`);
  console.log(`Endpoint: ${endpoint}`);
  console.log(`Prefix: ${normalizedPrefix || '(root)'}`);

  await client.send(new HeadBucketCommand({ Bucket: bucket }));
  console.log('Bucket access: OK');

  const topLevel = await listLevel(normalizedPrefix);
  console.log('\nTop-level folders:');
  if (topLevel.folders.length === 0) {
    console.log('  (none found)');
  } else {
    topLevel.folders.forEach((folder) => console.log(`  - ${folder}`));
  }

  if (topLevel.files.length > 0) {
    console.log('\nTop-level files:');
    topLevel.files.forEach((file) => console.log(`  - ${file}`));
  }

  const interestingFolders = [
    `${normalizedPrefix}audio/`,
    `${normalizedPrefix}profile-photos/`,
  ];

  for (const folder of interestingFolders) {
    const result = await listLevel(folder);
    console.log(`\nContents under ${folder}:`);

    if (result.folders.length === 0 && result.files.length === 0) {
      console.log('  (empty or not created yet)');
      continue;
    }

    result.folders.forEach((subfolder) => console.log(`  - ${subfolder}`));
    result.files.forEach((file) => console.log(`  - ${file}`));
  }
}

main().catch((error) => {
  console.error('\nS3 check failed.');
  console.error(`Name: ${error.name}`);
  console.error(`Message: ${error.message}`);

  if (error.$metadata) {
    console.error(`HTTP status: ${error.$metadata.httpStatusCode}`);
  }

  process.exit(1);
});
