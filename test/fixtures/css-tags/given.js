import css from 'extract-tags/css';

css`
  display: none;
`;

css.local`
  display: inline;
`;

css.global`
  div {
    display: block;
  }
`;
