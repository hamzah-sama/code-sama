import type { Command } from "./types";

export const commandList: Command[] = [
  {
    name: "new",
    description: "Start a new conversation",
    value: "/new",
    action: (ctx) => {
      ctx.toast.show({
        message: "New conversation started",
      });
    },
  },
  {
    name: "exit",
    description: "Exit the application",
    value: "/exit",
    action: (ctx) => {
      ctx.exit();
    },
  },
  {
    name: "help",
    description: "Show help information",
    value: "/help",
    action: (ctx) => {
      ctx.toast.show({
        message: "Help information shown",
      });
    },
  },
  {
    name: "version",
    description: "Show version information",
    value: "/version",
    action: (ctx) => {
      ctx.toast.show({
        message: "Version information shown",
      });
    },
  },
  {
    name: "clear",
    description: "Clear the console",
    value: "/clear",
    action: (ctx) => {
      ctx.toast.show({
        message: "Console cleared",
      });
    },
  },
  {
    name: "settings",
    description: "Open settings",
    value: "/settings",
    action: (ctx) => {
      ctx.toast.show({
        message: "Settings opened",
      });
    },
  },
  {
    name: "about",
    description: "Show information about the application",
    value: "/about",
    action: (ctx) => {
      ctx.toast.show({
        message: "About information shown",
      });
    },
  },
  {
    name: "feedback",
    description: "Provide feedback",
    value: "/feedback",
    action: (ctx) => {
      ctx.toast.show({
        message: "Feedback provided",
      });
    },
  },
  {
    name: "report",
    description: "Report an issue",
    value: "/report",
    action: (ctx) => {
      ctx.toast.show({
        message: "Issue reported",
      });
    },
  },
  {
    name: "update",
    description: "Check for updates",
    value: "/update",
    action: (ctx) => {
      ctx.toast.show({
        message: "Updates checked",
      });
    },
  },
  {
    name: "restart",
    description: "Restart the application",
    value: "/restart",
    action: (ctx) => {
      ctx.toast.show({
        message: "Application restarted",
      });
    },
  },
  {
    name: "logout",
    description: "Log out of the application",
    value: "/logout",
    action: (ctx) => {
      ctx.toast.show({
        message: "Logged out",
      });
    },
  },
  {
    name: "login",
    description: "Log in to the application",
    value: "/login",
    action: (ctx) => {
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
    action: (ctx) => {
      ctx.toast.show({
        message: "Profile information shown",
      });
    },
  },
  {
    name: "notifications",
    description: "View notifications",
    value: "/notifications",
    action: (ctx) => {
      ctx.toast.show({
        message: "Notifications shown",
      });
    },
  },
];
