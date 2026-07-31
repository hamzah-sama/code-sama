import { ModeDialog } from "../dialog/mode-dialog";
import { ModelDialog } from "../dialog/model-dialog";
import { SessionDialog } from "../dialog/session-dialog";
import { ThemeDialog } from "../dialog/theme-dialog";
import { availableChatModel } from "@code-sama/shared";
import type { Command, commandContext } from "./types";
import { performLogin } from "../../lib/oauth";
import { clearAuth } from "../../lib/auth";

export const commandList: Command[] = [
  {
    name: "new",
    description: "Start a new conversation",
    value: "/new",
    action: (ctx: commandContext) => {
      ctx.toast.show({
        message: "New conversation started",
      });
      ctx.navigate("/session/new", { replace: true });
    },
  },
  {
    name: "exit",
    description: "Exit the application",
    value: "/exit",
    action: (ctx: commandContext) => {
      ctx.exit();
    },
  },
  {
    name: "theme",
    description: "Change theme",
    value: "/theme",
    action: (ctx: commandContext) => {
      ctx.dialog.open({ title: "Select theme", children: <ThemeDialog /> });
    },
  },
  {
    name: "sessions",
    description: "Manage sessions",
    value: "/sessions",
    action: (ctx: commandContext) => {
      ctx.dialog.open({
        title: "Select session",
        children: <SessionDialog currentSession={ctx.sessionId} />,
      });
    },
  },
  {
    name: "mode",
    description: "Change mode",
    value: "/mode",
    action: (ctx: commandContext) => {
      ctx.dialog.open({
        title: "Select mode",
        children: (
          <ModeDialog currentMode={ctx.mode} onSelectMode={ctx.setMode} />
        ),
      });
    },
  },
  {
    name: "model",
    description: "Change model",
    value: "/model",
    action: (ctx: commandContext) => {
      ctx.dialog.open({
        title: "Select model",
        children: (
          <ModelDialog
            onSelectModel={ctx.setModel}
            models={availableChatModel}
            currentModel={ctx.model}
          />
        ),
      });
    },
  },
  {
    name: "about",
    description: "Show information about the application",
    value: "/about",
    action: (ctx: commandContext) => {
      ctx.toast.show({
        message: "About information shown",
      });
    },
  },
  {
    name: "feedback",
    description: "Provide feedback",
    value: "/feedback",
  },
  {
    name: "logout",
    description: "Sign out of your account",
    value: "/logout",
    action: (ctx: commandContext) => {
      clearAuth();
      ctx.toast.show({
        message: "Signed out successfully",
        variant: "success",
      });
    },
  },
  {
    name: "update",
    description: "Check for updates",
    value: "/update",
    action: (ctx: commandContext) => {
      ctx.toast.show({
        message: "Updates checked",
      });
    },
  },
  {
    name: "restart",
    description: "Restart the application",
    value: "/restart",
    action: (ctx: commandContext) => {
      ctx.toast.show({
        message: "Application restarted",
      });
    },
  },
  {
    name: "login",
    description: "Log in to the application",
    value: "/login",
    action: async (ctx: commandContext) => {
      ctx.toast.show({
        message: "Opening browser to sign in . . .",
        variant: "info",
      });
      try {
        await performLogin();
        ctx.toast.show({
          message: "Signed in",
          variant: "success",
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Sign in failed or timeout";
        ctx.toast.show({ variant: "error", message });
      }
    },
  },
  {
    name: "profile",
    description: "View your profile",
    value: "/profile",
    action: (ctx: commandContext) => {
      ctx.toast.show({
        message: "Profile information shown",
      });
    },
  },
  {
    name: "notifications",
    description: "View notifications",
    value: "/notifications",
    action: (ctx: commandContext) => {
      ctx.toast.show({
        message: "Notifications shown",
      });
    },
  },
].sort((a, b) => a.name.localeCompare(b.name));
