#!/usr/bin/env node

const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');

// ============================================================================
// UTILITIES
// ============================================================================

function exec(cmd, options = {}) {
  try {
    return execSync(cmd, {
      encoding: 'utf8',
      cwd: path.join(__dirname, '..'),
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options,
    }).trim();
  } catch (error) {
    if (options.throws !== false) {
      throw error;
    }
    return '';
  }
}

function parseVersion(tag) {
  // Extract semantic version from tag (e.g., v1.2.3 -> [1, 2, 3])
  const match = tag.match(/v?(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;
  return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
}

function formatVersion(parts) {
  return `v${parts[0]}.${parts[1]}.${parts[2]}`;
}

function formatVersionShort(parts) {
  return `${parts[0]}.${parts[1]}.${parts[2]}`;
}

function getLatestTag() {
  const tag = exec('git describe --tags --abbrev=0', {
    throws: false,
    silent: true,
  });
  return tag || null;
}

function getCommitsSinceTag(tag) {
  if (!tag) {
    // Si no hay tag, obtener todos los commits
    return (exec('git log --pretty=format:%s', {
      throws: false,
      silent: true,
    }) || '')
      .split('\n')
      .filter((line) => line.trim());
  }

  return (exec(`git log ${tag}..HEAD --pretty=format:%s`, {
    throws: false,
    silent: true,
  }) || '')
    .split('\n')
    .filter((line) => line.trim());
}

function classifyCommit(message) {
  // Skip merge commits and empty messages
  if (message.startsWith('Merge ') || !message.trim()) {
    return null;
  }

  // Check for BREAKING CHANGE in the message body
  if (message.includes('BREAKING CHANGE')) {
    return 'MAJOR';
  }

  // Check commit type with optional scope and optional breaking indicator
  // Matches: type(scope)!: or type!: or type(scope): or type:
  const typeMatch = message.match(
    /^(feat|fix|perf|refactor|docs|style|test|chore|ci|build)(?:\([^)]*\))?(!)?:/
  );

  if (!typeMatch) {
    return null;
  }

  const type = typeMatch[1];
  const hasBreakingPrefix = typeMatch[2] === '!';

  if (hasBreakingPrefix) {
    return 'MAJOR';
  }

  if (type === 'feat') {
    return 'MINOR';
  }

  // fix, perf, refactor, docs, style, test, chore, ci, build
  return 'PATCH';
}

function getCommitType(message) {
  // Returns the commit type for changelog categorization
  if (message.startsWith('Merge ') || !message.trim()) {
    return null;
  }

  const typeMatch = message.match(
    /^(feat|fix|perf|refactor|docs|style|test|chore|ci|build)(?:\([^)]*\))?(!)?:/
  );
  if (!typeMatch) {
    return null;
  }

  return typeMatch[1];
}

function determineReleaseType(commits) {
  const classifications = commits
    .map((commit) => classifyCommit(commit))
    .filter((classification) => classification !== null);

  if (classifications.length === 0) {
    return null;
  }

  if (classifications.includes('MAJOR')) {
    return 'MAJOR';
  }

  if (classifications.includes('MINOR')) {
    return 'MINOR';
  }

  return 'PATCH';
}

function incrementVersion(versionParts, releaseType) {
  const [major, minor, patch] = versionParts;

  switch (releaseType) {
    case 'MAJOR':
      return [major + 1, 0, 0];
    case 'MINOR':
      return [major, minor + 1, 0];
    case 'PATCH':
      return [major, minor, patch + 1];
    default:
      return versionParts;
  }
}

function printBox(title) {
  const width = 50;
  const line = '━'.repeat(width);
  console.log('\n' + line);
  console.log(title.padStart((width + title.length) / 2).padEnd(width));
  console.log(line + '\n');
}

function printLine(label, value) {
  console.log(`${label.padEnd(18)} ${value}`);
}

function isWorkingTreeClean() {
  const status = exec('git status --porcelain', {
    throws: false,
    silent: true,
  });
  return status.trim() === '';
}

function getCurrentBranch() {
  return (
    exec('git rev-parse --abbrev-ref HEAD', {
      throws: false,
      silent: true,
    }) || ''
  );
}

function updatePackageVersion(newVersion) {
  try {
    const pkgPath = path.join(__dirname, '..', 'package.json');
    const content = fs.readFileSync(pkgPath, 'utf8');
    const pkg = JSON.parse(content);
    pkg.version = newVersion;
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
    return true;
  } catch (error) {
    throw new Error(`Failed to update package.json: ${error.message}`);
  }
}

function updateChangelog(newVersion, releaseDate, commits) {
  try {
    const changelogPath = path.join(__dirname, '..', 'CHANGELOG.md');
    const existing = fs.readFileSync(changelogPath, 'utf8');

    // Group commits by type
    const groups = {
      Added: [],
      Changed: [],
      Fixed: [],
      Maintenance: [],
    };

    commits.forEach((commit) => {
      const type = getCommitType(commit);
      if (!type) return;

      let group = 'Changed'; // default
      if (type === 'feat') {
        group = 'Added';
      } else if (type === 'fix') {
        group = 'Fixed';
      } else if (['perf', 'refactor', 'docs', 'style'].includes(type)) {
        group = 'Changed';
      } else if (['test', 'chore', 'ci', 'build'].includes(type)) {
        group = 'Maintenance';
      }

      groups[group].push(`- ${commit}`);
    });

    // Build changelog entry
    let entry = `## [${newVersion}] - ${releaseDate}\n`;

    if (groups.Added.length > 0) {
      entry += `\n### Added\n\n${groups.Added.join('\n')}\n`;
    }
    if (groups.Changed.length > 0) {
      entry += `\n### Changed\n\n${groups.Changed.join('\n')}\n`;
    }
    if (groups.Fixed.length > 0) {
      entry += `\n### Fixed\n\n${groups.Fixed.join('\n')}\n`;
    }
    if (groups.Maintenance.length > 0) {
      entry += `\n### Maintenance\n\n${groups.Maintenance.join('\n')}\n`;
    }

    entry += '\n';

    // Find insertion point (after header)
    const lines = existing.split('\n');
    const insertIndex = lines.findIndex((l) => l.startsWith('and this project'));

    if (insertIndex === -1) {
      throw new Error('Could not find insertion point in CHANGELOG.md');
    }

    lines.splice(insertIndex + 1, 0, '', entry);
    fs.writeFileSync(changelogPath, lines.join('\n'), 'utf8');
    return true;
  } catch (error) {
    throw new Error(`Failed to update CHANGELOG.md: ${error.message}`);
  }
}

function captureReleaseFiles() {
  const root = path.join(__dirname, '..');
  const files = {
    packageJson: path.join(root, 'package.json'),
    changelog: path.join(root, 'CHANGELOG.md'),
  };

  return {
    files,
    snapshots: {
      packageJson: fs.readFileSync(files.packageJson),
      changelog: fs.readFileSync(files.changelog),
    },
  };
}

function restoreReleaseFiles(state) {
  fs.writeFileSync(state.files.packageJson, state.snapshots.packageJson);
  fs.writeFileSync(state.files.changelog, state.snapshots.changelog);
}

function rollbackRelease({ state, preReleaseHead, releaseCommit, releaseTag }) {
  exec('git reset HEAD -- package.json CHANGELOG.md', { silent: true, throws: false });

  if (releaseTag && exec(`git tag --list ${releaseTag}`, { silent: true, throws: false })) {
    exec(`git tag -d ${releaseTag}`, { silent: true, throws: false });
  }

  const currentHead = exec('git rev-parse HEAD', { silent: true, throws: false });
  if (releaseCommit && currentHead === releaseCommit) {
    exec(`git reset --hard ${preReleaseHead}`, { silent: true });
  }

  restoreReleaseFiles(state);
}

function getGitHubToken() {
  // Check common GitHub token environment variables
  return process.env.GITHUB_TOKEN || process.env.GH_TOKEN || process.env.GITHUB_PAT || null;
}

function hasGitHubCredentials() {
  return getGitHubToken() !== null;
}

async function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(String(answer || '').trim().toLowerCase());
    });
  });
}

// ============================================================================
// CHECK MODE
// ============================================================================

function runCheckMode(latestTag, commits, currentVersionStr, newVersionParts, releaseType) {
  printBox('AAUD RELEASE CHECK');

  printLine('Último tag:', latestTag || 'ninguno');
  printLine('Versión actual:', currentVersionStr.substring(1));
  console.log('');

  if (commits.length === 0) {
    console.log('No hay commits posteriores al último tag.');
    console.log('');
    printLine('Tipo de release:', 'NINGUNO');
    printLine('Nueva versión:', 'sin cambios');
    console.log('');
    printLine('Modo:', 'CHECK');
    console.log('No se realizaron cambios.');
    console.log('');
    console.log('━'.repeat(50));
    console.log('');
    return true;
  }

  if (!releaseType) {
    console.log('Commits encontrados pero ninguno representa un cambio de versión.');
    console.log('');
    printLine('Tipo de release:', 'NINGUNO');
    printLine('Nueva versión:', 'sin cambios');
    console.log('');
    printLine('Modo:', 'CHECK');
    console.log('No se realizaron cambios.');
    console.log('');
    console.log('━'.repeat(50));
    console.log('');
    return true;
  }

  // Show commits
  console.log('Commits desde ' + (latestTag || 'inicio') + ':');
  commits.forEach((commit) => {
    const type = getCommitType(commit);
    let prefix = '•';
    if (type === 'feat') prefix = '+';
    else if (type === 'fix') prefix = '✓';
    else if (['perf', 'refactor', 'docs', 'style'].includes(type)) prefix = '~';

    console.log(`  ${prefix} ${commit}`);
  });
  console.log('');

  const newVersionStr = formatVersion(newVersionParts);

  printLine('Tipo de release:', releaseType);
  printLine('Nueva versión:', newVersionStr.substring(1));
  console.log('');
  printLine('Modo:', 'CHECK');
  console.log('No se realizaron cambios.');
  console.log('');
  console.log('━'.repeat(50));
  console.log('');
  return true;
}

// ============================================================================
// RELEASE MODE
// ============================================================================

async function runReleaseMode(latestTag, commits, currentVersionStr, newVersionParts, releaseType) {
  const branch = getCurrentBranch();

  // Validations
  if (branch !== 'main') {
    throw new Error(`❌ Error: No estás en la rama main. Rama actual: ${branch}`);
  }

  if (!isWorkingTreeClean()) {
    throw new Error('❌ Error: El working tree tiene cambios sin commit.');
  }

  if (commits.length === 0) {
    throw new Error('❌ Error: No hay commits posteriores al último tag.');
  }

  if (!releaseType) {
    throw new Error('❌ Error: No hay commits que representen un cambio de versión.');
  }

  // Run validations
  console.log('Ejecutando validaciones...\n');

  try {
    console.log('  ✓ Validando Prisma...');
    exec('npm run prisma:validate', { stdio: 'pipe' });
  } catch (error) {
    throw new Error('❌ Error: Prisma validation falló');
  }

  try {
    console.log('  ✓ Compilando frontend...');
    exec('npm run build', { stdio: 'pipe' });
  } catch (error) {
    throw new Error('❌ Error: Build falló');
  }

  try {
    console.log('  ✓ Ejecutando tests del backend...');
    exec('npm run test -w apps/backend', { stdio: 'pipe' });
  } catch (error) {
    throw new Error('❌ Error: Tests falló');
  }

  console.log('');

  // Show confirmation
  const newVersionStr = formatVersion(newVersionParts);
  const newVersionShort = formatVersionShort(newVersionParts);
  const today = new Date().toISOString().split('T')[0];

  printBox('AAUD RELEASE');

  printLine('Versión actual:', currentVersionStr.substring(1));
  printLine('Nueva versión:', newVersionShort);
  printLine('Tipo de release:', releaseType);
  console.log('');

  console.log('Cambios:');
  commits.forEach((commit) => {
    const type = getCommitType(commit);
    let prefix = '•';
    if (type === 'feat') prefix = '+';
    else if (type === 'fix') prefix = '✓';
    else if (['perf', 'refactor', 'docs', 'style'].includes(type)) prefix = '~';

    console.log(`  ${prefix} ${commit}`);
  });
  console.log('');

  console.log('Validaciones:');
  printLine('  ✓ Branch main', '');
  printLine('  ✓ Working tree limpio', '');
  printLine('  ✓ Prisma validate', '');
  printLine('  ✓ Build', '');
  printLine('  ✓ Tests', '');
  console.log('');

  console.log('Se modificará:');
  console.log('  package.json');
  console.log('  CHANGELOG.md');
  console.log('');

  console.log('Se creará:');
  console.log(`  commit: chore(release): ${newVersionStr}`);
  console.log(`  tag:    ${newVersionStr}`);
  if (hasGitHubCredentials()) {
    console.log(`  GitHub Release: ${newVersionStr}`);
  }
  console.log('');

  const answer = await prompt('¿Continuar? [y/N] ');

  if (answer !== 'y' && answer !== 'yes') {
    console.log('\n❌ Release cancelado.');
    console.log('');
    process.exit(0);
  }

  console.log('\n✓ Actualizando archivos...');

  const releaseState = captureReleaseFiles();
  const preReleaseHead = exec('git rev-parse HEAD');
  let releaseCommit = '';
  let releaseTag = '';

  try {

  // Update package.json
  updatePackageVersion(newVersionShort);
  console.log('  ✓ package.json actualizado');

  // Update CHANGELOG.md
  updateChangelog(newVersionShort, today, commits);
  console.log('  ✓ CHANGELOG.md actualizado');

  // Stage files
  exec('git add package.json CHANGELOG.md');

  // Create commit
  exec(`git commit -m "chore(release): ${newVersionStr}"`);
  releaseCommit = exec('git rev-parse HEAD');
  console.log(`  ✓ Commit creado: chore(release): ${newVersionStr}`);

  // Create tag
  exec(`git tag -a ${newVersionStr} -m "Release ${newVersionStr}"`);
  releaseTag = newVersionStr;
  console.log(`  ✓ Tag creado: ${newVersionStr}`);

  // Push
  exec('git push origin main');
  exec(`git push origin ${newVersionStr}`);
  console.log('  ✓ Push realizado');

  // GitHub Release
  if (hasGitHubCredentials()) {
    try {
      const token = getGitHubToken();
      const owner = 'HiSoyRicky';
      const repo = 'SistemaAAUD';
      const url = `https://api.github.com/repos/${owner}/${repo}/releases`;

      const body = commits.map((c) => `- ${c}`).join('\n');

      const curlCmd = `curl -s -X POST "${url}" \
        -H "Authorization: Bearer ${token}" \
        -H "Accept: application/vnd.github.v3+json" \
        -d '{
          "tag_name": "${newVersionStr}",
          "name": "Release ${newVersionStr}",
          "body": "${body.replace(/"/g, '\\"')}",
          "draft": false,
          "prerelease": false
        }'`;

      exec(curlCmd, { stdio: 'pipe' });
      console.log('  ✓ GitHub Release creado');
    } catch (error) {
      console.warn('  ⚠ Error creando GitHub Release (continuando)');
    }
  }

  console.log('');
  console.log('━'.repeat(50));
  console.log('');
  console.log(`✓ Release ${newVersionStr} completado exitosamente.`);
  console.log('');
  } catch (error) {
    console.error('⚠ Falló el release. Restaurando cambios realizados por release.cjs...');
    try {
      rollbackRelease({ state: releaseState, preReleaseHead, releaseCommit, releaseTag });
      console.error('✓ Rollback completado. package.json, CHANGELOG.md, commit y tag locales restaurados.');
    } catch (rollbackError) {
      throw new Error(`${error.message}. Además, el rollback falló: ${rollbackError.message}`);
    }
    throw error;
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const isCheckMode = process.argv.includes('--check');

  try {
    // Validate working tree is clean only in release mode (not in check mode)
    if (!isCheckMode && !isWorkingTreeClean()) {
      console.error('\n❌ Error: El working tree tiene cambios sin commit.');
      console.error('Por favor, realiza un commit o stash de los cambios antes de hacer release.');
      console.log('');
      process.exit(1);
    }

    // 1. Get latest tag
    const latestTag = getLatestTag();
    const currentVersion = latestTag ? parseVersion(latestTag) : null;
    const currentVersionStr = currentVersion ? formatVersion(currentVersion) : 'v0.0.0';

    // 2. Get commits since tag
    const commits = getCommitsSinceTag(latestTag);

    // 3. Determine release type
    const releaseType = determineReleaseType(commits);

    // 4. Calculate new version
    const baseParts = currentVersion || [0, 0, 0];
    const newVersionParts = incrementVersion(baseParts, releaseType);

    // 5. Run in check mode
    if (isCheckMode) {
      runCheckMode(latestTag, commits, currentVersionStr, newVersionParts, releaseType);
    } else {
      // Run in release mode
      await runReleaseMode(latestTag, commits, currentVersionStr, newVersionParts, releaseType);
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  exec,
  getCommitsSinceTag,
  isWorkingTreeClean,
  rollbackRelease,
};
