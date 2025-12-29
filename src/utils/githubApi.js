/**
 * GitHub API Utilities
 * 
 * SECURITY:
 * - Uses hardcoded GitHub API base URL
 * - PAT token provided by user at runtime
 * - No tokens stored in code
 * 
 * CxSAST_Suppress: CWE-918 - Using hardcoded GitHub API endpoints only
 */

// Hardcoded GitHub API base (not user-configurable)
const GITHUB_API_BASE = 'https://api.github.com';

/**
 * Validate GitHub repository format
 * 
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @returns {boolean} True if valid
 */
function isValidRepo(owner, repo) {
  const repoRegex = /^[a-zA-Z0-9_.-]+$/;
  return owner && repo && repoRegex.test(owner) && repoRegex.test(repo);
}

/**
 * Validate file path
 * 
 * @param {string} path - File path
 * @returns {boolean} True if valid
 */
function isValidPath(path) {
  if (!path || typeof path !== 'string') return false;
  // No path traversal, no special characters
  if (path.includes('..') || path.startsWith('/')) return false;
  // Allow alphanumeric, dash, underscore, dot, forward slash
  return /^[a-zA-Z0-9_.\-\/]+$/.test(path);
}

/**
 * Make authenticated request to GitHub API
 * 
 * @param {string} endpoint - API endpoint (relative to base)
 * @param {string} token - GitHub PAT token
 * @param {object} options - Fetch options
 * @returns {Promise<object>} Response data
 */
async function githubRequest(endpoint, token, options = {}) {
  // CxSAST_Suppress: CWE-918 - Using hardcoded GITHUB_API_BASE constant
  const url = `${GITHUB_API_BASE}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `GitHub API Error: ${response.status}`);
  }

  // Handle empty responses (204 No Content)
  if (response.status === 204) {
    return null;
  }

  return response.json();
}

/**
 * Verify GitHub token and get user info
 * 
 * @param {string} token - GitHub PAT token
 * @returns {Promise<object>} User info
 */
export async function verifyGitHubToken(token) {
  if (!token || token.length < 10) {
    throw new Error('Invalid token format');
  }

  return githubRequest('/user', token);
}

/**
 * List repositories for authenticated user
 * 
 * @param {string} token - GitHub PAT token
 * @returns {Promise<object[]>} List of repositories
 */
export async function listRepositories(token) {
  const repos = await githubRequest('/user/repos?per_page=100&sort=updated', token);
  return repos.filter(repo => repo.permissions?.push);
}

/**
 * Check if a repository exists and user has write access
 * 
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} token - GitHub PAT token
 * @returns {Promise<object>} Repository info
 */
export async function checkRepository(owner, repo, token) {
  if (!isValidRepo(owner, repo)) {
    throw new Error('Invalid repository format');
  }

  const repoInfo = await githubRequest(`/repos/${owner}/${repo}`, token);
  
  if (!repoInfo.permissions?.push) {
    throw new Error('No write access to this repository');
  }

  return repoInfo;
}

/**
 * Get file content from repository
 * 
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} path - File path
 * @param {string} token - GitHub PAT token
 * @param {string} branch - Branch name
 * @returns {Promise<object|null>} File info or null if not exists
 */
export async function getFileContent(owner, repo, path, token, branch = 'main') {
  if (!isValidRepo(owner, repo) || !isValidPath(path)) {
    throw new Error('Invalid repository or path');
  }

  try {
    return await githubRequest(
      `/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
      token
    );
  } catch (error) {
    if (error.message.includes('404')) {
      return null;
    }
    throw error;
  }
}

/**
 * Create or update a file in a repository
 * 
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} path - File path
 * @param {string} content - File content
 * @param {string} message - Commit message
 * @param {string} token - GitHub PAT token
 * @param {string} branch - Branch name
 * @returns {Promise<object>} Commit info
 */
export async function createOrUpdateFile(owner, repo, path, content, message, token, branch = 'main') {
  if (!isValidRepo(owner, repo) || !isValidPath(path)) {
    throw new Error('Invalid repository or path');
  }

  // Check if file exists to get SHA
  const existing = await getFileContent(owner, repo, path, token, branch);
  
  // Encode content to base64
  const contentBase64 = btoa(unescape(encodeURIComponent(content)));

  const payload = {
    message: message,
    content: contentBase64,
    branch: branch,
  };

  if (existing?.sha) {
    payload.sha = existing.sha;
  }

  return githubRequest(
    `/repos/${owner}/${repo}/contents/${path}`,
    token,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    }
  );
}

/**
 * List contents of a directory in a repository
 * 
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} path - Directory path
 * @param {string} token - GitHub PAT token
 * @param {string} branch - Branch name
 * @returns {Promise<object[]>} Directory contents
 */
export async function listDirectory(owner, repo, path, token, branch = 'main') {
  if (!isValidRepo(owner, repo)) {
    throw new Error('Invalid repository format');
  }

  // Path can be empty for root
  const safePath = path ? (isValidPath(path) ? path : '') : '';
  const endpoint = safePath 
    ? `/repos/${owner}/${repo}/contents/${safePath}?ref=${branch}`
    : `/repos/${owner}/${repo}/contents?ref=${branch}`;

  try {
    const contents = await githubRequest(endpoint, token);
    return Array.isArray(contents) ? contents : [];
  } catch (error) {
    if (error.message.includes('404')) {
      return [];
    }
    throw error;
  }
}

/**
 * Get list of branches for a repository
 * 
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} token - GitHub PAT token
 * @returns {Promise<object[]>} List of branches
 */
export async function listBranches(owner, repo, token) {
  if (!isValidRepo(owner, repo)) {
    throw new Error('Invalid repository format');
  }

  return githubRequest(`/repos/${owner}/${repo}/branches`, token);
}

/**
 * Generate a unique filename with timestamp
 * 
 * @param {string} entityName - Entity name
 * @param {string} format - File format (json or csv)
 * @returns {string} Filename
 */
export function generateFilename(entityName, format) {
  const safeName = entityName.replace(/[^a-zA-Z0-9_]/g, '_');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${safeName}_${timestamp}.${format}`;
}
