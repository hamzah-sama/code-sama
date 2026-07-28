import { ModeDialog } from "../dialog/mode-dialog";
import { ModelDialog } from "../dialog/model-dialog";
import { SessionDialog } from "../dialog/session-dialog";
import { ThemeDialog } from "../dialog/theme-dialog";
import { availableChatModel } from "@code-sama/shared";
import type { Command, commandContext } from "./types";

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
    value: "/version",
    action: (ctx: commandContext) => {
      ctx.dialog.open({ title: "Select session", children: <SessionDialog /> });
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
    name: "report",
    description: "Report an issue",
    value: "/report",
    action: (ctx: commandContext) => {
      ctx.toast.show({
        message: "Issue reported",
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
    name: "logout",
    description: "Log out of the application",
    value: "/logout",
    action: (ctx: commandContext) => {
      ctx.toast.show({
        message: "Logged out",
      });
    },
  },
  {
    name: "login",
    description: "Log in to the application",
    value: "/login",
    action: (ctx: commandContext) => {
      ctx.toast.show({
        message: "Logged in",
        variant: "success",
      });
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
