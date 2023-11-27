// FFI (Foreign Function Interface) for webui.ts

import { FileSystem, glob } from "https://deno.land/x/quickr@0.6.51/main/file_system.js"

let defaultDynmaicLibName
switch (Deno.build.os) {
  case "windows":
      switch (Deno.build.arch) {
        case "x86_64":
            defaultDynmaicLibName = "windows-msvc-x64.dll";
            break
        default:
            throw new Error(
              `Unsupported architecture ${Deno.build.arch} for Windows`,
            );
      }
      break
  case "darwin":
      switch (Deno.build.arch) {
        case "x86_64":
            defaultDynmaicLibName = "macos-clang-x64.dylib";
            break
        case "aarch64":
            defaultDynmaicLibName = "macos-clang-arm64.dylib";
            break
        // case "arm64":
        //   defaultDynmaicLibName = "macos-clang-arm64.dylib";
        default:
            throw new Error(
              `Unsupported architecture ${Deno.build.arch} for Darwin`,
            );
      }
      break
  default:
      // Assuming Linux for default
      switch (Deno.build.arch) {
        case "x86_64":
            defaultDynmaicLibName = "linux-clang-x64.so";
            break
        // case "arm":
        //   defaultDynmaicLibName = "linux-gcc-arm.so";
        case "aarch64":
            defaultDynmaicLibName = "linux-gcc-arm.so";
            break
        default:
            throw new Error(
              `Unsupported architecture ${Deno.build.arch} for Linux`,
            );
      }
}

import uint8ArrayForLinuxClangX64So      from "../dlibs/linux-clang-x64.so.binaryified.js"
import uint8ArrayForLinuxGccArmSo        from "../dlibs/linux-gcc-arm.so.binaryified.js"
import uint8ArrayForMacosClangArm64Dylib from "../dlibs/macos-clang-arm64.dylib.binaryified.js"
import uint8ArrayForMacosClangX64Dylib   from "../dlibs/macos-clang-x64.dylib.binaryified.js"
import uint8ArrayForWindowsMsvcX64Dll    from "../dlibs/windows-msvc-x64.dll.binaryified.js"

const libBytes = await ({
    "linux-clang-x64.so": uint8ArrayForLinuxClangX64So,
    "linux-gcc-arm.so": uint8ArrayForLinuxGccArmSo,
    "macos-clang-arm64.dylib": uint8ArrayForMacosClangArm64Dylib,
    "macos-clang-x64.dylib": uint8ArrayForMacosClangX64Dylib,
    "windows-msvc-x64.dll": uint8ArrayForWindowsMsvcX64Dll,
})[defaultDynmaicLibName]

export function loadLib(
  { libPath, clearCache }: { libPath?: string; clearCache: boolean },
) {
  // Use user defined lib or cached one
  if (!libPath) {
    libPath = `${FileSystem.thisFolder}/dyamic_libraries/${defaultDynmaicLibName}`
    if (!FileSystem.sync.info(libPath).isFile) {
        FileSystem.sync.write({
            path: libPath,
            data: libBytes,
        })
    }
  }
  
  return Deno.dlopen(
    libPath,
    {
      webui_wait: {
        // void webui_wait(void)
        parameters: [],
        result: "void",
        nonblocking: true,
      },
      webui_new_window: {
        // size_t webui_new_window(void)
        parameters: [],
        result: "usize",
      },
      webui_show: {
        // bool webui_show(size_t window, const char* content)
        parameters: ["usize", "buffer"],
        result: "bool",
      },
      webui_show_browser: {
        // bool webui_show_browser(size_t window, const char* content, size_t browser)
        parameters: ["usize", "buffer", "usize"],
        result: "bool",
      },
      webui_interface_bind: {
        // size_t webui_interface_bind(size_t window, const char* element, void (*func)(size_t, size_t, char*, char*, size_t, size_t))
        parameters: ["usize", "buffer", "function"],
        result: "usize",
      },
      webui_script: {
        // bool webui_script(size_t window, const char* script, size_t timeout, char* buffer, size_t buffer_length)
        parameters: ["usize", "buffer", "usize", "buffer", "usize"],
        result: "bool",
      },
      webui_run: {
        // void webui_run(size_t window, const char* script)
        parameters: ["usize", "buffer"],
        result: "void",
      },
      webui_interface_set_response: {
        // void webui_interface_set_response(size_t window, size_t event_number, const char* response)
        parameters: ["usize", "usize", "buffer"],
        result: "void",
      },
      webui_exit: {
        // void webui_exit(void)
        parameters: [],
        result: "void",
      },
      webui_is_shown: {
        // bool webui_is_shown(size_t window)
        parameters: ["usize"],
        result: "bool",
      },
      webui_close: {
        // void webui_close(size_t window)
        parameters: ["usize"],
        result: "void",
      },
      webui_set_file_handler: {
        // void webui_set_file_handler(size_t window, const void* (*handler)(const char* filename, int* length))
        parameters: ["usize", "function"],
        result: "void",
      },
      webui_interface_is_app_running: {
        // bool webui_interface_is_app_running(void)
        parameters: [],
        result: "bool",
      },
      webui_set_profile: {
        // void webui_set_profile(size_t window, const char* name, const char* path)
        parameters: ["usize", "buffer", "buffer"],
        result: "void",
      },
    } as const,
  );
}
