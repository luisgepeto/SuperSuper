const seededRandom = (seed, min, max) => {
  const x = Math.sin(seed + min) * 10000;
  return Math.floor((x - Math.floor(x)) * (max - min + 1)) + min;
};

export const generatePlaceholderPrice = (product) => {
  const seed = product?.id || Date.now();
  const x = Math.sin(seed + 42) * 10000;
  return (Math.floor((x - Math.floor(x)) * 1900) + 99) / 100;
};

export const generatePlaceholderPurchaseData = (product) => {
  const seed = product?.id || Date.now();

  const daysAgo = seededRandom(seed, 1, 30);
  const lastPurchaseDate = new Date();
  lastPurchaseDate.setDate(lastPurchaseDate.getDate() - daysAgo);

  return {
    lastPurchaseDate: lastPurchaseDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    lastItemsPurchased: seededRandom(seed, 1, 5),
    lastPrice: (seededRandom(seed, 99, 1999) / 100).toFixed(2),
  };
};
