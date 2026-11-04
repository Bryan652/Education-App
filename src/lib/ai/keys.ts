"use client"

import { useSyncExternalStore } from "react"
import type { ProviderId } from "@/lib/ai/providers"

// Keys stay on the student's device. They never go in the database or to this app's server,
// and they're only ever sent to the provider they belong to.
export interface AiKey {
  id: string
  name: string
  provider: ProviderId
  key: string
}

export interface AiSelection {
  keyId: string | null
  model: string | null
}

const KEYS_ITEM = "education-app:ai-keys"
const FORGET_ITEM = "education-app:ai-forget-on-close"
const SELECTION_ITEM = "education-app:ai-selection"

const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  // Keeps other open tabs in step.
  window.addEventListener("storage", listener)
  return () => {
    listeners.delete(listener)
    window.removeEventListener("storage", listener)
  }
}

// Browsers can block storage, for example in some private windows. Keys then last until a reload.
const memory = new Map<string, string>()

function read(store: () => Storage, item: string) {
  try {
    return store().getItem(item) ?? memory.get(item) ?? null
  } catch {
    return memory.get(item) ?? null
  }
}

function write(store: () => Storage, item: string, value: string | null) {
  try {
    if (value === null) store().removeItem(item)
    else store().setItem(item, value)
    memory.delete(item)
  } catch {
    if (value === null) memory.delete(item)
    else memory.set(item, value)
  }
}

const local = () => window.localStorage
const session = () => window.sessionStorage

export function getForgetOnClose() {
  return read(local, FORGET_ITEM) === "true"
}

const keyStore = () => (getForgetOnClose() ? session() : local())

// useSyncExternalStore needs the same object back until the stored text actually changes.
const NO_KEYS: AiKey[] = []
let cachedKeysText: string | null = null
let cachedKeys = NO_KEYS

function getKeys() {
  const text = read(keyStore, KEYS_ITEM)
  if (text !== cachedKeysText) {
    cachedKeysText = text
    try {
      const parsed = text ? JSON.parse(text) : NO_KEYS
      cachedKeys = Array.isArray(parsed) ? parsed : NO_KEYS
    } catch {
      cachedKeys = NO_KEYS
    }
  }
  return cachedKeys
}

function saveKeys(keys: AiKey[]) {
  write(keyStore, KEYS_ITEM, keys.length > 0 ? JSON.stringify(keys) : null)
  notify()
}

export function addAiKey(key: Omit<AiKey, "id">) {
  const id = crypto.randomUUID()
  saveKeys([...getKeys(), { ...key, id }])
  return id
}

export function deleteAiKey(id: string) {
  saveKeys(getKeys().filter((key) => key.id !== id))
}

export function removeAllAiKeys() {
  write(local, KEYS_ITEM, null)
  write(session, KEYS_ITEM, null)
  write(local, SELECTION_ITEM, null)
  notify()
}

/** Moves keys to storage that the browser empties when the tab closes, or back again. */
export function setForgetOnClose(forget: boolean) {
  const keys = getKeys()
  write(local, KEYS_ITEM, null)
  write(session, KEYS_ITEM, null)
  write(local, FORGET_ITEM, forget ? "true" : null)
  saveKeys(keys)
}

let cachedSelectionText: string | null = null
let cachedSelection: AiSelection = { keyId: null, model: null }
const NO_SELECTION: AiSelection = { keyId: null, model: null }

function getSelection() {
  const text = read(local, SELECTION_ITEM)
  if (text !== cachedSelectionText) {
    cachedSelectionText = text
    try {
      cachedSelection = text ? JSON.parse(text) : NO_SELECTION
    } catch {
      cachedSelection = NO_SELECTION
    }
  }
  return cachedSelection
}

export function saveAiSelection(selection: AiSelection) {
  write(local, SELECTION_ITEM, JSON.stringify(selection))
  notify()
}

export function useAiKeys() {
  return useSyncExternalStore(subscribe, getKeys, () => NO_KEYS)
}

export function useForgetOnClose() {
  return useSyncExternalStore(subscribe, getForgetOnClose, () => false)
}

export function useAiSelection() {
  return useSyncExternalStore(subscribe, getSelection, () => NO_SELECTION)
}
