import {
  findSupportedChatModel,
  SUPPORTED_CHAT_MODELS,
  type ModelPricing,
} from "@code-sama/shared";
import type { LanguageModelUsage } from "ai";

type CalculateCreditsForUsageParams = {
  provider: string;
  model: string;
  usage: LanguageModelUsage;
};

type BillableUsage = {
  credits: number;
};

type TokenCounts = {
  inputTokens: number;
  outputTokens: number;
};

const TOKENS_PER_MILLION = 1_000_000;
const USD_PER_CREDITS = 0.01;

const getTokenCounts = (usage: LanguageModelUsage): TokenCounts => {
  const inputTokens = usage.inputTokens;
  const outputTokens = usage.outputTokens;

  if (inputTokens == null || outputTokens == null) {
    throw new Error(
      "Credit conversion requires both input and output token counts.",
    );
  }
  return { inputTokens, outputTokens };
};

const getModelPricing = (provider: string, model: string): ModelPricing => {
  const supportedModel = findSupportedChatModel(model);
  if (!supportedModel || supportedModel.provider !== provider) {
    throw new Error(`Unsupported billing model : ${model}`);
  }
  return supportedModel.pricing;
};

const estimatedCostsUsd = (
  { inputTokens, outputTokens }: TokenCounts,
  pricing: ModelPricing,
) => {
  return (
    (inputTokens * pricing.inputUsdPerMillionToken +
      outputTokens * pricing.outputUsdPerMillionToken) /
    TOKENS_PER_MILLION
  );
};

const convertUsdToCredits = (estimatedCostUsd: number) => {
  if (estimatedCostUsd <= 0) {
    return 0;
  }
  return Math.max(1, Math.ceil(estimatedCostUsd / USD_PER_CREDITS));
};

export const calculateCreditsForUsage = ({
  provider,
  model,
  usage,
}: CalculateCreditsForUsageParams): BillableUsage => {
  const tokenCounts = getTokenCounts(usage);
  const pricing = getModelPricing(provider, model);
  const estimatedCostUsd = estimatedCostsUsd(tokenCounts, pricing);
  const credits = convertUsdToCredits(estimatedCostUsd);
  return { credits }
};


