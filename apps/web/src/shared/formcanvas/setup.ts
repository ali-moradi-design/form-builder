"use client";

import { createRegistry } from "@formcanvas/engine";
import { allFields } from "@formcanvas/engine/fields/all";
import { createRenderers } from "@formcanvas/react";
import { allRenderers } from "@formcanvas/react/fields";

/** Every field type the app supports. */
export const registry = createRegistry(allFields);

/** The default renderer for each field type. */
export const renderers = createRenderers(allRenderers);
