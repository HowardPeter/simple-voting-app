import "dotenv/config";
import { randomBytes } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

// Seeding is a CLI-style operation, so it goes through the session pooler
// (DIRECT_URL) like migrations do, falling back to DATABASE_URL.
const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
    max: 1,
  }),
});

type SeedRoom = {
  code: string;
  users: string[]; // first user is the owner
  topics: {
    title: string;
    isOpen?: boolean;
    options: string[];
    // user name -> option label
    votes: Record<string, string>;
  }[];
};

const rooms: SeedRoom[] = [
  {
    code: "12345",
    users: ["Alice", "Bob", "Carol", "Dave"],
    topics: [
      {
        title: "Where should we go for the team lunch?",
        options: ["Pizza", "Sushi", "Tacos", "Salad bar"],
        votes: { Alice: "Sushi", Bob: "Pizza", Carol: "Sushi", Dave: "Tacos" },
      },
      {
        title: "Best day for the weekly sync?",
        options: ["Monday", "Wednesday", "Friday"],
        votes: { Alice: "Wednesday", Bob: "Wednesday" },
      },
      {
        title: "Tabs or spaces?",
        isOpen: false,
        options: ["Tabs", "Spaces"],
        votes: { Alice: "Spaces", Bob: "Tabs", Carol: "Spaces", Dave: "Spaces" },
      },
    ],
  },
  {
    code: "54321",
    users: ["Erin", "Frank"],
    topics: [
      {
        title: "Next book club pick?",
        options: ["Dune", "Project Hail Mary", "The Martian"],
        votes: { Frank: "Project Hail Mary" },
      },
    ],
  },
];

const newToken = () => randomBytes(24).toString("hex");

async function seedRoom(seed: SeedRoom) {
  // Idempotent: drop the previous copy of this room (cascades to everything).
  await prisma.room.deleteMany({ where: { code: seed.code } });

  const room = await prisma.room.create({
    data: {
      code: seed.code,
      users: { create: seed.users.map((name) => ({ name, token: newToken() })) },
    },
    include: { users: true },
  });

  const userIds = new Map(room.users.map((u) => [u.name, u.id]));
  await prisma.room.update({
    where: { id: room.id },
    data: { ownerId: userIds.get(seed.users[0]) },
  });

  for (const t of seed.topics) {
    const topic = await prisma.topic.create({
      data: {
        roomId: room.id,
        title: t.title,
        isOpen: t.isOpen ?? true,
        options: { create: t.options.map((label, position) => ({ label, position })) },
      },
      include: { options: true },
    });

    const optionIds = new Map(topic.options.map((o) => [o.label, o.id]));
    await prisma.vote.createMany({
      data: Object.entries(t.votes).map(([user, option]) => ({
        topicId: topic.id,
        userId: userIds.get(user)!,
        optionId: optionIds.get(option)!,
      })),
    });
  }

  console.log(`Seeded room ${seed.code} (${seed.users.length} users, ${seed.topics.length} topics)`);
}

async function main() {
  for (const room of rooms) await seedRoom(room);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
