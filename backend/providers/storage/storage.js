import config from '../../core/config/index.js';

const bucketAliases = {
  uploads: 'uploads',
  upload: 'uploads',

  attachments: 'attachments',
  attachment: 'attachments',
  documents: 'documents',
  document: 'documents',
  offers: 'offers',
  offer: 'offers',
  logos: 'logos',
  logo: 'logos',
  'rate-cards': 'rateCards',
  ratecards: 'rateCards',
  rateCards: 'rateCards',
  pdfs: 'pdfs',
  receipts: 'receipts',
  receipt: 'receipts',
};

function resolveBucket(bucketKey) {
  const normalized = bucketAliases[bucketKey] || bucketKey;
  return config.storage.buckets[normalized] || config.storage.defaultBucket;
}

export { resolveBucket  };
