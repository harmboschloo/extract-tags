import _tag from '../../../output/test/fixtures/css-tags/given_tag.css';
import _tag2 from '../../../output/test/fixtures/css-tags/given_tag2.css';
import _tag3 from '../../../output/test/fixtures/css-tags/given_tag3.css';
import styled from 'extract-tags/css';

styled(_tag);

styled.local(_tag2);

styled.global(_tag3);
