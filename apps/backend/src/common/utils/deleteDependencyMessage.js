// deleteDependencyMessage.js

const joinSpanishList = (items) => {
  if (items.length <= 1) return items[0] || '';
  if (items.length === 2) return `${items[0]} y ${items[1]}`;
  return `${items.slice(0, -1).join(', ')} y ${items.at(-1)}`;
};

export const buildDeleteDependencyMessage = ({
  subject,
  associatedWord = 'asociado',
  dependencies,
}) => {
  const details = dependencies
    .filter(({ count }) => Number(count) > 0)
    .map(({ count, label }) => `${count} ${label}`);

  if (details.length === 0) {
    return `No se puede eliminar ${subject} porque está ${associatedWord} a otros registros.`;
  }

  return `No se puede eliminar ${subject} porque está ${associatedWord} a ${joinSpanishList(details)}.`;
};
