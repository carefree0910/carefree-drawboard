import type { AvailablePythonPlugins, IMakePlugin } from "@/types/plugins";

export default function getPythonPluginSettings(): IMakePlugin<AvailablePythonPlugins>[] {
  return [
    /**
     * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
     * !!!!!                                 Please use                                   !!!!!
     * !!!!!                                                                              !!!!!
     * !!!!!          `git update-index --skip-worktree ./src/panels/_python.ts`          !!!!!
     * !!!!!                                                                              !!!!!
     * !!!!!                       to ignore changes of this file                         !!!!!
     * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
     */
    // START PYTHON PLUGIN SETTINGS
    // END PYTHON PLUGIN SETTINGS
  ];
}
