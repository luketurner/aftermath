export const config = {
  katex: {
    // trying to use identical ignored tags and delimiter settings from:
    // https://github.com/KaTeX/KaTeX/blob/main/contrib/auto-render/auto-render.js
    ignoredTags: ["SCRIPT", "NOSCRIPT", "STYLE", "TEXTAREA", "PRE", "CODE", "OPTION", "SVG",],
    delimiters: [
      {left: "$$", right: "$$", display: true},
      {left: "\\(", right: "\\)", display: false},
      // LaTeX uses $…$, but it ruins the display of normal `$` in text:
      // {left: "$", right: "$", display: false},
      // $ must come after $$
  
      // Render AMS environments even if outside $$…$$ delimiters.
      {left: "\\begin{equation}", right: "\\end{equation}", display: true},
      {left: "\\begin{align}", right: "\\end{align}", display: true},
      {left: "\\begin{alignat}", right: "\\end{alignat}", display: true},
      {left: "\\begin{gather}", right: "\\end{gather}", display: true},
      {left: "\\begin{CD}", right: "\\end{CD}", display: true},
  
      {left: "\\[", right: "\\]", display: true},
    ]
  },
  mermaid: {
    background: 'transparent'
  },
  postContentSelector: '.post-content',
};
