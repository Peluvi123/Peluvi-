import config from './config.js';

const base = 'id,name,business_name,address,city,phone,avatar_url';
export const categories = {
  vet: { title: 'Veterinarias', icon: '✚', table: 'profiles', select: `${base},vet_profiles(rating,review_count,whatsapp,schedule,services,images,emergency,description)`, filters: { role: 'eq.provider', provider_type: 'eq.vet' }, relation: 'vet_profiles' },
  grooming: { title: 'Peluquerías', icon: '✂', table: 'profiles', select: `${base},grooming_profiles(rating,review_count,whatsapp,schedule,services,images,description)`, filters: { role: 'eq.provider', provider_type: 'eq.grooming' }, relation: 'grooming_profiles' },
  caretaker: { title: 'Cuidadores', icon: '♡', table: 'profiles', select: `${base},caretaker_profiles(rating,review_count,photo,cover_photo,location,available,bio,services,gallery)`, filters: { role: 'eq.provider', provider_type: 'eq.caretaker' }, relation: 'caretaker_profiles' },
  products: { title: 'Tienda', icon: '▣', table: 'products', select: 'id,name,brand,price,image,description,category,rating,review_count', filters: { in_stock: 'eq.true', order: 'created_at.desc,id.asc' } },
  adoption: { title: 'Adopciones', icon: '🐾', table: 'adoptable_pets', select: 'id,name,species,breed,age,description,images,location,profiles(business_name,name,phone,address)', filters: { status: 'eq.available', order: 'created_at.desc,id.asc' } },
};

export function normalize(row, category) {
  const info = row[category.relation] || {};
  const foundation = row.profiles || {};
  return {
    id: row.id, name: row.business_name || row.name || 'Sin nombre',
    location: info.location || [row.address, row.city].filter(Boolean).join(' · ') || row.location || foundation.address || '',
    description: info.description || info.bio || row.description || '',
    image: info.images?.[0] || info.cover_photo || info.photo || row.images?.[0] || row.image || row.avatar_url,
    phone: info.whatsapp || row.phone || foundation.phone || '',
    rating: info.rating ?? row.rating, reviews: info.review_count ?? row.review_count,
    schedule: info.schedule || '', emergency: info.emergency,
    services: (Array.isArray(info.services) ? info.services : []).map(s => typeof s === 'string' ? s : [s.name, s.price, s.duration].filter(v => v !== undefined && v !== '').join(' · ')),
    subtitle: [row.brand, row.breed, row.age, foundation.business_name || foundation.name].filter(Boolean).join(' · '),
    price: row.price, available: info.available,
  };
}

export async function fetchCategory(key, signal) {
  const category = categories[key];
  if (!category) throw new Error('Categoría desconocida');
  const rows = [];
  // Request every page; a public directory may exceed Supabase's row limit.
  for (let offset = 0; ; offset += 100) {
    const params = new URLSearchParams({ select: category.select, order: 'id.asc', ...category.filters, limit: '100', offset: String(offset) });
    const response = await fetch(`${config.url}/rest/v1/${category.table}?${params}`, {
      headers: { apikey: config.key, Authorization: `Bearer ${config.key}` }, signal,
    });
    if (!response.ok) throw new Error('No pudimos consultar los servicios. Intenta de nuevo.');
    const page = await response.json();
    if (!Array.isArray(page)) throw new Error('Respuesta inesperada');
    rows.push(...page.map(row => normalize(row, category)));
    if (page.length < 100) return rows;
  }
}
