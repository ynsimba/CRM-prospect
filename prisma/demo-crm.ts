import { ActivityType, PrismaClient, ProspectPriority } from "@prisma/client";
import { computeLeadScore, computeProspectScore, fullName } from "../lib/crm";
import { encodeNotificationBody } from "../lib/notify-logic";

type SeedProspect = {
  firstName: string;
  lastName: string;
  jobTitle?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  city: string;
  company?: string;
  status: string;
  source: string;
  owner: "jean" | "marie";
  priority: ProspectPriority;
  tags?: string[];
  notes?: string;
  nextDays?: number;
};

const COMPANIES = [
  {
    name: "ABC SARL",
    industry: "BTP",
    website: "https://abc-sarl.cd",
    email: "contact@abc-sarl.cd",
    phone: "+243 812 100 001",
    city: "Gombe",
    address: "Av. du Port, Gombe",
    size: "50-200",
    owner: "jean" as const,
  },
  {
    name: "XYZ Consulting",
    industry: "Conseil",
    website: "https://xyzconsulting.cd",
    email: "hello@xyzconsulting.cd",
    phone: "+243 812 100 002",
    city: "Gombe",
    address: "Bd du 30 Juin, Gombe",
    size: "10-50",
    owner: "marie" as const,
  },
  {
    name: "Digital Congo",
    industry: "Tech",
    website: "https://digitalcongo.cd",
    email: "equipe@digitalcongo.cd",
    phone: "+243 812 100 003",
    city: "Gombe",
    address: "Av. Wagenia, Gombe",
    size: "20-80",
    owner: "jean" as const,
  },
  {
    name: "Kinshasa Business Group",
    industry: "Holding",
    website: "https://kbg.cd",
    email: "info@kbg.cd",
    phone: "+243 812 100 004",
    city: "Limete",
    address: "7e Rue, Limete Industriel",
    size: "200+",
    owner: "marie" as const,
  },
  {
    name: "Rawbank Corporate",
    industry: "Banque",
    website: "https://rawbank.cd",
    email: "corporate@rawbank.cd",
    phone: "+243 812 100 005",
    city: "Gombe",
    size: "1000+",
    owner: "jean" as const,
  },
  {
    name: "Airtel Congo",
    industry: "Télécoms",
    email: "b2b@airtel.cd",
    phone: "+243 812 100 006",
    city: "Gombe",
    size: "500+",
    owner: "marie" as const,
  },
];

const CONTACTS = [
  { firstName: "Patrick", lastName: "Mwamba", jobTitle: "Directeur général", email: "pmwamba@abc-sarl.cd", phone: "+243 810 200 011", company: "ABC SARL", owner: "jean" as const },
  { firstName: "Grace", lastName: "Ilunga", jobTitle: "DAF", email: "gilunga@abc-sarl.cd", phone: "+243 810 200 012", company: "ABC SARL", owner: "jean" as const },
  { firstName: "Cédric", lastName: "Kasongo", jobTitle: "Associé", email: "ckasongo@xyzconsulting.cd", phone: "+243 810 200 021", company: "XYZ Consulting", owner: "marie" as const },
  { firstName: "Sarah", lastName: "Mbuyi", jobTitle: "Product owner", email: "smbuyi@digitalcongo.cd", phone: "+243 810 200 031", whatsapp: "+243 810 200 031", company: "Digital Congo", owner: "jean" as const },
  { firstName: "Joseph", lastName: "Kabasele", jobTitle: "Directeur achats", email: "jkabasele@kbg.cd", phone: "+243 810 200 041", company: "Kinshasa Business Group", owner: "marie" as const },
];

const PROSPECTS: SeedProspect[] = [
  { firstName: "Alain", lastName: "Tshibanda", jobTitle: "Acheteur", email: "atshibanda@abc-sarl.cd", phone: "+243 810 300 001", city: "Gombe", company: "ABC SARL", status: "qualifie", source: "recommandation", owner: "jean", priority: "HIGH", tags: ["B2B", "Gros budget"], notes: "Intéressé par un CRM pour 40 commerciaux.", nextDays: 2 },
  { firstName: "Béatrice", lastName: "Lumbala", jobTitle: "Resp. marketing", email: "blumbala@abc-sarl.cd", phone: "+243 810 300 002", whatsapp: "+243 810 300 002", city: "Gombe", company: "ABC SARL", status: "contacte", source: "linkedin", owner: "jean", priority: "NORMAL", tags: ["À relancer"], nextDays: -1 },
  { firstName: "Christian", lastName: "Ngoy", jobTitle: "Consultant", email: "cngoy@xyzconsulting.cd", phone: "+243 810 300 003", city: "Gombe", company: "XYZ Consulting", status: "reponse", source: "site", owner: "marie", priority: "HIGH", tags: ["Hot Lead"], nextDays: 0 },
  { firstName: "Diane", lastName: "Kalonji", jobTitle: "Associée", email: "dkalonji@xyzconsulting.cd", phone: "+243 810 300 004", city: "Gombe", company: "XYZ Consulting", status: "nouveau", source: "salon", owner: "marie", priority: "NORMAL", tags: ["B2B"] },
  { firstName: "Éric", lastName: "Kabongo", jobTitle: "CTO", email: "ekabongo@digitalcongo.cd", phone: "+243 810 300 005", whatsapp: "+243 810 300 005", city: "Gombe", company: "Digital Congo", status: "qualifie", source: "whatsapp", owner: "jean", priority: "URGENT", tags: ["VIP", "Hot Lead"], notes: "Demo prévue.", nextDays: 1 },
  { firstName: "Fatou", lastName: "Diallo", jobTitle: "Growth", email: "fdiallo@digitalcongo.cd", phone: "+243 810 300 006", city: "Gombe", company: "Digital Congo", status: "a-contacter", source: "facebook", owner: "jean", priority: "NORMAL", nextDays: 3 },
  { firstName: "Gaël", lastName: "Mputu", jobTitle: "Directeur commercial", email: "gmputu@kbg.cd", phone: "+243 810 300 007", city: "Limete", company: "Kinshasa Business Group", status: "en-attente", source: "terrain", owner: "marie", priority: "HIGH", tags: ["Gros budget"], nextDays: 5 },
  { firstName: "Hélène", lastName: "Tshienda", jobTitle: "Office manager", email: "htshienda@kbg.cd", phone: "+243 810 300 008", city: "Limete", company: "Kinshasa Business Group", status: "contacte", source: "telephone", owner: "marie", priority: "LOW", nextDays: -4 },
  { firstName: "Isaac", lastName: "Mukendi", jobTitle: "Chef de projet", email: "imukendi@rawbank.cd", phone: "+243 810 300 009", city: "Gombe", company: "Rawbank Corporate", status: "qualifie", source: "email", owner: "jean", priority: "HIGH", tags: ["VIP"], nextDays: 2 },
  { firstName: "Jeanne", lastName: "Banza", jobTitle: "RH", email: "jbanza@rawbank.cd", phone: "+243 810 300 010", city: "Gombe", company: "Rawbank Corporate", status: "non-qualifie", source: "linkedin", owner: "jean", priority: "LOW" },
  { firstName: "Kevin", lastName: "Lutumba", jobTitle: "Key account", email: "klutumba@airtel.cd", phone: "+243 810 300 011", whatsapp: "+243 810 300 011", city: "Gombe", company: "Airtel Congo", status: "reponse", source: "recommandation", owner: "marie", priority: "NORMAL", tags: ["B2B"], nextDays: 4 },
  { firstName: "Léa", lastName: "Nsimba", jobTitle: "Commerciale", email: "lnsimba@airtel.cd", phone: "+243 810 300 012", city: "Gombe", company: "Airtel Congo", status: "nouveau", source: "instagram", owner: "marie", priority: "NORMAL" },
  { firstName: "Marc", lastName: "Kabila", jobTitle: "Gérant", email: "marc.kabila@gmail.com", phone: "+243 810 300 013", city: "Lemba", status: "a-contacter", source: "terrain", owner: "jean", priority: "NORMAL", notes: "Boutique de pièces auto, Matadi-Kibala.", nextDays: -2 },
  { firstName: "Nadia", lastName: "Phiri", jobTitle: "Propriétaire", email: "nphiri@yahoo.fr", phone: "+243 810 300 014", whatsapp: "+243 810 300 014", city: "Ngaliema", status: "contacte", source: "whatsapp", owner: "marie", priority: "HIGH", tags: ["À relancer"], nextDays: 0 },
  { firstName: "Olivier", lastName: "Mbuyi", jobTitle: "Importateur", email: "olivier.mbuyi@outlook.com", phone: "+243 810 300 015", city: "Limete", status: "qualifie", source: "salon", owner: "jean", priority: "URGENT", tags: ["Hot Lead", "Gros budget"], nextDays: 1 },
  { firstName: "Pauline", lastName: "Kasongo", jobTitle: "Pharmacienne", email: "pkasongo@pharma.cd", phone: "+243 810 300 016", city: "Kalamu", status: "nouveau", source: "site", owner: "marie", priority: "NORMAL" },
  { firstName: "Quincy", lastName: "Tumba", jobTitle: "Logisticien", email: "qtumba@logirdc.cd", phone: "+243 810 300 017", city: "Ndjili", status: "en-attente", source: "telephone", owner: "jean", priority: "NORMAL", nextDays: 7 },
  { firstName: "Rachel", lastName: "Mwamba", jobTitle: "Directrice", email: "rmwamba@hotels.cd", phone: "+243 810 300 018", city: "Gombe", status: "reponse", source: "linkedin", owner: "marie", priority: "HIGH", tags: ["VIP"], nextDays: 2 },
  { firstName: "Serge", lastName: "Ilunga", jobTitle: "Avocat", email: "silunga@cabinet.cd", phone: "+243 810 300 019", city: "Gombe", status: "contacte", source: "recommandation", owner: "jean", priority: "NORMAL", nextDays: -6 },
  { firstName: "Thérèse", lastName: "Kalala", jobTitle: "Comptable", email: "tkalala@fiduciaire.cd", phone: "+243 810 300 020", city: "Kintambo", status: "a-contacter", source: "email", owner: "marie", priority: "LOW", nextDays: 3 },
  { firstName: "Urbain", lastName: "Kabeya", jobTitle: "Transporteur", phone: "+243 810 300 021", whatsapp: "+243 810 300 021", city: "Masina", status: "nouveau", source: "terrain", owner: "jean", priority: "NORMAL", notes: "Pas d’e-mail, uniquement WhatsApp." },
  { firstName: "Viviane", lastName: "Nkongolo", jobTitle: "Responsable magasin", email: "vnkongolo@supergros.cd", phone: "+243 810 300 022", city: "Limete", status: "qualifie", source: "facebook", owner: "marie", priority: "HIGH", tags: ["B2B"], nextDays: 1 },
  { firstName: "Willy", lastName: "Tshilombo", jobTitle: "Entrepreneur", email: "wtshilombo@gmail.com", phone: "+243 810 300 023", city: "Bandalungwa", status: "perdu", source: "publicite", owner: "jean", priority: "LOW", notes: "Budget trop juste." },
  { firstName: "Xénia", lastName: "Lunda", jobTitle: "Chef de cabinet", email: "xlunda@min.gouv.cd", phone: "+243 810 300 024", city: "Gombe", status: "en-attente", source: "recommandation", owner: "marie", priority: "URGENT", tags: ["VIP", "Urgent"], nextDays: 4 },
  { firstName: "Yves", lastName: "Kadima", jobTitle: "DG", email: "ykadima@miniere.cd", phone: "+243 810 300 025", city: "Lubumbashi", status: "converti", source: "salon", owner: "jean", priority: "HIGH", tags: ["Gros budget"], notes: "Converti en client pilote." },
  { firstName: "Zola", lastName: "Mavungu", jobTitle: "Fondatrice", email: "zmavungu@mode.cd", phone: "+243 810 300 026", whatsapp: "+243 810 300 026", city: "Ngaliema", status: "contacte", source: "instagram", owner: "marie", priority: "NORMAL", tags: ["À relancer"], nextDays: -1 },
  { firstName: "André", lastName: "Kapend", jobTitle: "Ingénieur", email: "akapend@mines.cd", phone: "+243 810 300 027", city: "Kolwezi", status: "a-contacter", source: "linkedin", owner: "jean", priority: "HIGH", nextDays: 6 },
  { firstName: "Blanche", lastName: "Sumbu", jobTitle: "Négociante", email: "bsumbu@commerce.cd", phone: "+243 810 300 028", city: "Matadi", status: "nouveau", source: "whatsapp", owner: "marie", priority: "NORMAL" },
  { firstName: "Célestin", lastName: "Mbala", jobTitle: "Pasteur / ONG", email: "cmbala@ong.cd", phone: "+243 810 300 029", city: "Kisenso", status: "non-qualifie", source: "autre", owner: "jean", priority: "LOW", notes: "Pas de budget commercial." },
  { firstName: "Dorcas", lastName: "Kalume", jobTitle: "Directrice clinique", email: "dkalume@sante.cd", phone: "+243 810 300 030", city: "Lemba", status: "reponse", source: "site", owner: "marie", priority: "HIGH", tags: ["Hot Lead"], nextDays: 2 },
];

function shiftDays(days: number) {
  const date = new Date();
  date.setHours(9, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date;
}

export async function seedDemoCrm(prisma: PrismaClient, organizationId: string) {
  const jean = await prisma.user.findFirst({ where: { organizationId, email: "jean@demo.cd" } });
  const marie = await prisma.user.findFirst({ where: { organizationId, email: "marie@demo.cd" } });
  if (!jean || !marie) {
    throw new Error("Comptes Jean/Marie manquants pour le seed CRM.");
  }

  const owners = { jean: jean.id, marie: marie.id };
  const existing = await prisma.prospect.count({ where: { organizationId } });

  if (existing < 30) {
  const statuses = await prisma.prospectStatus.findMany({ where: { organizationId } });
  const sources = await prisma.prospectSource.findMany({ where: { organizationId } });
  const tags = await prisma.tag.findMany({ where: { organizationId } });
  const statusBySlug = Object.fromEntries(statuses.map((item) => [item.slug, item]));
  const sourceBySlug = Object.fromEntries(sources.map((item) => [item.slug, item]));
  const tagByName = Object.fromEntries(tags.map((item) => [item.name, item]));

  const companyIds = new Map<string, string>();
  for (const company of COMPANIES) {
    const found = await prisma.company.findFirst({
      where: { organizationId, name: company.name },
    });
    const row =
      found ??
      (await prisma.company.create({
        data: {
          organizationId,
          ownerId: owners[company.owner],
          name: company.name,
          industry: company.industry,
          website: company.website,
          email: company.email,
          phone: company.phone,
          country: "RD Congo",
          city: company.city,
          address: "address" in company ? company.address : undefined,
          size: company.size,
          notes: "Compte démo Kinshasa.",
        },
      }));
    companyIds.set(company.name, row.id);
  }

  for (const contact of CONTACTS) {
    const exists = await prisma.contact.findFirst({
      where: { organizationId, email: contact.email },
    });
    if (exists) continue;
    await prisma.contact.create({
      data: {
        organizationId,
        ownerId: owners[contact.owner],
        companyId: companyIds.get(contact.company),
        firstName: contact.firstName,
        lastName: contact.lastName,
        jobTitle: contact.jobTitle,
        email: contact.email,
        phone: contact.phone,
        whatsapp: "whatsapp" in contact ? contact.whatsapp : undefined,
      },
    });
  }

  for (const prospect of PROSPECTS) {
    const status = statusBySlug[prospect.status];
    const source = sourceBySlug[prospect.source];
    if (!status) {
      throw new Error(`Statut seed inconnu: ${prospect.status}`);
    }
    const companyId = prospect.company ? companyIds.get(prospect.company) : undefined;
    const exists = await prisma.prospect.findFirst({
      where: {
        organizationId,
        firstName: prospect.firstName,
        lastName: prospect.lastName,
      },
    });
    if (exists) continue;

    await prisma.prospect.create({
      data: {
        organizationId,
        ownerId: owners[prospect.owner],
        companyId,
        statusId: status.id,
        sourceId: source?.id,
        firstName: prospect.firstName,
        lastName: prospect.lastName,
        jobTitle: prospect.jobTitle,
        email: prospect.email,
        phone: prospect.phone,
        whatsapp: prospect.whatsapp,
        city: prospect.city,
        country: "RD Congo",
        priority: prospect.priority,
        notes: prospect.notes,
        score: computeLeadScore({
          email: prospect.email,
          phone: prospect.phone,
          companyId,
        }),
        nextContactAt: prospect.nextDays !== undefined ? shiftDays(prospect.nextDays) : undefined,
        lastContactAt: ["contacte", "reponse", "qualifie", "converti"].includes(prospect.status)
          ? shiftDays(-3)
          : undefined,
        convertedAt: prospect.status === "converti" ? shiftDays(-10) : undefined,
        tags: prospect.tags?.length
          ? {
              create: prospect.tags
                .map((name) => tagByName[name])
                .filter(Boolean)
                .map((tag) => ({ tagId: tag.id })),
            }
            : undefined,
      },
    });
  }
  }

  const companies = await prisma.company.findMany({
    where: { organizationId },
    select: { id: true, name: true },
  });
  const companyIds = new Map(companies.map((item) => [item.name, item.id]));
  await seedDemoOpportunities(prisma, organizationId, owners, companyIds);
  await seedDemoWork(prisma, organizationId, owners);
  await seedDemoTeam(prisma, organizationId);
  await seedDemoScoresAndAlerts(prisma, organizationId);
}

async function seedDemoOpportunities(
  prisma: PrismaClient,
  organizationId: string,
  owners: { jean: string; marie: string },
  companyIds: Map<string, string>,
) {
  const existing = await prisma.opportunity.count({ where: { organizationId } });
  if (existing >= 10) return;

  const pipeline = await prisma.pipeline.findFirst({
    where: { organizationId, isDefault: true },
    include: { stages: { orderBy: { sortOrder: "asc" } } },
  });
  if (!pipeline) return;

  const stageByName = Object.fromEntries(pipeline.stages.map((item) => [item.name, item]));
  const org = await prisma.organization.findFirst({
    where: { id: organizationId },
    select: { currency: true },
  });

  const deals = [
    { name: "CRM ABC SARL", amount: 8_500_000, stage: "Rendez-vous", company: "ABC SARL", prospect: "Alain Tshibanda", owner: "jean" as const, days: 14 },
    { name: "Plateforme Digital Congo", amount: 25_000_000, stage: "Négociation", company: "Digital Congo", prospect: "Éric Kabongo", owner: "jean" as const, days: 21 },
    { name: "Onboarding Rawbank", amount: 45_000_000, stage: "Proposition envoyée", company: "Rawbank Corporate", prospect: "Isaac Mukendi", owner: "jean" as const, days: 30 },
    { name: "Groupe KBG — licences", amount: 12_000_000, stage: "Contacté", company: "Kinshasa Business Group", prospect: "Gaël Mputu", owner: "marie" as const, days: 18 },
    { name: "Import Olivier Mbuyi", amount: 6_000_000, stage: "Qualifié", prospect: "Olivier Mbuyi", owner: "jean" as const, days: 10 },
    { name: "Pilote Yves Kadima", amount: 18_000_000, stage: "Gagné", prospect: "Yves Kadima", owner: "jean" as const, days: -10 },
    { name: "XYZ Consulting — formation", amount: 4_200_000, stage: "Nouveau", company: "XYZ Consulting", prospect: "Christian Ngoy", owner: "marie" as const, days: 25 },
    { name: "Super Gros Limete", amount: 3_500_000, stage: "Rendez-vous", prospect: "Viviane Nkongolo", owner: "marie" as const, days: 12 },
    { name: "Hôtellerie Rachel Mwamba", amount: 9_800_000, stage: "Proposition envoyée", prospect: "Rachel Mwamba", owner: "marie" as const, days: 20 },
    { name: "Ministère — Xénia Lunda", amount: 15_000_000, stage: "Négociation", prospect: "Xénia Lunda", owner: "marie" as const, days: 40 },
    { name: "Startup Willy Tshilombo", amount: 2_000_000, stage: "Perdu", prospect: "Willy Tshilombo", owner: "jean" as const, days: -5 },
    { name: "Clinique Dorcas Kalume", amount: 7_200_000, stage: "Qualifié", prospect: "Dorcas Kalume", owner: "marie" as const, days: 16 },
  ];

  for (const deal of deals) {
    const stage = stageByName[deal.stage];
    if (!stage) continue;
    const already = await prisma.opportunity.findFirst({
      where: { organizationId, name: deal.name },
    });
    if (already) continue;

    const [firstName, ...rest] = deal.prospect.split(" ");
    const lastName = rest.join(" ");
    const prospect = await prisma.prospect.findFirst({
      where: { organizationId, firstName, lastName },
    });

    await prisma.opportunity.create({
      data: {
        organizationId,
        pipelineId: pipeline.id,
        stageId: stage.id,
        name: deal.name,
        amount: deal.amount,
        currency: org?.currency ?? "CDF",
        probability: stage.probability,
        status: stage.isWon ? "WON" : stage.isLost ? "LOST" : "OPEN",
        companyId: deal.company ? companyIds.get(deal.company) : prospect?.companyId,
        prospectId: prospect?.id,
        ownerId: owners[deal.owner],
        expectedCloseAt: shiftDays(deal.days),
        source: "demo",
        description: "Affaire démo Kinshasa.",
      },
    });
  }
}

async function findNamedProspect(prisma: PrismaClient, organizationId: string, fullName: string) {
  const [firstName, ...rest] = fullName.split(" ");
  return prisma.prospect.findFirst({
    where: { organizationId, firstName, lastName: rest.join(" ") },
  });
}

async function seedDemoWork(
  prisma: PrismaClient,
  organizationId: string,
  owners: { jean: string; marie: string },
) {
  const existing = await prisma.activity.count({ where: { organizationId } });
  if (existing >= 8) return;

  const named = async (fullName: string) => findNamedProspect(prisma, organizationId, fullName);
  const alain = await named("Alain Tshibanda");
  const beatrice = await named("Béatrice Lumbala");
  const eric = await named("Éric Kabongo");
  const isaac = await named("Isaac Mukendi");
  const christian = await named("Christian Ngoy");
  const nadia = await named("Nadia Phiri");
  const gael = await named("Gaël Mputu");
  const marc = await named("Marc Kabila");
  const rawbank = await prisma.opportunity.findFirst({
    where: { organizationId, name: "Onboarding Rawbank" },
  });
  const digital = await prisma.opportunity.findFirst({
    where: { organizationId, name: "Plateforme Digital Congo" },
  });

  const logs: Array<{
    user: "jean" | "marie";
    type: ActivityType;
    comment: string;
    prospect?: { id: string; companyId: string | null } | null;
    opportunityId?: string;
    days: number;
  }> = [
    { user: "jean", type: "CALL", comment: "Appel au DG adjoint, intéressé par un déploiement Gombe.", prospect: alain, days: -2 },
    { user: "jean", type: "WHATSAPP", comment: "Message lu, pas de réponse.", prospect: beatrice, days: -5 },
    { user: "jean", type: "MEETING", comment: "Démo produit, 45 min, CTO présent.", prospect: eric, opportunityId: digital?.id, days: -1 },
    { user: "jean", type: "EMAIL", comment: "Proposition envoyée, relance prévue.", prospect: isaac, opportunityId: rawbank?.id, days: -3 },
    { user: "marie", type: "NOTE", comment: "Budget formation à valider en comité.", prospect: christian, days: -1 },
    { user: "marie", type: "WHATSAPP", comment: "RDV confirmé à Ngaliema.", prospect: nadia, days: 0 },
    { user: "marie", type: "CALL", comment: "Standard KBG, transféré aux achats.", prospect: gael, days: -4 },
    { user: "jean", type: "VISIT", comment: "Passage boutique Matadi-Kibala, gérant absent.", prospect: marc, days: -6 },
  ];

  for (const log of logs) {
    if (!log.prospect) continue;
    await prisma.activity.create({
      data: {
        organizationId,
        userId: owners[log.user],
        type: log.type,
        comment: log.comment,
        occurredAt: shiftDays(log.days),
        prospectId: log.prospect.id,
        companyId: log.prospect.companyId,
        opportunityId: log.opportunityId,
      },
    });
    await prisma.prospect.update({
      where: { id: log.prospect.id },
      data: { lastContactAt: shiftDays(log.days) },
    });
  }

  const chores = [
    { title: "Relancer Béatrice Lumbala", owner: "jean" as const, prospect: beatrice, days: -2, priority: "HIGH" as const },
    { title: "Préparer démo Digital Congo", owner: "jean" as const, prospect: eric, opportunityId: digital?.id, days: 0, priority: "URGENT" as const, status: "IN_PROGRESS" as const },
    { title: "Relance proposition Rawbank", owner: "jean" as const, prospect: isaac, opportunityId: rawbank?.id, days: 2, priority: "HIGH" as const },
    { title: "WhatsApp Marc Kabila", owner: "jean" as const, prospect: marc, days: -1, priority: "NORMAL" as const },
    { title: "Confirmer RDV Gaël Mputu", owner: "marie" as const, prospect: gael, days: 1, priority: "HIGH" as const },
    { title: "Envoyer brochure XYZ", owner: "marie" as const, prospect: christian, days: 3, priority: "NORMAL" as const },
    { title: "Visite Nadia Phiri", owner: "marie" as const, prospect: nadia, days: 0, priority: "HIGH" as const },
    { title: "Compte-rendu comité ABC", owner: "jean" as const, prospect: alain, days: 4, priority: "NORMAL" as const },
  ];

  for (const chore of chores) {
    if (!chore.prospect) continue;
    await prisma.task.create({
      data: {
        organizationId,
        ownerId: owners[chore.owner],
        title: chore.title,
        priority: chore.priority,
        status: "status" in chore ? chore.status : "TODO",
        dueAt: shiftDays(chore.days),
        prospectId: chore.prospect.id,
        companyId: chore.prospect.companyId,
        opportunityId: chore.opportunityId,
      },
    });
  }
}

async function seedDemoTeam(prisma: PrismaClient, organizationId: string) {
  const gombe = await prisma.team.upsert({
    where: { organizationId_name: { organizationId, name: "Gombe" } },
    update: {},
    create: { organizationId, name: "Gombe" },
  });
  const terrain = await prisma.team.upsert({
    where: { organizationId_name: { organizationId, name: "Terrain Kinshasa" } },
    update: {},
    create: { organizationId, name: "Terrain Kinshasa" },
  });

  const byEmail = async (email: string) =>
    prisma.user.findFirst({ where: { organizationId, email } });

  const jean = await byEmail("jean@demo.cd");
  const marie = await byEmail("marie@demo.cd");
  const paul = await byEmail("manager@demo.cd");
  if (jean) await prisma.user.update({ where: { id: jean.id }, data: { teamId: gombe.id } });
  if (marie) await prisma.user.update({ where: { id: marie.id }, data: { teamId: terrain.id } });
  if (paul) await prisma.user.update({ where: { id: paul.id }, data: { teamId: gombe.id } });

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  if ((await prisma.goal.count({ where: { organizationId, year, month } })) >= 3) {
    return;
  }

  const goals = [
    { user: jean, prospectsTarget: 15, meetingsTarget: 8, opportunitiesTarget: 5, revenueTarget: 40_000_000 },
    { user: marie, prospectsTarget: 12, meetingsTarget: 6, opportunitiesTarget: 4, revenueTarget: 30_000_000 },
    { user: paul, prospectsTarget: 6, meetingsTarget: 3, opportunitiesTarget: 2, revenueTarget: 10_000_000 },
  ];

  for (const row of goals) {
    if (!row.user) continue;
    await prisma.goal.upsert({
      where: {
        organizationId_userId_year_month: {
          organizationId,
          userId: row.user.id,
          year,
          month,
        },
      },
      update: {
        prospectsTarget: row.prospectsTarget,
        meetingsTarget: row.meetingsTarget,
        opportunitiesTarget: row.opportunitiesTarget,
        revenueTarget: row.revenueTarget,
      },
      create: {
        organizationId,
        userId: row.user.id,
        year,
        month,
        prospectsTarget: row.prospectsTarget,
        meetingsTarget: row.meetingsTarget,
        opportunitiesTarget: row.opportunitiesTarget,
        revenueTarget: row.revenueTarget,
      },
    });
  }
}

async function seedDemoScoresAndAlerts(prisma: PrismaClient, organizationId: string) {
  const prospects = await prisma.prospect.findMany({
    where: { organizationId },
    include: {
      status: true,
      tags: { include: { tag: true } },
      activities: { select: { type: true } },
    },
  });

  for (const prospect of prospects) {
    const { score } = computeProspectScore({
      email: prospect.email,
      phone: prospect.phone,
      whatsapp: prospect.whatsapp,
      companyId: prospect.companyId,
      jobTitle: prospect.jobTitle,
      priority: prospect.priority,
      tags: prospect.tags.map((item) => item.tag.name),
      statusSlug: prospect.status.slug,
      activityTypes: prospect.activities.map((item) => item.type),
      lastContactAt: prospect.lastContactAt,
      nextContactAt: prospect.nextContactAt,
    });
    if (score !== prospect.score) {
      await prisma.prospect.update({ where: { id: prospect.id }, data: { score } });
    }
  }

  if ((await prisma.notification.count({ where: { organizationId } })) >= 4) {
    return;
  }

  const jean = await prisma.user.findFirst({ where: { organizationId, email: "jean@demo.cd" } });
  const admin = await prisma.user.findFirst({ where: { organizationId, email: "admin@demo.cd" } });
  if (!jean || !admin) return;

  const hot =
    prospects.find((item) => item.firstName === "Éric" && item.lastName === "Kabongo") ?? prospects[0];
  const overdue =
    prospects.find((item) => item.firstName === "Béatrice" && item.lastName === "Lumbala") ?? prospects[1];
  if (!hot || !overdue) return;

  const alerts = [
    {
      userId: jean.id,
      title: "Lead très chaud",
      body: encodeNotificationBody(
        `${fullName(hot.firstName, hot.lastName)} passe à 100 (Très chaud).`,
        `/prospects/${hot.id}`,
      ),
      kind: "score",
    },
    {
      userId: jean.id,
      title: "Relance en retard",
      body: encodeNotificationBody(
        `${fullName(overdue.firstName, overdue.lastName)} devait être recontacté.`,
        `/prospects/${overdue.id}`,
      ),
      kind: "followup",
    },
    {
      userId: jean.id,
      title: "Tâche en retard",
      body: encodeNotificationBody("Préparer démo Digital Congo", "/taches"),
      kind: "task",
    },
    {
      userId: admin.id,
      title: "Nouveau prospect",
      body: encodeNotificationBody(
        `${fullName(hot.firstName, hot.lastName)} t’a été attribué.`,
        `/prospects/${hot.id}`,
      ),
      kind: "assign",
    },
  ];

  for (const alert of alerts) {
    await prisma.notification.create({
      data: {
        organizationId,
        userId: alert.userId,
        title: alert.title,
        body: alert.body,
        kind: alert.kind,
      },
    });
  }
}
