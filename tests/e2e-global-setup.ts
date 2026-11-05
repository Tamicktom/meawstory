//* Local imports
import {
  removeSavedCorrection,
  writeSavedCorrection,
} from "./helpers/saved-correction"

//* Tests run in parallel and share this file, so it lives for the whole run.
//* With it in place, no end-to-end test reaches the real model.
export default async function globalSetup() {
  await writeSavedCorrection()

  return removeSavedCorrection
}
