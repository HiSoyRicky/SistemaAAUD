export function mergeTonerDescription(current, previous, next) {
  const text = current || '';
  const userText = previous && text.startsWith(previous)
    ? text.slice(previous.length)
    : text ? `\n${text}` : '';
  return `${next}${userText}`;
}

export function getCurrentPrinterLevels(levels, printerId, modelId) {
  return levels?.printerId === printerId && levels?.modelId === String(modelId) ? levels.data : null;
}
