const path = require('path');
const os = require('os');

class PathResolver {
  normalizePath(inputPath) {
    // Convert to forward slashes first for consistent handling
    let normalized = inputPath.replace(/\\/g, '/');

    // Handle ~/ at the start
    if (normalized.startsWith('~/')) {
      normalized = normalized.replace('~', os.homedir().replace(/\\/g, '/'));
    }
    // Handle standalone ~
    else if (normalized === '~') {
      normalized = os.homedir().replace(/\\/g, '/');
    }
    // Handle ~user/
    else if (normalized.match(/^~[^/]+\//)) {
      const username = normalized.slice(1).split('/')[0];
      try {
        const userHomeDir = os.userInfo(username).homedir.replace(/\\/g, '/');
        normalized = normalized.replace(new RegExp(`^~${username}`), userHomeDir);
      } catch (error) {
        throw new Error(`no such user: ${username}`);
      }
    }

    // Convert separators back to the platform-specific ones
    // but only after all path manipulation is done
    if (os.platform() === 'win32') {
      normalized = normalized.replace(/\//g, '\\');
    }

    return normalized;
  }

  resolvePath(directory) {
    // Normalize the input path first
    const normalizedPath = this.normalizePath(directory);

    // Now resolve it against the current working directory
    // path.resolve will handle the platform-specific details
    const resolvedPath = path.resolve(process.cwd(), normalizedPath);

    // Verify the path exists (optional, but helpful for error messages)
    try {
      // This will throw if path doesn't exist or isn't accessible
      require('fs').accessSync(resolvedPath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`no such file or directory: ${directory}`);
      }
      throw error; // Re-throw other errors (permissions, etc.)
    }

    return resolvedPath;
  }
}

module.exports = PathResolver;