//* Libraries imports
import { withWorkflow } from "workflow/next";
import type { NextConfig } from "next";

import "@/env/client";
import "@/env/server";

const nextConfig: NextConfig = {}

export default withWorkflow(nextConfig);