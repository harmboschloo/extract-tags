import _tag from '../../../output/test/fixtures/css-tags/given_tag.css';
import _tag2 from '../../../output/test/fixtures/css-tags/given_tag2.css';
import css from 'extract-tags/css';

css`
  display: none;
`;

css.local(_tag);

css.global(_tag2);
