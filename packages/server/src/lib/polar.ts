import { Polar } from "@polar-sh/sdk";

type PolarServer = "sandbox" | "production";

const getRequiredEnv = (key: string) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const getAccessPolarToken = () => getRequiredEnv("POLAR_ACCESS_TOKEN");

const getPolarProductId = () => getRequiredEnv("POLAR_PRODUCT_ID");

const getPolarCreditsMeterId = () => getRequiredEnv("POLAR_CREDITS_METER_ID");

const getPolarServer = (): PolarServer => {
  const server = process.env.POLAR_SERVER;

  if (!server) {
    return "sandbox";
  }

  if (server !== "sandbox" && server !== "production") {
    throw new Error('Polar server must be either "sandbox" or "production"');
  }

  return server;
};

const polar = new Polar({
  accessToken: getAccessPolarToken(),
  server: getPolarServer(),
});

type CreateCheckoutUrlParams = {
  externalCustomerId: string;
  requestUrl: string;
};

export const createCheckoutUrl = async ({
  externalCustomerId,
  requestUrl,
}: CreateCheckoutUrlParams) => {
  const result = await polar.checkouts.create({
    products: [getPolarProductId()],
    successUrl: new URL("/billing/success", requestUrl).toString(),
    externalCustomerId,
  });

  return result.url;
};

export const createCustomerPortalUrl = async ({
  externalCustomerId,
  requestUrl,
}: CreateCheckoutUrlParams) => {
  const result = await polar.customerSessions.create({
    externalCustomerId,
    returnUrl: new URL("/billing/success", requestUrl).toString(),
  });
  return result.customerPortalUrl;
};

export const getAvailableCreditsBalance = async (externalId: string) => {
  try {
    const customerState = await polar.customers.getStateExternal({
      externalId,
    });
    const { activeMeters } = customerState;
    console.log("activeMeter :", activeMeters);
    const matchingMeters = customerState.activeMeters.filter(
      (meter) => meter.meterId === getPolarCreditsMeterId(),
    );

    if (matchingMeters.length > 1) {
      throw new Error("Expected only one matching meter, but found multiple.");
    }

    const creditsMeter = matchingMeters[0];
    return creditsMeter?.balance ?? 0;
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "statusCode" in error &&
      error.statusCode === 404
    ) {
      return 0;
    }

    throw error;
  }
};

type IngestAiUsageParams = {
  externalCustomerId: string;
  credits: number;
  eventId: string;
};

export const ingestAiUsage = async ({
  externalCustomerId,
  credits,
  eventId,
}: IngestAiUsageParams) => {
  if (credits <= 0) return;

  await polar.events.ingest({
    events: [
      {
        externalCustomerId,
        externalId: eventId,
        name: "usage",
        metadata: {
          credits,
        },
      },
    ],
  });
};
