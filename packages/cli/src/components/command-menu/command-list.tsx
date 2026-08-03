import { ModeDialog } from "../dialog/mode-dialog";
import { ModelDialog } from "../dialog/model-dialog";
import { SessionDialog } from "../dialog/session-dialog";
import { ThemeDialog } from "../dialog/theme-dialog";
import { availableChatModel } from "@code-sama/shared";
import type { Command, commandContext } from "./types";
import { performLogin } from "../../lib/oauth";
import { clearAuth } from "../../lib/auth";
import { openBillingPortal, openUpgradeCheckout } from "../../lib/upgrade";

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
    name: "upgrade",
    description: "Upgrade your plan",
    value: "/upgrade",
    action: async (ctx: commandContext) => {
      ctx.toast.show({
        message: "Opening credits checkout...",
      });

      try {
        await openUpgradeCheckout();
        ctx.toast.show({
          message: "Checkout opened in browser",
          variant: "success",
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to open checkout";
        ctx.toast.show({
          message,
          variant: "error",
        });
      }
    },
  },
  {
    name: "usage",
    description: "Open billing portal in your browser",
    value: "/usage",
    action: async (ctx: commandContext) => {
      ctx.toast.show({
        message: "Opening billing portal in browser...",
      });

      try {
        await openBillingPortal();
        ctx.toast.show({
          message: "Billing portal opened in browser",
          variant: "success",
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to open billing portal";
        ctx.toast.show({
          message,
          variant: "error",
        });
      }
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
].sort((a, b) => a.name.localeCompare(b.name));
