// "The problem" page: the statements, what was tried before, and what the
// announced proof reports doing. Content is prose, kept in one place here.
// `m` renders inline math, `M` renders a display formula.
export function problemPage({ m, M, esc, entryLink }) {
  const tried = [
    ['Zero-free regions', `The first results kept zeros away from the edge of the critical strip. Hadamard and de la Vallée Poussin showed in 1896 that there are no zeros with real part 1, which proves the prime number theorem. Vinogradov and Korobov widened the zero-free region in 1958. No zero-free region of the form ${m('\\operatorname{Re} s > 1 - \\delta')} with fixed ${m('\\delta > 0')} was ever established this way.`],
    ['Zeros on the critical line', `A second line of work counted how many zeros are on the line. Hardy showed in 1914 that infinitely many are. Selberg showed in 1942 that a positive proportion are, Levinson in 1974 that more than one third are, and Conrey in 1989 that more than two fifths are. Later work pushed the proportion a little past 41 percent. These methods were not expected to reach 100 percent.`],
    ['Computation', `The hypothesis was checked numerically for very many zeros. Platt and Trudgian verified it in 2021 for all zeros up to height ${m('3 \\cdot 10^{12}')}. Computation cannot settle the question, but it guided conjectures about the zeros.`],
    ['The analogue over finite fields', `For curves over finite fields the corresponding statement is a theorem. Hasse proved it for elliptic curves in the 1930s, Weil for all curves in the 1940s, and Deligne for higher-dimensional varieties in 1974. Stepanov gave an elementary proof for curves in 1969, by building an auxiliary function that vanishes to high order at many points. Bombieri simplified it. Carrying any of these proofs over to the integers was a long-standing hope.`],
    ['The spectral idea', `Hilbert and Pólya are credited with the suggestion that the zeros are the eigenvalues of some self-adjoint operator, which would force them onto a line. Montgomery's pair correlation conjecture of 1973 and Odlyzko's computations showed that the zeros behave statistically like eigenvalues of large random matrices. No such operator was found.`],
    ['Positivity criteria', `Weil showed that the hypothesis is equivalent to the positivity of a certain distribution built from the explicit formula that links primes and zeros. Li gave a related criterion in 1997: a specific sequence of numbers must be non-negative. Connes recast the explicit formula as a trace formula in noncommutative geometry.`],
    ['Approximation criteria', `Nyman in 1950 and Beurling in 1955 showed that the hypothesis is equivalent to a statement about approximating a constant function by dilates of the fractional part function. Báez-Duarte sharpened this in 2003. Several entries on this site record criteria of this kind.`],
    ['The de Bruijn-Newman constant', `A family of deformations of the zeta function is governed by a real constant ${m('\\Lambda')}. The hypothesis is equivalent to ${m('\\Lambda \\le 0')}. Newman conjectured in 1976 that ${m('\\Lambda \\ge 0')}, and Rodgers and Tao proved that in 2020. So the hypothesis, if true, is only barely true.`],
    ['Elementary equivalents', `The hypothesis is equivalent to statements that mention no complex analysis at all, such as ${entryLink('robin-inequality', "Robin's inequality")} for the sum of divisors and ${entryLink('lagarias-harmonic-inequality', "Lagarias's inequality")} with harmonic numbers. These made the problem easy to state but did not make it easier to prove.`],
  ];
  return `
<h1>The problem</h1>
<p class="lede">What the Riemann Hypothesis says, what people tried for 165 years, and what the announced proof reports doing.
This page is background. It was drafted by an AI system and has not been checked by an expert.</p>

<h2 id="statement">The statement</h2>
<p>The Riemann zeta function is defined for complex ${m('s')} with real part greater than 1 by</p>
${M('\\zeta(s) = \\sum_{n=1}^{\\infty} \\frac{1}{n^{s}} = \\prod_{p \\text{ prime}} \\frac{1}{1 - p^{-s}}')}
<p>and extends to the whole complex plane apart from a simple pole at ${m('s = 1')}. It vanishes at the negative even integers, which are called the trivial zeros.</p>
<div class="statement-box"><p><strong>Riemann Hypothesis (RH).</strong> Every other zero of ${m('\\zeta')} has real part ${m('\\tfrac12')}:</p>
${M('\\zeta(s) = 0,\\ s \\notin \\{-2, -4, -6, \\dots\\} \\;\\Longrightarrow\\; \\operatorname{Re} s = \\tfrac12')}</div>
<p>Riemann stated this in 1859. It is equivalent to the sharpest possible form of the prime number theorem: the number of primes up to ${m('x')} differs from the logarithmic integral by at most a constant times ${m('\\sqrt{x}\\,\\log x')}.</p>
<p>For a Dirichlet character ${m('\\chi')} modulo ${m('q')}, the Dirichlet L-function is</p>
${M('L(s, \\chi) = \\sum_{n=1}^{\\infty} \\frac{\\chi(n)}{n^{s}}')}
<div class="statement-box"><p><strong>Generalized Riemann Hypothesis for Dirichlet L-functions.</strong> For every Dirichlet character ${m('\\chi')}, every zero of ${m('L(s, \\chi)')} in the strip ${m('0 < \\operatorname{Re} s < 1')} has real part ${m('\\tfrac12')}:</p>
${M('L(s, \\chi) = 0,\\ 0 < \\operatorname{Re} s < 1 \\;\\Longrightarrow\\; \\operatorname{Re} s = \\tfrac12')}</div>
<p>These two statements are what the announced proof covers. The Lean development states the first with Mathlib's own definition, and the second in three forms for Dirichlet L-functions. The versions for Dedekind zeta functions of number fields, and for Hecke, Artin and automorphic L-functions, are not part of it. The <a href="about.html#taxonomy">method page</a> explains those versions, and the <a href="waiting.html">still waiting page</a> lists what depends on them.</p>

<h2 id="tried">What was tried before</h2>
<p>None of these routes produced a proof. Each left behind theorems and tools that are still in use.</p>
<dl class="defs tried">
${tried.map(([t, d]) => `  <dt>${esc(t)}</dt><dd>${d}</dd>`).join('\n')}
</dl>

<h2 id="announced">What the announced proof reports doing</h2>
<p class="notice"><strong>Read this part with care.</strong> It reports what the author's own short note says. Nobody has yet published an account of the argument that mathematicians have reviewed, and this site does not assess the proof.</p>
<p>The proof was released on 20 November 2026 as a Lean library of about 17 million lines, with a four-page note by its author, Levent Alpöge. The note says the argument was found and formalized together with an AI system, and that the author chose to publish only the Lean code because a readable account does not exist yet.</p>
<p>According to that note:</p>
<ul>
  <li><strong>The starting point is Stepanov's method.</strong> The note calls the argument "a descendant of Stepanov's", the elementary proof of the finite field analogue described above. That proof relies on a function vanishing to high order, and the note says that this kind of multiplicity "is hard to find over the integers".</li>
  <li><strong>The substitute for multiplicity is a chain of theta lifts.</strong> The note describes passing between automorphic forms on a sequence of unitary groups, with each step playing the role of one more order of vanishing. For a sum over primes of length ${m('X')}, the chain has length about ${m('\\sqrt{X}')}.</li>
  <li><strong>Many other tools are named.</strong> The note's timeline lists, among others, the Guinand-Weil explicit formula, an Iwasawa tower of fields, Bost's slope inequality, a seesaw identity, a relative trace formula, and a weakened form of Vandiver's conjecture.</li>
  <li><strong>The author says he has not mastered all of it.</strong> The note says parts of its own summary paraphrase machine-written text that "might make zero sense", that the argument is "incredibly long at the moment", and that the author expects it to be greatly simplified. He says he intends to write it up properly.</li>
  <li><strong>The author has since commented on the code.</strong> In a public post a few days after the release, he wrote that the Lean code "is full of garbage obviously, but compiles", that criticism of it "is totally reasonable and accepted", and that he should have cleaned it up. He also said that the figure of "250,000+ pages" in his note was a joke, and repeated that he expects much of the argument to turn out unnecessary. None of this bears on whether the formal proof checks; it is about how readable the code is.</li>
  <li><strong>What is claimed.</strong> The note claims the Riemann Hypothesis and says the method extends to the Generalized Riemann Hypothesis. It says the author expects, "with more time", the Extended Riemann Hypothesis too. That last statement is an expectation, not a claim, and the released Lean code does not include it.</li>
</ul>
<p>On 21 November 2026 the Lean and Mathlib communities issued a joint statement that the statement and the proof of the Riemann Hypothesis in that library are correct. That is a statement about the formal proof. Understanding why the argument works is separate work, and it has only begun. The current status and its sources are on the <a href="about.html#proof-status">method page</a>.</p>

<h2 id="maps">Maps of the proof itself</h2>
<p>This site maps what follows from the result. Others are mapping the proof. These are independent projects, listed here because they answer the questions this page cannot.</p>
<ul>
  <li><a href="https://nasqret.github.io/riemann-proof-atlas/" rel="noopener">Riemann proof atlas</a>, by Bartosz Naskręcki. An interactive map of the Lean declarations in the formalization and how they relate, with links to the source code.</li>
  <li><a href="https://tdupu.github.io/riemann-public/riemann-book.pdf" rel="noopener">Notes on Alpöge's Proof of the Riemann Hypothesis</a>, printed by Taylor Dupuy. A 271-page set of lecture notes, labeled by its author as AI generated and temporary. It states the main theorem for the zeta function and Dirichlet L-functions and shows how the proof is assembled from twenty named parts. The notes say they do not verify the argument or the Lean code, and give complete proofs for only some of the parts.</li>
  <li><a href="https://riemann.verifytask.cn/" rel="noopener">Lean 4 proof techniques and progress</a>, a public dashboard by @osgood001. It tracks an open benchmark in which participants shorten parts of the formal proof. The parts are thirteen classical theorems proved inside it without any hypothesis, such as the classical zero-free region and the Siegel-Walfisz bound. The dashboard states that these cover under 2 percent of the whole proof.</li>
  <li><a href="https://github.com/leanprover-community/riemann-hypothesis" rel="noopener">The Lean code</a>, as maintained by the Lean community.</li>
  <li><a href="https://math.mit.edu/~drew/grh/" rel="noopener">Verification results</a>, collected by Andrew Sutherland: which proof checkers were run and what they reported.</li>
</ul>
<p class="muted">Descriptions follow each project's own announcement. This site has not reviewed them.</p>

<h2 id="sources">Sources for this page</h2>
<ul>
  <li>B. Riemann, <cite>Ueber die Anzahl der Primzahlen unter einer gegebenen Grösse</cite>, 1859.</li>
  <li>E. Bombieri, <cite>Problems of the Millennium: the Riemann Hypothesis</cite>, Clay Mathematics Institute, 2000. The historical summary above follows standard accounts such as this one and was written from memory, not checked line by line.</li>
  <li>L. Alpöge, untitled note of 20 November 2026, <a href="https://alpo.ge/remark.pdf" rel="noopener">alpo.ge/remark.pdf</a>. Read in full. Quotations above are from it.</li>
  <li>L. Alpöge, post on X from the account @__alpoge__, about 23 November 2026. The text was supplied by this site's maintainer and was not read at its source.</li>
  <li>Lean and Mathlib communities, <a href="https://leanprover-community.github.io/blog/posts/riemann-hypothesis/" rel="noopener">Lean verification of the Riemann Hypothesis</a>, 21 November 2026.</li>
</ul>`;
}
