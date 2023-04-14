import type { AvailablePythonPlugins, IMakePlugin } from "@/schema/plugins";

export default function getPythonPluginSettings(): IMakePlugin<AvailablePythonPlugins>[] {
  return [
    /**
     * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
     * !!!!!                                 Please use                                   !!!!!
     * !!!!!                                                                              !!!!!
     * !!!!!          `git update-index --skip-worktree ./src/board/_python.ts`           !!!!!
     * !!!!!                                                                              !!!!!
     * !!!!!                       to ignore changes of this file                         !!!!!
     * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
     */
    // START PYTHON PLUGIN SETTINGS
    // END PYTHON PLUGIN SETTINGS
  ];
}
