function isCloudinaryImageUrl(url) {
  return (
    typeof url === 'string' &&
    url.includes('res.cloudinary.com/') &&
    url.includes('/image/upload/')
  );
}

function optimizeCloudinaryUrl(
  url,
  width = 800
) {
  if (!isCloudinaryImageUrl(url)) {
    return url;
  }

  const marker =
    '/image/upload/';

  const index =
    url.indexOf(marker);

  if (index === -1) {
    return url;
  }

  const before =
    url.slice(
      0,
      index + marker.length
    );

  const after =
    url.slice(
      index + marker.length
    );

  const transformations =
    `f_auto,q_auto,w_${width}`;

  const transformationPrefix =
    `${transformations}/`;

  if (
    after.startsWith(
      transformationPrefix
    )
  ) {
    return url;
  }

  return (
    `${before}` +
    `${transformationPrefix}` +
    `${after}`
  );
}

export {
  isCloudinaryImageUrl,
  optimizeCloudinaryUrl
};
