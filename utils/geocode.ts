const cache = new Map<string, string>();

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  const cached = cache.get(key);
  if (cached) return cached;

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=14`,
      { headers: { Accept: "application/json" } },
    );
    if (!res.ok) throw new Error("geocode failed");
    const data = await res.json();
    const addr = data.address ?? {};
    const place =
      addr.neighbourhood ||
      addr.suburb ||
      addr.road ||
      addr.village ||
      addr.town ||
      addr.city_district ||
      addr.city ||
      data.name;
    const city = addr.city || addr.town || addr.state || addr.country;
    const label = [place, city].filter(Boolean).join(", ") || data.display_name;
    const result = label || `${lat.toFixed(3)}, ${lng.toFixed(3)}`;
    cache.set(key, result);
    return result;
  } catch {
    return `${lat.toFixed(3)}, ${lng.toFixed(3)}`;
  }
}
