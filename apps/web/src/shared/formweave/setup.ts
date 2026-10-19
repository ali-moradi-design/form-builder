"use client";

import { createRegistry } from "@formweave/engine";
import { allFields } from "@formweave/engine/fields/all";
import { createRenderers } from "@formweave/react";
import { basicRenderers } from "@formweave/react/fields";

/** Every field type the app supports. */
export const registry = createRegistry(allFields);

/** The default renderer for each field type. */
export const renderers = createRenderers(basicRenderers);
