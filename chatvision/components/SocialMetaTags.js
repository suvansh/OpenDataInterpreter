import React from 'react';
import Head from 'next/head';

const SocialMetaTags = ({
  title,
  description,
  url = '',
  imageUrl = '',
  cardType = 'summary',
  siteName = 'Brilliantly AI',
  type = 'website',
  twitterUsername = '@BrilliantlyAI',
}) => {
  return (
    <Head>
      {/* Open Graph tags */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      {url && <meta property="og:url" content={url} />}
      {imageUrl && <meta property="og:image" content={imageUrl} />}
      {siteName && <meta property="og:site_name" content={siteName} />}
      <meta property="og:type" content={type} />

      {/* Twitter Card tags */}
      <meta name="twitter:card" content={cardType} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {url && <meta name="twitter:url" content={url} />}
      {imageUrl && <meta name="twitter:image" content={imageUrl} />}
      {twitterUsername && <meta name="twitter:site" content={twitterUsername} />}
    </Head>
  );
};

export default SocialMetaTags;