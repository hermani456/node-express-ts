import { Request, Response } from "express";
import { db } from "../db/index.js";
import { parkingSpot, booking } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { logger } from "../utils/logger.js";
import { randomUUID } from "node:crypto";

// Haversine formula to calculate distance in km
const calculateDistance = (
  authorizedLat: number,
  authorizedLon: number,
  targetLat: number,
  targetLon: number,
) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (targetLat - authorizedLat) * (Math.PI / 180);
  const dLon = (targetLon - authorizedLon) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(authorizedLat * (Math.PI / 180)) *
      Math.cos(targetLat * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d;
};

interface SearchQuery {
  lat?: string;
  lng?: string;
  radiusKm?: string;
}

export const searchSpots = async (
  req: Request<unknown, unknown, unknown, SearchQuery>,
  res: Response,
) => {
  try {
    const { lat, lng, radiusKm } = req.query;

    if (!lat || !lng) {
      return res
        .status(400)
        .json({ error: "Latitude and longitude are required" });
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    // Default 15 min drive ~ 5-10km. Let's say 10km radius if not specified.
    const searchRadius = radiusKm ? parseFloat(radiusKm) : 10;

    const allSpots = await db
      .select()
      .from(parkingSpot)
      .where(eq(parkingSpot.isAvailable, true));

    const nearbySpots = allSpots.filter((spot) => {
      const distance = calculateDistance(
        userLat,
        userLng,
        spot.latitude,
        spot.longitude,
      );
      return distance <= searchRadius;
    });

    res.json({ spots: nearbySpots });
  } catch (error) {
    logger.error(error, "Error searching spots");
    res.status(500).json({ error: "Internal server error" });
  }
};

interface CreateSpotBody {
  ownerId: string;
  latitude: number;
  longitude: number;
  address: string;
  pricePerHour: number;
  description?: string;
}

export const createSpot = async (
  req: Request<unknown, unknown, CreateSpotBody>,
  res: Response,
) => {
  try {
    const { ownerId, latitude, longitude, address, pricePerHour, description } =
      req.body;

    // In a real app, verify user role is owner or host here

    // Simple ID generation for MVP if standard default not working
    const id = randomUUID();

    const result = await db
      .insert(parkingSpot)
      .values({
        id,
        ownerId,
        latitude,
        longitude,
        address,
        pricePerHour,
        description,
        isAvailable: true,
      })
      .returning();

    res.status(201).json(result[0]);
  } catch (error) {
    logger.error(error, "Error creating spot");
    res.status(500).json({ error: "Internal server error" });
  }
};

interface BookSpotBody {
  spotId: string;
  clientId: string;
  startTime: string;
  endTime: string;
}

export const bookSpot = async (
  req: Request<unknown, unknown, BookSpotBody>,
  res: Response,
) => {
  try {
    const { spotId, clientId, startTime, endTime } = req.body;

    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    const spot = await db
      .select()
      .from(parkingSpot)
      .where(eq(parkingSpot.id, spotId))
      .limit(1);

    if (spot.length === 0) {
      return res.status(404).json({ error: "Spot not found" });
    }

    const currentSpot = spot[0];

    const totalPrice = currentSpot.pricePerHour * durationHours;
    const id = randomUUID();

    const result = await db
      .insert(booking)
      .values({
        id,
        spotId,
        clientId,
        startTime: start,
        endTime: end,
        totalPrice,
        status: "pending",
      })
      .returning();

    res.status(201).json(result[0]);
  } catch (error) {
    logger.error(error, "Error booking spot");
    res.status(500).json({ error: "Internal server error" });
  }
};
