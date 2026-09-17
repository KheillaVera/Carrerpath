/**
 * MySQL → SQLite statement translation.
 *
 * The application speaks MySQL, because that is what PathAura deploys onto.
 * Local development runs on SQLite so there is no database server to install,
 * start, or have killed by the operating system. Rather than fork every query,
 * this rewrites the handful of MySQL-specific constructs the codebase actually
 * uses. Anything it cannot translate is left alone and will fail loudly, which
 * is the intended behaviour — a silent mistranslation would be far worse.
 */

/**
 * Columns that make a row unique, per table. SQLite's upsert needs an explicit
 * conflict target where MySQL infers it from whichever unique key was violated.
 */
const CONFLICT_TARGETS = {
  roles: ['code'],
  permissions: ['code'],
  role_permissions: ['role_id', 'permission_id'],
  users: ['email'],
  user_roles: ['user_id', 'role_id'],
  job_seeker_profiles: ['user_id'],
  skill_categories: ['code'],
  skills: ['name'],
  user_skills: ['user_id', 'skill_id'],
  project_skills: ['project_id', 'skill_id'],
  companies: ['slug'],
  company_members: ['company_id', 'user_id'],
  job_required_skills: ['job_id', 'skill_id'],
  job_bookmarks: ['user_id', 'job_id'],
  applications: ['job_id', 'applicant_user_id'],
  assessments: ['skill_id', 'level'],
  assessment_answers: ['attempt_id', 'question_id'],
  schema_migrations: ['filename'],
};

/** Splits on commas that sit at the top level of a parenthesised argument list. */
function splitTopLevel(input) {
  const parts = [];
  let depth = 0;
  let current = '';
  let quote = null;

  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i];
    if (quote) {
      current += ch;
      if (ch === quote && input[i - 1] !== '\\') quote = null;
      continue;
    }
    if (ch === "'" || ch === '"') { quote = ch; current += ch; continue; }
    if (ch === '(') depth += 1;
    if (ch === ')') depth -= 1;
    if (ch === ',' && depth === 0) { parts.push(current.trim()); current = ''; continue; }
    current += ch;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

/**
 * Finds each call to `name(` and hands its balanced argument list to `rewrite`.
 * Works from the inside out so nested calls translate correctly.
 */
function replaceFunctionCalls(sql, name, rewrite) {
  const needle = new RegExp(`\\b${name}\\s*\\(`, 'i');
  let result = sql;

  for (let guard = 0; guard < 50; guard += 1) {
    const match = needle.exec(result);
    if (!match) break;

    const open = match.index + match[0].length - 1;
    let depth = 0;
    let close = -1;
    let quote = null;

    for (let i = open; i < result.length; i += 1) {
      const ch = result[i];
      if (quote) {
        if (ch === quote && result[i - 1] !== '\\') quote = null;
        continue;
      }
      if (ch === "'" || ch === '"') { quote = ch; continue; }
      if (ch === '(') depth += 1;
      else if (ch === ')') {
        depth -= 1;
        if (depth === 0) { close = i; break; }
      }
    }
    if (close === -1) break;

    const args = splitTopLevel(result.slice(open + 1, close));
    const replacement = rewrite(args);
    result = result.slice(0, match.index) + replacement + result.slice(close + 1);
  }

  return result;
}

/** MySQL FIELD(x, 'a', 'b') returns a 1-based position; SQLite needs a CASE. */
function translateField(sql) {
  return replaceFunctionCalls(sql, 'FIELD', (args) => {
    const [subject, ...values] = args;
    const cases = values
      .map((value, index) => `WHEN ${value} THEN ${index + 1}`)
      .join(' ');
    return `(CASE ${subject} ${cases} ELSE 0 END)`;
  });
}

function translateScalarFunctions(sql) {
  // GREATEST / LEAST over scalars are MAX / MIN in SQLite.
  let out = replaceFunctionCalls(sql, 'GREATEST', (args) => `MAX(${args.join(', ')})`);
  out = replaceFunctionCalls(out, 'LEAST', (args) => `MIN(${args.join(', ')})`);
  // MySQL's three-argument IF is SQLite's IIF.
  out = replaceFunctionCalls(out, 'IF', (args) => (args.length === 3 ? `IIF(${args.join(', ')})` : `IF(${args.join(', ')})`));
  return out;
}

function translateDates(sql) {
  return sql
    .replace(/\bDATE_ADD\s*\(\s*NOW\(\)\s*,\s*INTERVAL\s+\?\s+MINUTE\s*\)/gi,
      "datetime('now', '+' || ? || ' minutes')")
    .replace(/\bDATE_ADD\s*\(\s*NOW\(\)\s*,\s*INTERVAL\s+(\d+)\s+MINUTE\s*\)/gi,
      "datetime('now', '+$1 minutes')")
    .replace(/\bCURDATE\s*\(\s*\)/gi, "date('now')")
    .replace(/\bNOW\s*\(\s*\)/gi, 'CURRENT_TIMESTAMP')
    .replace(/\bUTC_TIMESTAMP\s*\(\s*\)/gi, 'CURRENT_TIMESTAMP');
}

/** Rewrites MySQL upserts into SQLite's ON CONFLICT form. */
function translateUpsert(sql) {
  const duplicate = /\bON\s+DUPLICATE\s+KEY\s+UPDATE\b/i;
  if (!duplicate.test(sql)) {
    return sql.replace(/\bINSERT\s+IGNORE\s+INTO\b/gi, 'INSERT OR IGNORE INTO');
  }

  const tableMatch = /\bINSERT\s+(?:IGNORE\s+)?INTO\s+`?([A-Za-z_][A-Za-z0-9_]*)`?/i.exec(sql);
  const table = tableMatch ? tableMatch[1] : null;
  const target = table ? CONFLICT_TARGETS[table] : null;
  if (!target) {
    throw new Error(
      `No SQLite conflict target registered for table "${table}". `
      + 'Add it to CONFLICT_TARGETS in sqlDialect.js.'
    );
  }

  const [head, assignments] = sql.split(duplicate);
  // VALUES(col) refers to the row that would have been inserted: excluded.col.
  const rewritten = replaceFunctionCalls(assignments, 'VALUES', (args) => `excluded.${args[0].replace(/`/g, '')}`);

  return `${head.replace(/\bINSERT\s+IGNORE\s+INTO\b/gi, 'INSERT INTO')} `
    + `ON CONFLICT(${target.join(', ')}) DO UPDATE SET ${rewritten}`;
}

/** The catalogue lookup used by the seeds to check whether a table exists. */
function translateInformationSchema(sql) {
  if (!/information_schema\.tables/i.test(sql)) return sql;
  // The table name may arrive as a placeholder or as a literal.
  return sql.replace(
    /FROM\s+information_schema\.tables\s+WHERE\s+table_schema\s*=\s*DATABASE\(\)\s*AND\s+table_name\s*=\s*(\?|'[^']*')/i,
    "FROM sqlite_master WHERE type = 'table' AND name = $1"
  );
}

function translate(sql) {
  let out = sql;
  out = translateInformationSchema(out);
  out = translateUpsert(out);
  out = translateField(out);
  out = translateScalarFunctions(out);
  out = translateDates(out);
  // Backtick quoting is MySQL's; SQLite accepts double quotes.
  out = out.replace(/`([A-Za-z_][A-Za-z0-9_]*)`/g, '"$1"');
  return out;
}

module.exports = { translate, CONFLICT_TARGETS, splitTopLevel, replaceFunctionCalls };
