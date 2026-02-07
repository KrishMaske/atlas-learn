// =============================================================================
// Atlas — Code to Graph Parser
// =============================================================================
// Parses the generated code back to extract user-modified code blocks.
// Uses markers like `// --- NODE: <id> ---` to identify blocks.
// =============================================================================

export interface NodeCodeUpdate {
  nodeId: string;
  customCode: string;
}

export function parseCodeToNodeUpdates(code: string): NodeCodeUpdate[] {
  const updates: NodeCodeUpdate[] = [];
  
  // Regex to match node blocks
  // Pattern: // --- NODE: <id> (<type>) --- ... // --- USER CODE START --- ... // --- USER CODE END --- ... // --- END NODE: <id> ---
  const nodeBlockRegex = /\/\/ --- NODE: ([a-zA-Z0-9_-]+) \([^)]+\) ---[\s\S]*?\/\/ --- USER CODE START ---\n([\s\S]*?)\/\/ --- USER CODE END ---[\s\S]*?\/\/ --- END NODE: \1 ---/g;
  
  let match;
  while ((match = nodeBlockRegex.exec(code)) !== null) {
    const nodeId = match[1];
    let userCode = match[2];
    
    // Remove the leading indentation (4 spaces) from each line
    userCode = userCode
      .split('\n')
      .map(line => line.startsWith('    ') ? line.slice(4) : line)
      .join('\n')
      .trim();
    
    updates.push({ nodeId, customCode: userCode });
  }
  
  return updates;
}

// Validate that the code structure is parseable
export function isCodeStructureValid(code: string): boolean {
  // Check for basic structure markers
  const hasNodeMarkers = /\/\/ --- NODE: .+ ---/.test(code);
  const hasEndMarkers = /\/\/ --- END NODE: .+ ---/.test(code);
  const hasUserCodeMarkers = /\/\/ --- USER CODE START ---/.test(code) && /\/\/ --- USER CODE END ---/.test(code);
  
  return hasNodeMarkers && hasEndMarkers && hasUserCodeMarkers;
}
