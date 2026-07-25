import {
  findSupportedChatModel,
  type SupportedChatModel,
  type SupportedChatModelName,
  type SupportedProvider,
} from "@code-sama/shared";
import type { LanguageModel } from "ai";

import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";

export type ResolvedModel = {
  model: LanguageModel;
  provider: SupportedProvider;
  modelName: SupportedChatModelName;
};

type SupoortedAntropicModel = Extract<
  SupportedChatModel,
  { provider: "anthropic" }
>["name"];

type SupoortedOpenAIModel = Extract<
  SupportedChatModel,
  { provider: "openai" }
>["name"];

const resolvedAnthropicModel = (
  model: SupoortedAntropicModel,
): ResolvedModel => {
  return {
    model: anthropic(model),
    provider: "anthropic",
    modelName: model,
  };
};

const resolvedOpenaiModel = (model: SupoortedOpenAIModel): ResolvedModel => {
  return {
    model: openai(model),
    provider: "openai",
    modelName: model,
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



