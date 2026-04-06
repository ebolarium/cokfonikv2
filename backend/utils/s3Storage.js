const fs = require('fs');
const path = require('path');
const { S3Client, DeleteObjectCommand, ListObjectsV2Command, PutObjectCommand } = require('@aws-sdk/client-s3');

const requiredEnvVars = [
  'S3_BUCKET',
  'S3_REGION',
  'S3_ENDPOINT',
  'S3_ACCESS_KEY_ID',
  'S3_SECRET_ACCESS_KEY',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required S3 env var: ${envVar}`);
  }
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

function withPrefix(key) {
  return `${normalizedPrefix}${key.replace(/^\/+/, '')}`;
}

function stripPrefix(key) {
  if (normalizedPrefix && key.startsWith(normalizedPrefix)) {
    return key.slice(normalizedPrefix.length);
  }

  return key.replace(/^\/+/, '');
}

function buildPublicUrl(key) {
  const endpointUrl = new URL(endpoint);
  endpointUrl.hostname = `${bucket}.${endpointUrl.hostname}`;
  endpointUrl.pathname = `/${key}`;
  return endpointUrl.toString();
}

function getContentType(fileName, fallback = 'application/octet-stream') {
  const ext = path.extname(fileName).toLowerCase();

  if (ext === '.mp3') return 'audio/mpeg';
  if (ext === '.wav') return 'audio/wav';
  if (ext === '.m4a') return 'audio/mp4';
  if (ext === '.aac') return 'audio/aac';
  if (ext === '.ogg') return 'audio/ogg';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';

  return fallback;
}

async function listObjects(prefixKey) {
  const fullPrefix = withPrefix(prefixKey);
  const objects = [];
  let continuationToken;

  do {
    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: fullPrefix,
        ContinuationToken: continuationToken,
      })
    );

    (response.Contents || []).forEach((item) => {
      if (item.Key !== fullPrefix) {
        objects.push(item);
      }
    });

    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
  } while (continuationToken);

  return objects;
}

async function uploadFile({ filePath, key, contentType, cacheControl }) {
  const resolvedKey = withPrefix(key);

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: resolvedKey,
      Body: fs.createReadStream(filePath),
      ContentType: contentType || getContentType(filePath),
      CacheControl: cacheControl,
    })
  );

  return {
    key: resolvedKey,
    url: buildPublicUrl(resolvedKey),
  };
}

async function deleteObject(key) {
  const resolvedKey = key.startsWith(normalizedPrefix) ? key : withPrefix(key);

  return client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: resolvedKey,
    })
  );
}

module.exports = {
  bucket,
  buildPublicUrl,
  client,
  deleteObject,
  getContentType,
  listObjects,
  normalizedPrefix,
  stripPrefix,
  uploadFile,
  withPrefix,
};
