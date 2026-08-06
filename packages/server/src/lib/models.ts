import {
  findSupportedChatModel,
  type SupportedChatModel,
  type SupportedChatModelName,
  type SupportedProvider,
} from "@code-sama/shared";
import type { LanguageModel } from "ai";
import type { ProviderOptions } from "@ai-sdk/provider-utils";

import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";

export type ResolvedModel = {
  model: LanguageModel;
  provider: SupportedProvider;
  modelName: SupportedChatModelName;
  providerOptions?: ProviderOptions;
};

type SupportedAntropicModel = Extract<
  SupportedChatModel,
  { provider: "anthropic" }
>["name"];

type SupportedOpenAIModel = Extract<
  SupportedChatModel,
  { provider: "openai" }
>["name"];

const ANTHROPIC_PROVIDER_OPTIONS: Partial<
  Record<SupportedAntropicModel, ProviderOptions>
> = {
  "claude-opus-4-6": {
    anthropic: {
      thinking: {
        type: "enabled",
        budgetTokens: 1200,
      },
    },
  },
  "claude-sonnet-4-6": {
    anthropic: {
      thinking: {
        type: "enabled",
        budgetTokens: 1200,
      },
    },
  },
};
const OPENAI_PROVIDER_OPTIONS: Partial<
  Record<SupportedOpenAIModel, ProviderOptions>
> = {
  "gpt-5.4": {
    openai: {
      reasoningEffort: "high",
      reasoningSummary: "detailed",
    },
  },
  "gpt-5.4-mini": {
    openai: {
      reasoningEffort: "high",
      reasoningSummary: "detailed",
    },
  },
};

const resolvedAnthropicModel = (
  model: SupportedAntropicModel,
): ResolvedModel => {
  return {
    model: anthropic(model),
    provider: "anthropic",
    modelName: model,
    providerOptions: ANTHROPIC_PROVIDER_OPTIONS[model],
  };
};

const resolvedOpenaiModel = (model: SupportedOpenAIModel): ResolvedModel => {
  return {
    model: openai(model),
    provider: "openai",
    modelName: model,
    providerOptions: OPENAI_PROVIDER_OPTIONS[model],
  };
};

const assetedUnsupportedProvider = (provider: never): never => {
  throw new Error(`Unsupported provider: ${provider}`);
};

const resolvedSupportedChatModel = (
  model: SupportedChatModel,
): ResolvedModel => {
  const provider = model.provider;

  switch (provider) {
    case "anthropic":
      return resolvedAnthropicModel(model.name);
    case "openai":
      return resolvedOpenaiModel(model.name);
    default:
      return assetedUnsupportedProvider(provider);
  }
};

export const isSupportedChatModel = (model: string): boolean => {
  return findSupportedChatModel(model) !== undefined;
};

export const resolvedChatModel = (modelName: string): ResolvedModel => {
  const model = findSupportedChatModel(modelName);
  if (!model) {
    throw new Error(`Unsupported model: ${modelName}`);
  }

  return resolvedSupportedChatModel(model);
};
