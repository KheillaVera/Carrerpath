/**
 * Real assessment content.
 *
 * These are genuine questions with genuine answers and explanations — the point
 * of an assessment is that passing it means something, so placeholder content
 * would defeat the feature. Each assessment is tied to a skill in the catalogue
 * and, when passed, writes a verified level onto the candidate's profile.
 */

const ASSESSMENTS = [
  {
    skill: 'JavaScript',
    level: 'intermediate',
    title: 'JavaScript fundamentals',
    description: 'Types, scope, asynchronous behaviour and array methods as used in everyday work.',
    durationMinutes: 12,
    passingScore: 70,
    questions: [
      {
        text: 'What does `typeof null` return in JavaScript?',
        type: 'single_choice',
        explanation: 'It returns "object". This is a long-standing bug kept for backwards compatibility — use `value === null` to test for null.',
        options: [['"null"', false], ['"object"', true], ['"undefined"', false], ['"boolean"', false]],
      },
      {
        text: 'Which of these create a new array rather than modifying the original?',
        type: 'multiple_choice',
        explanation: '`map` and `filter` return new arrays. `push` and `sort` change the array they are called on — `sort` is a common source of bugs for that reason.',
        options: [['map()', true], ['filter()', true], ['push()', false], ['sort()', false]],
      },
      {
        text: 'What is logged?\n\nconst a = [1, 2, 3];\nconst b = a;\nb.push(4);\nconsole.log(a.length);',
        type: 'single_choice',
        explanation: '`b` refers to the same array as `a`, not a copy, so pushing through `b` is visible through `a`. Copy with `[...a]` when you need independence.',
        options: [['3', false], ['4', true], ['undefined', false], ['It throws an error', false]],
      },
      {
        text: 'What does `async` in front of a function guarantee?',
        type: 'single_choice',
        explanation: 'An async function always returns a Promise, wrapping any plain value you return. It does not make the code run on another thread.',
        options: [
          ['The function runs on a separate thread', false],
          ['The function always returns a Promise', true],
          ['The function runs before other code', false],
          ['The function cannot throw', false],
        ],
      },
      {
        text: '`let` and `const` are scoped to the nearest block, while `var` is scoped to the function.',
        type: 'true_false',
        explanation: 'Correct. This is why a `var` declared inside an if-block is visible after it, which surprises people and causes bugs.',
        options: [['True', true], ['False', false]],
      },
      {
        text: 'Which comparison is true?',
        type: 'single_choice',
        explanation: '`==` performs type coercion, so "1" becomes 1. `===` compares type as well as value, which is why it is the safer default.',
        options: [["'1' === 1", false], ["'1' == 1", true], ['null === undefined', false], ['NaN === NaN', false]],
      },
    ],
  },
  {
    skill: 'React',
    level: 'intermediate',
    title: 'React components and state',
    description: 'Component state, effects, keys and the rules that keep a React app predictable.',
    durationMinutes: 12,
    passingScore: 70,
    questions: [
      {
        text: 'Why does React need a `key` on items in a list?',
        type: 'single_choice',
        explanation: 'Keys let React match elements between renders so it updates the right ones. Using the array index as a key causes wrong behaviour when the list reorders.',
        options: [
          ['To identify which items changed between renders', true],
          ['To sort the list automatically', false],
          ['To make the list render faster in every case', false],
          ['It is only needed for tables', false],
        ],
      },
      {
        text: 'What happens if you call `setState` during render?',
        type: 'single_choice',
        explanation: 'Updating state during render causes an infinite re-render loop. State updates belong in event handlers or effects.',
        options: [
          ['Nothing — it is the normal way to update', false],
          ['It causes an infinite render loop', true],
          ['React silently ignores it', false],
          ['It updates only after a refresh', false],
        ],
      },
      {
        text: 'Which of these belong in a `useEffect` dependency array?',
        type: 'multiple_choice',
        explanation: 'Every reactive value the effect reads — props, state and values derived from them — belongs in the dependencies. Refs do not, because changing a ref does not re-render.',
        options: [
          ['Props the effect reads', true],
          ['State the effect reads', true],
          ['A ref object the effect reads', false],
          ['Constants defined outside the component', false],
        ],
      },
      {
        text: 'What should a `useEffect` return when it subscribes to something?',
        type: 'single_choice',
        explanation: 'Return a cleanup function. React runs it before the next effect and on unmount, which is what prevents leaks and stale subscriptions.',
        options: [
          ['The subscription object', false],
          ['A cleanup function that unsubscribes', true],
          ['Nothing — React cleans up on its own', false],
          ['A Promise', false],
        ],
      },
      {
        text: 'Mutating state directly, such as `items.push(newItem)`, reliably re-renders the component.',
        type: 'true_false',
        explanation: 'False. React compares references; mutating in place keeps the same reference, so React sees no change. Create a new array: `setItems([...items, newItem])`.',
        options: [['True', false], ['False', true]],
      },
      {
        text: 'What is the main reason to lift state up to a parent component?',
        type: 'single_choice',
        explanation: 'When two components need the same data, the state belongs in their closest common parent, which then passes it down.',
        options: [
          ['To let sibling components share the same data', true],
          ['To make the app run faster', false],
          ['Because child components cannot hold state', false],
          ['To avoid using props entirely', false],
        ],
      },
    ],
  },
  {
    skill: 'SQL',
    level: 'intermediate',
    title: 'SQL querying',
    description: 'Joins, aggregation, filtering and the difference between WHERE and HAVING.',
    durationMinutes: 12,
    passingScore: 70,
    questions: [
      {
        text: 'Which join returns every row from the left table, even when there is no match on the right?',
        type: 'single_choice',
        explanation: 'A LEFT JOIN keeps all left-hand rows, filling the right-hand columns with NULL where there is no match.',
        options: [['INNER JOIN', false], ['LEFT JOIN', true], ['CROSS JOIN', false], ['SELF JOIN', false]],
      },
      {
        text: 'What is the difference between WHERE and HAVING?',
        type: 'single_choice',
        explanation: 'WHERE filters rows before grouping; HAVING filters the groups afterwards, which is why HAVING can use aggregate functions such as COUNT.',
        options: [
          ['WHERE filters rows before grouping, HAVING filters groups after', true],
          ['They are interchangeable', false],
          ['WHERE works only on numbers', false],
          ['HAVING runs before WHERE', false],
        ],
      },
      {
        text: 'What does `COUNT(column_name)` do with NULL values in that column?',
        type: 'single_choice',
        explanation: 'COUNT(column) skips NULLs. COUNT(*) counts rows regardless — a distinction that quietly changes reports.',
        options: [['Counts them as zero', false], ['Ignores them', true], ['Returns NULL overall', false], ['Raises an error', false]],
      },
      {
        text: 'Which clauses help a query on a large table run faster?',
        type: 'multiple_choice',
        explanation: 'An index on the filtered column and a LIMIT both reduce the work. SELECT * increases it, and ORDER BY on an unindexed column forces a sort.',
        options: [
          ['An index on the column in the WHERE clause', true],
          ['LIMIT when you only need some rows', true],
          ['Using SELECT * instead of naming columns', false],
          ['Adding ORDER BY on an unindexed column', false],
        ],
      },
      {
        text: 'Building a query by joining strings with user input is safe as long as you check the input first.',
        type: 'true_false',
        explanation: 'False. String concatenation is how SQL injection happens. Use parameterised queries — the database then treats the input as data, never as SQL.',
        options: [['True', false], ['False', true]],
      },
      {
        text: 'What does a PRIMARY KEY guarantee?',
        type: 'single_choice',
        explanation: 'It guarantees each row is uniquely identifiable and that the column is never NULL.',
        options: [
          ['Values are unique and not NULL', true],
          ['Values are sorted alphabetically', false],
          ['The column is encrypted', false],
          ['The table can only have one row', false],
        ],
      },
    ],
  },
  {
    skill: 'HTML',
    level: 'beginner',
    title: 'HTML and accessibility basics',
    description: 'Semantic elements, forms and the markup that makes a page usable for everyone.',
    durationMinutes: 10,
    passingScore: 70,
    questions: [
      {
        text: 'Why use `<button>` instead of a `<div>` with a click handler?',
        type: 'single_choice',
        explanation: 'A real button is keyboard focusable, responds to Enter and Space, and is announced as a button by screen readers. A div gives you none of that.',
        options: [
          ['It is keyboard accessible and announced correctly by screen readers', true],
          ['It loads faster', false],
          ['It is easier to style', false],
          ['There is no real difference', false],
        ],
      },
      {
        text: 'What does the `alt` attribute on an image do?',
        type: 'single_choice',
        explanation: 'It describes the image for people using screen readers and shows when the image fails to load. Decorative images take an empty alt="".',
        options: [
          ['Describes the image for assistive technology and when it fails to load', true],
          ['Sets the image title on hover', false],
          ['Improves image quality', false],
          ['Sets the image size', false],
        ],
      },
      {
        text: 'Which elements are semantic — they describe meaning rather than appearance?',
        type: 'multiple_choice',
        explanation: '`nav`, `article` and `header` describe the role of their content. `div` and `span` carry no meaning; they are generic containers.',
        options: [['<nav>', true], ['<article>', true], ['<div>', false], ['<header>', true]],
      },
      {
        text: 'How do you connect a `<label>` to its input?',
        type: 'single_choice',
        explanation: 'Match the label\'s `for` to the input\'s `id`. Clicking the label then focuses the input, and screen readers read the two together.',
        options: [
          ["The label's `for` matches the input's `id`", true],
          ['They must be next to each other', false],
          ['Using the `name` attribute', false],
          ['It happens automatically', false],
        ],
      },
      {
        text: 'A page should normally have exactly one `<h1>`.',
        type: 'true_false',
        explanation: 'True in practice. One h1 naming the page, with h2 and h3 nested beneath it, gives assistive technology a clear outline to navigate.',
        options: [['True', true], ['False', false]],
      },
    ],
  },
  {
    skill: 'Excel',
    level: 'intermediate',
    title: 'Excel for data work',
    description: 'Lookups, absolute references, conditional aggregation and pivot tables.',
    durationMinutes: 10,
    passingScore: 70,
    questions: [
      {
        text: 'What does the `$` do in the reference `$B$2`?',
        type: 'single_choice',
        explanation: 'It locks the column and the row, so the reference does not shift when the formula is copied to other cells.',
        options: [
          ['Locks the column and row when the formula is copied', true],
          ['Formats the cell as currency', false],
          ['Marks the cell as text', false],
          ['Refers to another sheet', false],
        ],
      },
      {
        text: 'Which function sums values that meet a condition?',
        type: 'single_choice',
        explanation: 'SUMIF adds only the values whose rows match a criterion; SUMIFS handles several criteria at once.',
        options: [['SUMIF', true], ['VLOOKUP', false], ['CONCAT', false], ['COUNTA', false]],
      },
      {
        text: 'What does VLOOKUP return if the lookup value is not found and the last argument is FALSE?',
        type: 'single_choice',
        explanation: 'It returns #N/A. Wrapping it in IFNA or IFERROR is the usual way to show something friendlier.',
        options: [['#N/A', true], ['0', false], ['An empty cell', false], ['The nearest match', false]],
      },
      {
        text: 'Which are good reasons to use a pivot table?',
        type: 'multiple_choice',
        explanation: 'Pivot tables summarise and cross-tabulate large ranges quickly, and refresh when the source changes. They do not clean or correct data.',
        options: [
          ['To summarise thousands of rows by category', true],
          ['To cross-tabulate two fields against each other', true],
          ['To automatically correct spelling in the data', false],
          ['To refresh a summary when the source data changes', true],
        ],
      },
      {
        text: 'Deleting a column that a formula refers to leaves the formula working normally.',
        type: 'true_false',
        explanation: 'False. The formula breaks with #REF!, because the cell it pointed at no longer exists.',
        options: [['True', false], ['False', true]],
      },
    ],
  },
  {
    skill: 'Data analysis',
    level: 'beginner',
    title: 'Data analysis foundations',
    description: 'Reading data honestly: averages, outliers, correlation and how charts mislead.',
    durationMinutes: 10,
    passingScore: 70,
    questions: [
      {
        text: 'Salaries in a team are 200k, 220k, 240k, 260k and 4,000,000. Which measure best describes a typical salary?',
        type: 'single_choice',
        explanation: 'The median (240k) is not distorted by the single extreme value, while the mean (about 984k) describes nobody in the team.',
        options: [['The mean', false], ['The median', true], ['The maximum', false], ['The range', false]],
      },
      {
        text: 'Ice cream sales and drowning incidents rise together each year. What does this show?',
        type: 'single_choice',
        explanation: 'Both are driven by hot weather. Correlation does not establish that one causes the other — a third factor often explains both.',
        options: [
          ['Ice cream causes drowning', false],
          ['They correlate, probably because both rise with hot weather', true],
          ['Drowning causes ice cream sales', false],
          ['The data must be wrong', false],
        ],
      },
      {
        text: 'Which practices make a chart more honest?',
        type: 'multiple_choice',
        explanation: 'Starting a bar chart at zero and labelling axes and sample size let a reader judge the claim. A truncated axis exaggerates small differences.',
        options: [
          ['Starting the y-axis of a bar chart at zero', true],
          ['Labelling both axes with units', true],
          ['Cutting the y-axis to make differences look bigger', false],
          ['Stating the number of records the chart covers', true],
        ],
      },
      {
        text: 'A survey is sent only to people who already bought a product, and 95% say they like it. What is the main problem?',
        type: 'single_choice',
        explanation: 'This is selection bias: people who disliked it enough not to buy are never asked, so the result cannot describe the wider population.',
        options: [
          ['The sample only includes buyers, so it cannot represent everyone', true],
          ['The sample is too small', false],
          ['95% is too high to be real', false],
          ['There is no problem', false],
        ],
      },
      {
        text: 'Before analysing a dataset, you should check for missing values and duplicates.',
        type: 'true_false',
        explanation: 'True. Missing values and duplicated rows quietly distort every total and average computed from the data.',
        options: [['True', true], ['False', false]],
      },
    ],
  },
];

async function seedAssessments(conn) {
  // Phase 6 tables may not exist yet; seed only once they do.
  const [tables] = await conn.query(
    "SELECT COUNT(*) AS c FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'assessments'"
  );
  if (tables[0].c === 0) return 0;

  const [skillRows] = await conn.query('SELECT id, name FROM skills');
  const skillId = Object.fromEntries(skillRows.map((s) => [s.name, s.id]));

  let seeded = 0;
  for (const definition of ASSESSMENTS) {
    const id = skillId[definition.skill];
    if (!id) continue;

    await conn.query(
      `INSERT INTO assessments (skill_id, title, description, level, duration_minutes, passing_score, is_active)
       VALUES (?, ?, ?, ?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE title = VALUES(title), description = VALUES(description),
                               duration_minutes = VALUES(duration_minutes),
                               passing_score = VALUES(passing_score), is_active = 1`,
      [id, definition.title, definition.description, definition.level,
       definition.durationMinutes, definition.passingScore]
    );

    const [existing] = await conn.query(
      'SELECT id FROM assessments WHERE skill_id = ? AND level = ? LIMIT 1',
      [id, definition.level]
    );
    const assessmentId = existing[0].id;

    // Questions are replaced wholesale so edits to this file always take effect.
    // Attempts keep their own recorded scores, so history is not rewritten.
    await conn.query('DELETE FROM assessment_questions WHERE assessment_id = ?', [assessmentId]);

    let position = 0;
    for (const question of definition.questions) {
      const [inserted] = await conn.query(
        `INSERT INTO assessment_questions (assessment_id, question_text, question_type, explanation, points, position)
         VALUES (?, ?, ?, ?, 1, ?)`,
        [assessmentId, question.text, question.type, question.explanation, position]
      );
      let optionPosition = 0;
      for (const [text, correct] of question.options) {
        await conn.query(
          `INSERT INTO assessment_options (question_id, option_text, is_correct, position)
           VALUES (?, ?, ?, ?)`,
          [inserted.insertId, text, correct ? 1 : 0, optionPosition]
        );
        optionPosition += 1;
      }
      position += 1;
    }
    seeded += 1;
  }

  return seeded;
}

module.exports = { seedAssessments, ASSESSMENTS };
