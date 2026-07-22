export type ModelPricing = {
  inputUsdPerMillionToken: number;
  outputUsdPerMillionToken: number;
};

export type SupportedProvider = "antropic" | "openai";

type SupportedChatModelDefinition = {
  name: string;
  provider: SupportedProvider;
  pricing: ModelPricing;
};

export const SUPPORTED_CHAT_MODELS = [
  {
    name: "claude-sonnet-4-6",
    provider: "antropic",
    pricing: {
      inputUsdPerMillionToken: 3,
      outputUsdPerMillionToken: 15,
    },
  },
  {
    name: "claude-haiku-4-5",
    provider: "antropic",
    pricing: {
      inputUsdPerMillionToken: 1,
      outputUsdPerMillionToken: 5,
    },
  },
  {
    name: "claude-opus-4-6",
    provider: "antropic",
    pricing: {
      inputUsdPerMillionToken: 5,
      outputUsdPerMillionToken: 25,
    },
  },
  {
    name: "gpt-5-4",
    provider: "openai",
    pricing: {
      inputUsdPerMillionToken: 2.5,
      outputUsdPerMillionToken: 15,
    },
  },
  {
    name: "gpt-5-4-mini",
    provider: "openai",
    pricing: {
      inputUsdPerMillionToken: 0.75,
      outputUsdPerMillionToken: 4.5,
    },
  },
  {
    name: "gpt-5-4-nano",
    provider: "openai",
    pricing: {
      inputUsdPerMillionToken: 0.2,
      outputUsdPerMillionToken: 1.25,
    },
  },
] as const satisfies readonly SupportedChatModelDefinition[];

export type SupportedChatModel = (typeof SUPPORTED_CHAT_MODELS)[number];

export type SupportedChatModelName = SupportedChatModel["name"];

export const findSupportedChatModel = (modelName: string) => {
  return SUPPORTED_CHAT_MODELS.find((model) => model.name === modelName);
};

export const DEFAULT_CHAT_MODEL_NAME : SupportedChatModelName = 'claude-opus-4-6';
