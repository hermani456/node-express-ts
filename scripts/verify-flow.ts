import { db } from "../src/db/index.js";
import { user } from "../src/db/schema.js";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";

const BASE_URL = "http://localhost:3000/api/parking";
const AUTH_URL = "http://localhost:3000/api/auth";

async function main() {
  console.log("Starting authenticated verification flow...");

  const ownerEmail = `owner-${Date.now()}@test.com`;
  const clientEmail = `client-${Date.now()}@test.com`;
  const password = "password123";

  // Helper to sign up and get cookies
  async function signUpAndGetHeaders(
    name: string,
    email: string,
    role: string,
  ) {
    console.log(`Signing up ${name}...`);
    const res = await fetch(`${AUTH_URL}/sign-up/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        name,
      }),
    });

    if (!res.ok) {
      console.error(`Failed to sign up ${name}:`, await res.text());
      process.exit(1);
    }

    // Better Auth should automatically sign in and set cookies
    const cookie = res.headers.get("set-cookie");
    if (!cookie) {
      console.error("No cookie received after signup");
      process.exit(1);
    }

    // We need to grab the user ID from the DB since the API might not return it directly in the format we want or we just want to be sure
    // Actually better-auth returns a user object usually.
    const data = (await res.json()) as { user: { id: string } };
    const userId = data.user.id;

    // Manually update role in DB because sign-up might not allow setting role directly for security
    await db
      .update(user)
      .set({ role: role as any })
      .where(eq(user.id, userId));

    return {
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
      userId,
    };
  }

  // 1. Authenticate Owner
  const ownerAuth = await signUpAndGetHeaders(
    "Test Owner",
    ownerEmail,
    "owner",
  );
  console.log("Owner authenticated:", ownerAuth.userId);

  // 2. Authenticate Client
  const clientAuth = await signUpAndGetHeaders(
    "Test Client",
    clientEmail,
    "client",
  );
  console.log("Client authenticated:", clientAuth.userId);

  // 3. Create a parking spot (as Owner)
  console.log("\nCreating parking spot...");
  const spotRes = await fetch(`${BASE_URL}/spots`, {
    method: "POST",
    headers: ownerAuth.headers,
    body: JSON.stringify({
      ownerId: ownerAuth.userId, // Controller might still expect this, or we should update controller to use req.user.id
      latitude: 40.7128,
      longitude: -74.006,
      address: "123 Test St",
      pricePerHour: 15,
      description: "Test Spot",
    }),
  });

  if (!spotRes.ok) {
    console.error("Failed to create spot:", await spotRes.text());
    process.exit(1);
  }

  const spot = (await spotRes.json()) as { id: string };
  console.log("Spot created:", spot);

  // 4. Search for the spot (as Client)
  console.log("\nSearching for spot...");
  const searchRes = await fetch(
    `${BASE_URL}/search?lat=40.7128&lng=-74.0060&radiusKm=1`,
    {
      headers: clientAuth.headers,
    },
  );

  if (!searchRes.ok) {
    console.error("Failed to search:", await searchRes.text());
    process.exit(1);
  }

  const searchData = await searchRes.json();
  console.log("Search results:", searchData);

  // 5. Book the spot (as Client)
  console.log("\nBooking the spot...");
  const bookRes = await fetch(`${BASE_URL}/book`, {
    method: "POST",
    headers: clientAuth.headers,
    body: JSON.stringify({
      spotId: spot.id,
      clientId: clientAuth.userId,
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours later
    }),
  });

  if (!bookRes.ok) {
    console.error("Failed to book spot:", await bookRes.text());
    process.exit(1);
  }

  const booking = await bookRes.json();
  console.log("Booking created:", booking);
  console.log("\nAuthenticated Verification SUCCESS!");
  process.exit(0);
}

main().catch(console.error);
