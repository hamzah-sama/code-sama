import type { KeyBinding } from "@opentui/core";

export const textAreaKeyBindings: KeyBinding[] = [
  {
    name: "return",
    action: "submit",
  },
  {
    name: "enter",
    action: "submit",
  },
  {
    name: "return",
    shift: true,
    action: "newline",
  },
  {
    name: "enter",
    shift: true,
    action: "newline",
  },
];
