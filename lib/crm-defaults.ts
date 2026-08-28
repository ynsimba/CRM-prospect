export const DEFAULT_STATUSES = [
  { name: "Nouveau", slug: "nouveau", sortOrder: 0, isConverted: false, isLost: false },
  { name: "À contacter", slug: "a-contacter", sortOrder: 1, isConverted: false, isLost: false },
  { name: "Contacté", slug: "contacte", sortOrder: 2, isConverted: false, isLost: false },
  { name: "Réponse reçue", slug: "reponse", sortOrder: 3, isConverted: false, isLost: false },
  { name: "Qualifié", slug: "qualifie", sortOrder: 4, isConverted: false, isLost: false },
  { name: "Non qualifié", slug: "non-qualifie", sortOrder: 5, isConverted: false, isLost: true },
  { name: "En attente", slug: "en-attente", sortOrder: 6, isConverted: false, isLost: false },
  { name: "Converti", slug: "converti", sortOrder: 7, isConverted: true, isLost: false },
  { name: "Perdu", slug: "perdu", sortOrder: 8, isConverted: false, isLost: true },
];

export const DEFAULT_SOURCES = [
  { name: "Site web", slug: "site" },
  { name: "Facebook", slug: "facebook" },
  { name: "Instagram", slug: "instagram" },
  { name: "WhatsApp", slug: "whatsapp" },
  { name: "LinkedIn", slug: "linkedin" },
  { name: "Email", slug: "email" },
  { name: "Téléphone", slug: "telephone" },
  { name: "Prospection terrain", slug: "terrain" },
  { name: "Recommandation", slug: "recommandation" },
  { name: "Salon / événement", slug: "salon" },
  { name: "Publicité", slug: "publicite" },
  { name: "Import CSV", slug: "import" },
  { name: "Autre", slug: "autre" },
];

export const DEFAULT_TAGS = ["VIP", "Hot Lead", "Urgent", "B2B", "À relancer", "Gros budget"];

export const DEFAULT_PIPELINE_STAGES = [
  { name: "Nouveau", probability: 10, sortOrder: 0, isWon: false, isLost: false },
  { name: "Contacté", probability: 20, sortOrder: 1, isWon: false, isLost: false },
  { name: "Qualifié", probability: 40, sortOrder: 2, isWon: false, isLost: false },
  { name: "Rendez-vous", probability: 55, sortOrder: 3, isWon: false, isLost: false },
  { name: "Proposition envoyée", probability: 70, sortOrder: 4, isWon: false, isLost: false },
  { name: "Négociation", probability: 80, sortOrder: 5, isWon: false, isLost: false },
  { name: "Gagné", probability: 100, sortOrder: 6, isWon: true, isLost: false },
  { name: "Perdu", probability: 0, sortOrder: 7, isWon: false, isLost: true },
];
