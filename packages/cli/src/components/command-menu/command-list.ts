import type { Command } from "./types";

export const commandList: Command[] = [
  {
    name: "new",
    description: "Start a new conversation",
    value: "/new",
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
  },
  {
    name: "version",
    description: "Show version information",
    value: "/version",
  },
  {
    name: "clear",
    description: "Clear the console",
    value: "/clear",
  },
  {
    name: "settings",
    description: "Open settings",
    value: "/settings",
  },
  {
    name: "about",
    description: "Show information about the application",
    value: "/about",
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
  },
  {
    name: "update",
    description: "Check for updates",
    value: "/update",
  },
  {
    name: "restart",
    description: "Restart the application",
    value: "/restart",
  },
  {
    name: "logout",
    description: "Log out of the application",
    value: "/logout",
  },
  {
    name: "login",
    description: "Log in to the application",
    value: "/login",
  },
  {
    name: "profile",
    description: "View your profile",
    value: "/profile",
  },
  {
    name: "notifications",
    description: "View notifications",
    value: "/notifications",
  },
];
