import { fileURLToPath } from "node:url";
import * as sass from "sass";

// Both standalone HTML and the Node access gate consume this exact global baseline.
export function compileGlobalTokens() {
  return (
    sass.compile(
      fileURLToPath(new URL("../tokens/index.scss", import.meta.url)),
      {
        style: "compressed",
      },
    ).css + "\n"
  );
}
