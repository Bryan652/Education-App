"use client"

import { useSyncExternalStore } from "react"

// Lets the AI chat link return to the chat that was open. It's kept per browser tab, and only
// holds the chat's address, never what's in it.
const ITEM = "education-app:last-chat"
const NEW_CHAT = "/chat"

const listeners = new Set<() => void>()
let memory: string | null = null

function read() {
  try {
    return window.sessionStorage.getItem(ITEM) ?? memory ?? NEW_CHAT
  } catch {
    return memory ?? NEW_CHAT
  }
}

function write(path: string | null) {
  memory = path
  try {
    if (path === null) window.sessionStorage.removeItem(ITEM)
    else window.sessionStorage.setItem(ITEM, path)
  } catch {
    // Storage can be blocked, so the address just lasts until a reload.
  }
  listeners.forEach((listener) => listener())
}

export function rememberChat(path: string) {
  if (path !== read()) write(path)
}

export function forgetLastChat() {
  write(null)
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useLastChatPath() {
  return useSyncExternalStore(subscribe, read, () => NEW_CHAT)
}
