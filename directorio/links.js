const entryPoints = [
  ['[data-vet-detail="search"]', 'vet'],
  ['.grooming-cta-primary', 'grooming'],
  ['[data-store-detail="products"]', 'products'],
  ['[data-caregivers-detail="verified"], [data-caregivers-detail="walks"], [data-caregivers-detail="home"]', 'caretaker'],
  ['.adoption-main-cta', 'adoption'],
];
entryPoints.forEach(([selector, key]) => document.querySelectorAll(selector).forEach(button => {
  const open = event => { event.preventDefault(); event.stopImmediatePropagation(); window.open(`/directorio/?categoria=${key}`, '_blank', 'noopener,noreferrer'); };
  button.addEventListener('click', open, true);
  button.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') open(event); }, true);
}));
