import { findProperty, properties as allProperties } from '../data/properties.data';

export function resolveProperty(idOrName: string) {
  const byId = findProperty(idOrName);
  if (byId) return byId;
  const query = idOrName.toLowerCase();
  return allProperties.find(p => p.name.toLowerCase().includes(query));
}
