import { useLocation } from "react-router";
import { SessionWrapper } from "./session-wrapper";
import { BotMessage } from "../messages/bot-message";
import { UserMessage } from "../messages/user-message";
import { ErrorMessage } from "../messages/error-message";

export const NewSession = () => {
  const location = useLocation();
  const state = (location.state as { message?: string } | null) ?? {};

  if (!state.message) return null;
  return (
    <SessionWrapper onSubmit={() => {}} inputDisabled>
      <UserMessage message={state.message} />
      <BotMessage
        content="Sorry, I can't process your request right now."
        model="gpt-4"
      />
      <ErrorMessage message="This session has expired. Please start a new session." />
    </SessionWrapper>
  );
};