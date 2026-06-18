// Destinations candidates. Chaque critere est note de 0 (faible) a 5 (excellent)
// pour un sejour de 3-5 jours en saison agreable. `cost` = budget indicatif
// tout compris par personne (vol + logement + resto + extras), en euros,
// utilise pour filtrer selon le plafond budgetaire du groupe.
// `travel` est deja un SCORE (5 = trajet court depuis la Belgique, 0 = long).
//
// VOITURE : pour les villes accessibles en voiture depuis Bruxelles, on a une
// voiture donc le trajet est "gratuit". Ajoute `drivable: true`, `transport`
// (la part transport par personne deja incluse dans `cost`, qu'on retire car
// le trajet est gratuit) et `parking` (cout TOTAL du parking pour le sejour,
// partage par la voiture). Le cout effectif devient :
//   cost - transport + parking / nb_participants.
// Modifie ces chiffres librement si besoin.

export const CRITERIA = [
  { key: 'weather',   label: 'Météo / soleil' },
  { key: 'travel',    label: 'Trajet court' },
  { key: 'beach',     label: 'Plage / mer' },
  { key: 'food',      label: 'Gastronomie' },
  { key: 'nightlife', label: 'Vie nocturne' },
  { key: 'wellness',  label: 'Spa / farniente' },
  { key: 'culture',   label: 'Culture / visites' },
  { key: 'nature',    label: 'Nature / rando' },
];

export const DESTINATIONS = [
  {
    id: 'marrakech', name: 'Marrakech', country: 'Maroc', emoji: '🇲🇦',
    cost: 750,
    scores: { weather: 5, travel: 3, beach: 0, food: 5, nightlife: 4, wellness: 5, culture: 5, nature: 3 },
    note: 'Souks, riads, hammams. Soleil quasi garanti, super rapport qualité-prix.',
  },
  {
    id: 'essaouira', name: 'Essaouira', country: 'Maroc', emoji: '🌊',
    cost: 800,
    scores: { weather: 4, travel: 2, beach: 5, food: 4, nightlife: 2, wellness: 4, culture: 4, nature: 4 },
    note: 'Bord de mer, surf, ambiance détente. À combiner avec Marrakech.',
  },
  {
    id: 'lisbonne', name: 'Lisbonne', country: 'Portugal', emoji: '🇵🇹',
    cost: 850,
    scores: { weather: 4, travel: 4, beach: 3, food: 5, nightlife: 5, wellness: 3, culture: 5, nature: 3 },
    note: 'Ville vivante, gastronomie, plages proches, vols directs courts.',
  },
  {
    id: 'athenes', name: 'Athènes / Cyclades', country: 'Grèce', emoji: '🇬🇷',
    cost: 900,
    scores: { weather: 5, travel: 3, beach: 5, food: 5, nightlife: 4, wellness: 3, culture: 5, nature: 4 },
    note: 'Culture antique + îles et plages. Un peu plus cher en haute saison.',
  },
  {
    id: 'tirana', name: 'Tirana / Riviera', country: 'Albanie', emoji: '🇦🇱',
    cost: 650,
    scores: { weather: 4, travel: 3, beach: 5, food: 4, nightlife: 3, wellness: 2, culture: 3, nature: 5 },
    note: 'Très bon marché, plages superbes, nature. Moins de tourisme de masse.',
  },
  {
    id: 'ljubljana', name: 'Ljubljana / Bled', country: 'Slovénie', emoji: '🇸🇮',
    cost: 800,
    scores: { weather: 3, travel: 4, beach: 1, food: 4, nightlife: 2, wellness: 4, culture: 4, nature: 5 },
    note: 'Lacs, montagnes, thermes. Idéal nature et bien-être, peu de plage.',
  },
  {
    id: 'montpellier', name: 'Sud de la France', country: 'Montpellier', emoji: '🇫🇷',
    cost: 600,
    scores: { weather: 4, travel: 4, beach: 4, food: 5, nightlife: 3, wellness: 4, culture: 4, nature: 4 },
    note: "Option maison des parents de Mathias. Logement potentiellement gratuit = budget bas.",
  },
  {
    id: 'amsterdam', name: 'Amsterdam', country: 'Pays-Bas', emoji: '🇳🇱',
    cost: 700, drivable: true, transport: 70, parking: 120,
    scores: { weather: 2, travel: 5, beach: 1, food: 4, nightlife: 5, wellness: 2, culture: 5, nature: 2 },
    note: 'Citytrip culturel et festif, accessible en voiture. Météo incertaine.',
  },
  {
    id: 'spa-belgique', name: 'Spa-hôtel', country: 'Belgique', emoji: '💆',
    cost: 450, drivable: true, transport: 20, parking: 0,
    scores: { weather: 1, travel: 5, beach: 0, food: 4, nightlife: 1, wellness: 5, culture: 2, nature: 4 },
    note: 'Le moins cher, à 1h de route en voiture (parking gratuit). 100% détente.',
  },
];
